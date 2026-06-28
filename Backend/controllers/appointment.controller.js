import { db } from '../src/db/index.js';
import { appointments, invoices, payments, users } from '../src/db/schema/index.js';
import { eq, and } from 'drizzle-orm';
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

        const [newAppointment] = await db.insert(appointments).values({
            patient_id,
            doctor_id,
            appointment_date,
            start_time,
            visit_reason,
            notes,
            status: 'scheduled', // TEMPORARY BYPASS
            payment_status: 'paid_at_desk', // TEMPORARY BYPASS
            payment_expires_at: null,
            created_by: req.user.id
        }).returning();

        return res.status(201).json({
            success: true,
            message: 'TEMPORARY BYPASS: Appointment booked successfully without payment.',
            appointment: newAppointment
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

        const [newAppointment] = await db.insert(appointments).values({
            patient_id: req.user.id,    // Patient is the logged-in user
            doctor_id,
            appointment_date,
            start_time,
            visit_reason,
            status: 'scheduled', // TEMPORARY BYPASS
            payment_status: 'paid_online', // TEMPORARY BYPASS
            payment_expires_at: null,
            created_by: req.user.id
        }).returning();

        return res.status(201).json({
            success: true,
            message: 'TEMPORARY BYPASS: Appointment booked successfully without payment.',
            appointment: newAppointment
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
export const getAppointments = async (req, res) => {
    try {
        const role = req.user.role;
        let query = db.select().from(appointments);

        if (role === 'patient') {
            query = query.where(eq(appointments.patient_id, req.user.id));
        } else if (role === 'doctor') {
            query = query.where(eq(appointments.doctor_id, req.user.id));
        }
        // Receptionist gets all appointments (no filter)

        const result = await query.orderBy(appointments.appointment_date, appointments.start_time);

        return res.status(200).json({ success: true, appointments: result });
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
