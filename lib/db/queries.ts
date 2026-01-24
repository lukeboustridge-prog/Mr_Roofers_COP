import { db } from './index';
import { eq, and, ilike, or, desc, asc, count } from 'drizzle-orm';
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

// ============================================
// CATEGORIES
// ============================================
export async function getCategoriesBySubstrate(substrateId: string) {
  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.substrateId, substrateId))
    .orderBy(asc(categories.sortOrder));

  // Get detail counts for each category
  const categoriesWithCounts = await Promise.all(
    cats.map(async (cat) => {
      const [countResult] = await db
        .select({ count: count() })
        .from(details)
        .where(eq(details.categoryId, cat.id));
      return {
        ...cat,
        detailCount: countResult?.count || 0,
      };
    })
  );

  return categoriesWithCounts;
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
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;

  const detailsList = await db
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
    .where(eq(details.categoryId, categoryId))
    .orderBy(asc(details.code))
    .limit(limit)
    .offset(offset);

  // Get warning counts for each detail
  const detailsWithCounts = await Promise.all(
    detailsList.map(async (detail) => {
      const [warningCount] = await db
        .select({ count: count() })
        .from(warningConditions)
        .where(eq(warningConditions.detailId, detail.id));

      const [failureCount] = await db
        .select({ count: count() })
        .from(detailFailureLinks)
        .where(eq(detailFailureLinks.detailId, detail.id));

      return {
        ...detail,
        warningCount: warningCount?.count || 0,
        failureCount: failureCount?.count || 0,
      };
    })
  );

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(details)
    .where(eq(details.categoryId, categoryId));

  return {
    details: detailsWithCounts,
    total: totalResult?.count || 0,
    limit,
    offset,
  };
}

export async function getDetailsBySubstrate(
  substrateId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;

  const detailsList = await db
    .select()
    .from(details)
    .where(eq(details.substrateId, substrateId))
    .orderBy(asc(details.code))
    .limit(limit)
    .offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(details)
    .where(eq(details.substrateId, substrateId));

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

  // Map task to category patterns (task names often match category IDs)
  // Tasks: flashings, ridges, valleys, penetrations, gutters, ventilation, other
  let whereCondition;

  if (task && task !== 'other') {
    // Find categories that match the task for this substrate
    const matchingCategories = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.substrateId, substrateId),
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
        or(...categoryIds.map(id => eq(details.categoryId, id)))
      );
    } else {
      // No matching categories, fall back to substrate only
      whereCondition = eq(details.substrateId, substrateId);
    }
  } else {
    // No task filter or "other" - get all details for substrate
    whereCondition = eq(details.substrateId, substrateId);
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
    })
    .from(details)
    .where(whereCondition)
    .orderBy(asc(details.code))
    .limit(limit)
    .offset(offset);

  // Get warning counts for each detail
  const detailsWithCounts = await Promise.all(
    detailsList.map(async (detail) => {
      const [warningCount] = await db
        .select({ count: count() })
        .from(warningConditions)
        .where(eq(warningConditions.detailId, detail.id));

      const [failureCount] = await db
        .select({ count: count() })
        .from(detailFailureLinks)
        .where(eq(detailFailureLinks.detailId, detail.id));

      return {
        ...detail,
        warningCount: warningCount?.count || 0,
        failureCount: failureCount?.count || 0,
      };
    })
  );

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(details)
    .where(whereCondition);

  return {
    details: detailsWithCounts,
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

  // Get substrate and category info
  const [substrate] = await db
    .select()
    .from(substrates)
    .where(eq(substrates.id, detail.substrateId!))
    .limit(1);

  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, detail.categoryId!))
    .limit(1);

  // Get steps
  const steps = await db
    .select()
    .from(detailSteps)
    .where(eq(detailSteps.detailId, id))
    .orderBy(asc(detailSteps.stepNumber));

  // Get warnings
  const warnings = await db
    .select()
    .from(warningConditions)
    .where(eq(warningConditions.detailId, id));

  // Get linked failure cases
  const failureLinks = await db
    .select({
      failureCase: failureCases,
    })
    .from(detailFailureLinks)
    .innerJoin(failureCases, eq(detailFailureLinks.failureCaseId, failureCases.id))
    .where(eq(detailFailureLinks.detailId, id));

  return {
    ...detail,
    substrate,
    category,
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
    limit?: number;
    offset?: number;
  } = {}
) {
  const { substrateId, categoryId, limit = 20, offset = 0 } = options;
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

  const results = await db
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

  // Get substrate names for results
  const resultsWithSubstrate = await Promise.all(
    results.map(async (detail) => {
      const [substrate] = await db
        .select({ name: substrates.name })
        .from(substrates)
        .where(eq(substrates.id, detail.substrateId!))
        .limit(1);

      const [warningCount] = await db
        .select({ count: count() })
        .from(warningConditions)
        .where(eq(warningConditions.detailId, detail.id));

      return {
        ...detail,
        substrateName: substrate?.name || '',
        hasWarning: (warningCount?.count || 0) > 0,
      };
    })
  );

  const [totalResult] = await db
    .select({ count: count() })
    .from(details)
    .where(whereClause);

  return {
    details: resultsWithSubstrate,
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
  const [failureCase] = await db
    .select()
    .from(failureCases)
    .where(eq(failureCases.id, id))
    .limit(1);

  if (!failureCase) return null;

  // Get linked details
  const linkedDetails = await db
    .select({
      detail: details,
    })
    .from(detailFailureLinks)
    .innerJoin(details, eq(detailFailureLinks.detailId, details.id))
    .where(eq(detailFailureLinks.failureCaseId, id));

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
