import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { details, detailSteps } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

// GET - Get step-by-step instructions for a detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify detail exists
    const [detail] = await db
      .select({
        id: details.id,
        code: details.code,
        name: details.name,
      })
      .from(details)
      .where(eq(details.id, id))
      .limit(1);

    if (!detail) {
      return NextResponse.json(
        { error: 'Detail not found' },
        { status: 404 }
      );
    }

    // Get steps for this detail
    const steps = await db
      .select({
        id: detailSteps.id,
        detailId: detailSteps.detailId,
        stepNumber: detailSteps.stepNumber,
        instruction: detailSteps.instruction,
        imageUrl: detailSteps.imageUrl,
        cautionNote: detailSteps.cautionNote,
      })
      .from(detailSteps)
      .where(eq(detailSteps.detailId, id))
      .orderBy(asc(detailSteps.stepNumber));

    return NextResponse.json({
      success: true,
      data: {
        detailId: detail.id,
        detailCode: detail.code,
        detailName: detail.name,
        steps: steps.map((step) => ({
          id: step.id,
          stepNumber: step.stepNumber,
          instruction: step.instruction,
          imageUrl: step.imageUrl,
          cautionNote: step.cautionNote,
        })),
        totalSteps: steps.length,
      },
    });
  } catch (error) {
    console.error('Error fetching detail steps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detail steps' },
      { status: 500 }
    );
  }
}
