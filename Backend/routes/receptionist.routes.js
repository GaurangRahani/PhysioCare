import express from 'express';
import { createPatient, searchPatients } from '../controllers/receptionist.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { z } from 'zod';

const router = express.Router();

const createPatientSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Invalid phone number'),
    date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: z.string().max(500).optional()
});

// Create a new patient account
router.post(
    '/patients/create',
    requireAuth,
    requireRole(['receptionist']),
    validate(createPatientSchema),
    createPatient
);

// Search/list all patients
router.get(
    '/patients/search',
    requireAuth,
    requireRole(['receptionist', 'doctor']),
    searchPatients
);

export default router;
