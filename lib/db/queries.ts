import { db } from './index';
import { eq, and, ilike, or, desc, asc, count, sql } from 'drizzle-orm';
import {
  substrates,
  categories,
  details,
  detailSteps,
  warningConditions,
  failureCases,
  detailFailureLinks,
  userFavourites,
  userHistory,
  contentSources,
} from './schema';

// ============================================
// SUBSTRATES
// ============================================
export async function getAllSubstrates() {
  return db
    .select()
    .from(substrates)
    .orderBy(asc(substrates.sortOrder));
}

export async function getSubstrateById(id: string) {
  const result = await db
    .select()
    .from(substrates)
    .where(eq(substrates.id, id))
    .limit(1);
  return result[0] || null;
}

export async function getSubstratesWithCounts() {
  return db
    .select({
      id: substrates.id,
      name: substrates.name,
      description: substrates.description,
      iconUrl: substrates.iconUrl,
      sortOrder: substrates.sortOrder,
      sourceId: substrates.sourceId,
      detailCount: sql<number>`(SELECT count(*) FROM details WHERE details.substrate_id = substrates.id)`.as('detail_count'),
    })
    .from(substrates)
    .orderBy(asc(substrates.sortOrder));
}

// ============================================
// CATEGORIES
// ============================================
export async function getCategoriesBySubstrate(substrateId: string) {
  return db
    .select({
      id: categories.id,
      substrateId: categories.substrateId,
      name: categories.name,
      description: categories.description,
      iconUrl: categories.iconUrl,
      sortOrder: categories.sortOrder,
      sourceId: categories.sourceId,
      detailCount: sql<number>`(SELECT count(*) FROM details WHERE details.category_id = categories.id)`.as('detail_count'),
    })
    .from(categories)
    .where(eq(categories.substrateId, substrateId))
    .orderBy(asc(categories.sortOrder));
}

export async function getCategoryById(id: string) {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return result[0] || null;
}

// ============================================
// DETAILS
// ============================================
export async function getDetailsByCategory(
  categoryId: string,
  options: { limit?: number; offset?: number; sourceId?: string } = {}
) {
  const { limit = 20, offset = 0, sourceId } = options;

  // Build where condition with optional source filter
  const whereCondition = sourceId
    ? and(eq(details.categoryId, categoryId), eq(details.sourceId, sourceId))
    : eq(details.categoryId, categoryId);

  const detailsList = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
      description: details.description,
      substrateId: details.substrateId,
      categoryId: details.categoryId,
      sourceId: details.sourceId,
      thumbnailUrl: details.thumbnailUrl,
      modelUrl: details.modelUrl,
      warningCount: sql<number>`(SELECT count(*) FROM warning_conditions WHERE warning_conditions.detail_id = details.id)`.as('warning_count'),
      failureCount: sql<number>`(SELECT count(*) FROM detail_failure_links WHERE detail_failure_links.detail_id = details.id)`.as('failure_count'),
    })
    .from(details)
    .where(whereCondition)
    .orderBy(asc(details.code))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(details)
    .where(whereCondition);

  return {
    details: detailsList,
    total: totalResult?.count || 0,
    limit,
    offset,
  };
}

export async function getDetailsBySubstrate(
  substrateId: string,
  options: { limit?: number; offset?: number; sourceId?: string } = {}
) {
  const { limit = 20, offset = 0, sourceId } = options;

  // Build where condition with optional source filter
  const whereCondition = sourceId
    ? and(eq(details.substrateId, substrateId), eq(details.sourceId, sourceId))
    : eq(details.substrateId, substrateId);

  const detailsList = await db
    .select()
    .from(details)
    .where(whereCondition)
    .orderBy(asc(details.code))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(details)
    .where(whereCondition);

  return {
    details: detailsList,
    total: totalResult?.count || 0,
    limit,
    offset,
  };
}

