import { Webhook } from 'svix';
import { db } from '../src/db/index.js';
import { users } from '../src/db/schema/index.js';

export const clerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('You need a WEBHOOK_SECRET in your .env');
  }

  // Get the headers
  const headers = req.headers;
  // Express raw body is a Buffer, we must convert it to a string for svix
  const payload = req.body.toString('utf8');

  // Get the Svix headers for verification
  const svix_id = headers['svix-id'];
  const svix_timestamp = headers['svix-timestamp'];
  const svix_signature = headers['svix-signature'];

  // If there are no Svix headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({
      success: false,
      message: 'Error occurred -- no svix headers',
    });
  }

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Attempt to verify the incoming webhook
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.log('Error verifying webhook:', err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // The payload is verified! Now handle the event
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created') {
    console.log(`User ${id} was created in Clerk! Syncing to DB...`);
    const { id: clerkId, email_addresses, first_name, last_name, phone_numbers } = evt.data;

    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown';
    const phone = phone_numbers?.[0]?.phone_number || null;

    try {
      // Insert into PostgreSQL using Drizzle
      const insertedUser = await db.insert(users).values({
        clerk_id: clerkId,
        email: email,
        name: name,
        phone: phone,
        role: 'patient',
      }).onConflictDoNothing().returning(); // Silently ignores duplicate emails/users so webhook doesn't crash!
      
      if (insertedUser.length === 0) {
        console.log('⚠️ User already existed in database. Ignored duplicate webhook.');
      } else {
        console.log('✅ Successfully saved new user to PostgreSQL database!');
      }
    } catch (error) {
      console.error(' Error saving user to database:', error);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Webhook processed successfully',
  });
};
