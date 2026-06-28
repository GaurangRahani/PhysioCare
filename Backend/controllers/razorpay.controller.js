import crypto from 'crypto';
import { db } from '../src/db/index.js';
import { appointments, invoices, payments, users } from '../src/db/schema/index.js';
import { eq, or } from 'drizzle-orm';
import { sendAppointmentConfirmationEmail } from '../utils/email.js';

// ─── HELPER: Generate next invoice number ─────────────────────────────────────
const generateInvoiceNumber = async () => {
    const year = new Date().getFullYear();
    const count = await db.$count(invoices);
    const seq = String(count + 1).padStart(5, '0');
    return `INV-${year}-${seq}`;
};

export const razorpayWebhook = async (req, res) => {
    // 1. Verify Signature
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    if (!secret || !signature) {
        console.error('[Razorpay Webhook Error] Missing signature or secret in .env');
        return res.status(400).send('Missing signature or secret');
    }

    // Since we use express.raw(), req.body is a Buffer
    const payloadBuffer = req.body;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadBuffer)
        .digest('hex');

    if (expectedSignature !== signature) {
        console.error('[Razorpay Webhook Error] Signature mismatch! Make sure your .env RAZORPAY_WEBHOOK_SECRET exactly matches the one in the dashboard.');
        return res.status(400).send('Invalid signature');
    }

    // 2. Process Event
    let payloadObject;
    try {
        payloadObject = JSON.parse(payloadBuffer.toString('utf8'));
    } catch (err) {
        console.error('[Razorpay Webhook Error] Failed to parse JSON body');
        return res.status(400).send('Invalid JSON');
    }

    const event = payloadObject.event;
    const payload = payloadObject.payload;

    try {
        if (event === 'payment_link.paid' || event === 'order.paid') {
            const entity = event === 'payment_link.paid' ? payload.payment_link.entity : payload.order.entity;
            
            // Find the appointment using the ID we passed in notes
            const appointmentId = entity.notes?.appointment_id;
            
            if (!appointmentId) {
                console.error('[Razorpay Webhook] Missing appointment_id in notes');
                return res.status(200).send('Ignored - missing appointment ID');
            }

            // Find the appointment and related patient/doctor
            const [appointment] = await db.select().from(appointments).where(eq(appointments.id, appointmentId));
            
            if (!appointment) {
                console.error('[Razorpay Webhook] Appointment not found:', appointmentId);
                return res.status(200).send('Ignored - appointment not found');
            }

            if (appointment.payment_status === 'paid_online') {
                return res.status(200).send('Already processed');
            }

            // Wrap in transaction
            await db.transaction(async (tx) => {
                // Update appointment
                await tx.update(appointments)
                    .set({ 
                        status: 'scheduled', 
                        payment_status: 'paid_online',
                        payment_expires_at: null // Clear expiry so cron ignores it
                    })
                    .where(eq(appointments.id, appointmentId));

                // Generate Invoice
                const invoiceNumber = await generateInvoiceNumber();
                const [newInvoice] = await tx.insert(invoices).values({
                    patient_id: appointment.patient_id,
                    appointment_id: appointment.id,
                    invoice_number: invoiceNumber,
                    description: appointment.visit_reason || 'Physiotherapy consultation',
                    amount: entity.amount_paid / 100, // convert paise back to rupees
                    status: 'paid',
                    issued_by: appointment.patient_id // Self-service
                }).returning();

                // Generate Payment record
                // We extract the actual payment ID from the webhook payload. 
                // For payment links, the payment details are in a nested array or object.
                // For simplicity, we just use the entity ID as the transaction reference.
                await tx.insert(payments).values({
                    invoice_id: newInvoice.id,
                    amount: entity.amount_paid / 100,
                    payment_method: 'online', // Razorpay handles the actual method (UPI/Card etc)
                    transaction_reference: entity.id, // e.g. plink_xxxx or order_xxxx
                    recorded_by: appointment.patient_id
                });
            });

            // Send confirmation email
            const [patient] = await db.select().from(users).where(eq(users.id, appointment.patient_id));
            const [doctor] = await db.select().from(users).where(eq(users.id, appointment.doctor_id));

            if (patient && doctor) {
                sendAppointmentConfirmationEmail({
                    to: patient.email,
                    first_name: patient.name.split(' ')[0],
                    doctor_name: doctor.name,
                    appointment_date: appointment.appointment_date,
                    start_time: appointment.start_time
                });
            }

            console.log(`[Razorpay Webhook] Successfully processed payment for appointment ${appointmentId}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('[Razorpay Webhook Error]', error);
        res.status(500).send('Internal Server Error');
    }
};
