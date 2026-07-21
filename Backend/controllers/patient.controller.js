import { db } from "../src/db/index.js";
import {
  users,
  patientProfiles,
  consultations,
  treatmentPlans,
  exerciseLogs,
  patientSchedule,
  treatmentPlanExercises,
  exercises,
} from "../src/db/schema/index.js";
import { eq, and, desc, gte, lte, isNotNull, sql, gt } from "drizzle-orm";
import { calculateExpectedSessions, localToday } from "../utils/scheduleUtils.js";

import { getAuth } from "@clerk/express";

// GET /api/patients/profile - Get the logged-in patient's profile
export const getPatientProfile = async (req, res) => {
  try {
    const auth = getAuth(req);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerk_id, auth.userId));
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in database" });
    }

    const [profile] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.user_id, user.id));

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      profile: profile || null,
    });
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
//put /api/patients/profile
export const updatePatientProfile = async (req, res) => {
  try {
    const {
      phone,
      date_of_birth,
      gender,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      medical_history,
    } = req.body;
    const auth = getAuth(req);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerk_id, auth.userId));
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in database" });
    }

    // Update the phone number in the main 'users' table if they provided one!
    if (phone) {
      await db.update(users).set({ phone }).where(eq(users.id, user.id));
    }

    const [profile] = await db
      .insert(patientProfiles)
      .values({
        user_id: user.id,
        date_of_birth: date_of_birth
          ? new Date(date_of_birth).toISOString()
          : null,
        gender,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        medical_history,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: patientProfiles.user_id,
        set: {
          date_of_birth: date_of_birth
            ? new Date(date_of_birth).toISOString()
            : null,
          gender,
          address,
          emergency_contact_name,
          emergency_contact_phone,
          medical_history,
          updated_at: new Date(),
        },
      })
      .returning();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/patients
