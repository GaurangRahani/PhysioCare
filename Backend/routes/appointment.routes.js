import express from "express";
import {
  bookAtDesk,
  bookByPhone,
  selfBook,
  getAppointments,
  cancelAppointment,
  updateAppointmentStatus,
  payAtDesk,
  getAvailableSlots,
  getAvailableDates,
  resendPaymentLink,
  verifyPayment,
  resumePayment,
} from "../controllers/appointment.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  bookAtDeskSchema,
  bookByPhoneSchema,
  selfBookSchema,
  updateStatusSchema,
} from "../validators/appointment.validator.js";

const router = express.Router();

// ── Receptionist-only booking routes ─────────────────────────────────────────
router.post(
  "/book-at-desk",
  requireAuth,
  requireRole(["receptionist"]),
  validate(bookAtDeskSchema),
  bookAtDesk,
);

router.post(
  "/book-by-phone",
  requireAuth,
  requireRole(["receptionist"]),
  validate(bookByPhoneSchema),
  bookByPhone,
);

// ── Patient self-booking ──────────────────────────────────────────────────────
router.post(
  "/self-book",
  requireAuth,
  requireRole(["patient"]),
  validate(selfBookSchema),
  selfBook,
);

// ── View appointments (role-based filtering happens in controller) ─────────────
router.get("/available-dates", requireAuth, getAvailableDates);

router.get("/slots", requireAuth, getAvailableSlots);

router.get("/", requireAuth, getAppointments);

// ── Cancel an appointment (patient cancels own, receptionist/doctor cancel any) ─
router.put("/:id/cancel", requireAuth, cancelAppointment);

// ── Doctor or receptionist marks as completed or no_show ──────────────────────
router.put(
  "/:id/status",
  requireAuth,
  requireRole(["doctor", "receptionist"]),
  validate(updateStatusSchema),
  updateAppointmentStatus,
);

// ── Receptionist collects payment at desk for a phone-booked appointment ───────
router.put("/:id/pay", requireAuth, requireRole(["receptionist"]), payAtDesk);

// ── Resend Payment Link ────────────────────────────────────────────────────────
router.put(
  "/:id/resend-payment-link",
  requireAuth,
  requireRole(["receptionist"]),
  resendPaymentLink,
);

// ── Verify Razorpay Payment (Client callback) ──────────────────────────────────
router.post("/:id/verify-payment", requireAuth, verifyPayment);

// ── Resume payment for an existing pending appointment (patient only) ────────
router.post(
  "/:id/resume-payment",
  requireAuth,
  requireRole(["patient"]),
  resumePayment,
);

export default router;
