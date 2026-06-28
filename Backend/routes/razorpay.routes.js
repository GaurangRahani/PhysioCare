import express from 'express';
import { razorpayWebhook } from '../controllers/razorpay.controller.js';

const router = express.Router();

router.post('/', razorpayWebhook);

export default router;
