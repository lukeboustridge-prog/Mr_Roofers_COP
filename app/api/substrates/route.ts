import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getAllSubstrates, getSubstratesWithCounts } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const includeCounts = request.nextUrl.searchParams.get('counts') === 'true';

    if (includeCounts) {
      const substrates = await getSubstratesWithCounts();
      return NextResponse.json({ data: substrates });
    }

    const substrates = await getAllSubstrates();
    return NextResponse.json({ data: substrates });
  } catch (error) {
    console.error('Error fetching substrates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch substrates' },
      { status: 500 }
    );
  }
}
