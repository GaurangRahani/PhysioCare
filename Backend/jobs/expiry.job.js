import { db } from '../src/db/index.js';
import { appointments, patientSchedule } from '../src/db/schema/index.js';
import { eq, and, lt } from 'drizzle-orm';
import cron from 'node-cron';


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
            const today = new Date().toISOString().split('T')[0];

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
