import express from "express";
import {
  createConsultation,
  getConsultationById,
} from "../controllers/consultation.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createConsultationSchema } from "../validators/consultation.validator.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only doctors can create consultations
router.post(
  "/",
  requireAuth,
  requireRole(["doctor"]),
  validate(createConsultationSchema),
  createConsultation,
);

// Doctors can view consultations
router.get("/:id", requireAuth, requireRole(["doctor"]), getConsultationById);

export default router;
