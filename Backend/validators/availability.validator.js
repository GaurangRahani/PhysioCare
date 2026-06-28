import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// A single shift block e.g. { start: "09:00", end: "12:00" }
const shiftSchema = z.object({
  start: z.string().regex(timeRegex, 'Must be HH:MM format (e.g. 09:00)'),
  end: z.string().regex(timeRegex, 'Must be HH:MM format (e.g. 12:00)'),
}).refine(data => data.start < data.end, {
  message: 'End time must be after start time',
  path: ['end']
});

// PUT /api/availability/weekly - Set shifts for one day of the week
// day_of_week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// shifts: array of shift objects (empty array = doctor is off that day)
export const setWeeklyDaySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  shifts: z.array(shiftSchema)  // [] means day is off
});

// POST /api/availability/specific-date - Override a specific calendar date
// shifts: [] means on leave, [...] means custom hours for that day
export const setSpecificDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  shifts: z.array(shiftSchema)  // [] means on leave
});

// PUT /api/availability/slot-duration - Change the slot size
export const setSlotDurationSchema = z.object({
  slot_minutes: z.number().int().min(5).max(120)
});
