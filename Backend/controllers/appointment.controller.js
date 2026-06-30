import { db } from '../src/db/index.js';
import { appointments, invoices, payments, users } from '../src/db/schema/index.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import Razorpay from 'razorpay';
import { sendPaymentLinkEmail } from '../utils/email.js';

const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay keys are missing in .env");
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

// ─── HELPER: Generate next invoice number ─────────────────────────────────────
const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const count = await db.$count(invoices); // Total invoice count
    const seq = String(count + 1).padStart(5, '0');
    return `INV-${year}-${seq}`;
};

// ─── 1. POST /api/appointments/book-at-desk ───────────────────────────────────
export const bookAtDesk = async (req, res) => {
    const {
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        visit_reason,
        notes,
        payment_method,
        amount,
        transaction_reference
    } = req.body;

    try {
        const existing = await db.select().from(appointments).where(
            and(
                eq(appointments.doctor_id, doctor_id),
                eq(appointments.appointment_date, appointment_date),
                eq(appointments.start_time, start_time)
            )
        );
        const isDoubleBooked = existing.some(a => !['cancelled', 'no_show'].includes(a.status));
        if (isDoubleBooked) {
            return res.status(409).json({ success: false, message: 'This slot is already booked or held. Please choose a different time.' });
        }

        const result = await db.transaction(async (tx) => {

            const [newAppointment] = await tx.insert(appointments).values({
                patient_id,
                doctor_id,
                appointment_date,
                start_time,
                visit_reason,
                notes,
                status: 'scheduled',         // Confirmed immediately — patient is present
                payment_status: 'paid_at_desk',
                payment_expires_at: null,
                created_by: req.user.id
            }).returning();

            // ── Insert invoice (official receipt) ───────────────────────────
            const invoiceNumber = await generateInvoiceNumber();
            const [newInvoice] = await tx.insert(invoices).values({
                patient_id,
                appointment_id: newAppointment.id,
                invoice_number: invoiceNumber,
                description: visit_reason || 'Physiotherapy consultation',
                amount,
                status: 'paid',
                issued_by: req.user.id
            }).returning();

            // ── Insert payment record ───────────────────────────────────────
            const [newPayment] = await tx.insert(payments).values({
                invoice_id: newInvoice.id,
                amount,
                payment_method,
                transaction_reference,
                recorded_by: req.user.id
            }).returning();

            return { appointment: newAppointment, invoice: newInvoice, payment: newPayment };
        });

        return res.status(201).json({
            success: true,
            message: 'Appointment booked and payment recorded successfully',
            ...result
        });

    } catch (error) {
        // ── Catch PostgreSQL unique violation (slot just got taken) ─────────
        const isDuplicate = error.code === '23505' ||
            (error.cause && error.cause.code === '23505') ||
            (error.message && error.message.includes('unique constraint'));

        if (isDuplicate) {
            return res.status(409).json({
                success: false,
                message: 'This slot was just taken by another booking. Please choose a different time.'
            });
        }
        console.error('Error booking at desk:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── 2. POST /api/appointments/book-by-phone ──────────────────────────────────
// Receptionist creates appointment for a phone-booking patient.
// Flow: Book slot (pending_payment) → Create Razorpay Payment Link → Email link to patient
export const bookByPhone = async (req, res) => {
    const {
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        visit_reason,
        notes,
        amount
    } = req.body;

    try {
        // ── Check for existing active booking ────────────────────────────────
        const existing = await db.select().from(appointments).where(
            and(
                eq(appointments.doctor_id, doctor_id),
                eq(appointments.appointment_date, appointment_date),
                eq(appointments.start_time, start_time)
            )
        );
        const isDoubleBooked = existing.some(a => !['cancelled', 'no_show'].includes(a.status));
        if (isDoubleBooked) {
            return res.status(409).json({ success: false, message: 'This slot is already booked or held. Please choose a different time.' });
        }

        // ── Hold the slot immediately (15-min window) ────────────────────────
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const [newAppointment] = await db.insert(appointments).values({
            patient_id,
            doctor_id,
            appointment_date,
            start_time,
            visit_reason,
            notes,
            status: 'pending_payment',
            payment_status: 'pending',
            payment_expires_at: expiresAt,
            created_by: req.user.id
        }).returning();

        // ── Create Razorpay Payment Link ─────────────────────────────────────
        const razorpay = getRazorpayInstance();
        const paymentLink = await razorpay.paymentLink.create({
            amount: Math.round(amount * 100), // Razorpay works in paise
            currency: 'INR',
            description: visit_reason || 'PhysioCare Consultation',
            expire_by: Math.floor(expiresAt.getTime() / 1000), // Unix timestamp
            reminder_enable: false,
            notes: {
                appointment_id: newAppointment.id // Webhook uses this to find the appointment
            },
            notify: { sms: false, email: false }, // We send our own email
            callback_url: `${process.env.FRONTEND_URL}/booking/status?appointment_id=${newAppointment.id}`,
            callback_method: 'get'
        });

        // ── Email the patient the payment link ───────────────────────────────
        const [patient] = await db.select().from(users).where(eq(users.id, patient_id));
        if (patient?.email) {
            sendPaymentLinkEmail({
                to: patient.email,
                first_name: patient.name.split(' ')[0],
                payment_link: paymentLink.short_url,
                expires_in_minutes: 15
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Slot held. Payment link sent to patient email.',
            appointment: newAppointment,
            payment_link: paymentLink.short_url,
            expires_at: expiresAt
        });

    } catch (error) {
        const isDuplicate = error.code === '23505' ||
            (error.cause && error.cause.code === '23505') ||
            (error.message && error.message.includes('unique constraint'));

        if (isDuplicate) {
            return res.status(409).json({
                success: false,
                message: 'This slot was just taken. Please choose a different time.'
            });
        }
        console.error('Error booking by phone:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── 3. POST /api/appointments/self-book ─────────────────────────────────────
// Patient books their own appointment online.
// Flow: Book slot (pending_payment) → Create Razorpay Order → Client opens Razorpay checkout
// On success: Razorpay webhook confirms payment, flips status to 'scheduled'
export const selfBook = async (req, res) => {
    const {
        doctor_id,
        appointment_date,
        start_time,
        visit_reason,
        amount
    } = req.body;

    try {
        // ── Check for existing active booking ────────────────────────────────
        const existing = await db.select().from(appointments).where(
            and(
                eq(appointments.doctor_id, doctor_id),
                eq(appointments.appointment_date, appointment_date),
                eq(appointments.start_time, start_time)
            )
        );
        const isDoubleBooked = existing.some(a => !['cancelled', 'no_show'].includes(a.status));
        if (isDoubleBooked) {
            return res.status(409).json({ success: false, message: 'This slot is already booked or held. Please choose a different time.' });
        }

        // ── Hold the slot immediately (15-min window) ────────────────────────
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const [newAppointment] = await db.insert(appointments).values({
            patient_id: req.user.id,
            doctor_id,
            appointment_date,
            start_time,
            visit_reason,
            status: 'pending_payment',
            payment_status: 'pending',
            payment_expires_at: expiresAt,
            created_by: req.user.id
        }).returning();

        // ── Create Razorpay Order (client opens this in Razorpay checkout modal) ─
        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // paise
            currency: 'INR',
            receipt: `appt_${newAppointment.id.slice(0, 8)}`,
            notes: {
                appointment_id: newAppointment.id // Webhook uses this to confirm
            }
        });

        // ── Return order + appointment to client ─────────────────────────────
        // Client uses order.id to open Razorpay checkout modal
        // After payment, Razorpay fires 'order.paid' webhook → confirms appointment
        return res.status(201).json({
            success: true,
            message: 'Slot held for 15 minutes. Complete payment to confirm.',
            appointment: newAppointment,
            razorpay_order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            },
            expires_at: expiresAt
        });

    } catch (error) {
        const isDuplicate = error.code === '23505' ||
            (error.cause && error.cause.code === '23505') ||
            (error.message && error.message.includes('unique constraint'));

        if (isDuplicate) {
            return res.status(409).json({
                success: false,
                message: 'This slot was just taken. Please choose a different time.'
            });
        }
        console.error('Error in self-booking:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── 4. GET /api/appointments ─────────────────────────────────────────────────
// Supports ?date=today, ?date=YYYY-MM-DD, ?range=week for dashboard/calendar views
export const getAppointments = async (req, res) => {
    try {
        const role = req.user.role;
        const { date, range } = req.query;

        let conditions = [];

        // Role-based ownership filter
        if (role === 'patient') {
            conditions.push(eq(appointments.patient_id, req.user.id));
        } else if (role === 'doctor') {
            conditions.push(eq(appointments.doctor_id, req.user.id));
        }
        // Receptionist/Admin gets all — no ownership filter

        // Date filter — ?date=today or ?date=2026-07-01
        if (date === 'today' || date === undefined && range === undefined) {
            // If date=today is explicit, filter to today
            if (date === 'today') {
                const today = new Date().toISOString().split('T')[0];
                conditions.push(eq(appointments.appointment_date, today));
            }
        } else if (date && date !== 'today') {
            // Specific date requested
            conditions.push(eq(appointments.appointment_date, date));
        }

        // Range filter — ?range=week gives Mon-Sun of current week
        if (range === 'week') {
            const now = new Date();
            const dayOfWeek = now.getDay(); // 0=Sun
            const monday = new Date(now);
            monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const weekStart = monday.toISOString().split('T')[0];
            const weekEnd = sunday.toISOString().split('T')[0];

            conditions.push(gte(appointments.appointment_date, weekStart));
            conditions.push(lte(appointments.appointment_date, weekEnd));
        }

        const query = db.select().from(appointments);
        const result = await (
            conditions.length > 0
                ? query.where(and(...conditions))
                : query
        ).orderBy(appointments.appointment_date, appointments.start_time);

        return res.status(200).json({ success: true, count: result.length, appointments: result });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── 5. PUT /api/appointments/:id/cancel ─────────────────────────────────────

export const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const role = req.user.role;

        // Fetch the appointment first to check ownership
        const [appointment] = await db.select()
            .from(appointments)
            .where(eq(appointments.id, id));

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Patients can only cancel their own appointments
        if (role === 'patient' && appointment.patient_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only cancel your own appointments' });
        }

        // Cannot cancel an already completed or cancelled appointment
        if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel an appointment with status: ${appointment.status}`
            });
        }

        const [cancelled] = await db.update(appointments)
            .set({ status: 'cancelled', updated_at: new Date() })
            .where(eq(appointments.id, id))
            .returning();

        // TODO Phase 2: If payment_status was 'paid_online' or 'paid_at_desk', flag for manual refund review

        return res.status(200).json({
            success: true,
            message: 'Appointment cancelled. Slot is now available for rebooking.',
            appointment: cancelled
        });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── 6. PUT /api/appointments/:id/status ─────────────────────────────────────
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = ['completed', 'no_show'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
            });
        }

        const [updated] = await db.update(appointments)
            .set({ status, updated_at: new Date() })
            .where(eq(appointments.id, id))
            .returning();

        if (!updated) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        return res.status(200).json({ success: true, message: `Appointment marked as ${status}`, appointment: updated });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── 7. PUT /api/appointments/:id/pay ────────────────────────────────────────
// Receptionist collects cash/card at desk for a phone-booked (pending_payment) appointment
export const payAtDesk = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_method, amount, transaction_reference } = req.body;

        const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointment.payment_status === 'paid_at_desk' || appointment.payment_status === 'paid_online') {
            return res.status(400).json({ success: false, message: 'This appointment has already been paid.' });
        }

        if (appointment.status === 'cancelled' || appointment.status === 'no_show') {
            return res.status(400).json({ success: false, message: `Cannot collect payment for a ${appointment.status} appointment.` });
        }

        const result = await db.transaction(async (tx) => {
            // Mark appointment as paid and confirm it
            const [updated] = await tx.update(appointments)
                .set({
                    status: 'scheduled',
                    payment_status: 'paid_at_desk',
                    payment_expires_at: null, // Clear expiry so cron ignores it
                    updated_at: new Date()
                })
                .where(eq(appointments.id, id))
                .returning();

            // Generate invoice
            const invoiceNumber = await generateInvoiceNumber();
            const [newInvoice] = await tx.insert(invoices).values({
                patient_id: appointment.patient_id,
                appointment_id: appointment.id,
                invoice_number: invoiceNumber,
                description: appointment.visit_reason || 'Physiotherapy consultation',
                amount,
                status: 'paid',
                issued_by: req.user.id
            }).returning();

            // Generate payment record
            await tx.insert(payments).values({
                invoice_id: newInvoice.id,
                amount,
                payment_method,
                transaction_reference: transaction_reference || null,
                recorded_by: req.user.id
            });

            return { appointment: updated, invoice: newInvoice };
        });

        return res.status(200).json({
            success: true,
            message: 'Payment collected and appointment confirmed.',
            ...result
        });
    } catch (error) {
        console.error('Error recording at-desk payment:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
