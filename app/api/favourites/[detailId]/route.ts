import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { userFavourites } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { idSchema } from '@/lib/validations';

// DELETE - Remove a favourite by detailId
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ detailId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { detailId: rawDetailId } = await params;
    const result = idSchema.safeParse(rawDetailId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Detail ID is required' },
        { status: 400 }
      );
    }

    const detailId = result.data;

    // Check if favourite exists
    const [existing] = await db
      .select()
      .from(userFavourites)
      .where(
        and(
          eq(userFavourites.userId, userId),
          eq(userFavourites.detailId, detailId)
        )
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Favourite not found' },
        { status: 404 }
      );
    }

    // Delete the favourite
    await db
      .delete(userFavourites)
      .where(
        and(
          eq(userFavourites.userId, userId),
          eq(userFavourites.detailId, detailId)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Favourite removed',
      data: { detailId },
    });
  } catch (error) {
    console.error('Error removing favourite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favourite' },
      { status: 500 }
    );
  }
}

// GET - Check if a detail is favourited
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ detailId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { detailId: rawDetailId } = await params;
    const result = idSchema.safeParse(rawDetailId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Detail ID is required' },
        { status: 400 }
      );
    }

    const detailId = result.data;

    const [favourite] = await db
      .select()
      .from(userFavourites)
      .where(
        and(
          eq(userFavourites.userId, userId),
          eq(userFavourites.detailId, detailId)
        )
      )
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        detailId,
        isFavourited: !!favourite,
        createdAt: favourite?.createdAt || null,
      },
    });
  } catch (error) {
    console.error('Error checking favourite status:', error);
    return NextResponse.json(
      { error: 'Failed to check favourite status' },
      { status: 500 }
    );
  }
}
