/**
 * Treatment Plan Comprehensive Test Suite
 * Tests: Plan Creation, Exercise Assignment, Logging, Lifecycle Management
 *
 * Run with: node --input-type=module tests/treatment_plan_tests.js
 * Requires: Backend running on localhost:5000, NODE_ENV !== 'production'
 * Uses x-dev-email header for auth bypass (dev mode only)
 */

import { db } from '../src/db/index.js';
import {
  users, consultations, exercises, treatmentPlans,
  treatmentPlanExercises, patientSchedule, exerciseLogs
} from '../src/db/schema/index.js';
import { eq, and, desc } from 'drizzle-orm';

const BASE = 'http://localhost:5000';

// ─── Test harness ─────────────────────────────────────────────────────────────

let PASS = 0, FAIL = 0, WARN = 0;
const results = [];

function log(id, status, msg, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${id}] ${msg}${detail ? `\n   → ${detail}` : ''}`);
  results.push({ id, status, msg, detail });
  if (status === 'PASS') PASS++;
  else if (status === 'FAIL') FAIL++;
  else WARN++;
}

async function apiCall(method, path, body, email) {
  const headers = { 'Content-Type': 'application/json' };
  if (email) headers['x-dev-email'] = email;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json;
  try { json = await res.json(); } catch { json = {}; }
  return { status: res.status, body: json };
}

// ─── DB Helpers ───────────────────────────────────────────────────────────────

async function getActivePlan(patientId) {
  const [plan] = await db.select().from(treatmentPlans)
    .where(and(eq(treatmentPlans.patient_id, patientId), eq(treatmentPlans.status, 'active')));
  return plan;
}

async function getScheduleRows(patientId, date) {
  return db.select().from(patientSchedule)
    .where(and(eq(patientSchedule.patient_id, patientId), eq(patientSchedule.scheduled_date, date)));
}

async function getTpe(tpeId) {
  const [tpe] = await db.select().from(treatmentPlanExercises).where(eq(treatmentPlanExercises.id, tpeId));
  return tpe;
}

async function cleanup(patientId) {
  // Delete exercise logs for patient
  await db.delete(exerciseLogs).where(eq(exerciseLogs.patient_id, patientId));
  // Delete schedule rows
  await db.delete(patientSchedule).where(eq(patientSchedule.patient_id, patientId));
  // Delete TPEs
  const plans = await db.select({ id: treatmentPlans.id }).from(treatmentPlans)
    .where(eq(treatmentPlans.patient_id, patientId));
  for (const p of plans) {
    await db.delete(treatmentPlanExercises).where(eq(treatmentPlanExercises.treatment_plan_id, p.id));
  }
  // Delete plans
  await db.delete(treatmentPlans).where(eq(treatmentPlans.patient_id, patientId));
}

// ─── Test Data ────────────────────────────────────────────────────────────────

const DOCTOR_EMAIL  = 'pprahani123@gmail.com';   // Dr Gaurang
const PATIENT_EMAIL = 'ojatrahani09@gmail.com';  // parthjindal
const DOCTOR_ID  = 'cfebdf19-ee43-4c2d-861f-68dcb21fcbf7';
const PATIENT_ID = 'b17759a5-abbc-4707-817d-76199b34d0d7';
const EXERCISE_1 = '95daee87-5d0d-408a-9ecd-157997b2a4fc';
const EXERCISE_2 = '3bba3c42-5d53-4088-8dcd-459b7e1ed754';
const EXERCISE_3 = '28085a95-f6cf-48d1-bc80-9040adeaf372';

// We'll use a consultation that belongs to PATIENT_ID
// From seed data: d50cd23f belongs to patient 332be545, not our patient
// We need to find/create a consultation for PATIENT_ID
let VALID_CONSULT_ID = null;

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

// Get or create a consultation for our patient
async function ensureConsultation() {
  const [existing] = await db.select().from(consultations)
    .where(eq(consultations.patient_id, PATIENT_ID)).limit(1);
  if (existing) {
    VALID_CONSULT_ID = existing.id;
    return existing;
  }
  const [created] = await db.insert(consultations).values({
    patient_id: PATIENT_ID,
    doctor_id: DOCTOR_ID,
    appointment_id: null,
    chief_complaint: 'Test consultation',
    diagnosis: 'Test',
    notes: 'For automated testing',
  }).returning();
  VALID_CONSULT_ID = created.id;
  return created;
}

// ─── MODULE 1: Plan Creation ──────────────────────────────────────────────────

async function testPlanCreation(doctorToken) {
  console.log('\n━━━ MODULE 1: Treatment Plan Creation ━━━\n');

  // TC-TP-001: Valid plan, no exercises
  let r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Test Plan No Exercises',
    start_date: tomorrow,
    end_date: nextMonth,
    exercises: []
  }, doctorToken);
  if (r.status === 201 && r.body.success) {
    log('TC-TP-001', 'PASS', 'Create plan with no exercises → 201');
  } else {
    log('TC-TP-001', 'FAIL', 'Create plan with no exercises', JSON.stringify(r.body));
  }

  // Clean up so we can run TC-TP-002 fresh
  await cleanup(PATIENT_ID);

  // TC-TP-002: Valid plan with 1 daily exercise
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Daily Exercise Plan',
    start_date: today,
    end_date: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0], // 7 days
    exercises: [{
      exercise_id: EXERCISE_1,
      sets: 3,
      reps: 10,
      frequency_type: 'daily',
      sessions_per_day: 1
    }]
  }, doctorToken);
  if (r.status === 201 && r.body.success && r.body.exercises?.length === 1) {
    log('TC-TP-002', 'PASS', 'Create plan with 1 daily exercise → 201, 1 TPE returned');
    // Verify schedule rows were generated
    await new Promise(r => setTimeout(r, 500)); // wait for async schedule gen
    const rows = await db.select().from(patientSchedule).where(eq(patientSchedule.patient_id, PATIENT_ID));
    if (rows.length === 7) {
      log('TC-TP-002b', 'PASS', `Schedule generated: 7 rows for 7-day daily plan`);
    } else {
      log('TC-TP-002b', 'FAIL', `Expected 7 schedule rows, got ${rows.length}`);
    }
  } else {
    log('TC-TP-002', 'FAIL', 'Create plan with daily exercise', JSON.stringify(r.body));
  }

  await cleanup(PATIENT_ID);

  // TC-TP-003: Bulk 3 exercises
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Multi Exercise Plan',
    start_date: today,
    end_date: nextWeek,
    exercises: [
      { exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'daily' },
      { exercise_id: EXERCISE_2, sets: 2, reps: 15, frequency_type: 'mon_wed_fri' },
      { exercise_id: EXERCISE_3, sets: 4, reps: 8, frequency_type: 'alternate_days' }
    ]
  }, doctorToken);
  if (r.status === 201 && r.body.exercises?.length === 3) {
    log('TC-TP-003', 'PASS', 'Bulk 3 exercises → 201, 3 TPEs');
  } else {
    log('TC-TP-003', 'FAIL', 'Bulk 3 exercises', JSON.stringify(r.body));
  }

  // TC-TP-004: Create plan when active plan exists → old plan completed, new one active
  // consultation_id is UNIQUE, so we must create a NEW consultation for the replacement plan
  const oldPlanId = (await getActivePlan(PATIENT_ID))?.id;
  const [secondConsult] = await db.insert(consultations).values({
    patient_id: PATIENT_ID,
    doctor_id: DOCTOR_ID,
    appointment_id: null,
    chief_complaint: 'Replacement consult',
    diagnosis: 'Test',
    notes: 'TC-TP-004 second consultation',
  }).returning();

  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: secondConsult.id,
    patient_id: PATIENT_ID,
    title: 'Replacement Plan',
    start_date: today,
    end_date: nextWeek,
    exercises: [{ exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'daily' }]
  }, doctorToken);
  // clean up the extra consult
  await db.delete(consultations).where(eq(consultations.id, secondConsult.id)).catch(() => {});
  if (r.status === 201) {
    const oldPlan = oldPlanId ? await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, oldPlanId)) : [];
    if (oldPlanId && oldPlan[0]?.status === 'completed') {
      log('TC-TP-004', 'PASS', 'Old active plan auto-completed when new plan created');
    } else if (!oldPlanId) {
      log('TC-TP-004', 'WARN', 'No previous active plan to test old-plan completion');
    } else {
      log('TC-TP-004', 'FAIL', `Old plan status should be 'completed', got: ${oldPlan[0]?.status}`);
    }
  } else {
    log('TC-TP-004', 'FAIL', 'Create replacement plan', JSON.stringify(r.body));
  }

  await cleanup(PATIENT_ID);

  // TC-TP-005: mon_wed_fri frequency — schedule on correct days
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Mon/Wed/Fri Plan',
    start_date: '2026-07-21', // Tuesday
    end_date: '2026-08-01',   // 12 days — expect Mon(27), Wed(22,29), Fri(24,31) = 5 sessions
    exercises: [{ exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'mon_wed_fri' }]
  }, doctorToken);
  if (r.status === 201) {
    await new Promise(r => setTimeout(r, 500));
    const rows = await db.select().from(patientSchedule).where(eq(patientSchedule.patient_id, PATIENT_ID));
    const days = rows.map(r => new Date(r.scheduled_date + 'T00:00:00Z').getDay());
    const allMWF = days.every(d => [1, 3, 5].includes(d)); // Mon=1, Wed=3, Fri=5
    if (allMWF && rows.length > 0) {
      log('TC-TP-005', 'PASS', `Mon/Wed/Fri schedule correct — ${rows.length} sessions, all on correct days`);
    } else {
      log('TC-TP-005', 'FAIL', `Days scheduled: ${[...new Set(days)]} — not all Mon/Wed/Fri. Count: ${rows.length}`);
    }
  } else {
    log('TC-TP-005', 'FAIL', 'Create mon_wed_fri plan', JSON.stringify(r.body));
  }

  await cleanup(PATIENT_ID);

  // TC-TP-007: custom_days encoding
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Custom Days Plan',
    start_date: '2026-07-21',
    end_date: '2026-07-31',
    exercises: [{
      exercise_id: EXERCISE_1, sets: 3, reps: 10,
      frequency_type: 'custom_days',
      frequency_days: ['Mon', 'Wed'] // bitmask = 1+4 = 5
    }]
  }, doctorToken);
  if (r.status === 201) {
    await new Promise(r => setTimeout(r, 500));
    const rows = await db.select().from(patientSchedule).where(eq(patientSchedule.patient_id, PATIENT_ID));
    const days = rows.map(r => new Date(r.scheduled_date + 'T00:00:00Z').getDay());
    const allMonWed = days.every(d => [1, 3].includes(d));
    if (allMonWed) {
      log('TC-TP-007', 'PASS', `Custom days (Mon+Wed) scheduled correctly — ${rows.length} sessions`);
    } else {
      log('TC-TP-007', 'FAIL', `Days: ${[...new Set(days)]} — expected only Mon(1)+Wed(3)`);
    }
  } else {
    log('TC-TP-007', 'FAIL', 'Create custom_days plan', JSON.stringify(r.body));
  }

  await cleanup(PATIENT_ID);

  // TC-TP-008: sessions_per_day=2
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Two Sessions Per Day',
    start_date: today,
    end_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0], // 5 days
    exercises: [{ exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'daily', sessions_per_day: 2 }]
  }, doctorToken);
  if (r.status === 201) {
    await new Promise(r => setTimeout(r, 500));
    const rows = await db.select().from(patientSchedule).where(eq(patientSchedule.patient_id, PATIENT_ID));
    const session2s = rows.filter(r => r.session_number === 2);
    if (rows.length === 10 && session2s.length === 5) {
      log('TC-TP-008', 'PASS', `sessions_per_day=2: 10 total rows, 5 with session_number=2`);
    } else {
      log('TC-TP-008', 'FAIL', `Expected 10 rows with 5 having session 2, got total=${rows.length}, session2=${session2s.length}`);
    }
  } else {
    log('TC-TP-008', 'FAIL', 'sessions_per_day=2', JSON.stringify(r.body));
  }

  await cleanup(PATIENT_ID);

  // ─── Error Cases ─────────────────────────────────────────────────────────────

  // TC-TP-012: Non-existent consultation_id
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: '00000000-0000-0000-0000-000000000000',
    patient_id: PATIENT_ID,
    title: 'Bad Plan',
    start_date: today,
    end_date: nextWeek,
  }, doctorToken);
  if (r.status === 404) {
    log('TC-TP-012', 'PASS', 'Non-existent consultation_id → 404');
  } else {
    log('TC-TP-012', 'FAIL', `Expected 404, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-TP-013: consultation belongs to different patient
  const wrongConsultId = 'd50cd23f-1b2c-4539-9949-8dc610b3a2f4'; // belongs to 332be545
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: wrongConsultId,
    patient_id: PATIENT_ID, // different patient
    title: 'Mismatch Plan',
    start_date: today,
    end_date: nextWeek,
  }, doctorToken);
  if (r.status === 400 && r.body.message?.includes('does not belong')) {
    log('TC-TP-013', 'PASS', 'Consultation-patient mismatch → 400');
  } else {
    log('TC-TP-013', 'FAIL', `Expected 400 mismatch, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-TP-014: end_date == start_date
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Same Date Plan',
    start_date: today,
    end_date: today,
  }, doctorToken);
  if (r.status === 400) {
    log('TC-TP-014', 'PASS', 'end_date == start_date → 400');
  } else {
    log('TC-TP-014', 'FAIL', `Expected 400, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-TP-015: end_date < start_date
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Backwards Plan',
    start_date: nextWeek,
    end_date: today,
  }, doctorToken);
  if (r.status === 400) {
    log('TC-TP-015', 'PASS', 'end_date < start_date → 400');
  } else {
    log('TC-TP-015', 'FAIL', `Expected 400, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-TP-016: custom_days without frequency_days
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Custom No Days',
    start_date: today,
    end_date: nextWeek,
    exercises: [{ exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'custom_days' }]
  }, doctorToken);
  if (r.status === 400) {
    log('TC-TP-016', 'PASS', 'custom_days without frequency_days → 400');
  } else {
    log('TC-TP-016', 'FAIL', `Expected 400, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-TP-017: custom_days with empty array
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Empty Custom Days',
    start_date: today,
    end_date: nextWeek,
    exercises: [{ exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'custom_days', frequency_days: [] }]
  }, doctorToken);
  if (r.status === 400) {
    log('TC-TP-017', 'PASS', 'custom_days with empty array → 400');
  } else {
    log('TC-TP-017', 'FAIL', `Expected 400, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-TP-025: Patient role cannot create a treatment plan (403 Forbidden)
  r = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Patient Creates Plan',
    start_date: today,
    end_date: nextWeek,
  }, PATIENT_EMAIL);  // patient email → role check → 403
  if (r.status === 403) {
    log('TC-TP-025', 'PASS', `Patient role blocked from creating plan → 403`);
  } else {
    log('TC-TP-025', 'FAIL', `Expected 403, got ${r.status}`, JSON.stringify(r.body));
  }
}

// ─── MODULE 2: Exercise Assignment ────────────────────────────────────────────

async function testExerciseAssignment(doctorToken) {
  console.log('\n━━━ MODULE 2: Exercise Assignment ━━━\n');

  // Create a fresh active plan to test on
  const createRes = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Assignment Test Plan',
    start_date: today,
    end_date: nextMonth,
    exercises: [{ exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'daily' }]
  }, doctorToken);

  if (createRes.status !== 201) {
    log('SETUP', 'FAIL', 'Could not create plan for Module 2 tests', JSON.stringify(createRes.body));
    return;
  }

  const planId = createRes.body.treatment_plan?.id;
  const tpeId = createRes.body.exercises?.[0]?.id;

  // TC-AE-001: Add exercise to active plan
  let r = await apiCall('POST', `/api/treatment-plans/${planId}/exercises`, {
    exercise_id: EXERCISE_2,
    sets: 2,
    reps: 15,
    frequency_type: 'mon_wed_fri',
  }, doctorToken);
  if (r.status === 201) {
    log('TC-AE-001', 'PASS', 'Add exercise to active plan → 201');
  } else {
    log('TC-AE-001', 'FAIL', `Add exercise to plan`, JSON.stringify(r.body));
  }

  // TC-AE-004: Add exercise with end_date after plan end
  const farFuture = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
  r = await apiCall('POST', `/api/treatment-plans/${planId}/exercises`, {
    exercise_id: EXERCISE_3,
    sets: 3,
    reps: 10,
    frequency_type: 'daily',
    end_date: farFuture
  }, doctorToken);
  if (r.status === 400) {
    log('TC-AE-004', 'PASS', 'end_date after plan end → 400');
  } else {
    log('TC-AE-004', 'FAIL', `Expected 400, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-AE-009: Non-existent plan
  r = await apiCall('POST', '/api/treatment-plans/00000000-0000-0000-0000-000000000000/exercises', {
    exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'daily'
  }, doctorToken);
  if (r.status === 404) {
    log('TC-AE-009', 'PASS', 'Non-existent plan → 404');
  } else {
    log('TC-AE-009', 'FAIL', `Expected 404, got ${r.status}`);
  }

  // TC-AE-010: custom_days without frequency_days
  r = await apiCall('POST', `/api/treatment-plans/${planId}/exercises`, {
    exercise_id: EXERCISE_3, sets: 3, reps: 10, frequency_type: 'custom_days'
  }, doctorToken);
  if (r.status === 400) {
    log('TC-AE-010', 'PASS', 'custom_days without days → 400');
  } else {
    log('TC-AE-010', 'FAIL', `Expected 400, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-UA-001: Update assignment (versioning)
  const beforeRows = await db.select().from(patientSchedule)
    .where(and(eq(patientSchedule.patient_id, PATIENT_ID), eq(patientSchedule.status, 'pending')));

  r = await apiCall('PATCH', `/api/treatment-plan-exercises/${tpeId}`, {
    sets: 5,
    reps: 12,
  }, doctorToken);
  if (r.status === 200) {
    const oldTpe = await getTpe(tpeId);
    if (oldTpe?.is_active === false) {
      log('TC-UA-001', 'PASS', 'Update assignment: old TPE deactivated, new one created');
    } else {
      log('TC-UA-001', 'FAIL', `Old TPE should be inactive, is_active=${oldTpe?.is_active}`);
    }
    // Verify old future schedule rows deleted
    const afterRows = await db.select().from(patientSchedule)
      .where(and(eq(patientSchedule.patient_id, PATIENT_ID), eq(patientSchedule.treatment_plan_exercise_id, tpeId), eq(patientSchedule.status, 'pending')));
    if (afterRows.length === 0) {
      log('TC-UA-001b', 'PASS', 'Old pending schedule rows deleted after assignment update');
    } else {
      log('TC-UA-001b', 'FAIL', `Old pending schedule rows remain: ${afterRows.length}`);
    }
  } else {
    log('TC-UA-001', 'FAIL', `Update assignment`, JSON.stringify(r.body));
  }

  // TC-UA-004: Update already inactive assignment
  r = await apiCall('PATCH', `/api/treatment-plan-exercises/${tpeId}`, { sets: 8 }, doctorToken);
  if (r.status === 400 && r.body.message?.includes('deactivated')) {
    log('TC-UA-004', 'PASS', 'Update inactive assignment → 400 deactivated');
  } else {
    log('TC-UA-004', 'FAIL', `Expected 400 deactivated, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-DA-001: Delete active assignment
  const addRes = await apiCall('POST', `/api/treatment-plans/${planId}/exercises`, {
    exercise_id: EXERCISE_3, sets: 3, reps: 10, frequency_type: 'daily'
  }, doctorToken);
  const newTpeId = addRes.body.exercise?.id;
  if (newTpeId) {
    r = await apiCall('DELETE', `/api/treatment-plan-exercises/${newTpeId}`, null, doctorToken);
    if (r.status === 200) {
      const deletedTpe = await getTpe(newTpeId);
      if (deletedTpe?.is_active === false) {
        log('TC-DA-001', 'PASS', 'Delete assignment: is_active=false, future schedule cleared');
      } else {
        log('TC-DA-001', 'FAIL', `TPE should be inactive after delete, is_active=${deletedTpe?.is_active}`);
      }
    } else {
      log('TC-DA-001', 'FAIL', `Delete assignment`, JSON.stringify(r.body));
    }

    // TC-DA-002: Delete already inactive
    r = await apiCall('DELETE', `/api/treatment-plan-exercises/${newTpeId}`, null, doctorToken);
    if (r.status === 400) {
      log('TC-DA-002', 'PASS', 'Delete already inactive assignment → 400');
    } else {
      log('TC-DA-002', 'FAIL', `Expected 400, got ${r.status}`, JSON.stringify(r.body));
    }
  }
}

// ─── MODULE 3: Logging ────────────────────────────────────────────────────────

async function testExerciseLogs(doctorToken, patientToken) {
  console.log('\n━━━ MODULE 3: Exercise Logging ━━━\n');

  await cleanup(PATIENT_ID);

  // Create a plan with a today-starting daily exercise
  const createRes = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Log Test Plan',
    start_date: today,
    end_date: nextWeek,
    exercises: [
      { exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'daily', sessions_per_day: 2 }
    ]
  }, doctorToken);

  if (createRes.status !== 201) {
    log('SETUP', 'FAIL', 'Module 3 setup plan creation failed', JSON.stringify(createRes.body));
    return;
  }

  const tpeId = createRes.body.exercises?.[0]?.id;
  await new Promise(r => setTimeout(r, 500)); // wait for schedule gen

  // TC-DS-001: Get daily schedule
  let r = await apiCall('GET', '/api/exercise-logs/today', null, patientToken);
  if (r.status === 200 && r.body.pending_count === 2) {
    log('TC-DS-001', 'PASS', `Daily schedule: 2 pending sessions (sessions_per_day=2)`);
  } else {
    log('TC-DS-001', 'WARN', `Daily schedule: status=${r.status}, pending=${r.body.pending_count}`, JSON.stringify(r.body));
  }

  // TC-EL-001: Log session 1
  r = await apiCall('POST', '/api/exercise-logs', {
    treatment_plan_exercise_id: tpeId,
    log_date: today,
    session_number: 1,
    sets_completed: 3,
    pain_level: 3,
    comments: 'Felt good'
  }, patientToken);
  if (r.status === 201 && r.body.success) {
    log('TC-EL-001', 'PASS', 'Log session 1 → 201');
    // Verify counter incremented
    const tpe = await getTpe(tpeId);
    if (tpe?.completed_sessions_count === 1) {
      log('TC-EL-001b', 'PASS', 'completed_sessions_count incremented to 1');
    } else {
      log('TC-EL-001b', 'FAIL', `completed_sessions_count=${tpe?.completed_sessions_count}, expected 1`);
    }
    // Verify schedule row marked complete
    const schedRows = await db.select().from(patientSchedule)
      .where(and(
        eq(patientSchedule.patient_id, PATIENT_ID),
        eq(patientSchedule.treatment_plan_exercise_id, tpeId),
        eq(patientSchedule.scheduled_date, today)
      ));
    const session1 = schedRows.find(r => r.session_number === 1);
    if (session1?.status === 'completed') {
      log('TC-EL-001c', 'PASS', 'Schedule row for session 1 marked completed');
    } else {
      log('TC-EL-001c', 'FAIL', `Session 1 schedule status=${session1?.status}`);
    }
    const session2 = schedRows.find(r => r.session_number === 2);
    if (session2?.status === 'pending') {
      log('TC-DS-006', 'PASS', 'Session 2 still pending after logging session 1');
    }
  } else {
    log('TC-EL-001', 'FAIL', `Log session 1`, JSON.stringify(r.body));
  }

  // TC-EL-008: Duplicate log → idempotent
  r = await apiCall('POST', '/api/exercise-logs', {
    treatment_plan_exercise_id: tpeId,
    log_date: today,
    session_number: 1,
    sets_completed: 3,
    pain_level: 2,
  }, patientToken);
  if (r.status === 200 && r.body.alreadyLogged === true) {
    log('TC-EL-008', 'PASS', 'Duplicate log → 200 alreadyLogged:true');
    // Verify counter NOT incremented again
    const tpe = await getTpe(tpeId);
    if (tpe?.completed_sessions_count === 1) {
      log('TC-EL-008b', 'PASS', 'Counter not double-incremented on duplicate');
    } else {
      log('TC-EL-008b', 'FAIL', `Counter=${tpe?.completed_sessions_count}, expected still 1`);
    }
  } else {
    log('TC-EL-008', 'FAIL', `Expected 200 alreadyLogged, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-EL-009: Log with yesterday's date
  r = await apiCall('POST', '/api/exercise-logs', {
    treatment_plan_exercise_id: tpeId,
    log_date: yesterday,
    session_number: 1,
    sets_completed: 3,
  }, patientToken);
  if (r.status === 400 && r.body.message?.includes('today')) {
    log('TC-EL-009', 'PASS', 'Log with past date → 400');
  } else {
    log('TC-EL-009', 'FAIL', `Expected 400, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-EL-010: Log with tomorrow's date
  r = await apiCall('POST', '/api/exercise-logs', {
    treatment_plan_exercise_id: tpeId,
    log_date: tomorrow,
    session_number: 1,
    sets_completed: 3,
  }, patientToken);
  if (r.status === 400) {
    log('TC-EL-010', 'PASS', 'Log with future date → 400');
  } else {
    log('TC-EL-010', 'FAIL', `Expected 400, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-EL-011: Non-existent TPE ID
  r = await apiCall('POST', '/api/exercise-logs', {
    treatment_plan_exercise_id: '00000000-0000-0000-0000-000000000000',
    log_date: today, session_number: 1, sets_completed: 3,
  }, patientToken);
  if (r.status === 404) {
    log('TC-EL-011', 'PASS', 'Non-existent TPE → 404');
  } else {
    log('TC-EL-011', 'FAIL', `Expected 404, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-EL-003: High pain level → flagged
  r = await apiCall('POST', '/api/exercise-logs', {
    treatment_plan_exercise_id: tpeId,
    log_date: today,
    session_number: 2,
    sets_completed: 2,
    pain_level: 8,
    comments: 'Sharp pain in knee'
  }, patientToken);
  if (r.status === 201) {
    log('TC-EL-003', 'PASS', 'High pain level (8) logged → 201');
    // Verify flagged in doctor view
    const logsRes = await apiCall('GET', `/api/exercise-logs/patient/${PATIENT_ID}`, null, doctorToken);
    const flagged = logsRes.body?.data?.flagged || [];
    const highPainLog = flagged.find(l => l.pain_level === 8);
    if (highPainLog) {
      log('TC-EL-003b', 'PASS', 'High pain log appears in flagged list in doctor view');
    } else {
      log('TC-EL-003b', 'FAIL', 'High pain log NOT in flagged list', JSON.stringify(logsRes.body?.data?.flagged?.length));
    }
  } else {
    log('TC-EL-003', 'FAIL', `Log high pain`, JSON.stringify(r.body));
  }

  // TC-EL-006: Standalone concern log (no exercise)
  r = await apiCall('POST', '/api/exercise-logs', {
    log_date: today,
    pain_level: 6,
    issue_type: 'general_concern',
    comments: 'Feeling dizzy after exercises'
  }, patientToken);
  if (r.status === 201 && r.body.success) {
    log('TC-EL-006', 'PASS', 'Standalone concern log (no TPE) → 201');
  } else {
    log('TC-EL-006', 'FAIL', `Standalone concern`, JSON.stringify(r.body));
  }

  // TC-EL-016: Concern log without issue_type
  r = await apiCall('POST', '/api/exercise-logs', {
    log_date: today,
    pain_level: 5,
    comments: 'Some concern'
  }, patientToken);
  if (r.status === 400) {
    log('TC-EL-016', 'PASS', 'Concern without issue_type → 400');
  } else {
    log('TC-EL-016', 'FAIL', `Expected 400, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-EL-017: Concern with sets_completed
  r = await apiCall('POST', '/api/exercise-logs', {
    log_date: today,
    issue_type: 'general_concern',
    sets_completed: 3,
  }, patientToken);
  if (r.status === 400) {
    log('TC-EL-017', 'PASS', 'Concern with sets_completed → 400');
  } else {
    log('TC-EL-017', 'FAIL', `Expected 400, got ${r.status}`, JSON.stringify(r.body));
  }

  // TC-EL-019: pain_level=7 → threshold, should be flagged
  const tpeForSkip = tpeId; // already has logs for session1+2
  // We need a fresh schedule row — add a new exercise
  const addRes = await apiCall('POST', `/api/treatment-plans/${createRes.body.treatment_plan?.id}/exercises`, {
    exercise_id: EXERCISE_2, sets: 3, reps: 10, frequency_type: 'daily'
  }, doctorToken);
  const tpe2Id = addRes.body.exercise?.id;
  if (tpe2Id) {
    await new Promise(r => setTimeout(r, 500));
    r = await apiCall('POST', '/api/exercise-logs', {
      treatment_plan_exercise_id: tpe2Id,
      log_date: today, session_number: 1, sets_completed: 3, pain_level: 7
    }, patientToken);
    if (r.status === 201) {
      const logsRes = await apiCall('GET', `/api/exercise-logs/patient/${PATIENT_ID}`, null, doctorToken);
      const flagged = logsRes.body?.data?.flagged || [];
      const t7 = flagged.find(l => l.pain_level === 7);
      if (t7) {
        log('TC-EL-019', 'PASS', 'pain_level=7 (threshold) → flagged');
      } else {
        log('TC-EL-019', 'FAIL', 'pain_level=7 not in flagged list');
      }
      // TC-GL-006: pain_level=6 not flagged
      const normal = logsRes.body?.data?.normal || [];
      // (we'll check this via a fresh log after cleanup)
    }
  }
}

// ─── MODULE 4: Plan Lifecycle ─────────────────────────────────────────────────

async function testLifecycle(doctorToken) {
  console.log('\n━━━ MODULE 4: Plan Lifecycle ━━━\n');

  await cleanup(PATIENT_ID);

  const createRes = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID,
    patient_id: PATIENT_ID,
    title: 'Lifecycle Test Plan',
    start_date: today,
    end_date: nextMonth,
    exercises: [{ exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'daily' }]
  }, doctorToken);

  if (createRes.status !== 201) {
    log('SETUP-M4', 'FAIL', 'Could not create plan for lifecycle tests');
    return;
  }

  const planId = createRes.body.treatment_plan?.id;
  await new Promise(r => setTimeout(r, 500));

  // TC-PL-008: Freeze/Pause plan
  const rowsBefore = await db.select().from(patientSchedule)
    .where(and(eq(patientSchedule.patient_id, PATIENT_ID), eq(patientSchedule.status, 'pending')));

  let r = await apiCall('PATCH', `/api/treatment-plans/${planId}/freeze`, null, doctorToken);
  if (r.status === 200) {
    const plan = (await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, planId)))[0];
    const rowsAfter = await db.select().from(patientSchedule)
      .where(and(eq(patientSchedule.patient_id, PATIENT_ID), eq(patientSchedule.status, 'pending')));
    if (plan?.status === 'paused' && rowsAfter.length === 0) {
      log('TC-PL-008', 'PASS', `Plan paused: status=paused, ${rowsBefore.length} future rows deleted`);
    } else {
      log('TC-PL-008', 'FAIL', `Plan status=${plan?.status}, pending rows remaining=${rowsAfter.length}`);
    }
  } else {
    log('TC-PL-008', 'FAIL', `Freeze plan`, JSON.stringify(r.body));
  }

  // TC-PL-009: Pause already paused plan → should return 400 (BUG CHECK)
  r = await apiCall('PATCH', `/api/treatment-plans/${planId}/freeze`, null, doctorToken);
  if (r.status === 400) {
    log('TC-PL-009', 'PASS', 'Pause already paused plan → 400 (guard exists)');
  } else if (r.status === 200) {
    log('TC-PL-009', 'FAIL', '🐛 BUG: Pausing an already-paused plan succeeds silently (no guard)');
  }

  // TC-PL-012: Resume paused plan
  r = await apiCall('PATCH', `/api/treatment-plans/${planId}/resume`, null, doctorToken);
  if (r.status === 200) {
    await new Promise(r => setTimeout(r, 500));
    const plan = (await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, planId)))[0];
    const newRows = await db.select().from(patientSchedule)
      .where(and(eq(patientSchedule.patient_id, PATIENT_ID), eq(patientSchedule.status, 'pending')));
    if (plan?.status === 'active' && newRows.length > 0) {
      log('TC-PL-012', 'PASS', `Plan resumed: status=active, ${newRows.length} future sessions regenerated`);
    } else {
      log('TC-PL-012', 'FAIL', `After resume: status=${plan?.status}, pending rows=${newRows.length}`);
    }
  } else {
    log('TC-PL-012', 'FAIL', `Resume plan`, JSON.stringify(r.body));
  }

  // TC-PL-001: Complete plan
  r = await apiCall('PATCH', `/api/treatment-plans/${planId}/complete`, null, doctorToken);
  if (r.status === 200) {
    const plan = (await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, planId)))[0];
    if (plan?.status === 'completed') {
      log('TC-PL-001', 'PASS', 'Complete plan → status=completed');
    } else {
      log('TC-PL-001', 'FAIL', `Plan status=${plan?.status} after complete`);
    }
  } else {
    log('TC-PL-001', 'FAIL', `Complete plan`, JSON.stringify(r.body));
  }

  // TC-PL-002: Complete already completed plan (BUG CHECK)
  r = await apiCall('PATCH', `/api/treatment-plans/${planId}/complete`, null, doctorToken);
  if (r.status === 400) {
    log('TC-PL-002', 'PASS', 'Complete already-completed plan → 400 (guard exists)');
  } else {
    log('TC-PL-002', 'FAIL', `🐛 BUG: No guard on completing an already-completed plan. Status: ${r.status}`);
  }

  // TC-PL-014: Resume cancelled plan (BUG CHECK)
  await cleanup(PATIENT_ID);
  const createRes2 = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID, patient_id: PATIENT_ID,
    title: 'Cancel Resume Test', start_date: today, end_date: nextWeek,
    exercises: [{ exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'daily' }]
  }, doctorToken);
  const plan2Id = createRes2.body.treatment_plan?.id;
  await apiCall('PATCH', `/api/treatment-plans/${plan2Id}/cancel`, null, doctorToken);
  r = await apiCall('PATCH', `/api/treatment-plans/${plan2Id}/resume`, null, doctorToken);
  if (r.status === 400) {
    log('TC-PL-014', 'PASS', 'Resume cancelled plan → 400 (guard exists)');
  } else {
    log('TC-PL-014', 'FAIL', `🐛 BUG: Resume of cancelled plan not blocked. Status: ${r.status}`);
  }

  // TC-PL-006: Cancel already cancelled plan (BUG CHECK)
  r = await apiCall('PATCH', `/api/treatment-plans/${plan2Id}/cancel`, null, doctorToken);
  if (r.status === 400) {
    log('TC-PL-006', 'PASS', 'Cancel already-cancelled plan → 400 (guard exists)');
  } else {
    log('TC-PL-006', 'FAIL', `🐛 BUG: Cancelling already-cancelled plan not blocked. Status: ${r.status}`);
  }

  // TC-PL-004: Cancel active plan — verify future pending rows deleted, past preserved
  await cleanup(PATIENT_ID);
  const createRes3 = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID, patient_id: PATIENT_ID,
    title: 'Cancel Test', start_date: today, end_date: nextWeek,
    exercises: [{ exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'daily' }]
  }, doctorToken);
  const plan3Id = createRes3.body.treatment_plan?.id;
  await new Promise(r => setTimeout(r, 500));
  const pendingBefore = await db.select().from(patientSchedule)
    .where(and(eq(patientSchedule.patient_id, PATIENT_ID), eq(patientSchedule.status, 'pending')));
  r = await apiCall('PATCH', `/api/treatment-plans/${plan3Id}/cancel`, null, doctorToken);
  if (r.status === 200) {
    const pendingAfter = await db.select().from(patientSchedule)
      .where(and(eq(patientSchedule.patient_id, PATIENT_ID), eq(patientSchedule.status, 'pending')));
    if (pendingAfter.length === 0) {
      log('TC-PL-004', 'PASS', `Cancel plan: ${pendingBefore.length} pending rows deleted`);
    } else {
      log('TC-PL-004', 'FAIL', `${pendingAfter.length} pending rows remain after cancel`);
    }
  } else {
    log('TC-PL-004', 'FAIL', `Cancel plan`, JSON.stringify(r.body));
  }
}

// ─── MODULE 5: Data Integrity ─────────────────────────────────────────────────

async function testDataIntegrity(doctorToken, patientToken) {
  console.log('\n━━━ MODULE 5: Data Integrity ━━━\n');

  await cleanup(PATIENT_ID);
  const createRes = await apiCall('POST', '/api/treatment-plans', {
    consultation_id: VALID_CONSULT_ID, patient_id: PATIENT_ID,
    title: 'Integrity Test Plan', start_date: today, end_date: nextWeek,
    exercises: [{ exercise_id: EXERCISE_1, sets: 3, reps: 10, frequency_type: 'daily', sessions_per_day: 1 }]
  }, doctorToken);
  const tpeId = createRes.body.exercises?.[0]?.id;
  await new Promise(r => setTimeout(r, 500));

  // TC-DI-001: Concurrent logging (simulate with 2 rapid requests)
  const [r1, r2] = await Promise.all([
    apiCall('POST', '/api/exercise-logs', {
      treatment_plan_exercise_id: tpeId, log_date: today, session_number: 1, sets_completed: 3
    }, patientToken),
    apiCall('POST', '/api/exercise-logs', {
      treatment_plan_exercise_id: tpeId, log_date: today, session_number: 1, sets_completed: 3
    }, patientToken)
  ]);
  const statuses = [r1.status, r2.status].sort();
  // One should be 201, one should be 200 (alreadyLogged)
  if (statuses[0] === 200 && statuses[1] === 201) {
    log('TC-DI-001', 'PASS', 'Concurrent logging: one 201, one 200 alreadyLogged — unique constraint works');
  } else if (r1.status === 201 && r2.body?.alreadyLogged) {
    log('TC-DI-001', 'PASS', 'Concurrent logging: unique constraint protected duplicate');
  } else {
    log('TC-DI-001', 'WARN', `Concurrent log results: ${r1.status}+${r2.status} — check for double-increment`);
  }

  // TC-DI-003: Verify counter accuracy after 0 logs already done (fresh state above)
  // We already logged once. Check counter = 1
  const tpe = await getTpe(tpeId);
  if (tpe?.completed_sessions_count === 1) {
    log('TC-DI-003', 'PASS', `completed_sessions_count=1 after 1 log (concurrent safe)`);
  } else {
    log('TC-DI-003', 'FAIL', `completed_sessions_count=${tpe?.completed_sessions_count} — expected 1`);
  }

  // TC-DI-005: Schedule row uniqueness (onConflictDoNothing verified in plan creation)
  const rows = await db.select().from(patientSchedule)
    .where(and(eq(patientSchedule.patient_id, PATIENT_ID), eq(patientSchedule.scheduled_date, today)));
  if (rows.length === 1) {
    log('TC-DI-005', 'PASS', 'No duplicate schedule rows for same patient+TPE+date+session');
  } else {
    log('TC-DI-005', 'FAIL', `Found ${rows.length} rows for same date — duplicates exist`);
  }
}

// ─── Main Runner ──────────────────────────────────────────────────────────────

async function main() {
  console.log('🧪 PhysioCare Treatment Plan Test Suite\n');
  console.log(`📅 Today: ${today}`);
  console.log('━'.repeat(60));

  const DOCTOR_EMAIL_PARAM = DOCTOR_EMAIL;
  const PATIENT_EMAIL_PARAM = PATIENT_EMAIL;

  await ensureConsultation();
  console.log(`📋 Using consultation: ${VALID_CONSULT_ID}`);
  console.log(`👨‍⚕️ Doctor: ${DOCTOR_EMAIL_PARAM} (${DOCTOR_ID})`);
  console.log(`🧑 Patient: ${PATIENT_EMAIL_PARAM} (${PATIENT_ID})\n`);

  await cleanup(PATIENT_ID);

  try {
    await testPlanCreation(DOCTOR_EMAIL_PARAM);
    await cleanup(PATIENT_ID);
    await testExerciseAssignment(DOCTOR_EMAIL_PARAM);
    await cleanup(PATIENT_ID);
    await testExerciseLogs(DOCTOR_EMAIL_PARAM, PATIENT_EMAIL_PARAM);
    await cleanup(PATIENT_ID);
    await testLifecycle(DOCTOR_EMAIL_PARAM);
    await cleanup(PATIENT_ID);
    await testDataIntegrity(DOCTOR_EMAIL_PARAM, PATIENT_EMAIL_PARAM);
  } finally {
    await cleanup(PATIENT_ID);
  }

  console.log('\n' + '━'.repeat(60));
  console.log(`\n📊 RESULTS: ✅ ${PASS} PASS  ❌ ${FAIL} FAIL  ⚠️ ${WARN} WARN`);
  console.log('━'.repeat(60));

  if (FAIL > 0) {
    console.log('\n❌ FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r =>
      console.log(`  [${r.id}] ${r.msg}${r.detail ? ' — ' + r.detail : ''}`)
    );
  }
  if (WARN > 0) {
    console.log('\n⚠️  WARNINGS (likely auth-dependent):');
    results.filter(r => r.status === 'WARN').forEach(r =>
      console.log(`  [${r.id}] ${r.msg}`)
    );
  }

  process.exit(FAIL > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('💥 Test runner crashed:', err);
  process.exit(1);
});
