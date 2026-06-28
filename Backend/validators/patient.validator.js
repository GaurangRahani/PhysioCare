import { z } from 'zod';

export const updatePatientProfileSchema = z.object({
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }).optional().nullable(),
  date_of_birth: z.string()
    .datetime({ message: "Date of birth must be a valid ISO date-time string" })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date of birth must be in YYYY-MM-DD format" }))
    .optional()
    .nullable(),
  gender: z.enum(['male', 'female', 'other'], { 
    errorMap: () => ({ message: "Gender must be 'male', 'female', or 'other'" }) 
  }).optional().nullable(),
  address: z.string().max(500, { message: "Address cannot exceed 500 characters" }).optional().nullable(),
  emergency_contact_name: z.string().max(100, { message: "Emergency contact name cannot exceed 100 characters" }).optional().nullable(),
  emergency_contact_phone: z.string().max(20, { message: "Emergency contact phone cannot exceed 20 characters" }).optional().nullable(),
  medical_history: z.string().max(2000, { message: "Medical history cannot exceed 2000 characters" }).optional().nullable(),
});
