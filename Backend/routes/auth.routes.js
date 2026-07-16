import express from 'express';
import { getMe, clearPasswordFlag } from '../controllers/auth.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get logged in user's core details and role (usable by ANY role)
router.get('/me', requireAuth, requireRole(['patient', 'doctor', 'receptionist']), getMe);

// Clear force_password_change flag
router.post('/clear-password-flag', requireAuth, requireRole(['patient', 'doctor', 'receptionist']), clearPasswordFlag);

export default router;
