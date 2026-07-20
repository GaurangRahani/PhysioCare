import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  date,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.js"; // Import the users table for the Foreign Key

export const patientStatusEnum = pgEnum("status", [
  "active",
  "inactive",
  "discharged",
]);

export const patientProfiles = pgTable("patient_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  date_of_birth: date("date_of_birth"),
  gender: varchar("gender"),
  address: text("address"),
  emergency_contact_name: varchar("emergency_contact_name"),
  emergency_contact_phone: varchar("emergency_contact_phone"),
  medical_history: text("medical_history"),
  status: patientStatusEnum("status").default("active").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
