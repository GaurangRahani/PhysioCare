import { getAuth, clerkClient } from '@clerk/express';

export const getMe = async (req, res) => {
  try {
    // req.user is guaranteed to be set by the requireRole middleware
    if (!req.user) {
       return res.status(404).json({ success: false, message: 'User not found in DB' });
    }
    
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const clearPasswordFlag = async (req, res) => {
  try {
    const auth = getAuth(req);
    if (!auth.userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Get current user metadata to preserve other fields
    const clerkUser = await clerkClient.users.getUser(auth.userId);
    const existingMetadata = clerkUser.publicMetadata || {};

    // Set the force_password_change flag to false
    // Note: Clerk performs deep merges, so we must explicitly set it to false rather than just deleting the key
    const newMetadata = { ...existingMetadata, force_password_change: false };

    await clerkClient.users.updateUserMetadata(auth.userId, {
      publicMetadata: newMetadata
    });

    return res.status(200).json({ success: true, message: 'Password flag cleared successfully' });
  } catch (error) {
    console.error('Error clearing password flag:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
