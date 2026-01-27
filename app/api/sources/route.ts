import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getAllContentSources, getContentSourcesWithCounts } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const includeCounts = request.nextUrl.searchParams.get('counts') === 'true';

    if (includeCounts) {
      const sources = await getContentSourcesWithCounts();
      return NextResponse.json({ data: sources });
    }

    const sources = await getAllContentSources();
    return NextResponse.json({ data: sources });
  } catch (error) {
    console.error('Error fetching content sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content sources' },
      { status: 500 }
    );
  }
}
