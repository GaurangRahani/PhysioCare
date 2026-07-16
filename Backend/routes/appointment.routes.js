import express from 'express';
import {
    bookAtDesk,
    bookByPhone,
    selfBook,
    getAppointments,
    cancelAppointment,
    updateAppointmentStatus,
    payAtDesk,
    getAvailableSlots
} from '../controllers/appointment.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    bookAtDeskSchema,
    bookByPhoneSchema,
    selfBookSchema,
    updateStatusSchema
} from '../validators/appointment.validator.js';

const router = express.Router();

// ── Receptionist-only booking routes ─────────────────────────────────────────
router.post(
    '/book-at-desk',
    requireAuth,
    requireRole(['receptionist']),
    validate(bookAtDeskSchema),
    bookAtDesk
);

router.post(
    '/book-by-phone',
    requireAuth,
    requireRole(['receptionist']),
    validate(bookByPhoneSchema),
    bookByPhone
);

// ── Patient self-booking ──────────────────────────────────────────────────────
router.post(
    '/self-book',
    requireAuth,
    requireRole(['patient']),
    validate(selfBookSchema),
    selfBook
);

// ── View appointments (role-based filtering happens in controller) ─────────────
router.get(
    '/slots',
    requireAuth,
    getAvailableSlots
);

router.get(
    '/',
    requireAuth,
    getAppointments
);

// ── Cancel an appointment (patient cancels own, receptionist/doctor cancel any) ─
router.put(
    '/:id/cancel',
    requireAuth,
    cancelAppointment
);

// ── Doctor or receptionist marks as completed or no_show ──────────────────────
router.put(
    '/:id/status',
    requireAuth,
    requireRole(['doctor', 'receptionist']),
    validate(updateStatusSchema),
    updateAppointmentStatus
);

// ── Receptionist collects payment at desk for a phone-booked appointment ───────
router.put(
    '/:id/pay',
    requireAuth,
    requireRole(['receptionist']),
    payAtDesk
);

export default router;
