import { NextRequest, NextResponse } from 'next/server';
import { getCategoriesBySubstrate, getSubstrateById } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const substrate = await getSubstrateById(id);
    if (!substrate) {
      return NextResponse.json(
        { error: 'Substrate not found' },
        { status: 404 }
      );
    }

    const categories = await getCategoriesBySubstrate(id);

    return NextResponse.json({
      substrate,
      categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
