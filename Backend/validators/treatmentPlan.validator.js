import { z } from 'zod';

export const createTreatmentPlanSchema = z.object({
    consultation_id: z.string().uuid("Invalid consultation ID"),
    patient_id: z.string().uuid("Invalid patient ID"),
    title: z.string().optional(),
    start_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid start date format" }),
    end_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid end date format" }),
    exercises: z.array(z.object({
        exercise_id: z.string().uuid("Invalid exercise ID"),
        sets: z.number().int().positive().optional(),
        reps: z.number().int().positive().optional(),
        sessions_per_day: z.number().int().positive().default(1),
        frequency_type: z.enum(['daily', 'alternate_days', 'mon_wed_fri', 'tue_thu_sat', 'custom_days']),
        frequency_days: z.union([z.number(), z.array(z.number())]).nullable().optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        notes: z.string().optional()
    })).optional()
}).refine(data => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return end >= start;
}, {
    message: "End date cannot be before start date",
    path: ["end_date"]
});
