import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { warningConditions, details } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { warningSchema, validateBody } from '@/lib/validations';
import { z } from 'zod';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

const createWarningSchema = warningSchema.extend({
  detailId: z.string().min(1, 'Detail ID is required'),
});

// POST - Create a new warning
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const validation = await validateBody(createWarningSchema, request);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    // Verify the detail exists
    const [detail] = await db
      .select()
      .from(details)
      .where(eq(details.id, data.detailId))
      .limit(1);

    if (!detail) {
      return NextResponse.json({ error: 'Detail not found' }, { status: 404 });
    }

    const warningId = `warning-${data.detailId}-${Date.now()}`;

    const [newWarning] = await db
      .insert(warningConditions)
      .values({
        id: warningId,
        detailId: data.detailId,
        conditionType: data.conditionType,
        conditionValue: data.conditionValue,
        warningText: data.warningText,
        severity: data.severity,
        nzbcRef: data.nzbcRef || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: newWarning }, { status: 201 });
  } catch (error) {
    console.error('Error creating warning:', error);
    return NextResponse.json(
      { error: 'Failed to create warning' },
      { status: 500 }
    );
  }
}
