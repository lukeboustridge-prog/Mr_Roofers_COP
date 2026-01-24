import { NextRequest, NextResponse } from 'next/server';
import { getDetailById, getDetailByCode } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try to get by ID first, then by code
    let detail = await getDetailById(id);
    if (!detail) {
      detail = await getDetailByCode(id.toUpperCase());
    }

    if (!detail) {
      return NextResponse.json(
        { error: 'Detail not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error('Error fetching detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detail' },
      { status: 500 }
    );
  }
}
