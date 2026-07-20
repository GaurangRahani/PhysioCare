import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function test() {
  try {
    const patientsQuery = sql`
      SELECT DISTINCT ON (u.id)
        u.id as patient_id, u.name,
        tp.id as active_plan_id, tp.status
      FROM users u
      JOIN treatment_plans tp ON tp.patient_id = u.id
      WHERE tp.doctor_id = '5ce437cb-6686-43ff-bec3-479470bbd774' 
        AND tp.status IN ('active', 'paused', 'completed')
    `;
    const res = await db.execute(patientsQuery);
    console.log("Found patients:", res.rows || res);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
test();
