import { pgTable, uuid, integer, smallint, date, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { treatmentPlans } from "./treatment_plans.js";
import { exercises } from "./exercises.js";

export const frequencyEnum = pgEnum("frequency_type", ["daily", "alternate_days", "mon_wed_fri", "tue_thu_sat", "custom_days"]);

export const treatmentPlanExercises = pgTable("treatment_plan_exercises", {
    id: uuid("id").defaultRandom().primaryKey(),
    treatment_plan_id: uuid("treatment_plan_id").references(() => treatmentPlans.id).notNull(),
    exercise_id: uuid("exercise_id").references(() => exercises.id).notNull(),
    sets: integer("sets").notNull(),
    reps: integer("reps").notNull(),
    sessions_per_day: integer("sessions_per_day").default(1).notNull(),
    frequency_type: frequencyEnum("frequency_type").notNull(),
    frequency_days: smallint("frequency_days"),
    start_date: date("start_date").notNull(),
    end_date: date("end_date").notNull(),
    expected_sessions_count: integer("expected_sessions_count").default(0).notNull(),
    completed_sessions_count: integer("completed_sessions_count").default(0).notNull(),
    notes: text("notes"),
    is_active: boolean("is_active").default(true).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});