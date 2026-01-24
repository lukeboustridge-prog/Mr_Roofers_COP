import { NextRequest, NextResponse } from 'next/server';
import { getFailureCaseById } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const failureCase = await getFailureCaseById(id);

    if (!failureCase) {
      return NextResponse.json(
        { error: 'Failure case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(failureCase);
  } catch (error) {
    console.error('Error fetching failure case:', error);
    return NextResponse.json(
      { error: 'Failed to fetch failure case' },
      { status: 500 }
    );
  }
}
