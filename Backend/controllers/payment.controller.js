import crypto from "crypto";
import { db } from "../src/db/index.js";
import {
  appointments,
  invoices,
  payments,
  users,
} from "../src/db/schema/index.js";
import { eq } from "drizzle-orm";
import {
  sendAppointmentConfirmationEmail,
  sendInvoiceEmail,
} from "../utils/email.js";

// ─── HELPER: Generate next invoice number ─────────────────────────────────────
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const count = await db.$count(invoices);
  const seq = String(count + 1).padStart(5, "0");
  return `INV-${year}-${seq}`;
};

// ─── 1. POST /api/payments/webhook/razorpay ───────────────────────────────────
//this webhook handle order.paid and layment_link.paid events
export const razorpayWebhook = async (req, res) => {
  // ── Verify Signature ─────────────────────────────────────────────────────
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  if (!secret || !signature) {
    console.error("[Razorpay Webhook] Missing signature or secret in .env");
    return res.status(400).send("Missing signature or secret");
  }

  // req.body is a Buffer (express.raw middleware used on this route)
  const payloadBuffer = req.body;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadBuffer)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.error(
      "[Razorpay Webhook] Signature mismatch! Check RAZORPAY_WEBHOOK_SECRET in .env",
    );
    return res.status(400).send("Invalid signature");
  }

  // ── Parse Event ──────────────────────────────────────────────────────────
  let payloadObject;
  try {
    payloadObject = JSON.parse(payloadBuffer.toString("utf8"));
  } catch (err) {
    console.error("[Razorpay Webhook] Failed to parse JSON body");
    return res.status(400).send("Invalid JSON");
  }

  const event = payloadObject.event;
  const payload = payloadObject.payload;

  try {
    if (event === "payment_link.paid" || event === "order.paid") {
      const entity =
        event === "payment_link.paid"
          ? payload.payment_link.entity
          : payload.order.entity;

      // Find the appointment using the ID we stored in Razorpay notes
      const appointmentId = entity.notes?.appointment_id;

      if (!appointmentId) {
        console.error("[Razorpay Webhook] Missing appointment_id in notes");
        return res.status(200).send("Ignored - missing appointment ID");
      }

      const [appointment] = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, appointmentId));

      if (!appointment) {
        console.error(
          "[Razorpay Webhook] Appointment not found:",
          appointmentId,
        );
        return res.status(200).send("Ignored - appointment not found");
      }

      // Idempotency guard — ignore if already processed
      if (appointment.payment_status === "paid_online") {
        return res.status(200).send("Already processed");
      }

      // ── Transaction: confirm appointment + create invoice + payment ──
      await db.transaction(async (tx) => {
        await tx
          .update(appointments)
          .set({
            status: "scheduled",
            payment_status: "paid_online",
            payment_expires_at: null, // Clear expiry so cron ignores it
          })
          .where(eq(appointments.id, appointmentId));

        const invoiceNumber = await generateInvoiceNumber();
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            patient_id: appointment.patient_id,
            appointment_id: appointment.id,
            invoice_number: invoiceNumber,
            description:
              appointment.visit_reason || "Physiotherapy consultation",
            amount: entity.amount_paid / 100, // Razorpay sends paise → convert to ₹
            status: "paid",
            issued_by: appointment.patient_id, // Self-service or phone booking
          })
          .returning();

        await tx.insert(payments).values({
          invoice_id: newInvoice.id,
          amount: entity.amount_paid / 100,
          payment_method: "online",
          transaction_reference: entity.id, // plink_xxx or order_xxx
          recorded_by: appointment.patient_id,
        });
      });

      // ── Fire confirmation email (non-blocking) ───────────────────────
      const [patient] = await db
        .select()
        .from(users)
        .where(eq(users.id, appointment.patient_id));
      const [doctor] = await db
        .select()
        .from(users)
        .where(eq(users.id, appointment.doctor_id));

      if (patient && doctor) {
        sendAppointmentConfirmationEmail({
          to: patient.email,
          first_name: patient.name.split(" ")[0],
          doctor_name: doctor.name,
          appointment_date: appointment.appointment_date,
          start_time: appointment.start_time,
        });
      }

      console.log(
        `[Razorpay Webhook]  Payment confirmed for appointment ${appointmentId}`,
      );
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("[Razorpay Webhook Error]", error);
    res.status(500).send("Internal Server Error");
  }
};

