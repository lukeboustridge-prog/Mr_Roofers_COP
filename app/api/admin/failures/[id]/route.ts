import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { failureCases, detailFailureLinks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { updateFailureSchema, validateBody } from '@/lib/validations';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

// PATCH - Update a failure case
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

    // Check if failure case exists
    const [existing] = await db
      .select()
      .from(failureCases)
      .where(eq(failureCases.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Failure case not found' }, { status: 404 });
    }

    const validation = await validateBody(updateFailureSchema, request);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    const [updated] = await db
      .update(failureCases)
      .set({
        caseId: data.caseId ?? existing.caseId,
        substrateTags: data.substrateTags !== undefined ? data.substrateTags : existing.substrateTags,
        detailTags: data.detailTags !== undefined ? data.detailTags : existing.detailTags,
        failureType: data.failureType !== undefined ? data.failureType : existing.failureType,
        nzbcClauses: data.nzbcClauses !== undefined ? data.nzbcClauses : existing.nzbcClauses,
        outcome: data.outcome !== undefined ? data.outcome : existing.outcome,
        summary: data.summary !== undefined ? data.summary : existing.summary,
        sourceUrl: data.sourceUrl !== undefined ? data.sourceUrl : existing.sourceUrl,
        decisionDate: data.decisionDate !== undefined
          ? data.decisionDate ? new Date(data.decisionDate) : null
          : existing.decisionDate,
      })
      .where(eq(failureCases.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating failure case:', error);
    return NextResponse.json(
      { error: 'Failed to update failure case' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a failure case
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

    // Check if failure case exists
    const [existing] = await db
      .select()
      .from(failureCases)
      .where(eq(failureCases.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Failure case not found' }, { status: 404 });
    }

    // Delete links first
    await db.delete(detailFailureLinks).where(eq(detailFailureLinks.failureCaseId, id));

    // Delete the failure case
    await db.delete(failureCases).where(eq(failureCases.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting failure case:', error);
    return NextResponse.json(
      { error: 'Failed to delete failure case' },
      { status: 500 }
    );
  }
}
