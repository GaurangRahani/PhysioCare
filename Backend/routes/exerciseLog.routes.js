import express from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { createExerciseLog, getExerciseLogs } from '../controllers/exerciseLog.controller.js';

const router = express.Router();

// Patient logs a completed exercise session or reports a concern
router.post('/', requireAuth, requireRole(['patient']), createExerciseLog);

// Doctor (or admin) fetches all logs for a specific patient
router.get('/patient/:patient_id', requireAuth, requireRole(['doctor', 'admin']), getExerciseLogs);

export default router;
