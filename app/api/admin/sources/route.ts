import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
import { createContentSource, getAllContentSources, getContentSourcesWithCounts } from '@/lib/db/queries';
import { createContentSourceSchema, validateBody } from '@/lib/validations';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

// GET - List all content sources (admin can see counts)
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

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

// POST - Create a new content source
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const validation = await validateBody(createContentSourceSchema, request);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const source = await createContentSource(validation.data);

    return NextResponse.json({ success: true, data: source }, { status: 201 });
  } catch (error) {
    console.error('Error creating content source:', error);

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'A content source with this ID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create content source' },
      { status: 500 }
    );
  }
}
