import { z } from 'zod';

export const updateReceptionistProfileSchema = z.object({
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }).optional().nullable()
});
