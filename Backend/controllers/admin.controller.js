import { clerkClient } from "@clerk/express";
import { db } from "../src/db/index.js";
import {
  users,
  patientProfiles,
  doctorProfiles,
} from "../src/db/schema/index.js";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { sendWelcomeEmail } from "../utils/email.js";

const rows = (result) =>
  Array.isArray(result) ? result : (result?.rows ?? []);

export const getOverview = async (req, res) => {
  try {
    const [
      appointmentsResult,
      revenueResult,
      activePatientsResult,
      newPatientsResult,
      todayResult,
      recentActivity,
    ] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(*)::int as count
        FROM appointments
        WHERE DATE_TRUNC('month', appointment_date) = DATE_TRUNC('month', CURRENT_DATE)
          AND status NOT IN ('cancelled', 'blocked', 'no_show')
      `),
      // Revenue = sum from payments table (actual money collected this month)
      db.execute(sql`
        SELECT COALESCE(SUM(p.amount), 0) as total
        FROM payments p
        WHERE DATE_TRUNC('month', p.payment_date) = DATE_TRUNC('month', CURRENT_DATE)
      `),
      db.execute(sql`
        SELECT COUNT(*)::int as count
        FROM patient_profiles
        WHERE status = 'active'
      `),
      db.execute(sql`
        SELECT COUNT(*)::int as count
        FROM users
        WHERE role = 'patient'
          AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      `),
      db.execute(sql`
        SELECT
          COUNT(CASE WHEN status = 'scheduled'       THEN 1 END)::int as scheduled_today,
          COUNT(CASE WHEN status = 'pending_payment'  THEN 1 END)::int as pending_payment_today,
          COUNT(CASE WHEN status = 'completed'        THEN 1 END)::int as completed_today
        FROM appointments
        WHERE appointment_date = CURRENT_DATE
      `),
      db.execute(sql`
        SELECT * FROM (
          (
            SELECT
              'appointment_booked' as event_type,
              a.created_at as event_time,
              u_patient.name as patient_name,
              u_doctor.name as doctor_name,
              a.appointment_date::text as detail,
              NULL::numeric as amount
            FROM appointments a
            JOIN users u_patient ON a.patient_id = u_patient.id
            JOIN users u_doctor  ON a.doctor_id  = u_doctor.id
            WHERE a.status != 'blocked'
            ORDER BY a.created_at DESC
            LIMIT 5
          )
          UNION ALL
          (
            SELECT
              'payment_received' as event_type,
              p.payment_date as event_time,
              u.name as patient_name,
              NULL as doctor_name,
              i.invoice_number as detail,
              p.amount as amount
            FROM payments p
            JOIN invoices i ON i.id = p.invoice_id
            JOIN users u    ON i.patient_id = u.id
            ORDER BY p.payment_date DESC
            LIMIT 5
          )
          UNION ALL
          (
            SELECT
              'new_patient' as event_type,
              u.created_at as event_time,
              u.name as patient_name,
              NULL as doctor_name,
              u.email as detail,
              NULL::numeric as amount
            FROM users u
            WHERE u.role = 'patient'
            ORDER BY u.created_at DESC
            LIMIT 5
          )
        ) events
        ORDER BY event_time DESC
        LIMIT 10
      `),
    ]);

    const apptRows = rows(appointmentsResult);
    const revRows = rows(revenueResult);
    const activePtRows = rows(activePatientsResult);
    const newPtRows = rows(newPatientsResult);
    const todayRows = rows(todayResult);
    const activityRows = rows(recentActivity);

    return res.json({
      stats: {
        appointments_this_month: apptRows[0]?.count || 0,
        revenue_this_month: Number(revRows[0]?.total || 0).toFixed(2),
        active_patients: activePtRows[0]?.count || 0,
        new_patients_this_month: newPtRows[0]?.count || 0,
      },
      today: {
        scheduled: todayRows[0]?.scheduled_today || 0,
        pending_payment: todayRows[0]?.pending_payment_today || 0,
        completed: todayRows[0]?.completed_today || 0,
      },
      recent_activity: activityRows,
    });
  } catch (error) {
    console.error("Error fetching admin overview:", error);
    return res.status(500).json({ error: "Failed to fetch overview data" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { role = "all", search = "", page = 1, limit = 20 } = req.query;

    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (parsedPage - 1) * parsedLimit;
    const searchTerm = `%${search}%`;

    const validRoles = ["doctor", "receptionist", "patient"];
    const filterRole = validRoles.includes(role) ? role : null;

    const usersResult = filterRole
      ? await db.execute(sql`
          SELECT u.id, u.name, u.email, u.phone, u.role,
                 u.is_active, u.created_at,
                 pp.status as patient_status, dp.specialization
          FROM users u
          LEFT JOIN patient_profiles pp ON pp.user_id = u.id
          LEFT JOIN doctor_profiles  dp ON dp.user_id = u.id
          WHERE u.role != 'admin'
            AND u.role = ${filterRole}
            AND (
              ${search} = ''
              OR u.name  ILIKE ${searchTerm}
              OR u.email ILIKE ${searchTerm}
              OR u.phone ILIKE ${searchTerm}
            )
          ORDER BY u.created_at DESC
          LIMIT ${parsedLimit} OFFSET ${offset}
        `)
      : await db.execute(sql`
          SELECT u.id, u.name, u.email, u.phone, u.role,
                 u.is_active, u.created_at,
                 pp.status as patient_status, dp.specialization
          FROM users u
          LEFT JOIN patient_profiles pp ON pp.user_id = u.id
          LEFT JOIN doctor_profiles  dp ON dp.user_id = u.id
          WHERE u.role != 'admin'
            AND (
              ${search} = ''
              OR u.name  ILIKE ${searchTerm}
              OR u.email ILIKE ${searchTerm}
              OR u.phone ILIKE ${searchTerm}
            )
          ORDER BY
            CASE u.role
              WHEN 'doctor'        THEN 1
              WHEN 'receptionist'  THEN 2
              ELSE 3
            END ASC,
            u.created_at DESC
          LIMIT ${parsedLimit} OFFSET ${offset}
        `);

    const countResult = filterRole
      ? await db.execute(sql`
          SELECT COUNT(*)::int as count
          FROM users u
          WHERE u.role != 'admin'
            AND u.role = ${filterRole}
            AND (
              ${search} = ''
              OR u.name  ILIKE ${searchTerm}
              OR u.email ILIKE ${searchTerm}
              OR u.phone ILIKE ${searchTerm}
            )
        `)
      : await db.execute(sql`
          SELECT COUNT(*)::int as count
          FROM users u
          WHERE u.role != 'admin'
            AND (
              ${search} = ''
              OR u.name  ILIKE ${searchTerm}
              OR u.email ILIKE ${searchTerm}
              OR u.phone ILIKE ${searchTerm}
            )
        `);

    const total = rows(countResult)[0]?.count || 0;

    return res.json({
      users: rows(usersResult),
      total,
      page: parsedPage,
      total_pages: Math.ceil(total / parsedLimit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { new_role } = req.body;

    if (userId === req.adminUser.id) {
      return res.status(400).json({ error: "Cannot change your own role" });
    }

    if (new_role === "admin") {
      return res
        .status(400)
        .json({ error: "Cannot grant admin role via this endpoint" });
    }

    if (!["patient", "doctor", "receptionist"].includes(new_role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Transaction for role update and profile creation
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ role: new_role, updated_at: new Date() })
        .where(eq(users.id, userId));

      if (new_role === "doctor") {
        await tx
          .insert(doctorProfiles)
          .values({ user_id: userId })
          .onConflictDoNothing({ target: doctorProfiles.user_id });
      }
      if (new_role === "patient") {
        await tx
          .insert(patientProfiles)
          .values({ user_id: userId, status: "active" })
          .onConflictDoNothing({ target: patientProfiles.user_id });
      }
    });

    return res.json({
      success: true,
      old_role: targetUser.role,
      new_role,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return res.status(500).json({ error: "Failed to update user role" });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active must be a boolean" });
    }

    const result = await db.execute(sql`
      UPDATE users SET is_active = ${is_active}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId} AND role != 'admin'
      RETURNING id
    `);

    if (result.length === 0) {
      return res
        .status(400)
        .json({ error: "User not found or cannot deactivate admin" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ error: "Failed to update user status" });
  }
};

export const updatePatientStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "discharged"].includes(status)) {
      return res.status(400).json({ error: "Invalid patient status" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || user.role !== "patient") {
      return res.status(400).json({ error: "User is not a patient" });
    }

    await db.execute(sql`
      UPDATE patient_profiles
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `);

    return res.json({ success: true });
  } catch (error) {
    console.error("Error updating patient status:", error);
    return res.status(500).json({ error: "Failed to update patient status" });
  }
};

export const inviteStaff = async (req, res) => {
  let clerkUser = null;
  try {
    const { name, email, phone, role } = req.body;

    if (!["doctor", "receptionist"].includes(role)) {
      return res
        .status(400)
        .json({ error: "Role must be doctor or receptionist" });
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const tempPassword = crypto.randomBytes(8).toString("base64url");

    clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      password: tempPassword,
      firstName: name.split(" ")[0],
      lastName: name.split(" ").slice(1).join(" ") || "",
    });

    const [newUser] = await db.transaction(async (tx) => {
      const [insertedUser] = await tx
        .insert(users)
        .values({
          clerk_id: clerkUser.id,
          name,
          email,
          phone: phone || null,
          role,
          is_active: true,
          must_change_password: true,
        })
        .returning();

      if (role === "doctor") {
        await tx.insert(doctorProfiles).values({
          user_id: insertedUser.id,
        });
      }
      return [insertedUser];
    });

    // Send welcome email with credentials
    sendWelcomeEmail({
      to: email,
      first_name: name.split(" ")[0],
      email,
      tempPassword,
    });

    return res.status(201).json({
      success: true,
      user_id: newUser.id,
      message: "Account created. Welcome email sent.",
    });
  } catch (error) {
    console.error("Error inviting staff:", error);
    if (clerkUser) {
      try {
        await clerkClient.users.deleteUser(clerkUser.id);
      } catch (e) {
        console.error("Failed to rollback Clerk user creation:", e);
      }
    }
    return res
      .status(500)
      .json({ error: "Failed to create account. Try again." });
  }
};

//clinic info
export const getClinicInfo = async (req, res) => {
  try {
    const [admin] = await db
      .select({ name: users.name, phone: users.phone, email: users.email })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);

    return res.json({
      clinic_name: process.env.CLINIC_NAME || "PhysioCare",
      contact_phone: admin?.phone || "+91 98765 43210",
      contact_email: admin?.email || null,
    });
  } catch (error) {
    console.error("Error fetching clinic info:", error);
    return res.status(500).json({ error: "Failed to fetch clinic info" });
  }
};
