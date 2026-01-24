import { NextRequest, NextResponse } from 'next/server';
import { getDetailsForFixer } from '@/lib/db/queries';
import { fixerQuerySchema, validateQuery, parseSearchParams } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request.nextUrl.searchParams);
    const validation = validateQuery(fixerQuerySchema, params);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { substrate, task, limit, offset } = validation.data;

    const result = await getDetailsForFixer(substrate, task, {
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in fixer API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch details' },
      { status: 500 }
    );
  }
}
