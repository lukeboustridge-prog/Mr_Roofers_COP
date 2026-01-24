import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { details, failureCases, warningConditions, detailFailureLinks } from '@/lib/db/schema';
import { eq, or, ilike, asc, count, and, sql } from 'drizzle-orm';
import { searchQuerySchema, validateQuery, parseSearchParams } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request.nextUrl.searchParams);
    const validation = validateQuery(searchQuerySchema, params);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { q: query, substrate: substrateId, category: categoryId, hasWarnings, hasFailures, type: searchType, limit, offset } = validation.data;

    if (!query.trim()) {
      return NextResponse.json({
        results: [],
        total: 0,
        limit,
        offset,
      });
    }

    const searchTerm = `%${query}%`;
    const trimmedQuery = query.trim().toUpperCase();

    // Check for exact code match first (direct jump)
    if (searchType === 'code' || searchType === 'all') {
      const [exactMatch] = await db
        .select({
          id: details.id,
          code: details.code,
          name: details.name,
          description: details.description,
          substrateId: details.substrateId,
          categoryId: details.categoryId,
          thumbnailUrl: details.thumbnailUrl,
        })
        .from(details)
        .where(eq(sql`UPPER(${details.code})`, trimmedQuery))
        .limit(1);

      if (exactMatch && searchType === 'code') {
        // Direct code search - return only the exact match
        return NextResponse.json({
          results: [{
            ...exactMatch,
            type: 'detail',
            isExactMatch: true,
          }],
          total: 1,
          exactMatch: true,
          limit,
          offset,
        });
      }
    }

    const results: Array<{
      id: string;
      code: string;
      name: string;
      description: string | null;
      substrateId: string | null;
      categoryId: string | null;
      type: 'detail' | 'failure';
      warningCount: number;
      failureCount: number;
      isExactMatch?: boolean;
    }> = [];

    // Search details
    if (searchType === 'all' || searchType === 'details') {
      let whereClause = or(
        ilike(details.name, searchTerm),
        ilike(details.code, searchTerm),
        ilike(details.description, searchTerm),
        // Search in specifications JSON
        sql`${details.specifications}::text ILIKE ${searchTerm}`,
        // Search in standards refs JSON
        sql`${details.standardsRefs}::text ILIKE ${searchTerm}`
      );

      if (substrateId) {
        whereClause = and(whereClause, eq(details.substrateId, substrateId));
      }

      if (categoryId) {
        whereClause = and(whereClause, eq(details.categoryId, categoryId));
      }

      const detailResults = await db
        .select({
          id: details.id,
          code: details.code,
          name: details.name,
          description: details.description,
          substrateId: details.substrateId,
          categoryId: details.categoryId,
          thumbnailUrl: details.thumbnailUrl,
        })
        .from(details)
        .where(whereClause)
        .orderBy(asc(details.code))
        .limit(limit)
        .offset(offset);

      // Enrich with warning and failure counts
      for (const detail of detailResults) {
        const [warningCount] = await db
          .select({ count: count() })
          .from(warningConditions)
          .where(eq(warningConditions.detailId, detail.id));

        const [failureCount] = await db
          .select({ count: count() })
          .from(detailFailureLinks)
          .where(eq(detailFailureLinks.detailId, detail.id));

        const wCount = warningCount?.count || 0;
        const fCount = failureCount?.count || 0;

        // Apply filters
        if (hasWarnings && wCount === 0) continue;
        if (hasFailures && fCount === 0) continue;

        results.push({
          ...detail,
          type: 'detail',
          warningCount: wCount,
          failureCount: fCount,
          isExactMatch: detail.code.toUpperCase() === trimmedQuery,
        });
      }
    }

    // Search failure cases
    if (searchType === 'all' || searchType === 'failures') {
      const failureResults = await db
        .select({
          id: failureCases.id,
          caseId: failureCases.caseId,
          summary: failureCases.summary,
          failureType: failureCases.failureType,
          outcome: failureCases.outcome,
        })
        .from(failureCases)
        .where(
          or(
            ilike(failureCases.caseId, searchTerm),
            ilike(failureCases.summary, searchTerm),
            ilike(failureCases.failureType, searchTerm),
            sql`${failureCases.nzbcClauses}::text ILIKE ${searchTerm}`
          )
        )
        .orderBy(asc(failureCases.caseId))
        .limit(Math.floor(limit / 2)); // Limit failures to half to balance results

      for (const failure of failureResults) {
        results.push({
          id: failure.id,
          code: failure.caseId,
          name: failure.failureType || 'Failure Case',
          description: failure.summary,
          substrateId: null,
          categoryId: null,
          type: 'failure',
          warningCount: 0,
          failureCount: 0,
        });
      }
    }

    // Sort results: exact matches first, then by type and code
    results.sort((a, b) => {
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;
      if (a.type === 'detail' && b.type === 'failure') return -1;
      if (a.type === 'failure' && b.type === 'detail') return 1;
      return a.code.localeCompare(b.code);
    });

    // Get total count for pagination
    let totalCount = results.length;
    if (searchType === 'all' || searchType === 'details') {
      let whereClause = or(
        ilike(details.name, searchTerm),
        ilike(details.code, searchTerm),
        ilike(details.description, searchTerm)
      );
      if (substrateId) {
        whereClause = and(whereClause, eq(details.substrateId, substrateId));
      }
      const [detailTotal] = await db.select({ count: count() }).from(details).where(whereClause);
      totalCount = detailTotal?.count || 0;
    }

    return NextResponse.json({
      results: results.slice(0, limit),
      total: totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
