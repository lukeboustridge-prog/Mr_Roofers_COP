import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { details, failureCases, warningConditions, detailFailureLinks } from '@/lib/db/schema';
import { eq, or, ilike, asc, count, and, sql } from 'drizzle-orm';
import { searchQuerySchema, validateQuery, parseSearchParams } from '@/lib/validations';
import { detectSearchType, getSectionNavigationUrl } from '@/lib/search-helpers';

export async function GET(request: NextRequest) {
  try {
    const params = parseSearchParams(request.nextUrl.searchParams);
    const validation = validateQuery(searchQuerySchema, params);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      q: query,
      substrate: substrateId,
      category: categoryId,
      source: sourceFilter,
      consentMode,
      hasWarnings,
      hasFailures,
      type: searchType,
      limit,
      offset
    } = validation.data;

    if (!query.trim()) {
      return NextResponse.json({
        results: [],
        total: 0,
        limit,
        offset,
      });
    }

    // Detect query type for appropriate routing
    const queryType = detectSearchType(query);

    // Section number detection - return redirect URL
    if (queryType === 'section') {
      return NextResponse.json({
        redirect: getSectionNavigationUrl(query),
        type: 'section',
      });
    }

    const trimmedQuery = query.trim();

    // Apply consent mode filter (MRM only when true)
    const effectiveSourceFilter = consentMode ? 'mrm-cop' : sourceFilter;

    // Check for exact code match first (direct jump)
    if (queryType === 'code' || searchType === 'code' || searchType === 'all') {
      const codeConditions = [eq(sql`UPPER(${details.code})`, trimmedQuery.toUpperCase())];

      if (effectiveSourceFilter) {
        codeConditions.push(eq(details.sourceId, effectiveSourceFilter));
      }

      const codeWhereClause = codeConditions.length > 1 ? and(...codeConditions) : codeConditions[0];

      const [exactMatch] = await db
        .select({
          id: details.id,
          code: details.code,
          name: details.name,
          description: details.description,
          substrateId: details.substrateId,
          categoryId: details.categoryId,
          thumbnailUrl: details.thumbnailUrl,
          sourceId: details.sourceId,
        })
        .from(details)
        .where(codeWhereClause)
        .limit(1);

      if (exactMatch && (searchType === 'code' || queryType === 'code')) {
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
      sourceId: string | null;
      thumbnailUrl: string | null;
      type: 'detail' | 'failure';
      warningCount: number;
      failureCount: number;
      relevanceScore?: number;
      isExactMatch?: boolean;
    }> = [];

    // Search details with ts_rank for text queries
    if (searchType === 'all' || searchType === 'details') {
      // Use full-text search with ts_rank for relevance scoring
      // Apply source weighting: MRM COP gets 2x boost, RANZ gets 1x
      const tsQuery = sql`websearch_to_tsquery('english', ${trimmedQuery})`;

      // Build WHERE conditions (not used in raw query, kept for total count query below)

      // Raw query with ts_rank and source weighting
      const detailResults = await db.execute<{
        id: string;
        code: string;
        name: string;
        description: string | null;
        substrate_id: string | null;
        category_id: string | null;
        source_id: string | null;
        thumbnail_url: string | null;
        relevance_score: number;
      }>(sql`
        SELECT
          d.id,
          d.code,
          d.name,
          d.description,
          d.substrate_id,
          d.category_id,
          d.source_id,
          d.thumbnail_url,
          ts_rank(d.search_vector, ${tsQuery}) *
            CASE WHEN d.source_id = 'mrm-cop' THEN 2.0 ELSE 1.0 END as relevance_score
        FROM details d
        WHERE d.search_vector @@ ${tsQuery}
          ${substrateId ? sql`AND d.substrate_id = ${substrateId}` : sql``}
          ${categoryId ? sql`AND d.category_id = ${categoryId}` : sql``}
          ${effectiveSourceFilter ? sql`AND d.source_id = ${effectiveSourceFilter}` : sql``}
        ORDER BY relevance_score DESC, d.code ASC
        LIMIT ${limit}
        OFFSET ${offset}
      `);

      // Enrich with warning and failure counts
      for (const row of detailResults.rows) {
        const detail = {
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description,
          substrateId: row.substrate_id,
          categoryId: row.category_id,
          sourceId: row.source_id,
          thumbnailUrl: row.thumbnail_url,
          relevanceScore: row.relevance_score,
        };

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
          isExactMatch: detail.code.toUpperCase() === trimmedQuery.toUpperCase(),
        });
      }
    }

    // Search failure cases
    if (searchType === 'all' || searchType === 'failures') {
      const searchTerm = `%${trimmedQuery}%`;

      const failureResults = await db
        .select({
          id: failureCases.id,
          caseId: failureCases.caseId,
          summary: failureCases.summary,
          failureType: failureCases.failureType,
          outcome: failureCases.outcome,
          sourceId: failureCases.sourceId,
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
          name: failure.failureType || 'Case Law',
          description: failure.summary,
          substrateId: null,
          categoryId: null,
          sourceId: failure.sourceId,
          thumbnailUrl: null,
          type: 'failure',
          warningCount: 0,
          failureCount: 0,
        });
      }
    }

    // Sort results: exact matches first, then by relevance score (for details), then by type and code
    results.sort((a, b) => {
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;

      // If both are details with relevance scores, sort by score (descending)
      if (a.type === 'detail' && b.type === 'detail' && a.relevanceScore && b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      if (a.type === 'detail' && b.type === 'failure') return -1;
      if (a.type === 'failure' && b.type === 'detail') return 1;
      return a.code.localeCompare(b.code);
    });

    // Get total count for pagination
    let totalCount = results.length;
    if (searchType === 'all' || searchType === 'details') {
      const tsQuery = sql`websearch_to_tsquery('english', ${trimmedQuery})`;

      // Build WHERE clause for count query
      const countConditions = [sql`${details.searchVector} @@ ${tsQuery}`];

      if (substrateId) {
        countConditions.push(eq(details.substrateId, substrateId));
      }

      if (categoryId) {
        countConditions.push(eq(details.categoryId, categoryId));
      }

      if (effectiveSourceFilter) {
        countConditions.push(eq(details.sourceId, effectiveSourceFilter));
      }

      const countWhereClause = countConditions.length > 1 ? and(...countConditions) : countConditions[0];

      const [detailTotal] = await db.select({ count: count() }).from(details).where(countWhereClause);
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
