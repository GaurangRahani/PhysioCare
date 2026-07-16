import express from 'express';
import {
    createTreatmentPlan,
    completeTreatmentPlan,
    cancelTreatmentPlan,
    updateAssignment,
    deleteAssignment,
    addExerciseToPlan,
} from '../controllers/treatmentPlan.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createTreatmentPlanSchema } from '../validators/treatmentPlan.validator.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', requireAuth, requireRole(['doctor']), validate(createTreatmentPlanSchema), createTreatmentPlan);
router.post('/:id/exercises', requireAuth, requireRole(['doctor']), addExerciseToPlan);
router.patch('/:id/complete', requireAuth, requireRole(['doctor']), completeTreatmentPlan);
router.patch('/:id/cancel', requireAuth, requireRole(['doctor']), cancelTreatmentPlan);

// Modify or remove an existing exercise assignment
router.patch('/:id', requireAuth, requireRole(['doctor']), updateAssignment);
router.delete('/:id', requireAuth, requireRole(['doctor']), deleteAssignment);

export default router;