// ─── 2. GET /api/payments/invoices?patient_id= ────────────────────────────────
// Patient sees own billing history. Receptionist/Doctor supplies patient_id.
export const getInvoices = async (req, res) => {
  try {
    const role = req.user.role;
    const { patient_id } = req.query;

    let targetPatientId;
    if (role === "patient") {
      targetPatientId = req.user.id;
    } else {
      if (!patient_id) {
        return res
          .status(400)
          .json({
            success: false,
            message: "patient_id query param is required.",
          });
      }
      targetPatientId = patient_id;
    }

    const result = await db
      .select({
        id: invoices.id,
        invoice_number: invoices.invoice_number,
        description: invoices.description,
        amount: invoices.amount,
        status: invoices.status,
        created_at: invoices.created_at,
        appointment_id: invoices.appointment_id,
      })
      .from(invoices)
      .where(eq(invoices.patient_id, targetPatientId))
      .orderBy(invoices.created_at);

    return res
      .status(200)
      .json({ success: true, count: result.length, invoices: result });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 3. GET /api/payments/invoices/:id ───────────────────────────────────────
// Single invoice + linked payment record — used for PDF download on Screen 30
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    // Patients can only access their own invoices
    if (req.user.role === "patient" && invoice.patient_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.invoice_id, id));

    return res
      .status(200)
      .json({ success: true, invoice, payment: payment || null });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 4. POST /api/payments/verify ─────────────────────────────────────────────
// Synchronous verification for client-side Razorpay flow (crucial when webhooks are blocked, e.g. local dev)
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      appointment_id,
    } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payment signature" });
    }

    // Signature is valid. Proceed to update DB.
    const [appointment] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointment_id));
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
        .json({ success: true, message: "Already processed" });
    }

    // Transaction
    await db.transaction(async (tx) => {
      await tx
        .update(appointments)
        .set({
          status: "scheduled",
          payment_status: "paid_online",
          payment_expires_at: null,
        })
        .where(eq(appointments.id, appointment_id));

      const invoiceNumber = await generateInvoiceNumber();
      const [newInvoice] = await tx
        .insert(invoices)
        .values({
          patient_id: appointment.patient_id,
          appointment_id: appointment.id,
          invoice_number: invoiceNumber,
          description: appointment.visit_reason || "Physiotherapy consultation",
          amount: 500, // Standard consultation fee
          status: "paid",
          issued_by: appointment.patient_id,
        })
        .returning();

      await tx.insert(payments).values({
        invoice_id: newInvoice.id,
        amount: 500,
        payment_method: "online",
        transaction_reference: razorpay_order_id,
        recorded_by: appointment.patient_id,
      });
    });

    // Fire confirmation email
    const [patient] = await db
      .select()
      .from(users)
      .where(eq(users.id, appointment.patient_id));
    const [doctor] = await db
      .select()
      .from(users)
      .where(eq(users.id, appointment.doctor_id));

    if (patient && doctor) {
      sendAppointmentConfirmationEmail({
        to: patient.email,
        first_name: patient.name.split(" ")[0],
        doctor_name: doctor.name,
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
      });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Payment verified and appointment confirmed",
      });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 5. POST /api/payments/invoices/:id/email ────────────────────────────────
export const emailInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    if (!invoice)
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });

    // Patients can only email their own invoices
    if (req.user.role === "patient" && invoice.patient_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const [patient] = await db
      .select()
      .from(users)
      .where(eq(users.id, invoice.patient_id));
    if (!patient?.email) {
      return res
        .status(400)
        .json({ success: false, message: "Patient email not found" });
    }

    sendInvoiceEmail({
      to: patient.email,
      first_name: patient.name.split(" ")[0],
      invoice_number: invoice.invoice_number,
      amount: invoice.amount,
      description: invoice.description || "Physiotherapy consultation",
      issued_date: new Date(invoice.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });

    return res.status(200).json({ success: true, sent_to: patient.email });
  } catch (error) {
    console.error("Error emailing invoice:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
