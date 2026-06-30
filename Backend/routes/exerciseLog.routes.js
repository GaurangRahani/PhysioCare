import express from 'express';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { getDailySchedule, createExerciseLog, getExerciseLogs } from '../controllers/exerciseLog.controller.js';

const router = express.Router();

// Patient sees today's exercise checklist
router.get('/today', requireAuth, requireRole(['patient']), getDailySchedule);

// Patient logs a completed exercise session or reports a concern
router.post('/', requireAuth, requireRole(['patient']), createExerciseLog);

// Doctor (or admin) fetches all logs for a specific patient
router.get('/patient/:patient_id', requireAuth, requireRole(['doctor', 'admin']), getExerciseLogs);

export default router;