export async function getDetailsForFixer(
  substrateId: string,
  task?: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options;

  // Fixer mode shows RANZ Guide content only (installation guides with 3D models),
  // not MRM COP reference material. Planner mode shows COP content.
  const ranzSourceId = 'ranz-guide';

  // Map task to category patterns (task names often match category IDs)
  // Tasks: flashings, ridges, valleys, penetrations, gutters, ventilation, other
  let whereCondition;

  if (task && task !== 'other') {
    // Find RANZ categories that match the task for this substrate
    const matchingCategories = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.substrateId, substrateId),
          eq(categories.sourceId, ranzSourceId),
          or(
            ilike(categories.id, `%${task}%`),
            ilike(categories.name, `%${task}%`)
          )
        )
      );

    const categoryIds = matchingCategories.map(c => c.id);

    if (categoryIds.length > 0) {
      whereCondition = and(
        eq(details.substrateId, substrateId),
        eq(details.sourceId, ranzSourceId),
        or(...categoryIds.map(id => eq(details.categoryId, id)))
      );
    } else {
      // No matching RANZ categories for this task, show all RANZ details for substrate
      whereCondition = and(
        eq(details.substrateId, substrateId),
        eq(details.sourceId, ranzSourceId),
      );
    }
  } else {
    // No task filter or "other" - get all RANZ details for substrate
    whereCondition = and(
      eq(details.substrateId, substrateId),
      eq(details.sourceId, ranzSourceId),
    );
  }

  const detailsList = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
      description: details.description,
      substrateId: details.substrateId,
      categoryId: details.categoryId,
      thumbnailUrl: details.thumbnailUrl,
      modelUrl: details.modelUrl,
      warningCount: sql<number>`(SELECT count(*) FROM warning_conditions WHERE warning_conditions.detail_id = details.id)`.as('warning_count'),
      failureCount: sql<number>`(SELECT count(*) FROM detail_failure_links WHERE detail_failure_links.detail_id = details.id)`.as('failure_count'),
    })
    .from(details)
    .where(whereCondition)
    .orderBy(asc(details.code))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(details)
    .where(whereCondition);

  return {
    details: detailsList,
    total: totalResult?.count || 0,
    limit,
    offset,
  };
}

export async function getDetailById(id: string) {
  const [detail] = await db
    .select()
    .from(details)
    .where(eq(details.id, id))
    .limit(1);

  if (!detail) return null;

  // Fetch all related data in parallel (not sequentially)
  const [substrateResult, categoryResult, sourceResult, steps, warnings, failureLinks] = await Promise.all([
    detail.substrateId
      ? db.select().from(substrates).where(eq(substrates.id, detail.substrateId)).limit(1)
      : Promise.resolve([null]),
    detail.categoryId
      ? db.select().from(categories).where(eq(categories.id, detail.categoryId)).limit(1)
      : Promise.resolve([null]),
    detail.sourceId
      ? db.select().from(contentSources).where(eq(contentSources.id, detail.sourceId)).limit(1)
      : Promise.resolve([null]),
    db.select().from(detailSteps).where(eq(detailSteps.detailId, id)).orderBy(asc(detailSteps.stepNumber)),
    db.select().from(warningConditions).where(eq(warningConditions.detailId, id)),
    db.select({ failureCase: failureCases })
      .from(detailFailureLinks)
      .innerJoin(failureCases, eq(detailFailureLinks.failureCaseId, failureCases.id))
      .where(eq(detailFailureLinks.detailId, id)),
  ]);

  return {
    ...detail,
    substrate: substrateResult[0],
    category: categoryResult[0],
    source: sourceResult[0],
    steps,
    warnings,
    failures: failureLinks.map((link) => link.failureCase),
  };
}

export async function getDetailByCode(code: string) {
  const [detail] = await db
    .select()
    .from(details)
    .where(eq(details.code, code))
    .limit(1);

  if (!detail) return null;
  return getDetailById(detail.id);
}

