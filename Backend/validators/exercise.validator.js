import { z } from 'zod';

export const createExerciseSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    instructions: z.string().optional(),
    target_body_part: z.string().optional(),
    video_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    photo_urls: z.array(z.string().url("Must be a valid URL")).optional()
});

export const updateExerciseSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    target_body_part: z.string().optional(),
    video_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    photo_urls: z.array(z.string().url("Must be a valid URL")).optional()
});
