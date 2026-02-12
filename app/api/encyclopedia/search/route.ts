import { NextResponse } from 'next/server';
import { searchCopSections } from '@/lib/encyclopedia/search-index';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = searchCopSections(q.trim(), 15);

  return NextResponse.json({ results });
}
