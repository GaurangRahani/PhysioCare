import { db } from "../src/db/index.js";
import { users, doctorProfiles } from "../src/db/schema/index.js";
import { eq } from "drizzle-orm";

// GET /api/doctors/profile - Get logged in doctor's profile
export const getDoctorProfile = async (req, res) => {
  try {
    // req.user is attached by requireRole middleware!
    const user = req.user;

    const [profile] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.user_id, user.id));

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      profile: profile || null,
    });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/doctors/profile - Update logged in doctor's profile
export const updateDoctorProfile = async (req, res) => {
  try {
    const { phone, specialization, qualification } = req.body;
    const user = req.user;

    // 1. Update the phone number in the main 'users' table if provided
    if (phone) {
      await db.update(users).set({ phone }).where(eq(users.id, user.id));
    }

    // 2. Upsert the doctor's medical profile data
    const [profile] = await db
      .insert(doctorProfiles)
      .values({
        user_id: user.id,
        specialization,
        qualification,
      })
      .onConflictDoUpdate({
        target: doctorProfiles.user_id,
        set: {
          specialization,
          qualification,
        },
      })
      .returning();

    return res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
// GET /api/doctors - List all doctors (public/receptionist)
export const getAllDoctors = async (req, res) => {
  try {
    const query = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        specialization: doctorProfiles.specialization,
        qualification: doctorProfiles.qualification,
      })
      .from(users)
      .leftJoin(doctorProfiles, eq(users.id, doctorProfiles.user_id))
      .where(eq(users.role, "doctor"));

    return res.status(200).json({
      success: true,
      doctors: query,
    });
  } catch (error) {
    console.error("Error fetching doctors list:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
