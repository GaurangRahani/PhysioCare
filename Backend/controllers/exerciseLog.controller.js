import { db } from "../src/db/index.js";
import {
  exerciseLogs,
  patientSchedule,
  treatmentPlanExercises,
  treatmentPlans,
  exercises,
} from "../src/db/schema/index.js";
import { eq, and, gte, lte, isNotNull } from "drizzle-orm";

// Patient opens app → sees their full exercise list for today
export const getDailySchedule = async (req, res) => {
  try {
    const patient_id = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    // Fetch all schedule rows for today for this patient
    // Join with exercises table to get exercise name, instructions, video
    const scheduleRows = await db
      .select({
        schedule_id: patientSchedule.id,
        scheduled_date: patientSchedule.scheduled_date,
        session_number: patientSchedule.session_number,
        status: patientSchedule.status,
        treatment_plan_exercise_id: patientSchedule.treatment_plan_exercise_id,
        // Exercise details
        exercise_id: exercises.id,
        exercise_name: exercises.name,
        target_body_part: exercises.target_body_part,
        instructions: exercises.instructions,
        video_url: exercises.video_url,
        // Assignment details (sets/reps prescribed by doctor)
        sets: treatmentPlanExercises.sets,
        reps: treatmentPlanExercises.reps,
        sessions_per_day: treatmentPlanExercises.sessions_per_day,
        notes: treatmentPlanExercises.notes,
      })
      .from(patientSchedule)
      .innerJoin(
        treatmentPlanExercises,
        eq(
          patientSchedule.treatment_plan_exercise_id,
          treatmentPlanExercises.id,
        ),
      )
      .innerJoin(
        exercises,
        eq(treatmentPlanExercises.exercise_id, exercises.id),
      )
      .where(
        and(
          eq(patientSchedule.patient_id, patient_id),
          eq(patientSchedule.scheduled_date, today),
        ),
      );

    // Separate into pending vs completed/missed for easy frontend rendering
    const pending = scheduleRows.filter((r) => r.status === "pending");
    const completed = scheduleRows.filter((r) => r.status === "completed");
    const missed = scheduleRows.filter((r) => r.status === "missed");

    return res.status(200).json({
      success: true,
      date: today,
      total_sessions: scheduleRows.length,
      pending_count: pending.length,
      completed_count: completed.length,
      missed_count: missed.length,
      schedule: {
        pending,
        completed,
        missed,
      },
    });
  } catch (error) {
    console.error("Error fetching daily schedule:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 1. POST /api/exercise-logs ───────────────────────────────────────────────
export const createExerciseLog = async (req, res) => {
  try {
    const {
      treatment_plan_exercise_id,
      log_date,
      session_number,
      sets_completed,
      pain_level,
      comments,
      issue_type,
      attachment_urls,
      is_skipped,
    } = req.body;

    const patient_id = req.user.id;
    const today = new Date().toISOString().split("T")[0];

    //general concern like pain or other issue
    if (!treatment_plan_exercise_id) {
      if (!issue_type) {
        return res.status(400).json({
          success: false,
          message:
            "issue_type is required when logging a concern without an exercise.",
        });
      }

      if (sets_completed != null) {
        return res.status(400).json({
          success: false,
          message: "sets_completed must be null for standalone concern logs.",
        });
      }

      // Just insert the log — no schedule update, no counter increment
      const [log] = await db
        .insert(exerciseLogs)
        .values({
          treatment_plan_exercise_id: null,
          patient_id,
          log_date,
          session_number: null,
          sets_completed: null,
          pain_level,
          comments,
          issue_type,
          attachment_urls,
        })
        .returning();

      return res.status(201).json({
        success: true,
        message: "Concern logged successfully.",
        log,
      });
    }

    //exercise log

    const [tpe] = await db
      .select()
      .from(treatmentPlanExercises)
      .where(eq(treatmentPlanExercises.id, treatment_plan_exercise_id));

    if (!tpe) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise assignment not found." });
    }
    if (!tpe.is_active) {
      return res.status(400).json({
        success: false,
        message:
          "This exercise is no longer part of your plan. It may have been modified or removed by your doctor.",
      });
    }

    const [plan] = await db
      .select()
      .from(treatmentPlans)
      .where(eq(treatmentPlans.id, tpe.treatment_plan_id));

    if (!plan || plan.status !== "active") {
      return res.status(400).json({
        success: false,
        message:
          "This treatment plan is no longer active and cannot accept new logs.",
      });
    }

    if (log_date !== today) {
      return res.status(400).json({
        success: false,
        message: `You can only log for today (${today}). Older logs are not accepted.`,
      });
    }

    const [scheduleRow] = await db
      .select()
      .from(patientSchedule)
      .where(
        and(
          eq(patientSchedule.patient_id, patient_id),
          eq(
            patientSchedule.treatment_plan_exercise_id,
            treatment_plan_exercise_id,
          ),
          eq(patientSchedule.scheduled_date, log_date),
          eq(patientSchedule.session_number, session_number),
        ),
      );

    if (!scheduleRow) {
      return res.status(404).json({
        success: false,
        message: `No scheduled session found for this exercise on ${log_date} (session ${session_number}). Check your schedule.`,
      });
    }

    let newLog;
    let isAlreadyLogged = false;

    await db.transaction(async (tx) => {
      const insertedRows = await tx
        .insert(exerciseLogs)
        .values({
          treatment_plan_exercise_id,
          patient_id,
          log_date,
          session_number,
          sets_completed,
          pain_level,
          comments,
          issue_type,
          attachment_urls,
          is_skipped: is_skipped || false,
        })
        .onConflictDoNothing()
        .returning();

      if (insertedRows.length === 0) {
        isAlreadyLogged = true;
        return;
      }

      newLog = insertedRows[0];

      await tx
        .update(patientSchedule)
        .set({ status: "completed" })
        .where(eq(patientSchedule.id, scheduleRow.id));

      await tx
        .update(treatmentPlanExercises)
        .set({
          completed_sessions_count: tpe.completed_sessions_count + 1,
          updated_at: new Date(),
        })
        .where(eq(treatmentPlanExercises.id, treatment_plan_exercise_id));
    });

    if (isAlreadyLogged) {
      return res.status(200).json({
        alreadyLogged: true,
        message:
          "This session has already been logged. You cannot log the same session twice.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Exercise session logged successfully.",
      log: newLog,
    });
  } catch (error) {
    console.error("Error creating exercise log:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/exercise-logs/patient/:patient_id
export const getExerciseLogs = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { from, to } = req.query;

    // Build the date range filter dynamically
    const filters = [eq(exerciseLogs.patient_id, patient_id)];

    if (from) filters.push(gte(exerciseLogs.log_date, from));
    if (to) filters.push(lte(exerciseLogs.log_date, to));

    const logs = await db
      .select()
      .from(exerciseLogs)
      .where(and(...filters))
      .orderBy(exerciseLogs.log_date);

    const flagged = logs.filter(
      (log) =>
        (log.pain_level != null && log.pain_level >= 7) ||
        log.issue_type != null ||
        log.is_skipped,
    );
    const normal = logs.filter(
      (log) =>
        (log.pain_level == null || log.pain_level < 7) &&
        log.issue_type == null &&
        !log.is_skipped,
    );

    return res.status(200).json({
      success: true,
      total: logs.length,
      flagged_count: flagged.length,
      data: {
        flagged, // Doctor sees these first — highlighted in red in the UI
        normal,
      },
    });
  } catch (error) {
    console.error("Error fetching exercise logs:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/exercise-logs/:id/acknowledge
export const acknowledgeUrgentAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor_id = req.user.id;

    const [updatedLog] = await db
      .update(exerciseLogs)
      .set({ doctor_reviewed: true })
      .where(eq(exerciseLogs.id, id))
      .returning();

    if (!updatedLog) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise log not found." });
    }

    return res
      .status(200)
      .json({ success: true, message: "Alert acknowledged.", log: updatedLog });
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
