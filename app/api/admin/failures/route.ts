import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { failureCases } from '@/lib/db/schema';
import { createFailureSchema, validateBody } from '@/lib/validations';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

// POST - Create a new failure case
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const validation = await validateBody(createFailureSchema, request);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;
    const failureId = `failure-${Date.now()}`;

    const [newFailure] = await db
      .insert(failureCases)
      .values({
        id: failureId,
        caseId: data.caseId,
        substrateTags: data.substrateTags || null,
        detailTags: data.detailTags || null,
        failureType: data.failureType || null,
        nzbcClauses: data.nzbcClauses || null,
        outcome: data.outcome || null,
        summary: data.summary || null,
        sourceUrl: data.sourceUrl || null,
        decisionDate: data.decisionDate ? new Date(data.decisionDate) : null,
      })
      .returning();

    return NextResponse.json({ success: true, data: newFailure }, { status: 201 });
  } catch (error) {
    console.error('Error creating failure case:', error);

    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'A failure case with this case ID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create failure case' },
      { status: 500 }
    );
  }
}
