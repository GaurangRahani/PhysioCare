import express from "express";
import {
  razorpayWebhook,
  getInvoices,
  getInvoiceById,
  verifyPayment,
  emailInvoice,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Razorpay webhook is mounted directly in server.js to ensure express.raw() body parsing

// ── Invoice / Billing history ─────────────────────────────────────────────────
// GET /api/payments/invoices?patient_id=    (patient sees own, staff supplies patient_id)
router.get("/invoices", requireAuth, getInvoices);

// GET /api/payments/invoices/:id            (single invoice + payment detail for PDF)
router.get("/invoices/:id", requireAuth, getInvoiceById);

// POST /api/payments/invoices/:id/email     (email receipt to patient)
router.post("/invoices/:id/email", requireAuth, emailInvoice);

// ── Payment Verification ──────────────────────────────────────────────────────
// POST /api/payments/verify                 (frontend confirms payment directly)
router.post("/verify", requireAuth, verifyPayment);

export default router;
