import { db } from "../src/db/index.js";
import {
  appointments,
  invoices,
  payments,
  users,
  doctorProfiles,
  consultations,
} from "../src/db/schema/index.js";
import { eq, and, gte, lte, inArray, aliasedTable } from "drizzle-orm";
import Razorpay from "razorpay";
import { sendPaymentLinkEmail } from "../utils/email.js";
import crypto from "crypto";
import { localToday } from "../utils/scheduleUtils.js";

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are missing in .env");
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ─── HELPER: Generate next invoice number ─────────────────────────────────────
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await db.$count(invoices); // Total invoice count
  const seq = String(count + 1).padStart(5, "0");
  return `INV-${year}-${seq}`;
};

// ─── 1. POST /api/appointments/book-at-desk ───────────────────────────────────
export const bookAtDesk = async (req, res) => {
  const {
    patient_id,
    doctor_id,
    appointment_date,
    start_time,
    visit_reason,
    notes,
    payment_method,
    amount,
    transaction_reference,
  } = req.body;

  try {
    const existing = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctor_id, doctor_id),
          eq(appointments.appointment_date, appointment_date),
          eq(appointments.start_time, start_time),
        ),
      );
    const isDoubleBooked = existing.some(
      (a) => !["cancelled", "no_show"].includes(a.status),
    );
    if (isDoubleBooked) {
      return res
        .status(409)
        .json({
          success: false,
          message:
            "This slot is already booked or held. Please choose a different time.",
        });
    }

    const result = await db.transaction(async (tx) => {
      const [newAppointment] = await tx
        .insert(appointments)
        .values({
          patient_id,
          doctor_id,
          appointment_date,
          start_time,
          visit_reason,
          notes,
          status: "scheduled", // Confirmed immediately — patient is present
          payment_status: "paid_at_desk",
          payment_expires_at: null,
          created_by: req.user.id,
        })
        .returning();

      // ── Insert invoice (official receipt) ───────────────────────────
      const invoiceNumber = await generateInvoiceNumber();
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          patient_id,
          appointment_id: newAppointment.id,
          invoice_number: invoiceNumber,
          description: visit_reason || "Physiotherapy consultation",
          amount,
          status: "paid",
          issued_by: req.user.id,
        })
        .returning();

      // ── Insert payment record ───────────────────────────────────────
      const [newPayment] = await tx
        .insert(payments)
        .values({
          invoice_id: newInvoice.id,
          amount,
          payment_method,
          transaction_reference,
          recorded_by: req.user.id,
        })
        .returning();

      return {
        appointment: newAppointment,
        invoice: newInvoice,
        payment: newPayment,
      };
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked and payment recorded successfully",
      ...result,
    });
  } catch (error) {
    // ── Catch PostgreSQL unique violation (slot just got taken) ─────────
    const isDuplicate =
      error.code === "23505" ||
      (error.cause && error.cause.code === "23505") ||
      (error.message && error.message.includes("unique constraint"));

    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message:
          "This slot was just taken by another booking. Please choose a different time.",
      });
    }
    console.error("Error booking at desk:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 2. POST /api/appointments/book-by-phone ──────────────────────────────────
// Receptionist creates appointment for a phone-booking patient.
// Flow: Book slot (pending_payment) → Create Razorpay Payment Link → Email link to patient
export const bookByPhone = async (req, res) => {
  const {
    patient_id,
    doctor_id,
    appointment_date,
    start_time,
    visit_reason,
    notes,
    amount,
  } = req.body;

  try {
    // ── Check for existing active booking ────────────────────────────────
    const existing = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctor_id, doctor_id),
          eq(appointments.appointment_date, appointment_date),
          eq(appointments.start_time, start_time),
        ),
      );
    const isDoubleBooked = existing.some(
      (a) => !["cancelled", "no_show"].includes(a.status),
    );
    if (isDoubleBooked) {
      return res
        .status(409)
        .json({
          success: false,
          message:
            "This slot is already booked or held. Please choose a different time.",
        });
    }

    // ── Hold the slot immediately (20-min window for safety) ─────────────
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        visit_reason,
        notes,
        status: "pending_payment",
        payment_status: "pending",
        payment_expires_at: expiresAt,
        created_by: req.user.id,
      })
      .returning();

    // ── Create Razorpay Payment Link ─────────────────────────────────────
    const razorpay = getRazorpayInstance();
    const paymentLink = await razorpay.paymentLink.create({
      amount: Math.round(amount * 100), // Razorpay works in paise
      currency: "INR",
      description: visit_reason || "PhysioCare Consultation",
      expire_by: Math.floor(expiresAt.getTime() / 1000), // Unix timestamp
      reminder_enable: false,
      notes: {
        appointment_id: newAppointment.id, // Webhook uses this to find the appointment
      },
      notify: { sms: false, email: false }, // We send our own email
      callback_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/booking/status?appointment_id=${newAppointment.id}`,
      callback_method: "get",
    });

    // ── Email the patient the payment link ───────────────────────────────
    const [patient] = await db
      .select()
      .from(users)
      .where(eq(users.id, patient_id));
    if (patient?.email) {
      sendPaymentLinkEmail({
        to: patient.email,
        first_name: patient.name.split(" ")[0],
        payment_link: paymentLink.short_url,
        expires_in_minutes: 15,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Slot held. Payment link sent to patient email.",
      appointment: newAppointment,
      payment_link: paymentLink.short_url,
      expires_at: expiresAt,
    });
  } catch (error) {
    const isDuplicate =
      error.code === "23505" ||
      (error.cause && error.cause.code === "23505") ||
      (error.message && error.message.includes("unique constraint"));

    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: "This slot was just taken. Please choose a different time.",
      });
    }
    console.error("Error booking by phone:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 3. POST /api/appointments/self-book ─────────────────────────────────────
// Patient books their own appointment online.
// Flow: Book slot (pending_payment) → Create Razorpay Order → Client opens Razorpay checkout
// On success: Razorpay webhook confirms payment, flips status to 'scheduled'
export const selfBook = async (req, res) => {
  const { doctor_id, appointment_date, start_time, visit_reason, amount } =
    req.body;

  try {
    // ── Check for existing active booking ────────────────────────────────
    const existing = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.doctor_id, doctor_id),
          eq(appointments.appointment_date, appointment_date),
          eq(appointments.start_time, start_time),
        ),
      );
    const isDoubleBooked = existing.some(
      (a) => !["cancelled", "no_show"].includes(a.status),
    );
    if (isDoubleBooked) {
      return res
        .status(409)
        .json({
          success: false,
          message:
            "This slot is already booked or held. Please choose a different time.",
        });
    }

    // ── Hold the slot immediately (15-min window) ────────────────────────
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const [newAppointment] = await db
      .insert(appointments)
      .values({
        patient_id: req.user.id,
        doctor_id,
        appointment_date,
        start_time,
        visit_reason,
        status: "pending_payment",
        payment_status: "pending",
        payment_expires_at: expiresAt,
        created_by: req.user.id,
      })
      .returning();

    // ── Create Razorpay Order (client opens this in Razorpay checkout modal) ─
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: "INR",
      receipt: `appt_${newAppointment.id.slice(0, 8)}`,
      notes: {
        appointment_id: newAppointment.id, // Webhook uses this to confirm
      },
    });

    // ── Persist order_id so resume-payment can reference it ────────────
    await db
      .update(appointments)
      .set({ razorpay_order_id: order.id })
      .where(eq(appointments.id, newAppointment.id));

    // ── Return order + appointment to client ─────────────────────────────
    // Client uses order.id to open Razorpay checkout modal
    // After payment, Razorpay fires 'order.paid' webhook → confirms appointment
    return res.status(201).json({
      success: true,
      message: "Slot held for 15 minutes. Complete payment to confirm.",
      appointment: { ...newAppointment, razorpay_order_id: order.id },
      razorpay_order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      razorpay_key_id: process.env.RAZORPAY_KEY_ID,
      expires_at: expiresAt,
    });
  } catch (error) {
    const isDuplicate =
      error.code === "23505" ||
      (error.cause && error.cause.code === "23505") ||
      (error.message && error.message.includes("unique constraint"));

    if (isDuplicate) {
      return res.status(409).json({
        success: false,
        message: "This slot was just taken. Please choose a different time.",
      });
    }
    console.error("Error in selfBook:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Server error" });
  }
};

// ─── 4. GET /api/appointments ─────────────────────────────────────────────────
// Supports ?date=today, ?date=YYYY-MM-DD, ?range=week for dashboard/calendar views
export const getAppointments = async (req, res) => {
  try {
    const role = req.user.role;
    const { date, range } = req.query;

    let conditions = [];

    // Role-based ownership filter
    if (role === "patient") {
      conditions.push(eq(appointments.patient_id, req.user.id));
    } else if (role === "doctor") {
      conditions.push(eq(appointments.doctor_id, req.user.id));
    }
    // Receptionist/Admin gets all — no ownership filter

    // Date filter — ?date=today or ?date=2026-07-01
    if (date === "today" || (date === undefined && range === undefined)) {
      // If date=today is explicit, filter to today
      if (date === "today") {
        const today = localToday();
        conditions.push(eq(appointments.appointment_date, today));
      }
    } else if (date && date !== "today") {
      // Specific date requested
      conditions.push(eq(appointments.appointment_date, date));
    }

    // Range filter — ?range=week gives Mon-Sun of current week
    if (range === "week") {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const weekStart = monday.toISOString().split("T")[0];
      const weekEnd = sunday.toISOString().split("T")[0];

      conditions.push(gte(appointments.appointment_date, weekStart));
      conditions.push(lte(appointments.appointment_date, weekEnd));
    }

    const patientsTable = aliasedTable(users, "patient");
    const doctorsTable = aliasedTable(users, "doctor");

    // Perform left join to get the patient's name and doctor's name
    const query = db
      .select({
        ...appointments, // Select all fields from appointments
        patient_name: patientsTable.name,
        doctor_name: doctorsTable.name,
      })
      .from(appointments)
      .leftJoin(patientsTable, eq(appointments.patient_id, patientsTable.id))
      .leftJoin(doctorsTable, eq(appointments.doctor_id, doctorsTable.id));

    let result = await (
      conditions.length > 0 ? query.where(and(...conditions)) : query
    ).orderBy(appointments.appointment_date, appointments.start_time);

    // Calculate visit type (First Visit vs Follow-up) for each patient
    if (result.length > 0) {
      const patientIds = [
        ...new Set(result.filter((a) => a.patient_id).map((a) => a.patient_id)),
      ];
      if (patientIds.length > 0) {
        // Count consultations for these patients
        const pastConsults = await db
          .select({
            patient_id: consultations.patient_id,
          })
          .from(consultations)
          .where(inArray(consultations.patient_id, patientIds));

        // Map patient_id -> count
        const counts = {};
        pastConsults.forEach((c) => {
          counts[c.patient_id] = (counts[c.patient_id] || 0) + 1;
        });

        // Attach to result
        result = result.map((appt) => ({
          ...appt,
          past_consultations_count: appt.patient_id
            ? counts[appt.patient_id] || 0
            : 0,
        }));
      }
    }

    return res
      .status(200)
      .json({ success: true, count: result.length, appointments: result });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 5. PUT /api/appointments/:id/cancel ─────────────────────────────────────

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.user.role;

    // Fetch the appointment first to check ownership
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Patients can only cancel their own appointments
    if (role === "patient" && appointment.patient_id !== req.user.id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You can only cancel your own appointments",
        });
    }

    // Cannot cancel an already completed or cancelled appointment
    if (["completed", "cancelled", "no_show"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an appointment with status: ${appointment.status}`,
      });
    }

    // Enforce 60-minute cancellation policy
    const apptDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
    const diffInMinutes = (apptDateTime - new Date()) / (1000 * 60);
    if (diffInMinutes <= 60) {
      return res.status(400).json({
        success: false,
        message: "Appointments cannot be cancelled within 60 minutes of the scheduled time.",
      });
    }

    const [cancelled] = await db
      .update(appointments)
      .set({ status: "cancelled", updated_at: new Date() })
      .where(eq(appointments.id, id))
      .returning();

    // TODO Phase 2: If payment_status was 'paid_online' or 'paid_at_desk', flag for manual refund review

    return res.status(200).json({
      success: true,
      message: "Appointment cancelled. Slot is now available for rebooking.",
      appointment: cancelled,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 6. PUT /api/appointments/:id/status ─────────────────────────────────────
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["completed", "no_show"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    const [updated] = await db
      .update(appointments)
      .set({ status, updated_at: new Date() })
      .where(eq(appointments.id, id))
      .returning();

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: `Appointment marked as ${status}`,
        appointment: updated,
      });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 7. PUT /api/appointments/:id/pay ────────────────────────────────────────
// Receptionist collects cash/card at desk for a phone-booked (pending_payment) appointment
export const payAtDesk = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, amount, transaction_reference } = req.body;

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    if (
      appointment.payment_status === "paid_at_desk" ||
      appointment.payment_status === "paid_online"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "This appointment has already been paid.",
        });
    }

    if (
      appointment.status === "cancelled" ||
      appointment.status === "no_show"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: `Cannot collect payment for a ${appointment.status} appointment.`,
        });
    }

    const result = await db.transaction(async (tx) => {
      // Mark appointment as paid and confirm it
      const [updated] = await tx
        .update(appointments)
        .set({
          status: "scheduled",
          payment_status: "paid_at_desk",
          payment_expires_at: null, // Clear expiry so cron ignores it
          updated_at: new Date(),
        })
        .where(eq(appointments.id, id))
        .returning();

      // Generate invoice
      const invoiceNumber = await generateInvoiceNumber();
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          invoice_number: invoiceNumber,
          description: appointment.visit_reason || "Physiotherapy consultation",
          amount,
          status: "paid",
          issued_by: req.user.id,
        })
        .returning();

      // Generate payment record
      await tx.insert(payments).values({
        invoice_id: newInvoice.id,
        amount,
        payment_method,
        transaction_reference: transaction_reference || null,
        recorded_by: req.user.id,
      });

      return { appointment: updated, invoice: newInvoice };
    });

    return res.status(200).json({
      success: true,
      message: "Payment collected and appointment confirmed.",
      ...result,
    });
  } catch (error) {
    console.error("Error recording at-desk payment:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
// ─── 7. GET /api/appointments/available-dates ─────────────────────────────────
export const getAvailableDates = async (req, res) => {
  try {
    const { doctor_id, month } = req.query; // month in YYYY-MM
    if (!doctor_id || !month) {
      return res
        .status(400)
        .json({ success: false, message: "doctor_id and month are required" });
    }

    const [year, monthNum] = month.split("-");
    const startDate = new Date(year, parseInt(monthNum) - 1, 1);
    const endDate = new Date(year, parseInt(monthNum), 0);

    const [profile] = await db
      .select({ availability_rules: doctorProfiles.availability_rules })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.user_id, doctor_id));

    if (!profile || !profile.availability_rules) {
      return res.status(200).json({ success: true, available_dates: [] });
    }

    const rules = profile.availability_rules;
    const slotMinutes = rules.slot_minutes || 30;

    // Fetch all appointments for this doctor in this month
    const existingAppts = await db
      .select({
        appointment_date: appointments.appointment_date,
        start_time: appointments.start_time,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctor_id, doctor_id),
          gte(
            appointments.appointment_date,
            startDate.toISOString().split("T")[0],
          ),
          lte(
            appointments.appointment_date,
            endDate.toISOString().split("T")[0],
          ),
        ),
      );

    const availableDates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      if (d < today) continue; // Skip past dates

      const dateStr = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay().toString();

      let dayBlocks = [];
      if (rules.specific_dates && rules.specific_dates[dateStr]) {
        dayBlocks = rules.specific_dates[dateStr];
      } else if (rules.weekly_routine && rules.weekly_routine[dayOfWeek]) {
        dayBlocks = rules.weekly_routine[dayOfWeek];
      }

      if (dayBlocks.length === 0) continue; // No hours

      let totalSlots = 0;
      for (const block of dayBlocks) {
        const start = new Date(`${dateStr}T${block.start}:00`);
        const end = new Date(`${dateStr}T${block.end}:00`);
        totalSlots += Math.floor((end - start) / (1000 * 60 * slotMinutes));
      }

      const takenSlotsForDay = existingAppts.filter(
        (a) =>
          a.appointment_date === dateStr &&
          !["cancelled", "no_show"].includes(a.status),
      ).length;

      if (totalSlots > takenSlotsForDay) {
        availableDates.push(dateStr);
      }
    }

    return res
      .status(200)
      .json({ success: true, available_dates: availableDates });
  } catch (error) {
    console.error("Error fetching available dates:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 8. GET /api/appointments/slots ──────────────────────────────────────────
export const getAvailableSlots = async (req, res) => {
  try {
    const { date, doctor_id } = req.query;
    if (!date || !doctor_id) {
      return res
        .status(400)
        .json({ success: false, message: "Date and doctor_id are required" });
    }

    // 1. Fetch Doctor's Availability Rules
    const [profile] = await db
      .select({ availability_rules: doctorProfiles.availability_rules })
      .from(doctorProfiles)
      .where(eq(doctorProfiles.user_id, doctor_id));

    if (!profile || !profile.availability_rules) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Doctor availability rules not found",
        });
    }

    const rules = profile.availability_rules;
    const slotMinutes = rules.slot_minutes || 30;

    // 2. Determine Day of Week (0 = Sunday, 1 = Monday, etc.)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay().toString();

    let dayBlocks = [];

    // Check if there are specific date overrides (like leave or custom hours)
    if (rules.specific_dates && rules.specific_dates[date]) {
      dayBlocks = rules.specific_dates[date]; // Empty array means closed
    } else if (rules.weekly_routine && rules.weekly_routine[dayOfWeek]) {
      dayBlocks = rules.weekly_routine[dayOfWeek];
    }

    // 3. Generate all possible time slots for the day based on the blocks
    const allSlots = [];
    for (const block of dayBlocks) {
      let current = new Date(`${date}T${block.start}:00`);
      const end = new Date(`${date}T${block.end}:00`);

      while (current < end) {
        const hours = String(current.getHours()).padStart(2, "0");
        const mins = String(current.getMinutes()).padStart(2, "0");
        allSlots.push(`${hours}:${mins}`);

        // Add slot_minutes
        current.setMinutes(current.getMinutes() + slotMinutes);
      }
    }

    if (allSlots.length === 0) {
      return res.status(200).json({ success: true, slots: [] }); // Doctor is not available
    }

    // 4. Fetch existing appointments for this doctor on this date
    const existingAppts = await db
      .select({
        start_time: appointments.start_time,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctor_id, doctor_id),
          eq(appointments.appointment_date, date),
        ),
      );

    // 5. Subtract taken slots
    const takenSlots = existingAppts
      .filter((a) => !["cancelled", "no_show"].includes(a.status))
      .map((a) => a.start_time.substring(0, 5)); // "09:30:00" -> "09:30"

    const blockedSlots = existingAppts
      .filter((a) => a.status === "blocked")
      .map((a) => a.start_time.substring(0, 5));

    const finalSlots = allSlots.map((time) => {
      let status = "available";
      if (takenSlots.includes(time)) status = "taken";
      if (blockedSlots.includes(time)) status = "blocked";
      return { time, status };
    });

    return res.status(200).json({ success: true, slots: finalSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching slots" });
  }
};

