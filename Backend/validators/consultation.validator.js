import { z } from 'zod';

export const createConsultationSchema = z.object({
    appointment_id: z.string().uuid("Invalid appointment ID"),
    patient_id: z.string().uuid("Invalid patient ID"),
    diagnosis: z.string().optional(),
    clinical_notes: z.string().optional(),
    treatment_recommendations: z.string().optional(),
    consultation_type: z.enum(['initial', 'follow_up']).default('initial'),
    previous_treatment_plan_id: z.string().uuid().optional()
}).refine(data => {
    // If follow_up, previous_treatment_plan_id is required
    if (data.consultation_type === 'follow_up') {
        return !!data.previous_treatment_plan_id;
    }
    return true;
}, {
    message: "previous_treatment_plan_id is required for follow_up consultations",
    path: ["previous_treatment_plan_id"]
});
