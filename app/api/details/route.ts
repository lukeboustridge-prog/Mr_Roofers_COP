import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getDetailsByCategory, getDetailsBySubstrate, searchDetails } from '@/lib/db/queries';
import { detailsQuerySchema, createDetailSchema, validateQuery, validateBody, parseSearchParams } from '@/lib/validations';
import { db } from '@/lib/db';
import { details } from '@/lib/db/schema';

// Helper to check if user has admin role
async function isAdmin(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;

  // Check for admin role in public metadata
  const role = user.publicMetadata?.role as string | undefined;
  return role === 'admin';
}

export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request.nextUrl.searchParams);
    const validation = validateQuery(detailsQuerySchema, params);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { substrate: substrateId, category: categoryId, q: query, limit, offset } = validation.data;

    // If there's a search query, use search
    if (query) {
      const results = await searchDetails(query, { substrateId, categoryId, limit, offset });
      return NextResponse.json(results);
    }

    // If category specified, get details by category
    if (categoryId) {
      const results = await getDetailsByCategory(categoryId, { limit, offset });
      return NextResponse.json(results);
    }

    // If substrate specified, get all details for substrate
    if (substrateId) {
      const results = await getDetailsBySubstrate(substrateId, { limit, offset });
      return NextResponse.json(results);
    }

    // Default: return empty result
    return NextResponse.json({ details: [], total: 0, limit, offset });
  } catch (error) {
    console.error('Error fetching details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch details' },
      { status: 500 }
    );
  }
}

// POST - Create a new detail (admin only)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin role
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const validation = await validateBody(createDetailSchema, request);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const data = validation.data;

    // Insert the new detail
    const [newDetail] = await db.insert(details).values({
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description || null,
      substrateId: data.substrateId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId || null,
      modelUrl: data.modelUrl || null,
      thumbnailUrl: data.thumbnailUrl || null,
      minPitch: data.minPitch || null,
      maxPitch: data.maxPitch || null,
      specifications: data.specifications || null,
      standardsRefs: data.standardsRefs || null,
      ventilationReqs: data.ventilationReqs || null,
    }).returning();

    return NextResponse.json({
      success: true,
      data: newDetail,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating detail:', error);

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'A detail with this ID or code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create detail' },
      { status: 500 }
    );
  }
}
