import { db } from '../src/db/index.js';
import {
  users, patientProfiles, consultations, treatmentPlans,
  exerciseLogs, patientSchedule, treatmentPlanExercises, exercises
} from '../src/db/schema/index.js';
import { eq, and, desc, gte, lte, isNotNull } from 'drizzle-orm';

import { getAuth } from '@clerk/express';

// GET /api/patients/profile - Get the logged-in patient's profile
export const getPatientProfile = async (req, res) => {
  try {
    const auth = getAuth(req);
    const [user] = await db.select().from(users).where(eq(users.clerk_id, auth.userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in database' });
    }

    const [profile] = await db.select().from(patientProfiles).where(eq(patientProfiles.user_id, user.id));

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      profile: profile || null
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
//put /api/patients/profile
export const updatePatientProfile = async (req, res) => {
  try {
    const { phone, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, medical_history } = req.body;
    const auth = getAuth(req);

    const [user] = await db.select().from(users).where(eq(users.clerk_id, auth.userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in database' });
    }

    // Update the phone number in the main 'users' table if they provided one!
    if (phone) {
      await db.update(users).set({ phone }).where(eq(users.id, user.id));
    }

    const [profile] = await db.insert(patientProfiles)
      .values({
        user_id: user.id,
        date_of_birth: date_of_birth ? new Date(date_of_birth).toISOString() : null,
        gender,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        medical_history,
        updated_at: new Date()
      })
      .onConflictDoUpdate({
        target: patientProfiles.user_id,
        set: {
          date_of_birth: date_of_birth ? new Date(date_of_birth).toISOString() : null,
          gender,
          address,
          emergency_contact_name,
          emergency_contact_phone,
          medical_history,
          updated_at: new Date()
        }
      })
      .returning();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/patients 
export const getAllPatients = async (req, res) => {
  try {
    const allPatients = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      status: patientProfiles.status,
      date_of_birth: patientProfiles.date_of_birth
    })
      .from(users)
      .leftJoin(patientProfiles, eq(users.id, patientProfiles.user_id))
      .where(eq(users.role, 'patient'));

    return res.status(200).json({
      success: true,
      count: allPatients.length,
      data: allPatients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
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
      exerciseLogsResult
    ] = await Promise.all([
      db.select().from(patientProfiles).where(eq(patientProfiles.user_id, patient_id)),
      db.select().from(consultations).where(eq(consultations.patient_id, patient_id)).orderBy(desc(consultations.consultation_date)),
      db.select().from(treatmentPlans).where(eq(treatmentPlans.patient_id, patient_id)).orderBy(desc(treatmentPlans.start_date)),
      db.select().from(exerciseLogs).where(eq(exerciseLogs.patient_id, patient_id)).orderBy(desc(exerciseLogs.log_date))
    ]);

    const profile = profileResult[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        status: profile ? profile.status : 'unknown',
        consultations: consultationsResult,
        treatment_plans: treatmentPlansResult,
        exercise_logs: exerciseLogsResult
      }
    });

  } catch (error) {
    console.error('Error fetching patient history:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/patients/:patient_id/today
export const getTodaySchedule = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    // Fetch ALL of today's schedule rows (pending + completed + missed)
    // Join exercises for name/video/instructions
    // Join treatment_plan_exercises for sets/reps prescribed by doctor
    const allRows = await db
      .select({
        schedule_id: patientSchedule.id,
        scheduled_date: patientSchedule.scheduled_date,
        session_number: patientSchedule.session_number,
        status: patientSchedule.status,
        treatment_plan_exercise_id: patientSchedule.treatment_plan_exercise_id,
        // What the exercise IS
        exercise_id: exercises.id,
        exercise_name: exercises.name,
        target_body_part: exercises.target_body_part,
        instructions: exercises.instructions,
        video_url: exercises.video_url,
        // What the doctor PRESCRIBED
        sets: treatmentPlanExercises.sets,
        reps: treatmentPlanExercises.reps,
        sessions_per_day: treatmentPlanExercises.sessions_per_day,
        doctor_notes: treatmentPlanExercises.notes,
      })
      .from(patientSchedule)
      .innerJoin(
        treatmentPlanExercises,
        eq(patientSchedule.treatment_plan_exercise_id, treatmentPlanExercises.id)
      )
      .innerJoin(
        exercises,
        eq(treatmentPlanExercises.exercise_id, exercises.id)
      )
      .where(and(
        eq(patientSchedule.patient_id, patient_id),
        eq(patientSchedule.scheduled_date, today)
      ))
      .orderBy(patientSchedule.session_number);


    if (allRows.length === 0) {
      // Check if patient has an active treatment plan at all
      const [activePlan] = await db
        .select({ id: treatmentPlans.id, title: treatmentPlans.title, start_date: treatmentPlans.start_date, end_date: treatmentPlans.end_date })
        .from(treatmentPlans)
        .where(and(
          eq(treatmentPlans.patient_id, patient_id),
          eq(treatmentPlans.status, 'active')
        ));

      if (activePlan) {
        // Plan exists but no rows for today
        // Either the schedule is still being generated (background job running)
        // OR today is simply a rest day (not a due day for their frequency)
        return res.status(200).json({
          success: true,
          date: today,
          state: 'no_sessions_today',
          message: 'No exercise sessions scheduled for today. Either today is a rest day, or your schedule is still being prepared.',
          active_plan: activePlan,
          schedule: { pending: [], completed: [], missed: [] }
        });
      }

      // No active plan at all
      return res.status(200).json({
        success: true,
        date: today,
        state: 'no_active_plan',
        message: 'You do not have an active treatment plan. Please consult your doctor.',
        schedule: { pending: [], completed: [], missed: [] }
      });
    }

    // ── Rows exist — split by status ──────────────────────────────────────
    const pending = allRows.filter(r => r.status === 'pending');
    const completed = allRows.filter(r => r.status === 'completed');
    const missed = allRows.filter(r => r.status === 'missed');

    return res.status(200).json({
      success: true,
      date: today,
      state: 'active',
      total_sessions: allRows.length,
      pending_count: pending.length,
      completed_count: completed.length,
      missed_count: missed.length,
      schedule: {
        pending,
        completed,
        missed,
      }
    });

  } catch (error) {
    console.error('Error fetching today schedule:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── GET /api/patients/:patient_id/progress?treatment_plan_id=:id ─────────────

export const getPatientProgress = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { treatment_plan_id } = req.query;

    if (!treatment_plan_id) {
      return res.status(400).json({ success: false, message: 'treatment_plan_id query parameter is required.' });
    }


    const [plan] = await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, treatment_plan_id));
    if (!plan) return res.status(404).json({ success: false, message: 'Treatment plan not found.' });
    if (plan.patient_id !== patient_id) {
      return res.status(403).json({ success: false, message: 'This plan does not belong to this patient.' });
    }


    const tpeRows = await db
      .select({
        tpe_id: treatmentPlanExercises.id,
        exercise_id: exercises.id,
        exercise_name: exercises.name,
        target_body_part: exercises.target_body_part,
        sets: treatmentPlanExercises.sets,
        reps: treatmentPlanExercises.reps,
        frequency_type: treatmentPlanExercises.frequency_type,
        start_date: treatmentPlanExercises.start_date,
        end_date: treatmentPlanExercises.end_date,
        expected_sessions_count: treatmentPlanExercises.expected_sessions_count,
        completed_sessions_count: treatmentPlanExercises.completed_sessions_count,
        is_active: treatmentPlanExercises.is_active,
      })
      .from(treatmentPlanExercises)
      .innerJoin(exercises, eq(treatmentPlanExercises.exercise_id, exercises.id))
      .where(eq(treatmentPlanExercises.treatment_plan_id, treatment_plan_id));

    const totalExpected = tpeRows.reduce((sum, r) => sum + (r.expected_sessions_count ?? 0), 0);
    const totalCompleted = tpeRows.reduce((sum, r) => sum + (r.completed_sessions_count ?? 0), 0);
    const overallCompliance = totalExpected > 0
      ? Math.round((totalCompleted / totalExpected) * 100)
      : 0;

    const tpeIds = tpeRows.map(r => r.tpe_id);

    // Get all exercise logs for this patient under this plan
    const allLogs = await db.select()
      .from(exerciseLogs)
      .where(and(
        eq(exerciseLogs.patient_id, patient_id),
        isNotNull(exerciseLogs.treatment_plan_exercise_id)
      ))
      .orderBy(exerciseLogs.log_date);

    // Get all patient_schedule rows for this plan (to count missed per exercise)
    const allScheduleRows = await db.select({
      treatment_plan_exercise_id: patientSchedule.treatment_plan_exercise_id,
      status: patientSchedule.status,
      scheduled_date: patientSchedule.scheduled_date,
    })
      .from(patientSchedule)
      .where(eq(patientSchedule.patient_id, patient_id));

    // Build per-exercise breakdown in JavaScript
    const exerciseBreakdown = tpeRows.map(tpe => {
      // Missed count from patient_schedule
      const missedRows = allScheduleRows.filter(
        r => r.treatment_plan_exercise_id === tpe.tpe_id && r.status === 'missed'
      );

      // Logs for this specific exercise assignment
      const tpeLogs = allLogs.filter(l => l.treatment_plan_exercise_id === tpe.tpe_id);

      // Pain trend: group by ISO week, calculate average pain per week
      const weeklyPain = {};
      tpeLogs.forEach(log => {
        if (log.pain_level == null) return;
        // Get Monday of the week for this log date
        const d = new Date(log.log_date);
        const day = d.getDay(); // 0=Sun
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d.setDate(diff)).toISOString().split('T')[0];

        if (!weeklyPain[weekStart]) weeklyPain[weekStart] = { total: 0, count: 0 };
        weeklyPain[weekStart].total += log.pain_level;
        weeklyPain[weekStart].count += 1;
      });
      const painTrend = Object.entries(weeklyPain).map(([week, data]) => ({
        week_start: week,
        avg_pain: Math.round((data.total / data.count) * 10) / 10,
        sessions: data.count
      }));

      const compliance = tpe.expected_sessions_count > 0
        ? Math.round((tpe.completed_sessions_count / tpe.expected_sessions_count) * 100)
        : 0;

      return {
        tpe_id: tpe.tpe_id,
        exercise_name: tpe.exercise_name,
        target_body_part: tpe.target_body_part,
        sets: tpe.sets,
        reps: tpe.reps,
        frequency_type: tpe.frequency_type,
        start_date: tpe.start_date,
        end_date: tpe.end_date,
        is_active: tpe.is_active,
        expected_sessions: tpe.expected_sessions_count,
        completed_sessions: tpe.completed_sessions_count,
        missed_sessions: missedRows.length,
        compliance_percent: compliance,
        pain_trend: painTrend,
      };
    });


    const flaggedLogs = allLogs
      .filter(l => (l.pain_level != null && l.pain_level >= 7) || l.issue_type != null)
      .sort((a, b) => new Date(b.log_date) - new Date(a.log_date));


    const calendarByWeek = {};
    allScheduleRows.forEach(row => {
      const d = new Date(row.scheduled_date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(new Date(row.scheduled_date).setDate(diff)).toISOString().split('T')[0];

      if (!calendarByWeek[weekStart]) calendarByWeek[weekStart] = [];
      calendarByWeek[weekStart].push(row);
    });
    const calendar = Object.entries(calendarByWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week_start, rows]) => ({
        week_start,
        sessions: rows,
        completed: rows.filter(r => r.status === 'completed').length,
        missed: rows.filter(r => r.status === 'missed').length,
        pending: rows.filter(r => r.status === 'pending').length,
      }));

    let previousPlanComparison = null;
    const [consultation] = await db.select()
      .from(consultations)
      .where(eq(consultations.id, plan.consultation_id));

    if (consultation?.previous_treatment_plan_id) {
      const prevTpeRows = await db.select({
        expected_sessions_count: treatmentPlanExercises.expected_sessions_count,
        completed_sessions_count: treatmentPlanExercises.completed_sessions_count,
      })
        .from(treatmentPlanExercises)
        .where(eq(treatmentPlanExercises.treatment_plan_id, consultation.previous_treatment_plan_id));

      const prevExpected = prevTpeRows.reduce((s, r) => s + (r.expected_sessions_count ?? 0), 0);
      const prevCompleted = prevTpeRows.reduce((s, r) => s + (r.completed_sessions_count ?? 0), 0);

      previousPlanComparison = {
        previous_plan_id: consultation.previous_treatment_plan_id,
        previous_compliance: prevExpected > 0 ? Math.round((prevCompleted / prevExpected) * 100) : 0,
        current_compliance: overallCompliance,
        improvement: overallCompliance - (prevExpected > 0 ? Math.round((prevCompleted / prevExpected) * 100) : 0),
      };
    }

    return res.status(200).json({
      success: true,
      plan: {
        id: plan.id,
        title: plan.title,
        start_date: plan.start_date,
        end_date: plan.end_date,
        status: plan.status,
        overall_compliance_percent: overallCompliance,
        total_expected_sessions: totalExpected,
        total_completed_sessions: totalCompleted,
      },
      exercise_breakdown: exerciseBreakdown,
      flagged_logs: flaggedLogs,
      calendar,
      previous_plan_comparison: previousPlanComparison,
    });

  } catch (error) {
    console.error('Error fetching patient progress:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── POST /api/patients/:patient_id/discharge ─────────────────────────────────
export const dischargePatient = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const [activePlan] = await db.select()
      .from(treatmentPlans)
      .where(and(
        eq(treatmentPlans.patient_id, patient_id),
        eq(treatmentPlans.status, 'active')
      ));

    await db.transaction(async (tx) => {
      // Step 1: Complete the active treatment plan (if any)
      if (activePlan) {
        await tx.update(treatmentPlans)
          .set({ status: 'completed', updated_at: new Date() })
          .where(eq(treatmentPlans.id, activePlan.id));

        await tx.delete(patientSchedule)
          .where(and(
            eq(patientSchedule.patient_id, patient_id),
            eq(patientSchedule.status, 'pending'),
            gte(patientSchedule.scheduled_date, today)
          ));
      }

      // Step 3: Mark the patient profile as 'discharged'
      await tx.update(patientProfiles)
        .set({ status: 'discharged', updated_at: new Date() })
        .where(eq(patientProfiles.user_id, patient_id));
    });

    return res.status(200).json({
      success: true,
      message: 'Patient discharged successfully. Active plan completed, future sessions cleared, profile marked discharged.',
      completed_plan_id: activePlan?.id ?? null,
    });

  } catch (error) {
    console.error('Error discharging patient:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── PATCH /api/patients/:patient_id/reactivate ───────────────────────────────

export const reactivatePatient = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [profile] = await db.select()
      .from(patientProfiles)
      .where(eq(patientProfiles.user_id, patient_id));

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }
    if (profile.status !== 'discharged') {
      return res.status(400).json({
        success: false,
        message: `Patient is currently '${profile.status}'. Only discharged patients can be reactivated.`
      });
    }


    await db.update(patientProfiles)
      .set({ status: 'active', updated_at: new Date() })
      .where(eq(patientProfiles.user_id, patient_id));

    return res.status(200).json({
      success: true,
      message: 'Patient reactivated. Receptionist can now book a new appointment for a fresh consultation.',
    });

  } catch (error) {
    console.error('Error reactivating patient:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
