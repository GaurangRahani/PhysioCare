import { db } from './src/db/index.js';
import { treatmentPlans, treatmentPlanExercises, exercises, patientSchedule, exerciseLogs } from './src/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { randomUUID as uuidv4 } from 'crypto';

async function seedAll() {
  try {
    console.log("Starting progress mock seeder for ALL active plans...");

    // Find ALL active plans
    const activePlans = await db.select().from(treatmentPlans).where(eq(treatmentPlans.status, 'active'));

    if (activePlans.length === 0) {
      throw new Error("No active plans found to seed");
    }

    // Get 4 exercises to use for everyone
    const allExercises = await db.select().from(exercises).limit(4);

    for (const targetPlan of activePlans) {
      console.log(`\n--- Seeding plan: ${targetPlan.title} (Patient: ${targetPlan.patient_id}) ---`);

      // Clean up old exercises for this plan
      console.log("Cleaning up old exercises for this plan...");
      const existingTpe = await db.select().from(treatmentPlanExercises).where(eq(treatmentPlanExercises.treatment_plan_id, targetPlan.id));
      for (const tpe of existingTpe) {
        await db.delete(exerciseLogs).where(eq(exerciseLogs.treatment_plan_exercise_id, tpe.id));
        await db.delete(patientSchedule).where(eq(patientSchedule.treatment_plan_exercise_id, tpe.id));
      }
      await db.delete(treatmentPlanExercises).where(eq(treatmentPlanExercises.treatment_plan_id, targetPlan.id));

      // Create new treatment plan exercises
      const tpeIds = [];
      for (let i = 0; i < allExercises.length; i++) {
        const ex = allExercises[i];
        const tpeId = uuidv4();
        tpeIds.push({ tpeId, exId: ex.id, reps: 10, sets: 3, sessions: 2 });

        // Update plan start_date to July 10th
        await db.update(treatmentPlans).set({ start_date: '2026-07-10', end_date: '2026-08-10' }).where(eq(treatmentPlans.id, targetPlan.id));

        await db.insert(treatmentPlanExercises).values({
          id: tpeId,
          treatment_plan_id: targetPlan.id,
          exercise_id: ex.id,
          sets: 3,
          reps: 10,
          sessions_per_day: 2,
          frequency_type: 'daily',
          start_date: '2026-07-10',
          end_date: '2026-08-10',
          expected_sessions_count: 62,
        });
      }
      console.log("Added exercises to plan");

      // Generate logs & schedules from July 10 to July 19
      const startDate = new Date('2026-07-10');
      const endDate = new Date('2026-07-19');

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        console.log(`Processing date: ${dateStr}`);

        for (const tpe of tpeIds) {
          for (let session = 1; session <= tpe.sessions; session++) {
            let status = 'completed';
            let setsCompleted = 3;
            let pain = Math.floor(Math.random() * 5) + 2;
            let comments = null;
            let issue = null;

            if (Math.random() < 0.15) {
              status = 'missed';
              setsCompleted = 0;
              pain = null;
            }
            else if (Math.random() < 0.20) {
              setsCompleted = 1;
              pain = Math.floor(Math.random() * 3) + 5;
              comments = "Too much pain to finish";
              issue = "increased_pain";
            }

            await db.insert(patientSchedule).values({
              treatment_plan_exercise_id: tpe.tpeId,
              patient_id: targetPlan.patient_id,
              exercise_id: tpe.exId,
              scheduled_date: dateStr,
              session_number: session,
              status: status
            });

            if (status === 'completed' || setsCompleted > 0) {
              if (status === 'completed' && Math.random() < 0.7) {
                comments = null;
                issue = null;
              } else if (status === 'completed') {
                comments = "Felt pretty good today";
              }

              await db.insert(exerciseLogs).values({
                treatment_plan_exercise_id: tpe.tpeId,
                patient_id: targetPlan.patient_id,
                log_date: dateStr,
                session_number: session,
                sets_completed: setsCompleted,
                pain_level: pain,
                comments: comments,
                issue_type: issue,
                is_skipped: false
              });
            }
          }
        }
      }
    }

    console.log("\nMock data inserted successfully for ALL active plans!");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedAll();
