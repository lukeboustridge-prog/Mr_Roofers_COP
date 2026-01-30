import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getContentSourceById, updateContentSource, deleteContentSource } from '@/lib/db/queries';
import { updateContentSourceSchema, validateBody } from '@/lib/validations';
import { db } from '@/lib/db';
import { details } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

// GET - Get a single content source
export async function GET(
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
    const source = await getContentSourceById(id);

    if (!source) {
      return NextResponse.json({ error: 'Content source not found' }, { status: 404 });
    }

    // Get detail count for this source
    const [detailCount] = await db
      .select({ count: count() })
      .from(details)
      .where(eq(details.sourceId, id));

    return NextResponse.json({
      data: {
        ...source,
        detailCount: Number(detailCount?.count) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching content source:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content source' },
      { status: 500 }
    );
  }
}

// PATCH - Update a content source
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
    const validation = await validateBody(updateContentSourceSchema, request);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check if source exists
    const existing = await getContentSourceById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Content source not found' }, { status: 404 });
    }

    const updated = await updateContentSource(id, validation.data);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating content source:', error);
    return NextResponse.json(
      { error: 'Failed to update content source' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a content source
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

    // Check if source exists
    const existing = await getContentSourceById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Content source not found' }, { status: 404 });
    }

    // Check if source is still in use
    const [detailCount] = await db
      .select({ count: count() })
      .from(details)
      .where(eq(details.sourceId, id));

    if ((detailCount?.count || 0) > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${detailCount.count} details are still using this source` },
        { status: 409 }
      );
    }

    await deleteContentSource(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content source:', error);
    return NextResponse.json(
      { error: 'Failed to delete content source' },
      { status: 500 }
    );
  }
}
