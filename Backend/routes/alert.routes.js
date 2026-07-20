import express from "express";
import {
  getPendingAlerts,
  resolveAlert,
} from "../controllers/alert.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get pending alerts for the logged-in doctor
router.get("/", requireAuth, requireRole(["doctor"]), getPendingAlerts);

// Resolve an alert
router.patch(
  "/:id/resolve",
  requireAuth,
  requireRole(["doctor"]),
  resolveAlert,
);

export default router;
