import { pgTable, uuid, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const doctorProfiles = pgTable("doctor_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  specialization: varchar("specialization"),
  qualification: varchar("qualification"),
  // The Master JSON object storing the entire availability blueprint
  // weekly_routine: { "1": [{start:"09:00",end:"12:00"}], "2": [...] }  (key = day_of_week 0-6)
  // specific_dates: { "2026-06-25": [] }  (empty array = leave/closed)
  availability_rules: jsonb("availability_rules")
    .default({
      slot_minutes: 30,
      weekly_routine: {},
      specific_dates: {},
    })
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
