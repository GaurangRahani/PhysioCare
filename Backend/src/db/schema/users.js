import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

// Define and export enums so other files can use them
export const roleEnum = pgEnum("role", [
  "admin",
  "patient",
  "receptionist",
  "doctor",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerk_id: varchar("clerk_id").notNull().unique(),
  role: roleEnum("role").notNull(),
  name: varchar("name").notNull(),
  phone: varchar("phone").unique(),
  email: varchar("email").unique(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  is_active: boolean("is_active").default(true).notNull(),
  must_change_password: boolean("must_change_password")
    .default(false)
    .notNull(),
});
