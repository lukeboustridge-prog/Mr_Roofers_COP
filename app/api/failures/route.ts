import { NextRequest, NextResponse } from 'next/server';
import { getAllFailureCases } from '@/lib/db/queries';
import { failuresQuerySchema, validateQuery, parseSearchParams } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request.nextUrl.searchParams);
    const validation = validateQuery(failuresQuerySchema, params);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { limit, offset, outcome, type, substrate } = validation.data;

    const results = await getAllFailureCases({ limit, offset, outcome, type, substrate });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching failures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch failure cases' },
      { status: 500 }
    );
  }
}
