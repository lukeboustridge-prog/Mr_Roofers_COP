import { NextResponse } from 'next/server';
import { getTopicsWithCounts } from '@/lib/db/queries/topics';

export async function GET() {
  try {
    const topics = await getTopicsWithCounts();
    return NextResponse.json({ data: topics });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
