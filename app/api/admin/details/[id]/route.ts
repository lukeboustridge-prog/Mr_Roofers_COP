import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { details } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateDetailSchema, validateBody } from '@/lib/validations';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

// PATCH - Update a detail
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
    const validation = await validateBody(updateDetailSchema, request);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    // Check if detail exists
    const [existing] = await db
      .select()
      .from(details)
      .where(eq(details.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Detail not found' }, { status: 404 });
    }

    // Update the detail
    const [updated] = await db
      .update(details)
      .set({
        code: data.code ?? existing.code,
        name: data.name ?? existing.name,
        description: data.description !== undefined ? data.description : existing.description,
        substrateId: data.substrateId ?? existing.substrateId,
        categoryId: data.categoryId ?? existing.categoryId,
        subcategoryId: data.subcategoryId !== undefined ? data.subcategoryId : existing.subcategoryId,
        sourceId: data.sourceId !== undefined ? data.sourceId : existing.sourceId,
        modelUrl: data.modelUrl !== undefined ? data.modelUrl : existing.modelUrl,
        thumbnailUrl: data.thumbnailUrl !== undefined ? data.thumbnailUrl : existing.thumbnailUrl,
        minPitch: data.minPitch !== undefined ? data.minPitch : existing.minPitch,
        maxPitch: data.maxPitch !== undefined ? data.maxPitch : existing.maxPitch,
        specifications: data.specifications !== undefined ? data.specifications : existing.specifications,
        standardsRefs: data.standardsRefs !== undefined ? data.standardsRefs : existing.standardsRefs,
        ventilationReqs: data.ventilationReqs !== undefined ? data.ventilationReqs : existing.ventilationReqs,
        updatedAt: new Date(),
      })
      .where(eq(details.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating detail:', error);
    return NextResponse.json(
      { error: 'Failed to update detail' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a detail
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

    // Check if detail exists
    const [existing] = await db
      .select()
      .from(details)
      .where(eq(details.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Detail not found' }, { status: 404 });
    }

    // Delete the detail (cascade will handle related records)
    await db.delete(details).where(eq(details.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting detail:', error);
    return NextResponse.json(
      { error: 'Failed to delete detail' },
      { status: 500 }
    );
  }
}
