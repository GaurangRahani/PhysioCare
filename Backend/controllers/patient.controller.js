import { db } from '../src/db/index.js';
import { users, patientProfiles, consultations, treatmentPlans, exerciseLogs } from '../src/db/schema/index.js';
import { eq, desc } from 'drizzle-orm';

import { getAuth } from '@clerk/express';

// GET /api/patients/profile - Get the logged-in patient's profile
export const getPatientProfile = async (req, res) => {
  try {
    const auth = getAuth(req);
    const [user] = await db.select().from(users).where(eq(users.clerk_id, auth.userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in database' });
    }

    const [profile] = await db.select().from(patientProfiles).where(eq(patientProfiles.user_id, user.id));

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      profile: profile || null
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
//put /api/patients/profile
export const updatePatientProfile = async (req, res) => {
  try {
    const { phone, date_of_birth, gender, address, emergency_contact_name, emergency_contact_phone, medical_history } = req.body;
    const auth = getAuth(req);

    const [user] = await db.select().from(users).where(eq(users.clerk_id, auth.userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in database' });
    }

    // Update the phone number in the main 'users' table if they provided one!
    if (phone) {
      await db.update(users).set({ phone }).where(eq(users.id, user.id));
    }

    const [profile] = await db.insert(patientProfiles)
      .values({
        user_id: user.id,
        date_of_birth: date_of_birth ? new Date(date_of_birth).toISOString() : null,
        gender,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        medical_history,
        updated_at: new Date()
      })
      .onConflictDoUpdate({
        target: patientProfiles.user_id,
        set: {
          date_of_birth: date_of_birth ? new Date(date_of_birth).toISOString() : null,
          gender,
          address,
          emergency_contact_name,
          emergency_contact_phone,
          medical_history,
          updated_at: new Date()
        }
      })
      .returning();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/patients 
export const getAllPatients = async (req, res) => {
  try {
    const allPatients = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      status: patientProfiles.status,
      date_of_birth: patientProfiles.date_of_birth
    })
      .from(users)
      .leftJoin(patientProfiles, eq(users.id, patientProfiles.user_id))
      .where(eq(users.role, 'patient'));

    return res.status(200).json({
      success: true,
      count: allPatients.length,
      data: allPatients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/patients/:patient_id/history
export const getPatientHistory = async (req, res) => {
  try {
    const { patient_id } = req.params;

    const [
      profileResult,
      consultationsResult,
      treatmentPlansResult,
      exerciseLogsResult
    ] = await Promise.all([
      db.select().from(patientProfiles).where(eq(patientProfiles.user_id, patient_id)),
      db.select().from(consultations).where(eq(consultations.patient_id, patient_id)).orderBy(desc(consultations.consultation_date)),
      db.select().from(treatmentPlans).where(eq(treatmentPlans.patient_id, patient_id)).orderBy(desc(treatmentPlans.start_date)),
      db.select().from(exerciseLogs).where(eq(exerciseLogs.patient_id, patient_id)).orderBy(desc(exerciseLogs.log_date))
    ]);

    const profile = profileResult[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        status: profile ? profile.status : 'unknown',
        consultations: consultationsResult,
        treatment_plans: treatmentPlansResult,
        exercise_logs: exerciseLogsResult
      }
    });

  } catch (error) {
    console.error('Error fetching patient history:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
