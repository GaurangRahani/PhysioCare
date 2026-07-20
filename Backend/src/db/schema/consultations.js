import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { appointments } from "./appointments.js";
import { treatmentPlans } from "./treatment_plans.js";

export const consultationTypeEnum = pgEnum("consultation_type", [
  "initial",
  "follow_up",
]);

export const consultations = pgTable("consultations", {
  id: uuid("id").defaultRandom().primaryKey(),
  appointment_id: uuid("appointment_id")
    .references(() => appointments.id)
    .unique(),
  patient_id: uuid("patient_id")
    .references(() => users.id)
    .notNull(),
  doctor_id: uuid("doctor_id")
    .references(() => users.id)
    .notNull(),
  diagnosis: text("diagnosis"),
  clinical_notes: text("clinical_notes"),
  treatment_recommendations: text("treatment_recommendations"),
  consultation_type: consultationTypeEnum("consultation_type")
    .default("initial")
    .notNull(),
  previous_treatment_plan_id: uuid("previous_treatment_plan_id").references(
    () => treatmentPlans.id,
  ), // nullable
  consultation_date: timestamp("consultation_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