export const getAllPatients = async (req, res) => {
  try {
    const allPatients = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        status: patientProfiles.status,
        date_of_birth: patientProfiles.date_of_birth,
      })
      .from(users)
      .leftJoin(patientProfiles, eq(users.id, patientProfiles.user_id))
      .where(eq(users.role, "patient"));

    return res.status(200).json({
      success: true,
      count: allPatients.length,
      data: allPatients,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/patients/:patient_id/history
export const getPatientHistory = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [
      profileResult,
      consultationsResult,
      treatmentPlansResult,
      exerciseLogsResult,
    ] = await Promise.all([
      db
        .select()
        .from(patientProfiles)
        .where(eq(patientProfiles.user_id, patient_id)),
      db
        .select()
        .from(consultations)
        .where(eq(consultations.patient_id, patient_id))
        .orderBy(desc(consultations.consultation_date)),
      db
        .select()
        .from(treatmentPlans)
        .where(eq(treatmentPlans.patient_id, patient_id))
        .orderBy(desc(treatmentPlans.start_date)),
      db
        .select()
        .from(exerciseLogs)
        .where(eq(exerciseLogs.patient_id, patient_id))
        .orderBy(desc(exerciseLogs.log_date)),
    ]);

    const profile = profileResult[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        status: profile ? profile.status : "unknown",
        consultations: consultationsResult,
        treatment_plans: treatmentPlansResult,
        exercise_logs: exerciseLogsResult,
      },
    });
  } catch (error) {
    console.error("Error fetching patient history:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/patients/:patient_id/today
export const getTodaySchedule = async (req, res) => {
  try {
    const { patient_id } = req.params;

    // 1. Find active treatment_plan
    const [activePlan] = await db
      .select({
        id: treatmentPlans.id,
        title: treatmentPlans.title,
        start_date: treatmentPlans.start_date,
        end_date: treatmentPlans.end_date,
      })
      .from(treatmentPlans)
      .where(
        and(
          eq(treatmentPlans.patient_id, patient_id),
          eq(treatmentPlans.status, "active"),
        ),
      )
      .limit(1);

    if (!activePlan) {
      return res.status(200).json({ hasPlan: false });
    }

    // Calculate weeks
    const startDate = new Date(activePlan.start_date);
    const endDate = new Date(activePlan.end_date);
    const today = new Date();
    const todayStr = localToday();

    const timeDiff = endDate.getTime() - startDate.getTime();
    const totalWeeks = Math.ceil(timeDiff / (1000 * 3600 * 24 * 7));

    const currDiff = today.getTime() - startDate.getTime();
    const weekNumber = Math.max(
      1,
      Math.ceil(currDiff / (1000 * 3600 * 24 * 7)),
    );

    // 5. Calculate weekly compliance using Drizzle's query builder
    const [complianceResult] = await db
      .select({
        completed: sql`COUNT(CASE WHEN ${patientSchedule.status} = 'completed' THEN 1 END)::int`,
        expected: sql`COUNT(*)::int`,
      })
      .from(patientSchedule)
      .innerJoin(
        treatmentPlanExercises,
        eq(
          patientSchedule.treatment_plan_exercise_id,
          treatmentPlanExercises.id,
        ),
      )
      .where(
        and(
          eq(patientSchedule.patient_id, patient_id),
          eq(treatmentPlanExercises.treatment_plan_id, activePlan.id),
          gte(
            patientSchedule.scheduled_date,
            sql`DATE_TRUNC('week', ${todayStr}::date)`,
          ),
          lte(patientSchedule.scheduled_date, todayStr),
        ),
      );

    let completed = 0;
    let expected = 0;

    if (complianceResult) {
      completed = complianceResult.completed || 0;
      expected = complianceResult.expected || 0;
    }
    const percent = expected > 0 ? Math.round((completed / expected) * 100) : 0;

    // 6. Find next scheduled date using Drizzle query builder
    const [nextSessionResult] = await db
      .select({
        next_date: sql`MIN(${patientSchedule.scheduled_date})`,
      })
      .from(patientSchedule)
      .innerJoin(
        treatmentPlanExercises,
        eq(
          patientSchedule.treatment_plan_exercise_id,
          treatmentPlanExercises.id,
        ),
      )
      .where(
        and(
          eq(patientSchedule.patient_id, patient_id),
          eq(treatmentPlanExercises.treatment_plan_id, activePlan.id),
          gt(patientSchedule.scheduled_date, todayStr),
          eq(patientSchedule.status, "pending"),
        ),
      );

    // Convert next_date to a local Date object instead of UTC string directly to avoid shifting to previous day
    let nextSessionDate = null;
    if (nextSessionResult && nextSessionResult.next_date) {
      const d = new Date(nextSessionResult.next_date);
      // Correct timezone offset
      const userTimezoneOffset = d.getTimezoneOffset() * 60000;
      nextSessionDate = new Date(d.getTime() - userTimezoneOffset)
        .toISOString()
        .split("T")[0];
    }

    // 3. Get today's schedule grouped by session_number
    const allRows = await db
      .select({
        session_number: patientSchedule.session_number,
        schedule_id: patientSchedule.id,
        schedule_status: patientSchedule.status,
        treatment_plan_exercise_id: patientSchedule.treatment_plan_exercise_id,
        exercise_id: exercises.id,
        exercise_name: exercises.name,
        target_body_part: exercises.target_body_part,
        instructions: exercises.instructions,
        video_url: exercises.video_url,
        image_urls: exercises.photo_urls,
        sets: treatmentPlanExercises.sets,
        reps: treatmentPlanExercises.reps,
        sessions_per_day: treatmentPlanExercises.sessions_per_day,
        doctor_notes: treatmentPlanExercises.notes,
        doctor_added_at: treatmentPlanExercises.created_at,
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
          eq(patientSchedule.scheduled_date, todayStr),
          eq(treatmentPlanExercises.is_active, true),
        ),
      )
      .orderBy(
        patientSchedule.session_number,
        treatmentPlanExercises.created_at,
      );

    // 4. Group results by session_number
    const sessionsMap = {};
    for (const row of allRows) {
      if (!sessionsMap[row.session_number]) {
        sessionsMap[row.session_number] = {
          session_number: row.session_number,
          exercises: [],
          completed_count: 0,
          total_count: 0,
          sessions_per_day: row.sessions_per_day,
        };
      }

      const sessionObj = sessionsMap[row.session_number];
      sessionObj.total_count += 1;
      if (row.schedule_status === "completed") {
        sessionObj.completed_count += 1;
      }

      sessionObj.exercises.push({
        schedule_id: row.schedule_id,
        treatment_plan_exercise_id: row.treatment_plan_exercise_id,
        exercise_id: row.exercise_id,
        exercise_name: row.exercise_name,
        target_body_part: row.target_body_part,
        instructions: row.instructions,
        video_url: row.video_url,
        image_urls: row.image_urls,
        prescribed_sets: row.sets,
        prescribed_reps: row.reps,
        doctor_notes: row.doctor_notes,
        schedule_status: row.schedule_status,
      });
    }

    const sessions = Object.values(sessionsMap).map((session) => {
      // Derive label
      let label = `Session ${session.session_number}`;
      if (session.sessions_per_day === 1) label = "Daily Session";
      else if (session.sessions_per_day === 2) {
        label =
          session.session_number === 1 ? "Morning Session" : "Evening Session";
      }

      return {
        session_number: session.session_number,
        label,
        exercises: session.exercises,
        completed_count: session.completed_count,
        total_count: session.total_count,
      };
    });

    const isRestDay = sessions.length === 0;

    return res.status(200).json({
      hasPlan: true,
      plan: {
        id: activePlan.id,
        title: activePlan.title,
        start_date: activePlan.start_date,
        end_date: activePlan.end_date,
        weekNumber,
        totalWeeks,
      },
      weeklyCompliance: {
        completed,
        expected,
        percent,
      },
      sessions,
      nextSessionDate,
      isRestDay,
    });
  } catch (error) {
    console.error("Error fetching today schedule:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /api/patients/:patient_id/progress?treatment_plan_id=:id ─────────────

export const getPatientProgress = async (req, res) => {
  try {
    const { patient_id } = req.params;
    let { planId } = req.query;

    let plan;
    if (planId) {
      const [fetchedPlan] = await db
        .select()
        .from(treatmentPlans)
        .where(
          and(
            eq(treatmentPlans.id, planId),
            eq(treatmentPlans.patient_id, patient_id),
          ),
        );
      plan = fetchedPlan;
    } else {
      const [activePlan] = await db
        .select()
        .from(treatmentPlans)
        .where(
          and(
            eq(treatmentPlans.patient_id, patient_id),
            eq(treatmentPlans.status, "active"),
          ),
        )
        .limit(1);
      plan = activePlan;
    }

    if (!plan) {
      return res
        .status(404)
        .json({ success: false, message: "Treatment plan not found." });
    }

    planId = plan.id;

      const todayStr = localToday();

    const [planOverview] = await db
      .select({
        id: treatmentPlans.id,
        title: treatmentPlans.title,
        start_date: treatmentPlans.start_date,
        end_date: treatmentPlans.end_date,
        status: treatmentPlans.status,
        week_number: sql`CEIL((${todayStr}::date - ${treatmentPlans.start_date} + 1) / 7.0)::int`,
        total_weeks: sql`CEIL((${treatmentPlans.end_date} - ${treatmentPlans.start_date} + 1) / 7.0)::int`,
        duration_progress_percent: sql`LEAST(ROUND((${todayStr}::date - ${treatmentPlans.start_date})::numeric / NULLIF((${treatmentPlans.end_date} - ${treatmentPlans.start_date}), 0) * 100), 100)::int`,
      })
      .from(treatmentPlans)
      .where(eq(treatmentPlans.id, planId));

    const exerciseRows = await db
      .select({
        exercise_id: exercises.id,
        exercise_name: exercises.name,
        tpe_id: treatmentPlanExercises.id,
        frequency_type: treatmentPlanExercises.frequency_type,
        sessions_per_day: treatmentPlanExercises.sessions_per_day,
        prescribed_sets: treatmentPlanExercises.sets,
        prescribed_reps: treatmentPlanExercises.reps,
        expected_sessions_count: treatmentPlanExercises.expected_sessions_count,
        completed_sessions_count:
          treatmentPlanExercises.completed_sessions_count,
        session_compliance_percent: sql`ROUND(${treatmentPlanExercises.completed_sessions_count}::numeric / NULLIF(${treatmentPlanExercises.expected_sessions_count}, 0) * 100)::int`,
        avg_sets_completed: sql`COALESCE(AVG(${exerciseLogs.sets_completed}::numeric), 0)`,
        avg_pain: sql`COALESCE(AVG(${exerciseLogs.pain_level}::numeric), 0)`,
      })
      .from(treatmentPlanExercises)
      .innerJoin(
        exercises,
        eq(treatmentPlanExercises.exercise_id, exercises.id),
      )
      .leftJoin(
        exerciseLogs,
        eq(exerciseLogs.treatment_plan_exercise_id, treatmentPlanExercises.id),
      )
      .where(
        and(
          eq(treatmentPlanExercises.treatment_plan_id, planId),
          eq(treatmentPlanExercises.is_active, true),
        ),
      )
      .groupBy(
        exercises.id,
        exercises.name,
        treatmentPlanExercises.id,
        treatmentPlanExercises.frequency_type,
        treatmentPlanExercises.sessions_per_day,
        treatmentPlanExercises.sets,
        treatmentPlanExercises.reps,
        treatmentPlanExercises.expected_sessions_count,
        treatmentPlanExercises.completed_sessions_count,
      )
      .orderBy(treatmentPlanExercises.created_at);

    const [overallComplianceResult] = await db
      .select({
        overall_compliance: sql`ROUND(SUM(${treatmentPlanExercises.completed_sessions_count})::numeric / NULLIF(SUM(${treatmentPlanExercises.expected_sessions_count}), 0) * 100)::int`,
      })
      .from(treatmentPlanExercises)
      .where(
        and(
          eq(treatmentPlanExercises.treatment_plan_id, planId),
          eq(treatmentPlanExercises.is_active, true),
        ),
      );

    const overallCompliance = overallComplianceResult?.overall_compliance || 0;

    const painWeeks = await db
      .select({
        week_start: sql`DATE_TRUNC('week', ${exerciseLogs.log_date})::date`,
        week_label: sql`TO_CHAR(DATE_TRUNC('week', ${exerciseLogs.log_date}), 'DD Mon')`,
        avg_pain: sql`ROUND(AVG(${exerciseLogs.pain_level})::numeric, 1)`,
      })
      .from(exerciseLogs)
      .innerJoin(
        treatmentPlanExercises,
        eq(exerciseLogs.treatment_plan_exercise_id, treatmentPlanExercises.id),
      )
      .where(
        and(
          eq(treatmentPlanExercises.treatment_plan_id, planId),
          eq(exerciseLogs.patient_id, patient_id),
          isNotNull(exerciseLogs.pain_level),
        ),
      )
      .groupBy(sql`DATE_TRUNC('week', ${exerciseLogs.log_date})`)
      .orderBy(sql`DATE_TRUNC('week', ${exerciseLogs.log_date}) ASC`);

    let trend = "stable";
    if (painWeeks.length >= 2) {
      const last = painWeeks[painWeeks.length - 1].avg_pain;
      const secondLast = painWeeks[painWeeks.length - 2].avg_pain;
      const diff = last - secondLast;
      if (diff > 1.5) trend = "increasing";
      else if (diff < -1.5) trend = "improving";
    }

    const calendarData = await db
      .select({
        scheduled_date: patientSchedule.scheduled_date,
        session_number: patientSchedule.session_number,
        status: patientSchedule.status,
        exercise_name: exercises.name,
        pain_level: exerciseLogs.pain_level,
        comments: exerciseLogs.comments,
        issue_type: exerciseLogs.issue_type,
        sets_completed: exerciseLogs.sets_completed,
      })
      .from(patientSchedule)
      .innerJoin(
        treatmentPlanExercises,
        eq(
          patientSchedule.treatment_plan_exercise_id,
          treatmentPlanExercises.id,
        ),
      )
      .innerJoin(exercises, eq(patientSchedule.exercise_id, exercises.id))
      .leftJoin(
        exerciseLogs,
        and(
          eq(
            patientSchedule.treatment_plan_exercise_id,
            exerciseLogs.treatment_plan_exercise_id,
          ),
          eq(patientSchedule.scheduled_date, exerciseLogs.log_date),
          eq(patientSchedule.session_number, exerciseLogs.session_number),
          eq(patientSchedule.patient_id, exerciseLogs.patient_id),
        ),
      )
      .where(
        and(
          eq(treatmentPlanExercises.treatment_plan_id, planId),
          eq(patientSchedule.patient_id, patient_id),
        ),
      )
      .orderBy(patientSchedule.scheduled_date, patientSchedule.session_number);

    const concerns = await db
      .select({
        log_date: exerciseLogs.log_date,
        pain_level: exerciseLogs.pain_level,
        comments: exerciseLogs.comments,
        issue_type: exerciseLogs.issue_type,
        created_at: exerciseLogs.created_at,
      })
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.patient_id, patient_id),
          sql`${exerciseLogs.treatment_plan_exercise_id} IS NULL`,
        ),
      )
      .orderBy(desc(exerciseLogs.log_date));

    const pastPlans = await db
      .select({
        id: treatmentPlans.id,
        title: treatmentPlans.title,
        start_date: treatmentPlans.start_date,
        end_date: treatmentPlans.end_date,
        compliance_percent: sql`ROUND(SUM(${treatmentPlanExercises.completed_sessions_count})::numeric / NULLIF(SUM(${treatmentPlanExercises.expected_sessions_count}), 0) * 100)::int`,
      })
      .from(treatmentPlans)
      .innerJoin(
        treatmentPlanExercises,
        eq(treatmentPlanExercises.treatment_plan_id, treatmentPlans.id),
      )
      .where(
        and(
          eq(treatmentPlans.patient_id, patient_id),
          eq(treatmentPlans.status, "completed"),
        ),
      )
      .groupBy(
        treatmentPlans.id,
        treatmentPlans.title,
        treatmentPlans.start_date,
        treatmentPlans.end_date,
      )
      .orderBy(desc(treatmentPlans.end_date));

    return res.status(200).json({
      plan: planOverview,
      overallCompliance,
      exercises: exerciseRows.map((e) => ({
        ...e,
        avg_sets_completed: parseFloat(e.avg_sets_completed),
        avg_pain: parseFloat(e.avg_pain),
      })),
      painTrend: {
        weeks: painWeeks.map((w) => ({
          ...w,
          avg_pain: parseFloat(w.avg_pain),
        })),
        trend,
      },
      calendarData,
      concerns,
      pastPlans,
    });
  } catch (error) {
    console.error("Error fetching patient progress:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── POST /api/patients/:patient_id/discharge ─────────────────────────────────
export const dischargePatient = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const today = localToday();

    const [activePlan] = await db
      .select()
      .from(treatmentPlans)
      .where(
        and(
          eq(treatmentPlans.patient_id, patient_id),
          eq(treatmentPlans.status, "active"),
        ),
      );

    await db.transaction(async (tx) => {
      // Step 1: Complete the active treatment plan (if any)
      if (activePlan) {
        await tx
          .update(treatmentPlans)
          .set({ status: "completed", updated_at: new Date() })
          .where(eq(treatmentPlans.id, activePlan.id));

        await tx
          .delete(patientSchedule)
          .where(
            and(
              eq(patientSchedule.patient_id, patient_id),
              eq(patientSchedule.status, "pending"),
              gte(patientSchedule.scheduled_date, today),
            ),
          );
      }

      // Step 3: Mark the patient profile as 'discharged'
      await tx
        .update(patientProfiles)
        .set({ status: "discharged", updated_at: new Date() })
        .where(eq(patientProfiles.user_id, patient_id));
    });

    return res.status(200).json({
      success: true,
      message:
        "Patient discharged successfully. Active plan completed, future sessions cleared, profile marked discharged.",
      completed_plan_id: activePlan?.id ?? null,
    });
  } catch (error) {
    console.error("Error discharging patient:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── PATCH /api/patients/:patient_id/reactivate ───────────────────────────────

export const reactivatePatient = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [profile] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.user_id, patient_id));

    if (!profile) {
      return res
        .status(404)
        .json({ success: false, message: "Patient profile not found." });
    }
    if (profile.status !== "discharged") {
      return res.status(400).json({
        success: false,
        message: `Patient is currently '${profile.status}'. Only discharged patients can be reactivated.`,
      });
    }

    await db
      .update(patientProfiles)
      .set({ status: "active", updated_at: new Date() })
      .where(eq(patientProfiles.user_id, patient_id));

    return res.status(200).json({
      success: true,
      message:
        "Patient reactivated. Receptionist can now book a new appointment for a fresh consultation.",
    });
  } catch (error) {
    console.error("Error reactivating patient:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/patients/:patient_id/overview
export const getPatientOverview = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, patient_id));

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    const [profile] = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.user_id, patient_id));

    const [activePlan] = await db
      .select()
      .from(treatmentPlans)
      .where(
        and(
          eq(treatmentPlans.patient_id, patient_id),
          eq(treatmentPlans.status, "active"),
        ),
      );

    // Get count of consultations to determine if First Visit or Follow-up
    const consultationRows = await db
      .select({ id: consultations.id })
      .from(consultations)
      .where(eq(consultations.patient_id, patient_id));

    return res.status(200).json({
      success: true,
      data: {
        user,
        profile: profile || null,
        active_plan: activePlan || null,
        visit_count: consultationRows.length,
      },
    });
  } catch (error) {
    console.error("Error fetching patient overview:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/patients/:patient_id/treatment-plans/active/compliance
export const getPatientActivePlanCompliance = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [activePlan] = await db
      .select()
      .from(treatmentPlans)
      .where(
        and(
          eq(treatmentPlans.patient_id, patient_id),
          eq(treatmentPlans.status, "active"),
        ),
      );

    if (!activePlan) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    const today = localToday();

    const tpeRows = await db
      .select({
        exercise_id: treatmentPlanExercises.exercise_id,
        exercise_name: exercises.name,
        completed_sessions_count:
          treatmentPlanExercises.completed_sessions_count,
        start_date: treatmentPlanExercises.start_date,
        end_date: treatmentPlanExercises.end_date,
        frequency_type: treatmentPlanExercises.frequency_type,
        frequency_days: treatmentPlanExercises.frequency_days,
        sessions_per_day: treatmentPlanExercises.sessions_per_day,
      })
      .from(treatmentPlanExercises)
      .innerJoin(
        exercises,
        eq(treatmentPlanExercises.exercise_id, exercises.id),
      )
      .where(
        and(
          eq(treatmentPlanExercises.treatment_plan_id, activePlan.id),
          eq(treatmentPlanExercises.is_active, true),
        ),
      );

    let totalExpected = 0;
    let totalCompleted = 0;

    const exercisesCompliance = tpeRows.map((r) => {
      const completed = r.completed_sessions_count ?? 0;

      // Calculate to-date expected
      const capped_end_date = r.end_date < today ? r.end_date : today;
      let expected = 0;

      if (r.start_date <= capped_end_date) {
        expected = calculateExpectedSessions({
          start_date: r.start_date,
          end_date: capped_end_date,
          frequency_type: r.frequency_type,
          frequency_days: r.frequency_days,
          sessions_per_day: r.sessions_per_day,
        });
      }

      totalExpected += expected;
      totalCompleted += completed;

      const pct =
        expected > 0
          ? Math.round((completed / expected) * 100)
          : completed > 0
            ? 100
            : 0;
      return {
        exercise_id: r.exercise_id,
        exercise_name: r.exercise_name,
        completed_sessions_count: completed,
        expected_sessions_count: expected,
        compliance_percent: Math.min(pct, 100), // Cap at 100% just in case
      };
    });

    const overallCompliance =
      totalExpected > 0
        ? Math.min(Math.round((totalCompleted / totalExpected) * 100), 100)
        : totalCompleted > 0
          ? 100
          : 0;

    const allTpesForPlan = await db
      .select({ id: treatmentPlanExercises.id })
      .from(treatmentPlanExercises)
      .where(eq(treatmentPlanExercises.treatment_plan_id, activePlan.id));
    const activePlanTpeIds = new Set(allTpesForPlan.map((t) => t.id));

    const logs = await db
      .select()
      .from(exerciseLogs)
      .where(
        and(
          eq(exerciseLogs.patient_id, patient_id),
          isNotNull(exerciseLogs.treatment_plan_exercise_id),
        ),
      );

    const planLogs = logs.filter((l) =>
      activePlanTpeIds.has(l.treatment_plan_exercise_id),
    );

    const weeklyPain = {};
    planLogs.forEach((log) => {
      if (log.pain_level == null) return;
      const d = new Date(log.log_date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff)).toISOString().split("T")[0];

      if (!weeklyPain[weekStart])
        weeklyPain[weekStart] = { total: 0, count: 0 };
      weeklyPain[weekStart].total += log.pain_level;
      weeklyPain[weekStart].count += 1;
    });

    const painTrend = Object.keys(weeklyPain)
      .sort()
      .map((week, idx) => {
        return {
          week: `Week ${idx + 1}`,
          avg_pain:
            Math.round((weeklyPain[week].total / weeklyPain[week].count) * 10) /
            10,
        };
      });

    return res.status(200).json({
      success: true,
      data: {
        overall_compliance: overallCompliance,
        exercises: exercisesCompliance,
        pain_trend: painTrend,
      },
    });
  } catch (error) {
    console.error("Error fetching patient compliance:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/patients/:patient_id/compliance-logs
export const getComplianceLogs = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [activePlan] = await db
      .select()
      .from(treatmentPlans)
      .where(
        and(
          eq(treatmentPlans.patient_id, patient_id),
          eq(treatmentPlans.status, "active"),
        ),
      );

    if (!activePlan) {
      return res.status(200).json({
        success: true,
        data: {
          summary: [],
          flagged_entries: [],
          standalone_concerns: [],
          grouped_logs: {},
        },
      });
    }

    const tpeRows = await db
      .select({
        id: treatmentPlanExercises.id,
        exercise_id: treatmentPlanExercises.exercise_id,
        exercise_name: exercises.name,
        completed_sessions_count:
          treatmentPlanExercises.completed_sessions_count,
        sets: treatmentPlanExercises.sets,
        start_date: treatmentPlanExercises.start_date,
        end_date: treatmentPlanExercises.end_date,
        frequency_type: treatmentPlanExercises.frequency_type,
        frequency_days: treatmentPlanExercises.frequency_days,
        sessions_per_day: treatmentPlanExercises.sessions_per_day,
        is_active: treatmentPlanExercises.is_active,
      })
      .from(treatmentPlanExercises)
      .innerJoin(
        exercises,
        eq(treatmentPlanExercises.exercise_id, exercises.id),
      )
      .where(eq(treatmentPlanExercises.treatment_plan_id, activePlan.id));

    const tpeIds = tpeRows.map((r) => r.id);

    const logs = await db
      .select()
      .from(exerciseLogs)
      .where(eq(exerciseLogs.patient_id, patient_id))
      .orderBy(desc(exerciseLogs.log_date));

    const today = localToday();

    // Group tpeRows by exercise_id
    const exercisesMap = {};
    tpeRows.forEach((tpe) => {
      if (!exercisesMap[tpe.exercise_id]) {
        exercisesMap[tpe.exercise_id] = {
          exercise_name: tpe.exercise_name,
          expected_sessions: 0,
          completed_sessions: 0,
          prescribed_sets: tpe.sets, // Default to first found
          tpeIds: [],
        };
      }

      const exMap = exercisesMap[tpe.exercise_id];
      exMap.tpeIds.push(tpe.id);

      // Update prescribed sets if this is the active version
      if (tpe.is_active) {
        exMap.prescribed_sets = tpe.sets;
      }

      // Calculate to-date expected for this version
      const capped_end_date = tpe.end_date < today ? tpe.end_date : today;
      let expected = 0;
      if (tpe.start_date <= capped_end_date) {
        expected = calculateExpectedSessions({
          start_date: tpe.start_date,
          end_date: capped_end_date,
          frequency_type: tpe.frequency_type,
          frequency_days: tpe.frequency_days,
          sessions_per_day: tpe.sessions_per_day,
        });
      }

      exMap.expected_sessions += expected;
      exMap.completed_sessions += tpe.completed_sessions_count ?? 0;
    });

    const summary = Object.values(exercisesMap).map((exMap) => {
      const compliance =
        exMap.expected_sessions > 0
          ? Math.min(
              Math.round(
                (exMap.completed_sessions / exMap.expected_sessions) * 100,
              ),
              100,
            )
          : exMap.completed_sessions > 0
            ? 100
            : 0;

      const exLogs = logs.filter((l) =>
        exMap.tpeIds.includes(l.treatment_plan_exercise_id),
      );
      const totalSets = exLogs.reduce(
        (sum, l) => sum + (l.sets_completed ?? 0),
        0,
      );
      const avgSets =
        exLogs.length > 0 ? Math.round(totalSets / exLogs.length) : 0;

      return {
        exercise_name: exMap.exercise_name,
        expected_sessions: exMap.expected_sessions,
        completed_sessions: exMap.completed_sessions,
        compliance_percent: compliance,
        prescribed_sets: exMap.prescribed_sets,
        avg_sets_completed: avgSets,
      };
    });

    const flagged_entries = logs
      .filter(
        (l) =>
          tpeIds.includes(l.treatment_plan_exercise_id) &&
          ((l.pain_level != null && l.pain_level >= 5) || l.issue_type != null),
      )
      .map((l) => {
        const tpe = tpeRows.find((t) => t.id === l.treatment_plan_exercise_id);
        return { ...l, exercise_name: tpe?.exercise_name };
      })
      .slice(0, 10);

    const standalone_concerns = logs.filter(
      (l) => l.treatment_plan_exercise_id == null,
    );

    const grouped_logs = {};
    Object.values(exercisesMap).forEach((exMap) => {
      grouped_logs[exMap.exercise_name] = logs.filter((l) =>
        exMap.tpeIds.includes(l.treatment_plan_exercise_id),
      );
    });

    return res.status(200).json({
      success: true,
      data: {
        summary,
        flagged_entries,
        standalone_concerns,
        grouped_logs,
      },
    });
  } catch (error) {
    console.error("Error fetching compliance logs:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Doctor Dashboard - My Patients Tab
export const getDoctorPatientsTab = async (req, res) => {
  try {
    const doctor_id = req.user.id;

    // 1. Urgent Alerts (Tier 1)
    // We look for urgent logs from patients who have ANY active treatment plan with this doctor.
    // This includes both exercise-linked logs AND standalone concerns (no treatment_plan_exercise_id).
    const urgentQuery = sql`
      SELECT DISTINCT ON (el.patient_id)
        u.id as patient_id,
        u.name as patient_name,
        u.phone,
        COALESCE(e.name, 'Standalone Concern') as exercise_name,
        el.pain_level,
        el.comments,
        el.created_at as logged_at,
        el.issue_type,
        el.id as log_id
      FROM exercise_logs el
      JOIN users u ON el.patient_id = u.id
      -- Join to check doctor ownership (via treatment plan or standalone)
      JOIN treatment_plans tp_check ON tp_check.patient_id = el.patient_id AND tp_check.doctor_id = ${doctor_id} AND tp_check.status IN ('active', 'paused')
      LEFT JOIN treatment_plan_exercises tpe ON el.treatment_plan_exercise_id = tpe.id
      LEFT JOIN exercises e ON tpe.exercise_id = e.id
      WHERE el.created_at >= NOW() - INTERVAL '7 days'
        AND (el.pain_level >= 9 OR (el.issue_type = 'new_symptom' AND el.pain_level >= 7))
        AND el.doctor_reviewed = false
      ORDER BY el.patient_id, el.created_at DESC;
    `;
    const urgentResult = await db.execute(urgentQuery);
    const urgentAlerts = urgentResult.rows || urgentResult; // depends on postgres driver

    // 2. Base Patients List
    // We need patients who have an active treatment plan with this doctor, OR have had consultations.
    // For simplicity, we get patients with treatment plans from this doctor.
    const patientsQuery = sql`
      SELECT DISTINCT ON (u.id)
        u.id as patient_id,
        u.name,
        EXTRACT(YEAR FROM AGE(pp.date_of_birth)) as age,
        pp.gender,
        tp.id as active_plan_id,
        cons.diagnosis as condition,
        tp.title as plan_title,
        tp.created_at as plan_created_at,
        (
          SELECT c.appointment_date 
          FROM appointments c 
          WHERE c.patient_id = u.id AND c.doctor_id = ${doctor_id} AND c.status = 'completed'
          ORDER BY c.appointment_date DESC LIMIT 1
        ) as last_visit
      FROM users u
      LEFT JOIN patient_profiles pp ON u.id = pp.user_id
      JOIN treatment_plans tp ON tp.patient_id = u.id
      LEFT JOIN consultations cons ON tp.consultation_id = cons.id
      WHERE tp.doctor_id = ${doctor_id} AND tp.status IN ('active', 'paused', 'completed')
    `;
    const patientsResult = await db.execute(patientsQuery);
    let patients = patientsResult.rows || patientsResult;

    // 3. Review Alerts Logic (Tier 2) & Compliance calculation
    // For each patient, fetch last 14 days of logs to compute compliance and pain trends
    const reviewAlerts = [];

    for (let p of patients) {
      // Calculate compliance for the last 7 days
      const logsQuery = sql`
        SELECT 
          el.pain_level, el.issue_type, el.created_at, el.is_skipped
        FROM exercise_logs el
        JOIN treatment_plan_exercises tpe ON el.treatment_plan_exercise_id = tpe.id
        WHERE tpe.treatment_plan_id = ${p.active_plan_id}
          AND el.created_at >= NOW() - INTERVAL '14 days'
        ORDER BY el.created_at DESC
      `;
      const logsRes = await db.execute(logsQuery);
      const allLogs = logsRes.rows || logsRes;

      const last7DaysLogs = allLogs.filter(
        (l) =>
          new Date(l.created_at) >=
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      );
      const prev7DaysLogs = allLogs.filter(
        (l) =>
          new Date(l.created_at) <
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      );

      // Compliance (naive calculation: we just check total expected sessions vs completed)
      // Since this can be complex, we'll do a simple metric: completed logs / 7
      // For a real app, calculateExpectedSessions() would be used.
      // Let's use the DB logs to find compliance
      const completedThisWeek = last7DaysLogs.filter(
        (l) => !l.is_skipped,
      ).length;
      // Assume 1 session per day expected for simplicity if no specific schedule logic is available here
      // But we can just use 7 as denominator for a quick compliance %
      const compliancePercent = Math.round((completedThisWeek / 7) * 100);
      p.compliancePercent = Math.min(100, compliancePercent);

      // Pain trend
      const avgPainThisWeek =
        last7DaysLogs
          .filter((l) => l.pain_level != null)
          .reduce((acc, l) => acc + l.pain_level, 0) /
        (last7DaysLogs.filter((l) => l.pain_level != null).length || 1);
      const avgPainPrevWeek =
        prev7DaysLogs
          .filter((l) => l.pain_level != null)
          .reduce((acc, l) => acc + l.pain_level, 0) /
        (prev7DaysLogs.filter((l) => l.pain_level != null).length || 1);

      let needsReview = false;
      let reviewReasons = [];

      if (compliancePercent < 50) {
        needsReview = true;
        reviewReasons.push(
          `Compliance dropped below 50% this week (${compliancePercent}%)`,
        );
      }

      if (avgPainPrevWeek > 0 && avgPainThisWeek - avgPainPrevWeek >= 2) {
        needsReview = true;
        reviewReasons.push(
          `Pain trending upward (${avgPainPrevWeek.toFixed(1)} → ${avgPainThisWeek.toFixed(1)})`,
        );
      }

      const recentFlags = last7DaysLogs.filter((l) => l.issue_type != null);
      if (recentFlags.length > 0) {
        needsReview = true;
        reviewReasons.push(`Patient flagged a concern recently`);
      }

      const daysSinceLastLog =
        allLogs.length > 0
          ? Math.floor(
              (Date.now() - new Date(allLogs[0].created_at)) /
                (1000 * 60 * 60 * 24),
            )
          : Math.floor(
              (Date.now() - new Date(p.plan_created_at)) /
                (1000 * 60 * 60 * 24),
            );

      if (daysSinceLastLog >= 5) {
        needsReview = true;
        reviewReasons.push(`No activity in ${daysSinceLastLog} days`);
      }

      // Check if this patient is already in Urgent Alerts
      const isUrgent = urgentAlerts.find((u) => u.patient_id === p.patient_id);
      p.hasUrgentAlert = !!isUrgent;
      if (isUrgent) {
        p.maxPainLevel = isUrgent.pain_level;
      }

      if (needsReview && !isUrgent) {
        reviewAlerts.push({
          patient_id: p.patient_id,
          patient_name: p.name,
          reasons: reviewReasons,
        });
      }
    }

    return res.status(200).json({
      success: true,
      urgentAlerts,
      reviewAlerts,
      patients,
    });
  } catch (error) {
    console.error("Error fetching doctor patients tab:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
