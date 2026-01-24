import { NextResponse } from 'next/server';
import { getAllSubstrates } from '@/lib/db/queries';

export async function GET() {
  try {
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
