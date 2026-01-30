import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { detailFailureLinks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

// DELETE - Unlink a detail from a failure case
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; detailId: string } }
) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id: failureCaseId, detailId } = params;

    // Delete the link
    await db
      .delete(detailFailureLinks)
      .where(
        and(
          eq(detailFailureLinks.detailId, detailId),
          eq(detailFailureLinks.failureCaseId, failureCaseId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking detail from failure case:', error);
    return NextResponse.json(
      { error: 'Failed to unlink detail' },
      { status: 500 }
    );
  }
}
