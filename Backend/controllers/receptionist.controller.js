import { clerkClient } from "@clerk/express";
import { db } from "../src/db/index.js";
import { users, patientProfiles } from "../src/db/schema/index.js";
import { eq, or, and, ilike } from "drizzle-orm";
import { sendWelcomeEmail } from "../utils/email.js";

// ─── HELPER: Generate a strong temporary password ─────────────────────────────
const generateTempPassword = () => {
  const adjectives = ["Physio", "Health", "Clinic", "Care", "Fit"];
  const word = adjectives[Math.floor(Math.random() * adjectives.length)];
  const number = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `${word}@${number}`; // e.g. "Physio@7823" — meets Clerk's strength rules
};

// ─── POST /api/receptionists/patients ────────────────────────────────────────
// Creates Clerk user → DB user + profile → Sends welcome email with temp password
export const createPatient = async (req, res) => {
  const { name, email, phone, date_of_birth, gender, address } = req.body;

  try {
    // ── Step 1: Check if patient already exists in our DB (by email or phone) ───
    const existingUser = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.phone, phone)));

    if (existingUser.length > 0) {
      const conflictField =
        existingUser[0].email === email ? "email" : "phone number";
      return res.status(409).json({
        success: false,
        message: `A patient with this ${conflictField} already exists.`,
        existing_patient_id: existingUser[0].id,
      });
    }

    const tempPassword = generateTempPassword();

    let clerkUser;
    try {
      clerkUser = await clerkClient.users.createUser({
        emailAddress: [email],
        password: tempPassword,
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" ") || "",
        publicMetadata: {
          role: "patient",
          force_password_change: true,
        },
        skipPasswordChecks: false,
      });
    } catch (clerkError) {
      // Handle Clerk duplicate identifier (email already in Clerk but not in our DB)
      if (clerkError.errors?.[0]?.code === "form_identifier_exists") {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists in the authentication system.",
        });
      }
      throw clerkError;
    }

    // ── Insert into DB — user + patient profile ────────────────────────
    const [newUser] = await db
      .insert(users)
      .values({
        clerk_id: clerkUser.id,
        name,
        email,
        phone,
        role: "patient",
      })
      .returning();

    await db.insert(patientProfiles).values({
      user_id: newUser.id,
      date_of_birth,
      gender,
      address,
    });

    // ── Send welcome email with temp password (fire-and-forget) ────────
    sendWelcomeEmail({
      to: email,
      first_name: name.split(" ")[0],
      email,
      tempPassword,
    });

    return res.status(201).json({
      success: true,
      message: `Patient account created. Welcome email sent to ${email}.`,
      patient: {
        id: newUser.id,
        name,
        email,
        phone,
      },
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── GET /api/receptionists/patients/search?q= ───────────────────────────────
export const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Search query must be at least 2 characters.",
        });
    }

    const searchTerm = `%${q.trim()}%`;

    const patients = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "patient"),
          or(
            ilike(users.name, searchTerm),
            ilike(users.email, searchTerm),
            ilike(users.phone, searchTerm),
          ),
        ),
      )
      .limit(20); // Cap results for performance

    return res
      .status(200)
      .json({ success: true, count: patients.length, patients });
  } catch (error) {
    console.error("Error searching patients:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
