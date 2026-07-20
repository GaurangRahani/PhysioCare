import { db } from './src/db/index.js';
import { patientSchedule, treatmentPlans, treatmentPlanExercises, exercises } from './src/db/schema/index.js';
import { sql, eq, and, desc } from 'drizzle-orm';

async function run() {
  const patient_id = '332be545-3fea-4c42-b745-05014068da18'; // from my previous query
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  console.log('Querying for patient:', patient_id, 'date:', todayStr);

  const allRows = await db
    .select({
      schedule_id: patientSchedule.id,
      schedule_status: patientSchedule.status,
      session_number: patientSchedule.session_number,
      scheduled_date: patientSchedule.scheduled_date,
      exercise_name: exercises.name,
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
      eq(patientSchedule.scheduled_date, todayStr),
      eq(treatmentPlanExercises.is_active, true)
    ));
    
  console.log('Results:', allRows);
  process.exit(0);
}
run();
