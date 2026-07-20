import express from "express";
import { getClinicInfo } from "../controllers/admin.controller.js";

const router = express.Router();

// Public — no auth middleware
router.get("/info", getClinicInfo);

export default router;
