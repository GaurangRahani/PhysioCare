import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import webhookRoutes from './routes/webhook.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import patientRoutes from './routes/patient.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import receptionistRoutes from './routes/receptionist.routes.js';
import availabilityRoutes from './routes/availability.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import consultationRoutes from './routes/consultation.routes.js';
import exerciseRoutes from './routes/exercise.routes.js';
import treatmentPlanRoutes from './routes/treatmentPlan.routes.js';
import exerciseLogRoutes from './routes/exerciseLog.routes.js';
import { startExpiryJob, startMissedScheduleSweep } from './jobs/expiry.job.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(clerkMiddleware());

// ── Webhook routes MUST use express.raw() — before express.json() ─────────────
app.use('/api/webhooks/clerk', express.raw({ type: 'application/json' }), webhookRoutes);
// Razorpay webhook ONLY needs raw body — mount just the webhook path
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentRoutes);

app.use(express.json());

// ── API Routes ─────────────────────────────────────────────────────────
app.use('/api/payments', paymentRoutes); // invoice GET endpoints use JSON body───────
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/receptionists', receptionistRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/treatment-plans', treatmentPlanRoutes);
// PATCH/DELETE /api/treatment-plan-exercises/:id are also handled by treatmentPlanRoutes
app.use('/api/treatment-plan-exercises', treatmentPlanRoutes);
app.use('/api/exercise-logs', exerciseLogRoutes);

app.get('/', (req, res) => {
  res.send('PhysioCare API is running!');
});
app.get('/api/protected', (req, res) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ error: 'Unauthorized! Please log in.' });
  }
  const { userId } = req.auth;
  res.json({ message: 'Success! You are authenticated!', userId });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  startExpiryJob();          // Every minute: cancel unpaid expired appointments
  startMissedScheduleSweep(); // Every midnight: mark missed exercises
});
