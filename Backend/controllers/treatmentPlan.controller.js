import { db } from '../src/db/index.js';
import {
    treatmentPlans,
    consultations,
    patientSchedule,
    treatmentPlanExercises,
    exercises,
} from '../src/db/schema/index.js';
import { eq, and, gte, inArray } from 'drizzle-orm';
import {
    calculateExpectedSessions,
    generateScheduleRows,
    encodeDays,
} from '../utils/scheduleUtils.js';

// ─── Background job: generate patient_schedule rows
async function generateSchedule(tpeId) {
    try {
        const [tpe] = await db
            .select({
                id: treatmentPlanExercises.id,
                exercise_id: treatmentPlanExercises.exercise_id,
                frequency_type: treatmentPlanExercises.frequency_type,
                frequency_days: treatmentPlanExercises.frequency_days,
                start_date: treatmentPlanExercises.start_date,
                end_date: treatmentPlanExercises.end_date,
                sessions_per_day: treatmentPlanExercises.sessions_per_day,
                patient_id: treatmentPlans.patient_id,
            })
            .from(treatmentPlanExercises)
            .innerJoin(treatmentPlans, eq(treatmentPlanExercises.treatment_plan_id, treatmentPlans.id))
            .where(eq(treatmentPlanExercises.id, tpeId));

        if (!tpe) {
            console.error(`[generateSchedule] TPE not found: ${tpeId}`);
            return;
        }

        const rows = generateScheduleRows(tpe);
        if (rows.length === 0) {
            console.log(`[generateSchedule] No schedule rows for TPE: ${tpeId}`);
            return;
        }

        await db.insert(patientSchedule).values(rows).onConflictDoNothing();
        console.log(`[generateSchedule] ✅ Inserted ${rows.length} schedule rows for TPE: ${tpeId}`);
    } catch (err) {
        console.error(`[generateSchedule] Error for TPE ${tpeId}:`, err);
    }
}

