import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { categories, substrates, details } from '@/lib/db/schema';
import { eq, asc, count } from 'drizzle-orm';
import { categoriesQuerySchema, validateQuery, parseSearchParams } from '@/lib/validations';

// GET - List all categories with optional substrate filter, or get single category by id
export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request.nextUrl.searchParams);

    // If id is provided, return single category
    if (params.id) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, params.id))
        .limit(1);

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }

      return NextResponse.json({ category });
    }

    const validation = validateQuery(categoriesQuerySchema, params);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { substrateId } = validation.data;

    // Build base query
    let query = db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        iconUrl: categories.iconUrl,
        sortOrder: categories.sortOrder,
        substrateId: categories.substrateId,
        substrateName: substrates.name,
      })
      .from(categories)
      .leftJoin(substrates, eq(categories.substrateId, substrates.id))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    // Apply substrate filter if provided
    if (substrateId) {
      query = query.where(eq(categories.substrateId, substrateId)) as typeof query;
    }

    const categoryList = await query;

    // Get detail counts for each category
    const detailCounts = await db
      .select({
        categoryId: details.categoryId,
        count: count(),
      })
      .from(details)
      .groupBy(details.categoryId);

    const countMap = new Map(
      detailCounts.map((dc) => [dc.categoryId, dc.count])
    );

    // Format response
    const formattedCategories = categoryList.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      iconUrl: cat.iconUrl,
      sortOrder: cat.sortOrder,
      substrate: cat.substrateId
        ? {
            id: cat.substrateId,
            name: cat.substrateName,
          }
        : null,
      detailCount: countMap.get(cat.id) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: formattedCategories,
      total: formattedCategories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
