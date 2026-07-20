import { db } from './src/db/index.js';
import { patientSchedule, treatmentPlans, treatmentPlanExercises } from './src/db/schema/index.js';
import { sql, desc } from 'drizzle-orm';

async function run() {
  const latestPlan = await db.select().from(treatmentPlans).orderBy(desc(treatmentPlans.created_at)).limit(1);
  console.log('Latest Plan:', latestPlan[0]);
  
  if (latestPlan.length > 0) {
    const planId = latestPlan[0].id;
    const tpes = await db.select().from(treatmentPlanExercises).where(sql`${treatmentPlanExercises.treatment_plan_id} = ${planId}`);
    console.log(`TPEs for latest plan (${tpes.length}):`);
    
    for (const tpe of tpes) {
        const schedules = await db.select().from(patientSchedule).where(sql`${patientSchedule.treatment_plan_exercise_id} = ${tpe.id}`);
        console.log(`Schedules for TPE ${tpe.id}: ${schedules.length}`);
        if (schedules.length > 0) {
           console.log(`  Sample dates: ${schedules.map(s => s.scheduled_date).slice(0,3).join(', ')}`);
        }
    }
  }
  process.exit(0);
}
run();
