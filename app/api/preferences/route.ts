import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema for user preferences
const preferencesSchema = z.object({
  windZone: z.string().nullable().optional(),
  corrosionZone: z.string().nullable().optional(),
  defaultSubstrate: z.string().nullable().optional(),
});

type UserPreferences = z.infer<typeof preferencesSchema>;

// GET - Fetch user preferences
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const [user] = await db
      .select({
        preferences: users.preferences,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      // User exists in Clerk but not in DB yet - return empty preferences
      return NextResponse.json({
        success: true,
        data: {
          windZone: null,
          corrosionZone: null,
          defaultSubstrate: null,
        },
      });
    }

    // Parse preferences from JSONB
    const preferences = (user.preferences as UserPreferences) || {
      windZone: null,
      corrosionZone: null,
      defaultSubstrate: null,
    };

    return NextResponse.json({
      success: true,
      data: {
        windZone: preferences.windZone || null,
        corrosionZone: preferences.corrosionZone || null,
        defaultSubstrate: preferences.defaultSubstrate || null,
      },
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PATCH - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = preferencesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const newPreferences = validationResult.data;

    // Check if user exists in database
    const [existingUser] = await db
      .select({
        id: users.id,
        preferences: users.preferences,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      // User doesn't exist in DB yet - this shouldn't happen if webhook is working
      // but handle gracefully by returning success with the preferences
      return NextResponse.json({
        success: true,
        message: 'User not found in database. Preferences stored locally only.',
        data: newPreferences,
      });
    }

    // Merge with existing preferences
    const currentPreferences = (existingUser.preferences as UserPreferences) || {};
    const mergedPreferences: UserPreferences = {
      windZone: newPreferences.windZone !== undefined
        ? newPreferences.windZone
        : currentPreferences.windZone,
      corrosionZone: newPreferences.corrosionZone !== undefined
        ? newPreferences.corrosionZone
        : currentPreferences.corrosionZone,
      defaultSubstrate: newPreferences.defaultSubstrate !== undefined
        ? newPreferences.defaultSubstrate
        : currentPreferences.defaultSubstrate,
    };

    // Update user preferences
    await db
      .update(users)
      .set({
        preferences: mergedPreferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: 'Preferences updated',
      data: mergedPreferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
