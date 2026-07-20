import express from "express";
import {
  getPatientProfile,
  updatePatientProfile,
  getAllPatients,
  getPatientHistory,
  getTodaySchedule,
  getPatientProgress,
  dischargePatient,
  reactivatePatient,
  getPatientOverview,
  getPatientActivePlanCompliance,
  getComplianceLogs,
  getDoctorPatientsTab,
} from "../controllers/patient.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { updatePatientProfileSchema } from "../validators/patient.validator.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only patients can view and update their own profile
router.get(
  "/profile",
  requireAuth,
  requireRole(["patient"]),
  getPatientProfile,
);
router.put(
  "/profile",
  requireAuth,
  requireRole(["patient"]),
  validate(updatePatientProfileSchema),
  updatePatientProfile,
);

// Only doctors and admins can view the list of all patients
router.get("/", requireAuth, requireRole(["doctor", "admin"]), getAllPatients);

// Doctor views the patient's full clinical history
router.get(
  "/:patient_id/history",
  requireAuth,
  requireRole(["doctor", "admin"]),
  getPatientHistory,
);

// Patient or doctor sees today's exercise schedule for a patient
router.get(
  "/:patient_id/today",
  requireAuth,
  requireRole(["patient", "doctor", "admin"]),
  getTodaySchedule,
);

// Doctor or patient reviews full progress (compliance, pain trend, calendar, flagged logs)
router.get(
  "/:patient_id/progress",
  requireAuth,
  requireRole(["patient", "doctor", "admin"]),
  getPatientProgress,
);

// Doctor discharges a patient — completes plan and clears future schedule
router.post(
  "/:patient_id/discharge",
  requireAuth,
  requireRole(["doctor"]),
  dischargePatient,
);

// Reactivate a discharged patient so they can be booked again
router.patch(
  "/:patient_id/reactivate",
  requireAuth,
  requireRole(["doctor", "admin"]),
  reactivatePatient,
);

// Doctor views the patient's lightweight overview before consultation
router.get(
  "/:patient_id/overview",
  requireAuth,
  requireRole(["doctor", "admin"]),
  getPatientOverview,
);

// Doctor views compliance summary for the active treatment plan
router.get(
  "/:patient_id/treatment-plans/active/compliance",
  requireAuth,
  requireRole(["doctor", "admin"]),
  getPatientActivePlanCompliance,
);

// Doctor views compliance logs
router.get(
  "/:patient_id/compliance-logs",
  requireAuth,
  requireRole(["doctor", "admin"]),
  getComplianceLogs,
);

// Doctor Dashboard - My Patients Tab
router.get(
  "/doctor/my-patients",
  requireAuth,
  requireRole(["doctor"]),
  getDoctorPatientsTab,
);

export default router;
