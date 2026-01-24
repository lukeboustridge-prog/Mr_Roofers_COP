import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { checklists, details } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';

const createChecklistSchema = z.object({
  detailId: z.string().min(1),
  projectRef: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      item: z.string(),
      completed: z.boolean(),
      note: z.string().optional(),
      photoUrl: z.string().optional(),
      required: z.boolean().optional(),
      isCaution: z.boolean().optional(),
    })
  ),
  completedAt: z.string().datetime().optional(),
});

// GET - List user's checklists
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const detailId = searchParams.get('detailId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let whereClause = eq(checklists.userId, userId);
    if (detailId) {
      whereClause = and(whereClause, eq(checklists.detailId, detailId))!;
    }

    const userChecklists = await db
      .select({
        checklist: checklists,
        detail: details,
      })
      .from(checklists)
      .leftJoin(details, eq(checklists.detailId, details.id))
      .where(whereClause)
      .orderBy(desc(checklists.updatedAt))
      .limit(limit)
      .offset(offset);

    const formattedChecklists = userChecklists.map(({ checklist, detail }) => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: formattedChecklists,
    });
  } catch (error) {
    console.error('Error fetching checklists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch checklists' },
      { status: 500 }
    );
  }
}

// POST - Create a new checklist
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createChecklistSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { detailId, projectRef, items, completedAt } = validationResult.data;

    // Verify detail exists
    const [detail] = await db
      .select()
      .from(details)
      .where(eq(details.id, detailId))
      .limit(1);

    if (!detail) {
      return NextResponse.json(
        { error: 'Detail not found' },
        { status: 404 }
      );
    }

    const checklistId = `cl-${userId}-${detailId}-${Date.now()}`;

    await db.insert(checklists).values({
      id: checklistId,
      userId,
      detailId,
      projectRef: projectRef || null,
      items,
      completedAt: completedAt ? new Date(completedAt) : null,
    });

    return NextResponse.json({
      success: true,
      message: 'Checklist created',
      data: {
        id: checklistId,
        detailId,
        detailCode: detail.code,
        detailName: detail.name,
        substrateId: detail.substrateId,
        categoryId: detail.categoryId,
        projectRef,
        items,
        completedAt,
      },
    });
  } catch (error) {
    console.error('Error creating checklist:', error);
    return NextResponse.json(
      { error: 'Failed to create checklist' },
      { status: 500 }
    );
  }
}
