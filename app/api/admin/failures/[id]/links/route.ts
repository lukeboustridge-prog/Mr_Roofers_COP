import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { detailFailureLinks, failureCases, details } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

const linkSchema = z.object({
  detailId: z.string().min(1, 'Detail ID is required'),
});

// POST - Link a detail to a failure case
export async function POST(
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

    const { id: failureCaseId } = params;

    // Check if failure case exists
    const [failureCase] = await db
      .select()
      .from(failureCases)
      .where(eq(failureCases.id, failureCaseId))
      .limit(1);

    if (!failureCase) {
      return NextResponse.json({ error: 'Failure case not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = linkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { detailId } = validation.data;

    // Check if detail exists
    const [detail] = await db
      .select()
      .from(details)
      .where(eq(details.id, detailId))
      .limit(1);

    if (!detail) {
      return NextResponse.json({ error: 'Detail not found' }, { status: 404 });
    }

    // Check if link already exists
    const [existingLink] = await db
      .select()
      .from(detailFailureLinks)
      .where(
        and(
          eq(detailFailureLinks.detailId, detailId),
          eq(detailFailureLinks.failureCaseId, failureCaseId)
        )
      )
      .limit(1);

    if (existingLink) {
      return NextResponse.json(
        { error: 'This detail is already linked to this failure case' },
        { status: 409 }
      );
    }

    // Create the link
    await db.insert(detailFailureLinks).values({
      detailId,
      failureCaseId,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error linking detail to failure case:', error);
    return NextResponse.json(
      { error: 'Failed to link detail' },
      { status: 500 }
    );
  }
}
