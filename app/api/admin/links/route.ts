import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getAllLinks, createDetailLink } from '@/lib/db/queries/detail-links';

export const dynamic = 'force-dynamic';

async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

// Validation schema for creating a link
const createLinkSchema = z.object({
  primaryDetailId: z.string().min(1, 'Primary detail ID is required'),
  supplementaryDetailId: z.string().min(1, 'Supplementary detail ID is required'),
  linkType: z.enum(['installation_guide', 'technical_supplement', 'alternative']),
  matchConfidence: z.enum(['exact', 'partial', 'related']).optional(),
  notes: z.string().optional(),
});

// GET - List all links
export async function GET() {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const links = await getAllLinks();
    return NextResponse.json({ data: links });
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch links' },
      { status: 500 }
    );
  }
}

// POST - Create a new link
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const validation = createLinkSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { primaryDetailId, supplementaryDetailId, linkType, matchConfidence, notes } = validation.data;

    const link = await createDetailLink(
      primaryDetailId,
      supplementaryDetailId,
      linkType,
      matchConfidence,
      notes
    );

    return NextResponse.json({ success: true, data: link }, { status: 201 });
  } catch (error) {
    console.error('Error creating link:', error);

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'A link between these details already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    );
  }
}
