import express from "express";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import {
  getOverview,
  getUsers,
  updateUserRole,
  updateUserStatus,
  updatePatientStatus,
  inviteStaff,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(requireAdmin);

router.get("/overview", getOverview);
router.get("/users", getUsers);
router.patch("/users/:userId/role", updateUserRole);
router.patch("/users/:userId/active", updateUserStatus);
router.patch("/users/:userId/patient-status", updatePatientStatus);
router.post("/users/invite", inviteStaff);

export default router;
