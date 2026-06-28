import express from 'express';
import { getPatientProfile, updatePatientProfile, getAllPatients, getPatientHistory } from '../controllers/patient.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updatePatientProfileSchema } from '../validators/patient.validator.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Only patients can view and update their own profile
router.get('/profile', requireAuth, requireRole(['patient']), getPatientProfile);
router.put('/profile', requireAuth, requireRole(['patient']), validate(updatePatientProfileSchema), updatePatientProfile);

// Only doctors and admins can view the list of all patients
router.get('/', requireAuth, requireRole(['doctor', 'admin']), getAllPatients);

// Doctor views the patient's full clinical history
router.get('/:patient_id/history', requireAuth, requireRole(['doctor', 'admin']), getPatientHistory);

export default router;