// ============================================
// SEARCH
// ============================================
export async function searchDetails(
  query: string,
  options: {
    substrateId?: string;
    categoryId?: string;
    sourceId?: string;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { substrateId, categoryId, sourceId, limit = 20, offset = 0 } = options;
  const searchTerm = `%${query}%`;

  let whereClause = or(
    ilike(details.name, searchTerm),
    ilike(details.code, searchTerm),
    ilike(details.description, searchTerm)
  );

  if (substrateId) {
    whereClause = and(whereClause, eq(details.substrateId, substrateId));
  }

  if (categoryId) {
    whereClause = and(whereClause, eq(details.categoryId, categoryId));
  }

  if (sourceId) {
    whereClause = and(whereClause, eq(details.sourceId, sourceId));
  }

  const results = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
      description: details.description,
      substrateId: details.substrateId,
      categoryId: details.categoryId,
      thumbnailUrl: details.thumbnailUrl,
      substrateName: sql<string>`(SELECT substrates.name FROM substrates WHERE substrates.id = details.substrate_id LIMIT 1)`.as('substrate_name'),
      hasWarning: sql<boolean>`(SELECT count(*) FROM warning_conditions WHERE warning_conditions.detail_id = details.id) > 0`.as('has_warning'),
    })
    .from(details)
    .where(whereClause)
    .orderBy(asc(details.code))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(details)
    .where(whereClause);

  return {
    details: results,
    total: totalResult?.count || 0,
    limit,
    offset,
  };
}

