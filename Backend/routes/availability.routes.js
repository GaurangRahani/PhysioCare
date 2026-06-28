import express from 'express';
import {
    getAvailabilityRules,
    setWeeklyDay,
    setSpecificDate,
    deleteSpecificDate,
    setSlotDuration,
    getAvailableSlots
} from '../controllers/availability.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
    setWeeklyDaySchema,
    setSpecificDateSchema,
    setSlotDurationSchema
} from '../validators/availability.validator.js';

const router = express.Router();

// ── Doctor-Only Routes (Managing the Schedule) ───────────────────────────────
router.get('/', requireAuth, requireRole(['doctor']), getAvailabilityRules);
router.put('/weekly', requireAuth, requireRole(['doctor']), validate(setWeeklyDaySchema), setWeeklyDay);
router.post('/specific-date', requireAuth, requireRole(['doctor']), validate(setSpecificDateSchema), setSpecificDate);
router.delete('/specific-date/:date', requireAuth, requireRole(['doctor']), deleteSpecificDate);
router.put('/slot-duration', requireAuth, requireRole(['doctor']), validate(setSlotDurationSchema), setSlotDuration);

// ── Open to Any Authenticated User (Patients, Receptionists, Doctors) ────────
router.get('/slots', requireAuth, getAvailableSlots);

export default router;
