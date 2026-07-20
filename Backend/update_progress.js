const fs = require('fs');

const path = '/media/gaurang-rahani/D/Dev/PhysioCare/Backend/controllers/patient.controller.js';
let content = fs.readFileSync(path, 'utf8');

const startIndex = content.indexOf('export const getPatientProgress = async (req, res) => {');
const endMarker = '// ─── POST /api/patients/:patient_id/discharge ─────────────────────────────────';
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find start or end index');
  process.exit(1);
}

const replacement = `export const getPatientProgress = async (req, res) => {
  try {
    const { patient_id } = req.params;
    let { planId } = req.query;

    let plan;
    if (planId) {
      const [fetchedPlan] = await db.select().from(treatmentPlans).where(and(eq(treatmentPlans.id, planId), eq(treatmentPlans.patient_id, patient_id)));
      plan = fetchedPlan;
    } else {
      const [activePlan] = await db.select().from(treatmentPlans).where(and(eq(treatmentPlans.patient_id, patient_id), eq(treatmentPlans.status, 'active'))).limit(1);
      plan = activePlan;
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Treatment plan not found.' });
    }
    
    planId = plan.id;

    const [planOverview] = await db.select({
      id: treatmentPlans.id,
      title: treatmentPlans.title,
      start_date: treatmentPlans.start_date,
      end_date: treatmentPlans.end_date,
      status: treatmentPlans.status,
      week_number: sql\`CEIL((CURRENT_DATE - \${treatmentPlans.start_date} + 1) / 7.0)::int\`,
      total_weeks: sql\`CEIL((\${treatmentPlans.end_date} - \${treatmentPlans.start_date} + 1) / 7.0)::int\`,
      duration_progress_percent: sql\`LEAST(ROUND((CURRENT_DATE - \${treatmentPlans.start_date})::numeric / NULLIF((\${treatmentPlans.end_date} - \${treatmentPlans.start_date}), 0) * 100), 100)::int\`
    })
    .from(treatmentPlans)
    .where(eq(treatmentPlans.id, planId));

    const exerciseRows = await db.select({
      exercise_id: exercises.id,
      exercise_name: exercises.name,
      tpe_id: treatmentPlanExercises.id,
      frequency_type: treatmentPlanExercises.frequency_type,
      sessions_per_day: treatmentPlanExercises.sessions_per_day,
      prescribed_sets: treatmentPlanExercises.sets,
      prescribed_reps: treatmentPlanExercises.reps,
      expected_sessions_count: treatmentPlanExercises.expected_sessions_count,
      completed_sessions_count: treatmentPlanExercises.completed_sessions_count,
      session_compliance_percent: sql\`ROUND(\${treatmentPlanExercises.completed_sessions_count}::numeric / NULLIF(\${treatmentPlanExercises.expected_sessions_count}, 0) * 100)::int\`,
      avg_sets_completed: sql\`COALESCE(AVG(\${exerciseLogs.sets_completed}::numeric), 0)\`,
      avg_pain: sql\`COALESCE(AVG(\${exerciseLogs.pain_level}::numeric), 0)\`
    })
    .from(treatmentPlanExercises)
    .innerJoin(exercises, eq(treatmentPlanExercises.exercise_id, exercises.id))
    .leftJoin(exerciseLogs, eq(exerciseLogs.treatment_plan_exercise_id, treatmentPlanExercises.id))
    .where(and(eq(treatmentPlanExercises.treatment_plan_id, planId), eq(treatmentPlanExercises.is_active, true)))
    .groupBy(
      exercises.id, exercises.name, treatmentPlanExercises.id, 
      treatmentPlanExercises.frequency_type, treatmentPlanExercises.sessions_per_day, 
      treatmentPlanExercises.sets, treatmentPlanExercises.reps, 
      treatmentPlanExercises.expected_sessions_count, treatmentPlanExercises.completed_sessions_count
    )
    .orderBy(treatmentPlanExercises.created_at);

    const [overallComplianceResult] = await db.select({
      overall_compliance: sql\`ROUND(SUM(\${treatmentPlanExercises.completed_sessions_count})::numeric / NULLIF(SUM(\${treatmentPlanExercises.expected_sessions_count}), 0) * 100)::int\`
    })
    .from(treatmentPlanExercises)
    .where(and(eq(treatmentPlanExercises.treatment_plan_id, planId), eq(treatmentPlanExercises.is_active, true)));
    
    const overallCompliance = overallComplianceResult?.overall_compliance || 0;

    const painWeeks = await db.select({
      week_start: sql\`DATE_TRUNC('week', \${exerciseLogs.log_date})::date\`,
      week_label: sql\`TO_CHAR(DATE_TRUNC('week', \${exerciseLogs.log_date}), 'DD Mon')\`,
      avg_pain: sql\`ROUND(AVG(\${exerciseLogs.pain_level})::numeric, 1)\`
    })
    .from(exerciseLogs)
    .innerJoin(treatmentPlanExercises, eq(exerciseLogs.treatment_plan_exercise_id, treatmentPlanExercises.id))
    .where(and(
      eq(treatmentPlanExercises.treatment_plan_id, planId),
      eq(exerciseLogs.patient_id, patient_id),
      isNotNull(exerciseLogs.pain_level)
    ))
    .groupBy(sql\`DATE_TRUNC('week', \${exerciseLogs.log_date})\`)
    .orderBy(sql\`DATE_TRUNC('week', \${exerciseLogs.log_date}) ASC\`);

    let trend = 'stable';
    if (painWeeks.length >= 2) {
      const last = painWeeks[painWeeks.length - 1].avg_pain;
      const secondLast = painWeeks[painWeeks.length - 2].avg_pain;
      const diff = last - secondLast;
      if (diff > 1.5) trend = 'increasing';
      else if (diff < -1.5) trend = 'improving';
    }

    const calendarData = await db.select({
      scheduled_date: patientSchedule.scheduled_date,
      session_number: patientSchedule.session_number,
      status: patientSchedule.status,
      exercise_name: exercises.name
    })
    .from(patientSchedule)
    .innerJoin(treatmentPlanExercises, eq(patientSchedule.treatment_plan_exercise_id, treatmentPlanExercises.id))
    .innerJoin(exercises, eq(patientSchedule.exercise_id, exercises.id))
    .where(and(
      eq(treatmentPlanExercises.treatment_plan_id, planId),
      eq(patientSchedule.patient_id, patient_id)
    ))
    .orderBy(patientSchedule.scheduled_date, patientSchedule.session_number);

    const concerns = await db.select({
      log_date: exerciseLogs.log_date,
      pain_level: exerciseLogs.pain_level,
      comments: exerciseLogs.comments,
      issue_type: exerciseLogs.issue_type,
      created_at: exerciseLogs.created_at
    })
    .from(exerciseLogs)
    .where(and(
      eq(exerciseLogs.patient_id, patient_id),
      sql\`\${exerciseLogs.treatment_plan_exercise_id} IS NULL\`
    ))
    .orderBy(desc(exerciseLogs.log_date));

    const pastPlans = await db.select({
      id: treatmentPlans.id,
      title: treatmentPlans.title,
      start_date: treatmentPlans.start_date,
      end_date: treatmentPlans.end_date,
      compliance_percent: sql\`ROUND(SUM(\${treatmentPlanExercises.completed_sessions_count})::numeric / NULLIF(SUM(\${treatmentPlanExercises.expected_sessions_count}), 0) * 100)::int\`
    })
    .from(treatmentPlans)
    .innerJoin(treatmentPlanExercises, eq(treatmentPlanExercises.treatment_plan_id, treatmentPlans.id))
    .where(and(
      eq(treatmentPlans.patient_id, patient_id),
      eq(treatmentPlans.status, 'completed')
    ))
    .groupBy(treatmentPlans.id, treatmentPlans.title, treatmentPlans.start_date, treatmentPlans.end_date)
    .orderBy(desc(treatmentPlans.end_date));

    return res.status(200).json({
      success: true,
      plan: planOverview,
      overallCompliance,
      exercises: exerciseRows.map(e => ({
        ...e,
        avg_sets_completed: parseFloat(e.avg_sets_completed),
        avg_pain: parseFloat(e.avg_pain)
      })),
      painTrend: {
        weeks: painWeeks.map(w => ({ ...w, avg_pain: parseFloat(w.avg_pain) })),
        trend
      },
      calendarData,
      concerns,
      pastPlans
    });

  } catch (error) {
    console.error('Error fetching patient progress:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(path, newContent);
console.log('Successfully updated getPatientProgress');
