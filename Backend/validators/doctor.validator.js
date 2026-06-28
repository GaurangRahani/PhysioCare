import { z } from 'zod';

export const updateDoctorProfileSchema = z.object({
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }).optional().nullable(),
  specialization: z.string().min(2, { message: "Specialization is required" }).optional(),
  qualification: z.string().min(2, { message: "Qualification is required" }).optional()
});
