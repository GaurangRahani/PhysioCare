import { db } from "../src/db/index.js";
import { users } from "../src/db/schema/users.js";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";

/**
 * Admin-only middleware.
 * Uses the same getAuth(req) pattern as requireAuth — no manual token parsing needed
 * since clerkMiddleware() is applied globally in server.js.
 */
export async function requireAdmin(req, res, next) {
  try {
    const auth = getAuth(req);

    if (!auth || !auth.userId) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    // Resolve Clerk ID → internal DB user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerk_id, auth.userId));

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "Account deactivated" });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    console.error("Admin auth error:", err.message);
    return res.status(401).json({ error: "Invalid session" });
  }
}
