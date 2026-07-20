import { db } from "../src/db/index.js";
import {
  exerciseLogs,
  users,
  treatmentPlanExercises,
  treatmentPlans,
} from "../src/db/schema/index.js";
import { eq, and, or, gte, isNotNull, desc } from "drizzle-orm";

// Get pending alerts for a doctor's patients
export const getPendingAlerts = async (req, res) => {
  try {
    const doctorId = req.user.id;

    // An alert is any unreviewed exercise_log where pain >= 5 OR issue_type is present
    const unreviewedLogs = await db
      .select({
        id: exerciseLogs.id,
        log_date: exerciseLogs.log_date,
        pain_level: exerciseLogs.pain_level,
        issue_type: exerciseLogs.issue_type,
        comments: exerciseLogs.comments,
        patient_id: users.id,
        patient_name: users.name,
        treatment_plan_id: treatmentPlans.id,
      })
      .from(exerciseLogs)
      .innerJoin(users, eq(exerciseLogs.patient_id, users.id))
      .innerJoin(
        treatmentPlanExercises,
        eq(exerciseLogs.treatment_plan_exercise_id, treatmentPlanExercises.id),
      )
      .innerJoin(
        treatmentPlans,
        eq(treatmentPlanExercises.treatment_plan_id, treatmentPlans.id),
      )
      .where(
        and(
          eq(treatmentPlans.doctor_id, doctorId),
          eq(exerciseLogs.doctor_reviewed, false),
          or(
            gte(exerciseLogs.pain_level, 5),
            isNotNull(exerciseLogs.issue_type),
          ),
        ),
      )
      .orderBy(desc(exerciseLogs.log_date));

    // Group into red and yellow
    const alerts = unreviewedLogs.map((log) => {
      const isRed = log.pain_level >= 8 || log.issue_type === "new_symptom";
      return {
        ...log,
        alert_level: isRed ? "red" : "yellow",
        message: log.issue_type
          ? `Reported issue: ${log.issue_type.replace("_", " ")}`
          : `Pain trending upward (${log.pain_level}/10)`,
      };
    });

    return res.status(200).json({ success: true, alerts });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Resolve an alert
export const resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_note } = req.body;

    const [log] = await db
      .select()
      .from(exerciseLogs)
      .where(eq(exerciseLogs.id, id));
    if (!log) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise log not found" });
    }

    const [updatedLog] = await db
      .update(exerciseLogs)
      .set({
        doctor_reviewed: true,
        resolution_note: resolution_note || null,
        resolved_at: new Date(),
      })
      .where(eq(exerciseLogs.id, id))
      .returning();

    return res
      .status(200)
      .json({
        success: true,
        message: "Alert resolved successfully",
        data: updatedLog,
      });
  } catch (error) {
    console.error("Error resolving alert:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
