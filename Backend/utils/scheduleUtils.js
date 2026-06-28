// ─── Bitmask Day Encoding ─────────────────────────────────────────────────────
export const DAY_BITS = { Mon: 1, Tue: 2, Wed: 4, Thu: 8, Fri: 16, Sat: 32, Sun: 64 };
// Index = getDay() (0=Sun, 1=Mon, ..., 6=Sat)
export const DOW_TO_BIT = [64, 1, 2, 4, 8, 16, 32];

/**
 * Encode an array of day name strings to a bitmask integer.
 * e.g. ['Mon', 'Wed', 'Fri'] → 21
 */
export function encodeDays(dayNames) {
    return dayNames.reduce((acc, d) => acc | (DAY_BITS[d] ?? 0), 0);
}

/**
 * Check if a treatment_plan_exercise is due on a given date.
 * Works with all frequency_type values.
 */
export function isDueOnDate(tpe, date) {
    const dow = date.getDay();
    const bit = DOW_TO_BIT[dow];

    switch (tpe.frequency_type) {
        case 'daily':
            return true;

        case 'alternate_days': {
            // Day 0 (start_date) is always due. Day 1 is not. Day 2 is. etc.
            const startMs = new Date(tpe.start_date).setHours(0, 0, 0, 0);
            const curMs = new Date(date).setHours(0, 0, 0, 0);
            const dayNum = Math.round((curMs - startMs) / 86400000);
            return dayNum % 2 === 0;
        }

        case 'mon_wed_fri':
            // Mon=1, Wed=4, Fri=16 → bitmask 21
            return (21 & bit) > 0;

        case 'tue_thu_sat':
            // Tue=2, Thu=8, Sat=32 → bitmask 42
            return (42 & bit) > 0;

        case 'custom_days':
            return ((tpe.frequency_days ?? 0) & bit) > 0;

        default:
            return false;
    }
}


export function calculateExpectedSessions(tpe) {
    let count = 0;
    // Use UTC midnight so timezone shifts don't cause off-by-one errors
    let current = new Date(tpe.start_date + 'T00:00:00Z');
    const end = new Date(tpe.end_date + 'T00:00:00Z');

    while (current <= end) {
        if (isDueOnDate(tpe, current)) count++;
        current.setUTCDate(current.getUTCDate() + 1);
    }

    return count * (tpe.sessions_per_day ?? 1);
}

/**
 * Generate all individual schedule rows for a treatment_plan_exercise.
 * Returns an array ready to be bulk-inserted into patient_schedule.
 */
export function generateScheduleRows(tpe) {
    const rows = [];
    let current = new Date(tpe.start_date + 'T00:00:00Z');
    const end = new Date(tpe.end_date + 'T00:00:00Z');

    while (current <= end) {
        if (isDueOnDate(tpe, current)) {
            const dateStr = current.toISOString().split('T')[0];
            for (let session = 1; session <= (tpe.sessions_per_day ?? 1); session++) {
                rows.push({
                    treatment_plan_exercise_id: tpe.id,
                    patient_id: tpe.patient_id,
                    exercise_id: tpe.exercise_id,
                    scheduled_date: dateStr,
                    session_number: session,
                    status: 'pending'
                });
            }
        }
        current.setUTCDate(current.getUTCDate() + 1);
    }

    return rows;
}
