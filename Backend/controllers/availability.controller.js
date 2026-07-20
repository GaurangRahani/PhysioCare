import { db } from "../src/db/index.js";
import { doctorProfiles, appointments } from "../src/db/schema/index.js";
import { eq, and, gte, lt, ne } from "drizzle-orm";

// ─── HELPER ─────────────────────────────────────────────────────────────────
// Generates an array of "HH:MM" slots from a list of shift objects
const generateSlots = (shifts, slotMinutes) => {
  const slots = [];
  for (const shift of shifts) {
    let current = new Date(`2000-01-01T${shift.start}:00Z`);
    const end = new Date(`2000-01-01T${shift.end}:00Z`);
    while (current < end) {
      const next = new Date(current.getTime() + slotMinutes * 60000);
      if (next > end) break;
      const hh = String(current.getUTCHours()).padStart(2, "0");
      const mm = String(current.getUTCMinutes()).padStart(2, "0");
      slots.push(`${hh}:${mm}`);
      current = next;
    }
  }
  return slots;
};

// ─── 1. GET /api/availability ─────────────────────────────────────────────────
// Doctor gets their full availability_rules JSON object
export const getAvailabilityRules = async (req, res) => {
  try {
    const [profile] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.user_id, req.user.id));

    if (!profile) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Doctor profile not found. Please update your profile first.",
        });
    }

    return res
      .status(200)
      .json({ success: true, availability_rules: profile.availability_rules });
  } catch (error) {
    console.error("Error getting availability rules:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 2. PUT /api/availability/weekly ─────────────────────────────────────────
export const setWeeklyDay = async (req, res) => {
  try {
    const { day_of_week, shifts } = req.body;

    const [profile] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.user_id, req.user.id));

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found." });
    }

    // Deep clone to avoid shallow copy trap — spread (...) only copies top-level keys
    const updatedRules = structuredClone(profile.availability_rules);

    if (shifts.length === 0) {
      // Remove that day entirely (means "off")
      delete updatedRules.weekly_routine[String(day_of_week)];
    } else {
      updatedRules.weekly_routine[String(day_of_week)] = shifts;
    }

    const [updated] = await db
      .update(doctorProfiles)
      .set({ availability_rules: updatedRules })
      .where(eq(doctorProfiles.user_id, req.user.id))
      .returning();

    return res.status(200).json({
      success: true,
      message:
        shifts.length === 0
          ? `Day ${day_of_week} marked as day off`
          : `Weekly schedule for day ${day_of_week} updated`,
      availability_rules: updated.availability_rules,
    });
  } catch (error) {
    console.error("Error setting weekly day:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 3. POST /api/availability/specific-date ─────────────────────────────────

export const setSpecificDate = async (req, res) => {
  try {
    const { date, shifts } = req.body;

    const [profile] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.user_id, req.user.id));

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found." });
    }

    const updatedRules = structuredClone(profile.availability_rules);
    updatedRules.specific_dates[date] = shifts; // [] = leave, [...] = custom hours

    const [updated] = await db
      .update(doctorProfiles)
      .set({ availability_rules: updatedRules })
      .where(eq(doctorProfiles.user_id, req.user.id))
      .returning();

    return res.status(200).json({
      success: true,
      message:
        shifts.length === 0
          ? `${date} marked as leave/holiday`
          : `Custom hours set for ${date}`,
      availability_rules: updated.availability_rules,
    });
  } catch (error) {
    console.error("Error setting specific date:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 4. DELETE /api/availability/specific-date/:date ─────────────────────────
// Removes a date override (doctor goes back to their normal weekly schedule for that date)
export const deleteSpecificDate = async (req, res) => {
  try {
    const { date } = req.params;

    const [profile] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.user_id, req.user.id));

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found." });
    }

    const updatedRules = structuredClone(profile.availability_rules);

    if (!updatedRules.specific_dates[date]) {
      return res
        .status(404)
        .json({ success: false, message: `No override found for ${date}` });
    }

    delete updatedRules.specific_dates[date];

    const [updated] = await db
      .update(doctorProfiles)
      .set({ availability_rules: updatedRules })
      .where(eq(doctorProfiles.user_id, req.user.id))
      .returning();

    return res.status(200).json({
      success: true,
      message: `Override for ${date} removed. Doctor reverts to normal weekly schedule.`,
      availability_rules: updated.availability_rules,
    });
  } catch (error) {
    console.error("Error deleting specific date:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 5. PUT /api/availability/slot-duration ───────────────────────────────────
// Doctor changes slot length (e.g., from 30 mins to 45 mins)
export const setSlotDuration = async (req, res) => {
  try {
    const { slot_minutes } = req.body;

    const [profile] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.user_id, req.user.id));

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor profile not found." });
    }

    const updatedRules = structuredClone(profile.availability_rules);
    updatedRules.slot_minutes = slot_minutes;

    const [updated] = await db
      .update(doctorProfiles)
      .set({ availability_rules: updatedRules })
      .where(eq(doctorProfiles.user_id, req.user.id))
      .returning();

    return res.status(200).json({
      success: true,
      message: `Slot duration updated to ${slot_minutes} minutes`,
      availability_rules: updated.availability_rules,
    });
  } catch (error) {
    console.error("Error setting slot duration:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 6. THE SLOT ENGINE ───────────────────────────────────────────────────────
// GET /api/availability/slots?doctor_id=X&date=YYYY-MM-DD
// Open to any authenticated user (patients, receptionists, doctors)
export const getAvailableSlots = async (req, res) => {
  try {
    let { doctor_id, date } = req.query;

    if (!doctor_id || !date) {
      return res
        .status(400)
        .json({
          success: false,
          message: "doctor_id and date query params are required",
        });
    }

    if (doctor_id === "me" && req.user) {
      doctor_id = req.user.id;
    }

    // ── Step 1: 1-Year Security Check (both dates normalized to UTC midnight to prevent timezone glitch) ──
    const requestedDate = new Date(`${date}T00:00:00Z`); // Force UTC midnight
    const today = new Date(
      new Date().toISOString().split("T")[0] + "T00:00:00Z",
    ); // Server today in UTC
    const maxDate = new Date(today);
    maxDate.setUTCFullYear(today.getUTCFullYear() + 1);

    if (requestedDate > maxDate) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot book more than 1 year in advance",
        });
    }

    // ── Step 2: Single DB query for doctor rules ────────────────────────
    const [profile] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.user_id, doctor_id));

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    const { slot_minutes, weekly_routine, specific_dates } =
      profile.availability_rules;

    // ── Step 3: Opt-In Logic (Core Engine) ─────────────────────────────
    let workingShifts = null;

    if (specific_dates[date] !== undefined) {
      // A specific override exists for this exact date
      workingShifts = specific_dates[date]; // Could be [] (leave) or [{...}] (custom hours)
    } else {
      // Fallback to the weekly template
      const dayOfWeek = requestedDate.getUTCDay(); // 0=Sun, 6=Sat
      workingShifts = weekly_routine[String(dayOfWeek)] || null;
    }

    // Default Closed check
    if (!workingShifts || workingShifts.length === 0) {
      return res
        .status(200)
        .json({ success: true, date, available: false, slots: [] });
    }

    // ── Step 4: Generate All Slots ─────────────────────────────────────
    const allSlots = generateSlots(workingShifts, slot_minutes);

    // ── Step 5: Fetch & Subtract Booked Appointments ───────────────────
    const nextDay = new Date(requestedDate);
    nextDay.setUTCDate(requestedDate.getUTCDate() + 1);

    const booked = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctor_id, doctor_id),
          eq(appointments.appointment_date, date),
          ne(appointments.status, "cancelled"),
        ),
      );

    // Convert booked times to "HH:MM" for comparison
    const bookedTimes = booked.map((a) => a.start_time.slice(0, 5));

    // ── Step 6: Return Clean Available Slots ───────────────────────────
    const availableSlots = allSlots.filter(
      (slot) => !bookedTimes.includes(slot),
    );

    return res.status(200).json({
      success: true,
      date,
      available: availableSlots.length > 0,
      slot_minutes,
      slots: availableSlots,
    });
  } catch (error) {
    console.error("Slot Engine error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
