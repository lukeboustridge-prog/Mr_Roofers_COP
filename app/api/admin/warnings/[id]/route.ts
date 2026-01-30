import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { warningConditions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { warningSchema, validateBody } from '@/lib/validations';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

// PATCH - Update a warning
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if warning exists
    const [existing] = await db
      .select()
      .from(warningConditions)
      .where(eq(warningConditions.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Warning not found' }, { status: 404 });
    }

    const validation = await validateBody(warningSchema, request);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    const [updated] = await db
      .update(warningConditions)
      .set({
        conditionType: data.conditionType,
        conditionValue: data.conditionValue,
        warningText: data.warningText,
        severity: data.severity,
        nzbcRef: data.nzbcRef || null,
      })
      .where(eq(warningConditions.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating warning:', error);
    return NextResponse.json(
      { error: 'Failed to update warning' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a warning
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Check if warning exists
    const [existing] = await db
      .select()
      .from(warningConditions)
      .where(eq(warningConditions.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Warning not found' }, { status: 404 });
    }

    await db.delete(warningConditions).where(eq(warningConditions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting warning:', error);
    return NextResponse.json(
      { error: 'Failed to delete warning' },
      { status: 500 }
    );
  }
}
