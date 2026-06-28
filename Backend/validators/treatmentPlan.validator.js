import { z } from 'zod';

export const createTreatmentPlanSchema = z.object({
    consultation_id: z.string().uuid("Invalid consultation ID"),
    patient_id: z.string().uuid("Invalid patient ID"),
    title: z.string().optional(),
    start_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid start date format" }),
    end_date: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid end date format" })
}).refine(data => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return end >= start;
}, {
    message: "End date cannot be before start date",
    path: ["end_date"]
});