// ─── 9. PUT /api/appointments/:id/resend-payment-link ───────────────────────────
export const resendPaymentLink = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId));

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    if (
      appointment.status !== "pending_payment" &&
      appointment.payment_status !== "pending"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Appointment is not pending payment.",
        });
    }

    const newExpiresAt = new Date(Date.now() + 20 * 60000);

    const [patient] = await db
      .select()
      .from(users)
      .where(eq(users.id, appointment.patient_id));

    let paymentLinkUrl = null;
    try {
      const invoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.appointment_id, appointmentId))
        .limit(1);
      let amount = appointment.amount;
      // fallback: get amount from invoice if it exists
      if (!amount && invoice.length > 0) amount = invoice[0].amount;
      if (!amount) amount = 500; // default safe fallback

      const razorpay = getRazorpayInstance();
      const paymentLink = await razorpay.paymentLink.create({
        amount: Math.round(amount * 100),
        currency: "INR",
        description: appointment.visit_reason || "PhysioCare Consultation",
        expire_by: Math.floor(newExpiresAt.getTime() / 1000),
        reminder_enable: false,
        notes: { appointment_id: appointment.id },
        notify: { sms: false, email: false },
        callback_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/booking/status?appointment_id=${appointment.id}`,
        callback_method: "get",
      });
      paymentLinkUrl = paymentLink.short_url;

      await db
        .update(appointments)
        .set({ payment_expires_at: newExpiresAt })
        .where(eq(appointments.id, appointmentId));

      if (patient?.email && paymentLinkUrl) {
        sendPaymentLinkEmail({
          to: patient.email,
          first_name: patient.name.split(" ")[0],
          payment_link: paymentLinkUrl,
          expires_in_minutes: 20,
        });
      }
    } catch (rpErr) {
      console.error("Razorpay error on resend:", rpErr);
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to generate a new payment link from Razorpay.",
        });
    }

    return res.status(200).json({
      success: true,
      message: "Payment link resent successfully, and timer extended.",
      payment_expires_at: newExpiresAt,
    });
  } catch (error) {
    console.error("Error resending payment link:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error resending link" });
  }
};

// ─── 10. POST /api/appointments/:id/verify-payment ────────────────────────────
export const verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { razorpay_payment_id, razorpay_signature, razorpay_order_id } =
      req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    if (!appointment)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });

    if (
      appointment.payment_status === "paid_online" ||
      appointment.status === "scheduled"
    ) {
      return res
        .status(200)
        .json({ success: true, message: "Already paid and confirmed" });
    }

    await db.transaction(async (tx) => {
      // Update appointment
      await tx
        .update(appointments)
        .set({
          status: "scheduled",
          payment_status: "paid_online",
          payment_expires_at: null,
        })
        .where(eq(appointments.id, id));

      // Create invoice and payment
      const invoiceNumber = await generateInvoiceNumber();
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          invoice_number: invoiceNumber,
          description: appointment.visit_reason || "Physiotherapy consultation",
          amount: 800, // Hardcoded standard fee based on prompt
          status: "paid",
          issued_by: req.user.id,
        })
        .returning();

      await tx.insert(payments).values({
        invoice_id: newInvoice.id,
        amount: 800,
        payment_method: "online",
        transaction_reference: razorpay_payment_id,
        recorded_by: req.user.id,
      });
    });

    return res
      .status(200)
      .json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 11. POST /api/appointments/:id/resume-payment ────────────────────────────

export const resumePayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch appointment and ensure the requesting patient owns it
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));
    if (!appointment)
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    if (appointment.patient_id !== req.user.id)
      return res.status(403).json({ success: false, message: "Forbidden" });
    if (appointment.status !== "pending_payment") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Appointment is not awaiting payment",
        });
    }

    // Check if the hold window has expired
    if (
      appointment.payment_expires_at &&
      new Date(appointment.payment_expires_at) < new Date()
    ) {
      // Cancel the expired appointment and release the slot
      await db
        .update(appointments)
        .set({ status: "cancelled" })
        .where(eq(appointments.id, id));
      return res
        .status(410)
        .json({
          success: false,
          message: "Payment window expired. Please book a new slot.",
        });
    }

    // Create a new Razorpay order for this appointment
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: 80000, // ₹800 in paise — standard consultation fee
      currency: "INR",
      receipt: `resume_${appointment.id.slice(0, 8)}`,
      notes: { appointment_id: appointment.id },
    });

    // Persist the new order_id
    await db
      .update(appointments)
      .set({ razorpay_order_id: order.id })
      .where(eq(appointments.id, id));

    return res.status(200).json({
      success: true,
      appointment,
      razorpay_order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      razorpay_key_id: process.env.RAZORPAY_KEY_ID,
      expires_at: appointment.payment_expires_at,
    });
  } catch (error) {
    console.error("Error resuming payment:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