// ============================================
// FAILURE CASES
// ============================================
export async function getAllFailureCases(options: {
  limit?: number;
  offset?: number;
  outcome?: string;
  type?: string;
  substrate?: string;
} = {}) {
  const { limit = 20, offset = 0, outcome, type } = options;
  // Note: substrate filtering would require checking JSONB array with @> operator
  // This is kept simple for now - substrate filter param accepted but not implemented

  // Build where conditions
  const conditions: ReturnType<typeof eq>[] = [];

  if (outcome) {
    conditions.push(eq(failureCases.outcome, outcome));
  }

  if (type) {
    conditions.push(eq(failureCases.failureType, type));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const cases = await db
    .select()
    .from(failureCases)
    .where(whereClause)
    .orderBy(desc(failureCases.decisionDate))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(failureCases)
    .where(whereClause);

  return {
    cases,
    total: totalResult?.count || 0,
    limit,
    offset,
  };
}

export async function getFailureCaseById(id: string) {
  // Try by primary key first
  let [failureCase] = await db
    .select()
    .from(failureCases)
    .where(eq(failureCases.id, id))
    .limit(1);

  // Fallback: try by human-readable caseId (e.g., '2024-035')
  if (!failureCase) {
    [failureCase] = await db
      .select()
      .from(failureCases)
      .where(eq(failureCases.caseId, id))
      .limit(1);
  }

  if (!failureCase) return null;

  // Get linked details using the resolved internal ID
  const linkedDetails = await db
    .select({
      detail: details,
    })
    .from(detailFailureLinks)
    .innerJoin(details, eq(detailFailureLinks.detailId, details.id))
    .where(eq(detailFailureLinks.failureCaseId, failureCase.id));

  return {
    ...failureCase,
    relatedDetails: linkedDetails.map((link) => link.detail),
  };
}

// ============================================
// USER FAVOURITES
// ============================================
export async function getUserFavourites(userId: string) {
  const favourites = await db
    .select({
      detail: details,
      createdAt: userFavourites.createdAt,
    })
    .from(userFavourites)
    .innerJoin(details, eq(userFavourites.detailId, details.id))
    .where(eq(userFavourites.userId, userId))
    .orderBy(desc(userFavourites.createdAt));

  return favourites.map((fav) => ({
    ...fav.detail,
    favouritedAt: fav.createdAt,
  }));
}

export async function addUserFavourite(userId: string, detailId: string) {
  await db.insert(userFavourites).values({
    userId,
    detailId,
  });
}

export async function removeUserFavourite(userId: string, detailId: string) {
  await db
    .delete(userFavourites)
    .where(
      and(
        eq(userFavourites.userId, userId),
        eq(userFavourites.detailId, detailId)
      )
    );
}

export async function isUserFavourite(userId: string, detailId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(userFavourites)
    .where(
      and(
        eq(userFavourites.userId, userId),
        eq(userFavourites.detailId, detailId)
      )
    );
  return (result?.count || 0) > 0;
}

// ============================================
// USER HISTORY
// ============================================
export async function getUserHistory(userId: string, limit = 10) {
  const history = await db
    .select({
      detail: details,
      viewedAt: userHistory.viewedAt,
    })
    .from(userHistory)
    .innerJoin(details, eq(userHistory.detailId, details.id))
    .where(eq(userHistory.userId, userId))
    .orderBy(desc(userHistory.viewedAt))
    .limit(limit);

  return history.map((item) => ({
    ...item.detail,
    viewedAt: item.viewedAt,
  }));
}

export async function recordDetailView(userId: string, detailId: string) {
  const id = `${userId}-${detailId}-${Date.now()}`;
  await db.insert(userHistory).values({
    id,
    userId,
    detailId,
  });
}

// ============================================
// STATS
// ============================================
export async function getStats() {
  const [detailCount] = await db.select({ count: count() }).from(details);
  const [failureCount] = await db.select({ count: count() }).from(failureCases);
  const [substrateCount] = await db.select({ count: count() }).from(substrates);

  return {
    totalDetails: detailCount?.count || 0,
    totalFailures: failureCount?.count || 0,
    totalSubstrates: substrateCount?.count || 0,
  };
}

// ============================================
// CONTENT SOURCES
// ============================================
export async function getAllContentSources() {
  return db
    .select()
    .from(contentSources)
    .orderBy(asc(contentSources.sortOrder));
}

export async function getContentSourceById(id: string) {
  const [source] = await db
    .select()
    .from(contentSources)
    .where(eq(contentSources.id, id))
    .limit(1);
  return source || null;
}

export async function getContentSourcesWithCounts() {
  return db
    .select({
      id: contentSources.id,
      name: contentSources.name,
      shortName: contentSources.shortName,
      description: contentSources.description,
      logoUrl: contentSources.logoUrl,
      websiteUrl: contentSources.websiteUrl,
      sortOrder: contentSources.sortOrder,
      createdAt: contentSources.createdAt,
      detailCount: sql<number>`(SELECT count(*) FROM details WHERE details.source_id = content_sources.id)`.as('detail_count'),
    })
    .from(contentSources)
    .orderBy(asc(contentSources.sortOrder));
}

export async function createContentSource(data: {
  id: string;
  name: string;
  shortName: string;
  description?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  sortOrder?: number;
}) {
  await db.insert(contentSources).values({
    id: data.id,
    name: data.name,
    shortName: data.shortName,
    description: data.description ?? null,
    logoUrl: data.logoUrl ?? null,
    websiteUrl: data.websiteUrl ?? null,
    sortOrder: data.sortOrder ?? 0,
  });
  return getContentSourceById(data.id);
}

export async function updateContentSource(
  id: string,
  data: {
    name?: string;
    shortName?: string;
    description?: string | null;
    logoUrl?: string | null;
    websiteUrl?: string | null;
    sortOrder?: number;
  }
) {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.shortName !== undefined) updateData.shortName = data.shortName;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.websiteUrl !== undefined) updateData.websiteUrl = data.websiteUrl;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  await db
    .update(contentSources)
    .set(updateData)
    .where(eq(contentSources.id, id));
  return getContentSourceById(id);
}

export async function deleteContentSource(id: string) {
  await db.delete(contentSources).where(eq(contentSources.id, id));
}
