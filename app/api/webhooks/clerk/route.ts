import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userFavourites, userHistory, checklists } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// This webhook handler syncs Clerk user data to our database

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: 'Missing svix headers' },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with the secret
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the webhook event
  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses?.find(e => e.id === evt.data.primary_email_address_id)?.email_address
          || email_addresses?.[0]?.email_address;

        if (!primaryEmail) {
          console.error('No email found for user:', id);
          return NextResponse.json({ error: 'No email found' }, { status: 400 });
        }

        const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;

        await db.insert(users).values({
          id,
          email: primaryEmail,
          name: fullName,
          imageUrl: image_url || null,
          preferences: {},
        }).onConflictDoUpdate({
          target: users.id,
          set: {
            email: primaryEmail,
            name: fullName,
            imageUrl: image_url || null,
            updatedAt: new Date(),
          },
        });

        console.log('User synced to database:', id);
        break;
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses?.find(e => e.id === evt.data.primary_email_address_id)?.email_address
          || email_addresses?.[0]?.email_address;

        if (!primaryEmail) {
          console.error('No email found for user:', id);
          return NextResponse.json({ error: 'No email found' }, { status: 400 });
        }

        const fullName = [first_name, last_name].filter(Boolean).join(' ') || null;

        // Upsert in case the user wasn't created via webhook initially
        await db.insert(users).values({
          id,
          email: primaryEmail,
          name: fullName,
          imageUrl: image_url || null,
          preferences: {},
        }).onConflictDoUpdate({
          target: users.id,
          set: {
            email: primaryEmail,
            name: fullName,
            imageUrl: image_url || null,
            updatedAt: new Date(),
          },
        });

        console.log('User updated in database:', id);
        break;
      }

      case 'user.deleted': {
        const { id } = evt.data;

        if (!id) {
          console.error('No user ID in deletion event');
          return NextResponse.json({ error: 'No user ID' }, { status: 400 });
        }

        // Delete user's related data first (foreign key constraints)
        await db.delete(userFavourites).where(eq(userFavourites.userId, id));
        await db.delete(userHistory).where(eq(userHistory.userId, id));
        await db.delete(checklists).where(eq(checklists.userId, id));

        // Delete the user record
        await db.delete(users).where(eq(users.id, id));

        console.log('User and related data deleted:', id);
        break;
      }

      default:
        console.log('Unhandled webhook event:', eventType);
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
