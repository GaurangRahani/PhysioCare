import { db } from "../src/db/index.js";
import {
  exercises,
  treatmentPlanExercises,
  treatmentPlans,
} from "../src/db/schema/index.js";
import { eq, and } from "drizzle-orm";

// ─── 1. POST /api/exercises ──────────────────────────────────────────────────
export const createExercise = async (req, res) => {
  try {
    const { name, description, instructions, target_body_part } = req.body;

    let video_url = req.body.video_url || null;
    let photo_urls = req.body.photo_urls || [];

    // If files were uploaded via Multer, use the Cloudinary URLs
    if (req.files && Array.isArray(req.files)) {
      const videoFile = req.files.find((f) => f.fieldname === "video");
      if (videoFile) {
        video_url = videoFile.path;
      }
      const photoFiles = req.files.filter(
        (f) => f.fieldname === "photos" || f.fieldname === "photo",
      );
      if (photoFiles.length > 0) {
        const uploadedPhotoUrls = photoFiles.map((file) => file.path);
        photo_urls = Array.isArray(photo_urls)
          ? [...photo_urls, ...uploadedPhotoUrls]
          : uploadedPhotoUrls;
      }
    }

    const [newExercise] = await db
      .insert(exercises)
      .values({
        name,
        description,
        instructions,
        target_body_part,
        video_url,
        photo_urls,
        created_by: req.user.id,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Exercise created successfully",
      exercise: newExercise,
    });
  } catch (error) {
    console.error("Error creating exercise:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 2. GET /api/exercises ───────────────────────────────────────────────────
export const getExercises = async (req, res) => {
  try {
    const { includeInactive, target_body_part } = req.query;

    let queryConditions = [];

    if (includeInactive !== "true") {
      queryConditions.push(eq(exercises.is_active, true));
    }

    if (target_body_part) {
      queryConditions.push(eq(exercises.target_body_part, target_body_part));
    }

    let result;
    if (queryConditions.length > 0) {
      result = await db
        .select()
        .from(exercises)
        .where(and(...queryConditions));
    } else {
      result = await db.select().from(exercises);
    }

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 3. PUT /api/exercises/:id ───────────────────────────────────────────────
export const updateExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, instructions, target_body_part } = req.body;

    let video_url = req.body.video_url;
    let photo_urls = req.body.photo_urls;

    if (req.files && Array.isArray(req.files)) {
      const videoFile = req.files.find((f) => f.fieldname === "video");
      if (videoFile) {
        video_url = videoFile.path;
      }
      const photoFiles = req.files.filter(
        (f) => f.fieldname === "photos" || f.fieldname === "photo",
      );
      if (photoFiles.length > 0) {
        const uploadedPhotoUrls = photoFiles.map((file) => file.path);
        photo_urls = Array.isArray(photo_urls)
          ? [...photo_urls, ...uploadedPhotoUrls]
          : uploadedPhotoUrls;
      }
    }

    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id));
    if (!exercise) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise not found" });
    }

    const [updatedExercise] = await db
      .update(exercises)
      .set({
        name,
        description,
        instructions,
        target_body_part,
        video_url,
        photo_urls,
        updated_at: new Date(),
      })
      .where(eq(exercises.id, id))
      .returning();

    return res.status(200).json({
      success: true,
      message: "Exercise updated successfully",
      exercise: updatedExercise,
    });
  } catch (error) {
    console.error("Error updating exercise:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 4. DELETE /api/exercises/:id ────────────────────────────────────────────
export const deleteExercise = async (req, res) => {
  try {
    const { id } = req.params;

    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id));
    if (!exercise) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise not found" });
    }

    if (!exercise.is_active) {
      return res
        .status(400)
        .json({ success: false, message: "Exercise is already inactive" });
    }

    // Check if exercise is in any active treatment plans
    // We join treatmentPlanExercises and treatmentPlans to find out
    const activeUsage = await db
      .select()
      .from(treatmentPlanExercises)
      .innerJoin(
        treatmentPlans,
        eq(treatmentPlanExercises.treatment_plan_id, treatmentPlans.id),
      )
      .where(
        and(
          eq(treatmentPlanExercises.exercise_id, id),
          eq(treatmentPlans.status, "active"),
        ),
      );

    // Soft delete the exercise
    await db
      .update(exercises)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(exercises.id, id));

    if (activeUsage.length > 0) {
      return res.status(200).json({
        success: true,
        message: `This exercise is part of ${activeUsage.length} active plans. It will be hidden from new assignments but existing plans are unaffected.`,
        warning: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Exercise successfully deactivated",
    });
  } catch (error) {
    console.error("Error deactivating exercise:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─── 5. PATCH /api/exercises/:id/activate ────────────────────────────────────
export const activateExercise = async (req, res) => {
  try {
    const { id } = req.params;

    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id));
    if (!exercise) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise not found" });
    }

    if (exercise.is_active) {
      return res
        .status(400)
        .json({ success: false, message: "Exercise is already active" });
    }

    await db
      .update(exercises)
      .set({ is_active: true, updated_at: new Date() })
      .where(eq(exercises.id, id));

    return res.status(200).json({
      success: true,
      message: "Exercise successfully reactivated",
    });
  } catch (error) {
    console.error("Error activating exercise:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
