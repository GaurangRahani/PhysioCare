import express from 'express';
import { razorpayWebhook, getInvoices, getInvoiceById } from '../controllers/payment.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ── Razorpay webhook — MUST use raw body (express.raw set in server.js) ───────
// POST /api/payments/webhook
router.post('/webhook', razorpayWebhook);

// ── Invoice / Billing history ─────────────────────────────────────────────────
// GET /api/payments/invoices?patient_id=    (patient sees own, staff supplies patient_id)
router.get('/invoices', requireAuth, getInvoices);

// GET /api/payments/invoices/:id            (single invoice + payment detail for PDF)
router.get('/invoices/:id', requireAuth, getInvoiceById);

export default router;
