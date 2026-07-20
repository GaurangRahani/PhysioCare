import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  date,
  time,
} from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "pending_payment", // Booking exists but payment not yet confirmed (phone booking / online self-booking)
  "scheduled", // Payment confirmed — appointment is real and shows on doctor's calendar
  "completed",
  "cancelled",
  "no_show",
  "blocked", // Receptionist blocked a slot (no patient, no payment needed)
]);

// Tracks WHY the payment state is what it is — separate from appointment status
export const appointmentPaymentStatusEnum = pgEnum(
  "appointment_payment_status",
  [
    "pending", // Awaiting payment (phone booking with link sent)
    "paid_at_desk", // Receptionist collected cash/card physically
    "paid_online", // Razorpay confirmed via webhook
    "failed", // Payment expired or failed
  ],
);

export const appointments = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  patient_id: uuid("patient_id").references(() => users.id), // Nullable — receptionist can block a slot with no patient
  doctor_id: uuid("doctor_id")
    .references(() => users.id)
    .notNull(),
  appointment_date: date("appointment_date").notNull(), // e.g. "2026-08-15"
  start_time: time("start_time").notNull(), // e.g. "10:30:00"
  visit_reason: varchar("visit_reason"),
  notes: varchar("notes", { length: 1000 }), // Receptionist or doctor notes

  // Two-layer status system:
  // status = what the rest of the app treats this appointment as (simple)
  // payment_status = the detailed financial reason behind the status (detailed)
  status: appointmentStatusEnum("status").default("pending_payment").notNull(),
  payment_status: appointmentPaymentStatusEnum("payment_status")
    .default("pending")
    .notNull(),

  // Set for phone-booking (now + 30 min) and online self-booking (now + 15 min)
  // NULL for at-desk bookings (paid immediately, no hold window needed)
  payment_expires_at: timestamp("payment_expires_at", { withTimezone: true }),

  // Razorpay pre-payment tracking (lives here, not on payments table)
  // razorpay_order_id: for patient self-booking (Razorpay checkout flow)
  // razorpay_link_id: for phone booking (Razorpay payment link flow)
  // These track the ATTEMPT — the webhook uses them to find this appointment
  razorpay_order_id: varchar("razorpay_order_id"),
  razorpay_link_id: varchar("razorpay_link_id"),

  created_by: uuid("created_by")
    .references(() => users.id)
    .notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),

  // NOTE: The double-booking constraint is a PARTIAL UNIQUE INDEX applied via raw SQL
  // (see below). It is NOT a Drizzle .unique() call because Drizzle cannot express
  // a WHERE clause on a unique index. The partial index only enforces uniqueness on
  // ACTIVE bookings, allowing cancelled slots to be re-booked.
  //
  // Run this once after drizzle-kit push:
  // CREATE UNIQUE INDEX unique_active_booking
  // ON appointments (doctor_id, appointment_date, start_time)
  // WHERE status NOT IN ('cancelled', 'no_show');
});
