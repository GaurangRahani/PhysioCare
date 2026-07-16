import express from 'express';
import { createExercise, getExercises, updateExercise, deleteExercise, activateExercise } from '../controllers/exercise.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createExerciseSchema, updateExerciseSchema } from '../validators/exercise.validator.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

// Accept any files, we will filter them manually in the controller to avoid Postman strictness issues
const exerciseUpload = upload.any();

// Only doctors and admins can manage exercises
// Note: Zod validation on FormData fields can be tricky if they come as strings, 
// so we might need to adjust validation if the frontend sends everything as FormData.
router.post('/', requireAuth, requireRole(['doctor', 'admin']), (req, res, next) => {
    console.log('[DEBUG] Reached POST /api/exercises. Now starting Multer upload...');
    next();
}, exerciseUpload, validate(createExerciseSchema), createExercise);
router.get('/', requireAuth, requireRole(['doctor', 'admin', 'patient']), getExercises);
router.put('/:id', requireAuth, requireRole(['doctor', 'admin']), exerciseUpload, validate(updateExerciseSchema), updateExercise);
router.patch('/:id/activate', requireAuth, requireRole(['doctor', 'admin']), activateExercise);
router.delete('/:id', requireAuth, requireRole(['doctor', 'admin']), deleteExercise);

export default router;
