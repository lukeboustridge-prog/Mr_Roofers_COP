import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserFavourites, addUserFavourite, removeUserFavourite } from '@/lib/db/queries';
import { addFavouriteSchema, idSchema, validateBody, parseSearchParams } from '@/lib/validations';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favourites = await getUserFavourites(userId);

    return NextResponse.json({
      success: true,
      data: favourites,
    });
  } catch (error) {
    console.error('Error fetching favourites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favourites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateBody(addFavouriteSchema, request);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { detailId } = validation.data;

    await addUserFavourite(userId, detailId);

    return NextResponse.json({
      success: true,
      message: 'Favourite added',
    });
  } catch (error) {
    console.error('Error adding favourite:', error);
    return NextResponse.json(
      { error: 'Failed to add favourite' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = parseSearchParams(request.nextUrl.searchParams);
    const result = idSchema.safeParse(params.detailId);

    if (!result.success) {
      return NextResponse.json({ error: 'Detail ID is required' }, { status: 400 });
    }

    const detailId = result.data;

    await removeUserFavourite(userId, detailId);

    return NextResponse.json({
      success: true,
      message: 'Favourite removed',
    });
  } catch (error) {
    console.error('Error removing favourite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favourite' },
      { status: 500 }
    );
  }
}
