import express from "express";
import {
  createTreatmentPlan,
  completeTreatmentPlan,
  cancelTreatmentPlan,
  updateAssignment,
  deleteAssignment,
  addExerciseToPlan,
  getExercisesByPlan,
  modifyAssignment,
  discontinueAssignment,
  discontinueTreatmentPlan,
  freezeTreatmentPlan,
  resumeTreatmentPlan,
} from "../controllers/treatmentPlan.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createTreatmentPlanSchema } from "../validators/treatmentPlan.validator.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole(["doctor"]),
  validate(createTreatmentPlanSchema),
  createTreatmentPlan,
);
router.get(
  "/:id/exercises",
  requireAuth,
  requireRole(["doctor"]),
  getExercisesByPlan,
);
router.post(
  "/:id/exercises",
  requireAuth,
  requireRole(["doctor"]),
  addExerciseToPlan,
);
router.patch(
  "/:id/complete",
  requireAuth,
  requireRole(["doctor"]),
  completeTreatmentPlan,
);
router.patch(
  "/:id/cancel",
  requireAuth,
  requireRole(["doctor"]),
  cancelTreatmentPlan,
);
router.patch(
  "/:id/discontinue",
  requireAuth,
  requireRole(["doctor"]),
  discontinueTreatmentPlan,
);
router.patch(
  "/:id/freeze",
  requireAuth,
  requireRole(["doctor"]),
  freezeTreatmentPlan,
);
router.patch(
  "/:id/resume",
  requireAuth,
  requireRole(["doctor"]),
  resumeTreatmentPlan,
);

// Modify or remove an existing exercise assignment
router.patch("/:id", requireAuth, requireRole(["doctor"]), updateAssignment);
router.delete("/:id", requireAuth, requireRole(["doctor"]), deleteAssignment);
router.patch(
  "/assignments/:id/modify",
  requireAuth,
  requireRole(["doctor"]),
  modifyAssignment,
);
router.patch(
  "/assignments/:id/discontinue",
  requireAuth,
  requireRole(["doctor"]),
  discontinueAssignment,
);

export default router;
