import { db } from "../src/db/index.js";
import {
  exerciseLogs,
  users,
  treatmentPlanExercises,
  treatmentPlans,
} from "../src/db/schema/index.js";
import { eq, and, or, gte, isNotNull, desc } from "drizzle-orm";
import { sendUrgentBookingEmail } from "../utils/email.js";

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
        treatmentPlans,
        and(
          eq(treatmentPlans.patient_id, exerciseLogs.patient_id),
          eq(treatmentPlans.status, 'active')
        )
      )
      .where(
        and(
          eq(treatmentPlans.doctor_id, doctorId),
          eq(exerciseLogs.doctor_reviewed, false),
          or(
            gte(exerciseLogs.pain_level, 8),
            eq(exerciseLogs.issue_type, 'new_symptom'),
          ),
        ),
      )
      .orderBy(desc(exerciseLogs.log_date));

    // Group all into red since yellow is removed
    const alerts = unreviewedLogs.map((log) => {
      return {
        ...log,
        alert_level: "red",
        message: log.issue_type === "new_symptom"
          ? `Reported issue: ${log.issue_type.replace("_", " ")}`
          : `Critical Pain Level (${log.pain_level}/10)`,
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
    const { resolution_note, actionType } = req.body;

    const [log] = await db
      .select({
        id: exerciseLogs.id,
        patient_id: exerciseLogs.patient_id
      })
      .from(exerciseLogs)
      .where(eq(exerciseLogs.id, id));
      
    if (!log) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise log not found" });
    }

    if (actionType === 'urgent_booking') {
        const [patient] = await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, log.patient_id));
        if (patient && patient.email) {
            sendUrgentBookingEmail({ to: patient.email, first_name: patient.name.split(' ')[0] });
        }
    }

    const finalNote = actionType === 'urgent_booking' 
        ? `URGENT_BOOKING: ${resolution_note || 'Requested urgent booking'}`
        : resolution_note || null;

    const updatedLogs = await db
      .update(exerciseLogs)
      .set({
        doctor_reviewed: true,
        resolution_note: finalNote,
        resolved_at: new Date(),
      })
      .where(
        actionType === 'urgent_booking'
          ? and(eq(exerciseLogs.patient_id, log.patient_id), eq(exerciseLogs.doctor_reviewed, false))
          : eq(exerciseLogs.id, id)
      )
      .returning();

    return res
      .status(200)
      .json({
        success: true,
        message: actionType === 'urgent_booking' ? "All pending alerts for this patient resolved successfully" : "Alert resolved successfully",
        data: updatedLogs[0],
      });
  } catch (error) {
    console.error("Error resolving alert:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Auto-resolve pending alerts for a patient (called internally when plans change)
export const autoResolvePatientAlerts = async (patientId, note = "Auto-resolved: Plan updated") => {
  try {
    await db
      .update(exerciseLogs)
      .set({
        doctor_reviewed: true,
        resolution_note: note,
        resolved_at: new Date(),
      })
      .where(
        and(
          eq(exerciseLogs.patient_id, patientId),
          eq(exerciseLogs.doctor_reviewed, false)
        )
      );
  } catch (error) {
    console.error("Error auto-resolving alerts:", error);
  }
};
