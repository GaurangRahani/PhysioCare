import express from 'express';
import {
    createTreatmentPlan,
    completeTreatmentPlan,
    cancelTreatmentPlan,
    assignExercise,
} from '../controllers/treatmentPlan.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createTreatmentPlanSchema } from '../validators/treatmentPlan.validator.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', requireAuth, requireRole(['doctor']), validate(createTreatmentPlanSchema), createTreatmentPlan);
router.patch('/:id/complete', requireAuth, requireRole(['doctor']), completeTreatmentPlan);
router.patch('/:id/cancel', requireAuth, requireRole(['doctor']), cancelTreatmentPlan);

// Assign an exercise to a treatment plan
router.post('/:id/exercises', requireAuth, requireRole(['doctor']), assignExercise);

export default router;
