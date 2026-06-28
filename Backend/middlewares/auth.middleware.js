import { db } from '../src/db/index.js';
import { users } from '../src/db/schema/index.js';
import { eq } from 'drizzle-orm';
import { getAuth } from '@clerk/express';

// 1. Checks if the user has a valid Clerk session token (or bypasses via x-dev-email)
export const requireAuth = async (req, res, next) => {
  //temporary bypass as of now for dev mode
  const devEmail = req.headers['x-dev-email'];
  if (process.env.NODE_ENV !== 'production' && devEmail) {
    const [user] = await db.select().from(users).where(eq(users.email, devEmail));
    if (!user) return res.status(404).json({ success: false, message: 'Dev bypass user not found' });
    req.user = user;
    req.clerkAuth = { userId: user.clerk_id }; // Mock clerk auth
    return next();
  }

  const auth = getAuth(req);

  if (!auth || !auth.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
  }

  // Attach auth object properly for later use
  req.clerkAuth = auth;
  next();
};

// 2. Checks if the user has the correct role in our database
export const requireRole = (allowedRoles) => async (req, res, next) => {
  try {
    // If dev bypass already attached req.user, skip the DB lookup!
    let user = req.user;

    if (!user) {
      const auth = getAuth(req);
      const [dbUser] = await db.select().from(users).where(eq(users.clerk_id, auth.userId));
      user = dbUser;
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found in database.' });
    }

    // Check if their role is in the allowed list
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ success: false, message: `Forbidden. Requires one of: ${allowedRoles.join(', ')}` });
    }

    // Attach the database user object to the request so controllers don't have to fetch it again!
    req.user = user;
    next();
  } catch (error) {
    console.error('Role middleware error:', error);
    return res.status(500).json({ success: false, message: 'Server error checking role.' });
  }
};