// create plan (with bulk exercises)
export const createTreatmentPlan = async (req, res) => {
    try {
        const { consultation_id, patient_id, title, start_date, end_date, exercises: exercisesArray } = req.body;

        // Verify consultation exists and belongs to the patient
        const [consultation] = await db.select().from(consultations).where(eq(consultations.id, consultation_id));
        if (!consultation) {
            return res.status(404).json({ success: false, message: 'Consultation not found' });
        }
        if (consultation.patient_id !== patient_id) {
            return res.status(400).json({ success: false, message: 'Consultation does not belong to this patient' });
        }

        if (end_date <= start_date) {
            return res.status(400).json({ success: false, message: 'end_date must be after start_date.' });
        }

        // Check for existing ACTIVE plans for this patient
        const activePlans = await db.select()
            .from(treatmentPlans)
            .where(and(eq(treatmentPlans.patient_id, patient_id), eq(treatmentPlans.status, 'active')));

        if (activePlans.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Patient has an active plan from ${activePlans[0].start_date}. Do you want to complete it before starting this one?`,
                active_plan_id: activePlans[0].id
            });
        }

        let newPlanData = null;
        let insertedTPEs = [];

        await db.transaction(async (tx) => {
            const [newPlan] = await tx.insert(treatmentPlans).values({
                patient_id,
                doctor_id: req.user.id,
                consultation_id,
                title,
                start_date,
                end_date,
                status: 'active'
            }).returning();

            newPlanData = newPlan;

            if (exercisesArray && Array.isArray(exercisesArray) && exercisesArray.length > 0) {
                const exercisesToInsert = [];

                for (let ex of exercisesArray) {
                    let {
                        exercise_id,
                        sets,
                        reps,
                        sessions_per_day = 1,
                        frequency_type,
                        frequency_days,
                        start_date: ex_start_date,
                        end_date: ex_end_date,
                        notes
                    } = ex;

                    // Default to plan dates if not provided
                    const final_start_date = ex_start_date || start_date;
                    const final_end_date = ex_end_date || end_date;

                    // Encode frequency days
                    let encodedFrequencyDays = null;
                    if (frequency_type === 'custom_days') {
                        if (!frequency_days) throw new Error('frequency_days is required when frequency_type is custom_days.');
                        encodedFrequencyDays = Array.isArray(frequency_days) ? encodeDays(frequency_days) : parseInt(frequency_days, 10);
                        if (!encodedFrequencyDays || encodedFrequencyDays <= 0) throw new Error('frequency_days must select at least one valid day.');
                    } else if (frequency_type === 'mon_wed_fri') {
                        encodedFrequencyDays = 21;
                    } else if (frequency_type === 'tue_thu_sat') {
                        encodedFrequencyDays = 42;
                    }

                    // Pre-calculate expected sessions
                    const tempTpe = { frequency_type, frequency_days: encodedFrequencyDays, start_date: final_start_date, end_date: final_end_date, sessions_per_day };
                    const expected_sessions_count = calculateExpectedSessions(tempTpe);

                    if (expected_sessions_count === 0) {
                        throw new Error(`Exercise ${exercise_id} has 0 expected sessions with the selected date range and frequency.`);
                    }

                    exercisesToInsert.push({
                        treatment_plan_id: newPlan.id,
                        exercise_id,
                        sets,
                        reps,
                        sessions_per_day,
                        frequency_type,
                        frequency_days: encodedFrequencyDays,
                        start_date: final_start_date,
                        end_date: final_end_date,
                        expected_sessions_count,
                        notes,
                    });
                }
                
                // Bulk insert all exercises attached to this plan
                insertedTPEs = await tx.insert(treatmentPlanExercises).values(exercisesToInsert).returning();
            }
        });

        // Generate schedule for all inserted exercises in background (Fire-and-forget)
        if (insertedTPEs.length > 0) {
            insertedTPEs.forEach(tpe => {
                generateSchedule(tpe.id);
            });
        }

        return res.status(201).json({ 
            success: true, 
            message: insertedTPEs.length > 0 ? `Treatment plan created with ${insertedTPEs.length} exercises.` : 'Treatment plan created successfully without exercises.', 
            treatment_plan: newPlanData,
            exercises: insertedTPEs
        });

    } catch (error) {
        if (error.message && (error.message.includes('frequency_days') || error.message.includes('expected sessions'))) {
             return res.status(400).json({ success: false, message: error.message });
        }
        const isDuplicate = error.code === '23505' ||
            (error.cause && error.cause.code === '23505') ||
            (error.message && error.message.includes('unique constraint'));

        if (isDuplicate) {
            return res.status(409).json({ success: false, message: 'A treatment plan already exists for this consultation.' });
        }
        console.error('Error creating treatment plan:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

//mark as complete
export const completeTreatmentPlan = async (req, res) => {
    try {
        const { id } = req.params;

        const [plan] = await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, id));
        if (!plan) return res.status(404).json({ success: false, message: 'Treatment plan not found' });

        const [updatedPlan] = await db.update(treatmentPlans)
            .set({ status: 'completed', updated_at: new Date() })
            .where(eq(treatmentPlans.id, id))
            .returning();

        return res.status(200).json({ success: true, message: 'Treatment plan marked as completed', treatment_plan: updatedPlan });
    } catch (error) {
        console.error('Error completing treatment plan:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

//canncel plan
export const cancelTreatmentPlan = async (req, res) => {
    try {
        const { id } = req.params;

        const [plan] = await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, id));
        if (!plan) return res.status(404).json({ success: false, message: 'Treatment plan not found' });

        await db.transaction(async (tx) => {
            await tx.update(treatmentPlans)
                .set({ status: 'cancelled', updated_at: new Date() })
                .where(eq(treatmentPlans.id, id));

            // Find all TPE IDs for this plan then delete their future schedule rows
            const planExercises = await tx.select({ id: treatmentPlanExercises.id })
                .from(treatmentPlanExercises)
                .where(eq(treatmentPlanExercises.treatment_plan_id, id));

            const exerciseIds = planExercises.map(pe => pe.id);
            if (exerciseIds.length > 0) {
                const today = new Date().toISOString().split('T')[0];
                await tx.delete(patientSchedule)
                    .where(
                        and(
                            inArray(patientSchedule.treatment_plan_exercise_id, exerciseIds),
                            eq(patientSchedule.status, 'pending'),
                            gte(patientSchedule.scheduled_date, today)
                        )
                    );
            }
        });

        return res.status(200).json({ success: true, message: 'Treatment plan cancelled. Future scheduled exercises have been cleared.' });
    } catch (error) {
        console.error('Error cancelling treatment plan:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};



//update added exercise
export const updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        let { sets, reps, sessions_per_day, frequency_type, frequency_days, end_date, notes } = req.body;

        const [oldTPE] = await db.select().from(treatmentPlanExercises).where(eq(treatmentPlanExercises.id, id));
        if (!oldTPE) return res.status(404).json({ success: false, message: 'Assignment not found' });
        if (!oldTPE.is_active) return res.status(400).json({ success: false, message: 'This assignment has already been deactivated.' });

        const [plan] = await db.select().from(treatmentPlans).where(eq(treatmentPlans.id, oldTPE.treatment_plan_id));
        if (end_date && end_date > plan.end_date) {
            return res.status(400).json({
                success: false,
                message: `end_date (${end_date}) cannot be after the plan's end date (${plan.end_date}).`
            });
        }

        // Encode days
        const resolvedFrequencyType = frequency_type ?? oldTPE.frequency_type;
        let encodedFrequencyDays = oldTPE.frequency_days;

        if (frequency_type === 'custom_days') {
            if (!frequency_days) return res.status(400).json({ success: false, message: 'frequency_days required for custom_days.' });
            encodedFrequencyDays = Array.isArray(frequency_days) ? encodeDays(frequency_days) : parseInt(frequency_days, 10);
        } else if (frequency_type === 'mon_wed_fri') {
            encodedFrequencyDays = 21;
        } else if (frequency_type === 'tue_thu_sat') {
            encodedFrequencyDays = 42;
        } else if (frequency_type && ['daily', 'alternate_days'].includes(frequency_type)) {
            encodedFrequencyDays = null;
        }

        // New row always starts from today
        const today = new Date().toISOString().split('T')[0];
        const newEndDate = end_date ?? oldTPE.end_date;

        const tempTpe = {
            frequency_type: resolvedFrequencyType,
            frequency_days: encodedFrequencyDays,
            start_date: today,
            end_date: newEndDate,
            sessions_per_day: sessions_per_day ?? oldTPE.sessions_per_day,
        };
        const expected_sessions_count = calculateExpectedSessions(tempTpe);

        if (expected_sessions_count === 0) {
            return res.status(400).json({ success: false, message: 'No future sessions would be scheduled with these new settings.' });
        }

        let newTPE;
        await db.transaction(async (tx) => {
            await tx.update(treatmentPlanExercises)
                .set({ is_active: false, updated_at: new Date() })
                .where(eq(treatmentPlanExercises.id, id));

            await tx.delete(patientSchedule)
                .where(and(
                    eq(patientSchedule.treatment_plan_exercise_id, id),
                    eq(patientSchedule.status, 'pending'),
                    gte(patientSchedule.scheduled_date, today)
                ));

            const [inserted] = await tx.insert(treatmentPlanExercises).values({
                treatment_plan_id: oldTPE.treatment_plan_id,
                exercise_id: oldTPE.exercise_id,
                sets: sets ?? oldTPE.sets,
                reps: reps ?? oldTPE.reps,
                sessions_per_day: sessions_per_day ?? oldTPE.sessions_per_day,
                frequency_type: resolvedFrequencyType,
                frequency_days: encodedFrequencyDays,
                start_date: today,
                end_date: newEndDate,
                expected_sessions_count,
                completed_sessions_count: 0,
                notes: notes ?? oldTPE.notes,
            }).returning();
            newTPE = inserted;
        });

        generateSchedule(newTPE.id);

        return res.status(200).json({
            success: true,
            message: `Assignment updated. History under old assignment (${id}) is preserved. ${expected_sessions_count} new sessions scheduled from today.`,
            old_assignment_id: id,
            new_assignment: newTPE,
        });

    } catch (error) {
        console.error('Error updating assignment:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// deleete exercise from plan
export const deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;

        const [tpe] = await db.select().from(treatmentPlanExercises).where(eq(treatmentPlanExercises.id, id));
        if (!tpe) return res.status(404).json({ success: false, message: 'Assignment not found' });
        if (!tpe.is_active) return res.status(400).json({ success: false, message: 'Assignment is already inactive.' });

        const today = new Date().toISOString().split('T')[0];

        await db.transaction(async (tx) => {
            await tx.update(treatmentPlanExercises)
                .set({ is_active: false, updated_at: new Date() })
                .where(eq(treatmentPlanExercises.id, id));

            await tx.delete(patientSchedule)
                .where(and(
                    eq(patientSchedule.treatment_plan_exercise_id, id),
                    eq(patientSchedule.status, 'pending'),
                    gte(patientSchedule.scheduled_date, today)
                ));
        });

        return res.status(200).json({
            success: true,
            message: 'Exercise removed from plan. Past history is preserved. Future sessions cancelled.'
        });

    } catch (error) {
        console.error('Error deleting assignment:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
