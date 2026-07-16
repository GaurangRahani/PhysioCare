import { pgTable, uuid, integer, date, text, timestamp, pgEnum, unique, boolean } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { treatmentPlanExercises } from "./treatment_plan_exercises.js";

export const issueTypeEnum = pgEnum("issue_type", ["increased_pain", "exercise_difficulty", "new_symptom", "general_concern"]);

export const exerciseLogs = pgTable("exercise_logs", {
    id: uuid("id").defaultRandom().primaryKey(),
    treatment_plan_exercise_id: uuid("treatment_plan_exercise_id").references(() => treatmentPlanExercises.id),
    patient_id: uuid("patient_id").references(() => users.id).notNull(),
    log_date: date("log_date").notNull(),
    session_number: integer("session_number"),
    sets_completed: integer("sets_completed"),
    pain_level: integer("pain_level"),
    comments: text("comments"),
    issue_type: issueTypeEnum("issue_type"),
    is_skipped: boolean("is_skipped").default(false).notNull(),
    attachment_urls: text("attachment_urls").array(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
    // This enforces your multi-column unique constraint
    uniqueLog: unique().on(table.patient_id, table.treatment_plan_exercise_id, table.log_date, table.session_number)
}));