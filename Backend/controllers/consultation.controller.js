import { db } from '../src/db/index.js';
import { consultations, appointments, users, treatmentPlans, exerciseLogs, patientProfiles } from '../src/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

// ─── 1. POST /api/consultations ───────────────────────────────────────────────
export const createConsultation = async (req, res) => {
    const {
        appointment_id,
        patient_id,
        diagnosis,
        clinical_notes,
        treatment_recommendations,
        consultation_type,
        previous_treatment_plan_id
    } = req.body;

    try {
        // 1. Verify Appointment
        const [appointment] = await db.select().from(appointments).where(eq(appointments.id, appointment_id));
        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        // Ensure doctor owns this appointment (or receptionist for dev)
        if (req.user.role === 'doctor' && appointment.doctor_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'You can only create consultations for your own appointments' });
        }

        if (appointment.status !== 'scheduled') {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot start consultation. Appointment status is '${appointment.status}'. Must be 'scheduled'.` 
            });
        }

        // 2. Verify previous treatment plan if follow_up
        if (consultation_type === 'follow_up' && !previous_treatment_plan_id) {
            return res.status(400).json({ success: false, message: 'previous_treatment_plan_id is required for follow_up consultations.' });
        }
        if (consultation_type === 'follow_up' && previous_treatment_plan_id) {
            const [prevPlan] = await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, previous_treatment_plan_id));
            if (!prevPlan) {
                return res.status(404).json({ success: false, message: 'Previous treatment plan not found' });
            }
            if (prevPlan.patient_id !== patient_id) {
                return res.status(400).json({ success: false, message: 'Treatment plan belongs to a different patient' });
            }
        }

        // 3. Transaction: Insert consultation + update appointment
        const result = await db.transaction(async (tx) => {
            const [newConsultation] = await tx.insert(consultations).values({
                appointment_id,
                patient_id,
                doctor_id: appointment.doctor_id,
                diagnosis,
                clinical_notes,
                treatment_recommendations,
                consultation_type,
                previous_treatment_plan_id
            }).returning();

            await tx.update(appointments)
                .set({ status: 'completed', updated_at: new Date() })
                .where(eq(appointments.id, appointment_id));

            return newConsultation;
        });

        return res.status(201).json({
            success: true,
            message: 'Consultation recorded successfully',
            consultation: result
        });

    } catch (error) {
        // Catch unique constraint on appointment_id
        const isDuplicate = error.code === '23505' || 
                            (error.cause && error.cause.code === '23505') ||
                            (error.message && error.message.includes('unique constraint'));
                            
        if (isDuplicate) {
            return res.status(409).json({
                success: false,
                message: 'Consultation already recorded for this visit.'
            });
        }
        
        console.error('Error creating consultation:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// ─── 2. GET /api/consultations/:id ───────────────────────────────────────────
export const getConsultationById = async (req, res) => {
    try {
        const { id } = req.params;

        const [consultation] = await db.select().from(consultations).where(eq(consultations.id, id));
        if (!consultation) {
            return res.status(404).json({ success: false, message: 'Consultation not found' });
        }

        // Fetch related entities
        const [patient] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, consultation.patient_id));
        const [appointment] = await db.select().from(appointments).where(eq(appointments.id, consultation.appointment_id));
        
        let previousPlan = null;
        if (consultation.consultation_type === 'follow_up' && consultation.previous_treatment_plan_id) {
            [previousPlan] = await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, consultation.previous_treatment_plan_id));
        }

        return res.status(200).json({
            success: true,
            consultation,
            patient,
            appointment,
            previous_treatment_plan: previousPlan
        });

    } catch (error) {
        console.error('Error fetching consultation:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
