import express from "express";
import {
  getDoctorProfile,
  updateDoctorProfile,
  getAllDoctors,
} from "../controllers/doctor.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { updateDoctorProfileSchema } from "../validators/doctor.validator.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only doctors can view and update their own profile
router.get("/profile", requireAuth, requireRole(["doctor"]), getDoctorProfile);
router.put(
  "/profile",
  requireAuth,
  requireRole(["doctor"]),
  validate(updateDoctorProfileSchema),
  updateDoctorProfile,
);

// Public/Receptionist route to get list of all doctors
router.get("/", requireAuth, getAllDoctors);

export default router;
