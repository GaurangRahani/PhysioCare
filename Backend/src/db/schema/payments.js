import {
  pgTable,
  uuid,
  varchar,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { invoices } from "./invoices.js";

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "upi",
  "bank_transfer",
  "online",
]);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoice_id: uuid("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  payment_method: paymentMethodEnum("payment_method").notNull(),
  payment_date: timestamp("payment_date", { withTimezone: true })
    .defaultNow()
    .notNull(),
  // Only stored on confirmed online payments — this proves money landed
  razorpay_payment_id: varchar("razorpay_payment_id"),
  // Cash receipt number / UPI reference / last 4 digits of card
  transaction_reference: varchar("transaction_reference"),
  recorded_by: uuid("recorded_by")
    .references(() => users.id)
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
