import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { checklists, details } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateChecklistSchema = z.object({
  projectRef: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string(),
        item: z.string(),
        completed: z.boolean(),
        note: z.string().optional(),
        photoUrl: z.string().optional(),
        required: z.boolean().optional(),
        isCaution: z.boolean().optional(),
      })
    )
    .optional(),
  completedAt: z.string().datetime().nullable().optional(),
});

// GET - Get a specific checklist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [result] = await db
      .select({
        checklist: checklists,
        detail: details,
      })
      .from(checklists)
      .leftJoin(details, eq(checklists.detailId, details.id))
      .where(and(eq(checklists.id, id), eq(checklists.userId, userId)))
      .limit(1);

    if (!result) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      );
    }

    const { checklist, detail } = result;

    return NextResponse.json({
      success: true,
      data: {
        id: checklist.id,
        detailId: checklist.detailId,
        detailCode: detail?.code || '',
        detailName: detail?.name || '',
        substrateId: detail?.substrateId || null,
        categoryId: detail?.categoryId || null,
        projectRef: checklist.projectRef,
        items: checklist.items as Array<{
          id: string;
          item: string;
          completed: boolean;
          note?: string;
          photoUrl?: string;
        }>,
        completedAt: checklist.completedAt,
        createdAt: checklist.createdAt,
        updatedAt: checklist.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checklist' },
      { status: 500 }
    );
  }
}

// PATCH - Update a checklist
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if checklist exists and belongs to user
    const [existing] = await db
      .select()
      .from(checklists)
      .where(and(eq(checklists.id, id), eq(checklists.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = updateChecklistSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { projectRef, items, completedAt } = validationResult.data;

    const updateData: {
      projectRef?: string | null;
      items?: unknown;
      completedAt?: Date | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (projectRef !== undefined) {
      updateData.projectRef = projectRef || null;
    }

    if (items !== undefined) {
      updateData.items = items;
    }

    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null;
    }

    await db
      .update(checklists)
      .set(updateData)
      .where(eq(checklists.id, id));

    return NextResponse.json({
      success: true,
      message: 'Checklist updated',
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json(
      { error: 'Failed to update checklist' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a checklist
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if checklist exists and belongs to user
    const [existing] = await db
      .select()
      .from(checklists)
      .where(and(eq(checklists.id, id), eq(checklists.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Checklist not found' },
        { status: 404 }
      );
    }

    await db.delete(checklists).where(eq(checklists.id, id));

    return NextResponse.json({
      success: true,
      message: 'Checklist deleted',
    });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    return NextResponse.json(
      { error: 'Failed to delete checklist' },
      { status: 500 }
    );
  }
}
