import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { detailSteps, details } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

const bulkStepsSchema = z.object({
  steps: z.array(
    z.object({
      id: z.string(),
      stepNumber: z.number().int().min(1),
      instruction: z.string().min(1),
      imageUrl: z.string().url().nullable().optional(),
      cautionNote: z.string().nullable().optional(),
    })
  ),
});

// PUT - Bulk update/replace all steps for a detail
export async function PUT(
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

    const { id: detailId } = params;

    // Check if detail exists
    const [detail] = await db
      .select()
      .from(details)
      .where(eq(details.id, detailId))
      .limit(1);

    if (!detail) {
      return NextResponse.json({ error: 'Detail not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = bulkStepsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const { steps } = validation.data;

    // Delete all existing steps for this detail
    await db.delete(detailSteps).where(eq(detailSteps.detailId, detailId));

    // Insert new steps
    if (steps.length > 0) {
      const stepsToInsert = steps.map((step) => ({
        id: step.id.startsWith('new-') ? `step-${detailId}-${step.stepNumber}-${Date.now()}` : step.id,
        detailId,
        stepNumber: step.stepNumber,
        instruction: step.instruction,
        imageUrl: step.imageUrl || null,
        cautionNote: step.cautionNote || null,
      }));

      await db.insert(detailSteps).values(stepsToInsert);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating steps:', error);
    return NextResponse.json(
      { error: 'Failed to update steps' },
      { status: 500 }
    );
  }
}

// POST - Create a single step
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

    const { id: detailId } = params;

    // Check if detail exists
    const [detail] = await db
      .select()
      .from(details)
      .where(eq(details.id, detailId))
      .limit(1);

    if (!detail) {
      return NextResponse.json({ error: 'Detail not found' }, { status: 404 });
    }

    const body = await request.json();
    const stepSchema = z.object({
      stepNumber: z.number().int().min(1),
      instruction: z.string().min(1),
      imageUrl: z.string().url().nullable().optional(),
      cautionNote: z.string().nullable().optional(),
    });

    const validation = stepSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues.map((e) => e.message).join(', ') },
        { status: 400 }
      );
    }

    const stepId = `step-${detailId}-${validation.data.stepNumber}-${Date.now()}`;

    const [newStep] = await db
      .insert(detailSteps)
      .values({
        id: stepId,
        detailId,
        stepNumber: validation.data.stepNumber,
        instruction: validation.data.instruction,
        imageUrl: validation.data.imageUrl || null,
        cautionNote: validation.data.cautionNote || null,
      })
      .returning();

    return NextResponse.json({ success: true, data: newStep }, { status: 201 });
  } catch (error) {
    console.error('Error creating step:', error);
    return NextResponse.json(
      { error: 'Failed to create step' },
      { status: 500 }
    );
  }
}
