import { pgTable, uuid, integer, date, timestamp, pgEnum, unique } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { exercises } from "./exercises.js";
import { treatmentPlanExercises } from "./treatment_plan_exercises.js";

export const scheduleStatusEnum = pgEnum("schedule_status", ["pending", "completed", "missed"]);

export const patientSchedule = pgTable("patient_schedule", {
    id: uuid("id").defaultRandom().primaryKey(),
    treatment_plan_exercise_id: uuid("treatment_plan_exercise_id").references(() => treatmentPlanExercises.id).notNull(),
    patient_id: uuid("patient_id").references(() => users.id).notNull(),
    exercise_id: uuid("exercise_id").references(() => exercises.id).notNull(),
    scheduled_date: date("scheduled_date").notNull(),
    session_number: integer("session_number").default(1).notNull(),
    status: scheduleStatusEnum("status").default("pending").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
    uniqueSchedule: unique().on(table.patient_id, table.treatment_plan_exercise_id, table.scheduled_date, table.session_number)
}));