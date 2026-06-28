import { pgTable, uuid, varchar, numeric, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { appointments } from "./appointments.js";

// Invoice is always created AT THE TIME of payment — never before.
// Think of it as the official numbered receipt, not a "bill to be paid later".
export const invoiceStatusEnum = pgEnum("invoice_status", [
    "paid",        // Created and paid in one transaction (the normal case)
    "refunded",    // Patient cancelled after paying — money returned
    "cancelled"    // Appointment cancelled before payment was ever collected
]);

export const invoices = pgTable("invoices", {
    id: uuid("id").defaultRandom().primaryKey(),
    patient_id: uuid("patient_id").references(() => users.id).notNull(),
    appointment_id: uuid("appointment_id").references(() => appointments.id),

    // Sequential receipt number for accounting and GST compliance e.g. "INV-2026-0042"
    invoice_number: varchar("invoice_number").notNull().unique(),

    description: text("description"),                                 // "Physiotherapy consultation — 1 hour"
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(), // Total amount charged (mirrors payments.amount — intentional 1:1)

    status: invoiceStatusEnum("status").default("paid").notNull(),    // Default "paid" — created only when payment lands

    issued_by: uuid("issued_by").references(() => users.id).notNull(), // Receptionist who issued it
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});