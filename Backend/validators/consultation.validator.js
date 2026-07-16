import { z } from 'zod';

export const createConsultationSchema = z.object({
    appointment_id: z.string().uuid("Invalid appointment ID"),
    patient_id: z.string().uuid("Invalid patient ID"),
    diagnosis: z.string().optional(),
    clinical_notes: z.string().optional(),
    treatment_recommendations: z.string().optional(),
    consultation_type: z.enum(['initial', 'follow_up']).default('initial'),
    previous_treatment_plan_id: z.string().uuid().optional()
});
