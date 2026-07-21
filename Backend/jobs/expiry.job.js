import { db } from '../src/db/index.js';
import { appointments, patientSchedule } from '../src/db/schema/index.js';
import { eq, and, lt } from 'drizzle-orm';
import cron from 'node-cron';
import { localToday } from '../utils/scheduleUtils.js';


// Cancels all pending_payment appointments past their expiry window
export const startExpiryJob = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const expired = await db.update(appointments)
                .set({
                    status: 'cancelled',
                    payment_status: 'failed',
                    updated_at: new Date()
                })
                .where(
                    and(
                        eq(appointments.status, 'pending_payment'),
                        lt(appointments.payment_expires_at, new Date())
                    )
                )
                .returning();

            if (expired.length > 0) {
                console.log(`[Expiry Job] Cancelled ${expired.length} unpaid appointment(s). Slots freed.`);
            }
        } catch (error) {
            console.error('[Expiry Job] Error during sweep:', error);
        }
    });

    console.log('✅ Appointment expiry cron job started (runs every minute)');
};


// Marks all pending patient_schedule rows with a past date as 'missed'
// This is the nightly sweep that ensures patients are held accountable
export const startMissedScheduleSweep = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            const today = localToday();

            const missed = await db.update(patientSchedule)
                .set({ status: 'missed' })
                .where(
                    and(
                        eq(patientSchedule.status, 'pending'),
                        lt(patientSchedule.scheduled_date, today)
                    )
                )
                .returning();

            if (missed.length > 0) {
                console.log(`[Missed Sweep] Marked ${missed.length} session(s) as missed.`);
            }
        } catch (error) {
            console.error('[Missed Sweep] Error:', error);
        }
    });

    console.log('✅ Missed exercise sweep cron job started (runs daily at midnight)');
};

// Marks all scheduled appointments that have passed as 'no_show'
export const startNoShowSweep = () => {
    cron.schedule('0 0 * * *', async () => {
        try {
            const today = localToday();

            // In SQLite/Postgres with Drizzle, comparing date strings is tricky across timezones.
            // A simple approach is fetching 'scheduled' appointments from today or earlier,
            // then filtering them in memory based on actual JS date objects, and updating.
            const scheduledAppts = await db.select()
                .from(appointments)
                .where(
                    and(
                        eq(appointments.status, 'scheduled'),
                        // We only care about today or older
                        lt(appointments.appointment_date, new Date(Date.now() + 86400000).toISOString().split('T')[0]) 
                    )
                );

            const now = new Date();
            const toUpdate = scheduledAppts.filter(appt => {
                const apptDateTime = new Date(`${appt.appointment_date}T${appt.start_time}`);
                return apptDateTime < now;
            });

            if (toUpdate.length > 0) {
                const ids = toUpdate.map(a => a.id);
                // Update in batches or using IN clause if supported, but loop is fine for cron
                for (const id of ids) {
                    await db.update(appointments)
                        .set({ status: 'no_show', updated_at: new Date() })
                        .where(eq(appointments.id, id));
                }
                console.log(`[No-Show Sweep] Marked ${toUpdate.length} passed appointment(s) as no_show.`);
            }
        } catch (error) {
            console.error('[No-Show Sweep] Error:', error);
        }
    });

    console.log('✅ No-Show sweep cron job started (runs daily at midnight)');
};
