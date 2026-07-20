import { db } from "../src/db/index.js";
import {
  users,
  patientProfiles,
  doctorProfiles,
} from "../src/db/schema/index.js";
import { eq } from "drizzle-orm";
import { getAuth, clerkClient } from "@clerk/express";

// 1. Checks if the user has a valid Clerk session token (or bypasses via x-dev-email)
// AND attaches the user database object to req.user
export const requireAuth = async (req, res, next) => {
  try {
    //temporary bypass as of now for dev mode
    const devEmail = req.headers["x-dev-email"];
    if (process.env.NODE_ENV !== "production" && devEmail) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, devEmail));
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "Dev bypass user not found" });
      req.user = user;
      req.clerkAuth = { userId: user.clerk_id }; // Mock clerk auth
      return next();
    }

    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized. Please log in." });
    }

    req.clerkAuth = auth;

    // Fetch user from our database
    let [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerk_id, auth.userId));

    // JIT Provisioning Fallback: If user exists in Clerk but not in our DB
    if (!dbUser) {
      try {
        const clerkUser = await clerkClient.users.getUser(auth.userId);
        if (clerkUser) {
          const email = clerkUser.emailAddresses[0]?.emailAddress;
          const name =
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
            "Unknown";
          const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;

          const [newUser] = await db
            .insert(users)
            .values({
              clerk_id: clerkUser.id,
              email: email,
              name: name,
              phone: phone,
              role: "patient", // Default role
            })
            .onConflictDoNothing()
            .returning(); // In case of race conditions

          dbUser = newUser;
        }
      } catch (clerkErr) {
        console.error("JIT Provisioning failed to fetch from Clerk:", clerkErr);
      }
    }

    if (!dbUser) {
      return res
        .status(404)
        .json({
          success: false,
          message: "User not found in database and JIT sync failed.",
        });
    }

    if (!dbUser.is_active) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Your account has been deactivated. Please contact the clinic.",
        });
    }

    req.user = dbUser;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Server error checking authentication.",
      });
  }
};

// 2. Checks if the user has the correct role in our database
// (Assumes requireAuth has already run and populated req.user)
export const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized. req.user missing." });
  }

  // Check if their role is in the allowed list
  if (!allowedRoles.includes(req.user.role)) {
    return res
      .status(403)
      .json({
        success: false,
        message: `Forbidden. Requires one of: ${allowedRoles.join(", ")}`,
      });
  }

  next();
};
