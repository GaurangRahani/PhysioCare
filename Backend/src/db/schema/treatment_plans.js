import {
  pgTable,
  uuid,
  varchar,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { consultations } from "./consultations.js";

export const planStatusEnum = pgEnum("plan_status", [
  "active",
  "completed",
  "cancelled",
  "paused",
]);

export const treatmentPlans = pgTable("treatment_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  patient_id: uuid("patient_id")
    .references(() => users.id)
    .notNull(),
  doctor_id: uuid("doctor_id")
    .references(() => users.id)
    .notNull(),
  consultation_id: uuid("consultation_id")
    .references(() => consultations.id)
    .notNull()
    .unique(),
  title: varchar("title"),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  status: planStatusEnum("status").default("active").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
