import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Shared base fields for all booking types
const bookingBase = {
    doctor_id: z.string().uuid('Invalid doctor ID'),
    appointment_date: z.string().regex(dateRegex, 'Must be YYYY-MM-DD format'),
    start_time: z.string().regex(timeRegex, 'Must be HH:MM format'),
    visit_reason: z.string().max(500).optional(),
    amount: z.number().positive('Amount must be a positive number')
};

// Flow 1: At-desk booking (receptionist) — requires payment details
export const bookAtDeskSchema = z.object({
    ...bookingBase,
    patient_id: z.string().uuid('Invalid patient ID'),
    notes: z.string().max(1000).optional(),
    payment_method: z.enum(['cash', 'card', 'upi'], {
        errorMap: () => ({ message: 'Payment method must be cash, card, or upi' })
    }),
    transaction_reference: z.string().max(100).optional()
});

// Flow 2: Phone booking (receptionist) — no payment details yet
export const bookByPhoneSchema = z.object({
    ...bookingBase,
    patient_id: z.string().uuid('Invalid patient ID'),
    notes: z.string().max(1000).optional()
});

// Flow 3: Self-booking (patient) — patient_id comes from auth token, not body
export const selfBookSchema = z.object({
    ...bookingBase,
    notes: z.string().max(1000).optional()
});

// Update appointment status (doctor/receptionist)
export const updateStatusSchema = z.object({
    status: z.enum(['completed', 'no_show'], {
        errorMap: () => ({ message: 'Status must be completed or no_show' })
    })
});
