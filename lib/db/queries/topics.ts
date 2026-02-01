import { db } from '@/lib/db';
import { topics, categoryTopics, details } from '@/lib/db/schema';
import { eq, inArray, and, sql } from 'drizzle-orm';

export interface TopicWithCounts {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
  categoryCount: number;
  detailCount: number;
}

export interface GetDetailsByTopicOptions {
  sourceId?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'code' | 'name' | 'updatedAt';
}

export interface TopicDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  modelUrl: string | null;
  categoryId: string | null;
  sourceId: string | null;
  sourceName: string | null;
  hasSteps: boolean;      // true if detail has installation steps
  hasWarnings: boolean;   // true if detail has warning conditions
  hasCaseLaw: boolean;    // true if detail has linked failure cases
}

export interface TopicDetailsResult {
  data: TopicDetail[];
  total: number;
  mrmCount: number;       // Count of details from MRM COP source
  ranzCount: number;      // Count of details from RANZ Guide source
  limit: number;
  offset: number;
}

/**
 * Get all topics with category and detail counts
 */
export async function getTopicsWithCounts(): Promise<TopicWithCounts[]> {
  // Use raw SQL for complex aggregation
  const result = await db.execute(sql`
    SELECT
      t.id,
      t.name,
      t.description,
      t.icon_url as "iconUrl",
      t.sort_order as "sortOrder",
      COUNT(DISTINCT ct.category_id) as "categoryCount",
      COUNT(DISTINCT d.id) as "detailCount"
    FROM topics t
    LEFT JOIN category_topics ct ON t.id = ct.topic_id
    LEFT JOIN categories c ON ct.category_id = c.id
    LEFT JOIN details d ON d.category_id = c.id
    GROUP BY t.id, t.name, t.description, t.icon_url, t.sort_order
    ORDER BY t.sort_order
  `);

  return result.rows as unknown as TopicWithCounts[];
}

/**
 * Get details by topic with optional source filter
 * Enables unified navigation: "show all flashings from all sources"
 */
export async function getDetailsByTopic(
  topicId: string,
  options: GetDetailsByTopicOptions = {}
): Promise<TopicDetailsResult> {
  const { sourceId, limit = 20, offset = 0, orderBy = 'code' } = options;

  // Get categories mapped to this topic
  const topicCategories = await db
    .select({ categoryId: categoryTopics.categoryId })
    .from(categoryTopics)
    .where(eq(categoryTopics.topicId, topicId));

  if (topicCategories.length === 0) {
    return { data: [], total: 0, mrmCount: 0, ranzCount: 0, limit, offset };
  }

  const categoryIds = topicCategories.map(c => c.categoryId);

  // Get source counts via GROUP BY aggregation (before applying source filter)
  const sourceCounts = await db
    .select({
      sourceId: details.sourceId,
      count: sql<number>`COUNT(*)::int`.as('count')
    })
    .from(details)
    .where(inArray(details.categoryId, categoryIds))
    .groupBy(details.sourceId);

  const countMap = sourceCounts.reduce((acc, { sourceId: sid, count }) => {
    if (sid) acc[sid] = count;
    return acc;
  }, {} as Record<string, number>);

  const mrmCount = countMap['mrm-cop'] || 0;
  const ranzCount = countMap['ranz-guide'] || 0;

  // Build conditions for main query
  const conditions = [inArray(details.categoryId, categoryIds)];
  if (sourceId) {
    conditions.push(eq(details.sourceId, sourceId));
  }

  // Get total count (with source filter applied)
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(details)
    .where(and(...conditions));

  // Get details with source info and capability flags using raw SQL for aggregations
  // Build WHERE clause string for raw SQL
  const categoryIdsStr = categoryIds.map(id => `'${id}'`).join(',');
  const sourceCondition = sourceId ? `AND d.source_id = '${sourceId}'` : '';
  const orderStr = orderBy === 'code' ? 'd.code ASC'
    : orderBy === 'name' ? 'd.name ASC'
    : 'd.updated_at DESC';

  const detailsResult = await db.execute(sql`
    SELECT
      d.id,
      d.code,
      d.name,
      d.description,
      d.thumbnail_url as "thumbnailUrl",
      d.model_url as "modelUrl",
      d.category_id as "categoryId",
      d.source_id as "sourceId",
      cs.short_name as "sourceName",
      CASE WHEN EXISTS (SELECT 1 FROM detail_steps ds WHERE ds.detail_id = d.id) THEN true ELSE false END as "hasSteps",
      CASE WHEN EXISTS (SELECT 1 FROM warning_conditions wc WHERE wc.detail_id = d.id) THEN true ELSE false END as "hasWarnings",
      CASE WHEN EXISTS (SELECT 1 FROM detail_failure_links dfl WHERE dfl.detail_id = d.id) THEN true ELSE false END as "hasCaseLaw"
    FROM details d
    LEFT JOIN content_sources cs ON d.source_id = cs.id
    WHERE d.category_id IN (${sql.raw(categoryIdsStr)}) ${sql.raw(sourceCondition)}
    ORDER BY ${sql.raw(orderStr)}
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  const data = detailsResult.rows as unknown as TopicDetail[];

  return {
    data,
    total: Number(totalResult.count),
    mrmCount,
    ranzCount,
    limit,
    offset,
  };
}

/**
 * Get a single topic by ID
 */
export async function getTopicById(topicId: string) {
  const [topic] = await db
    .select()
    .from(topics)
    .where(eq(topics.id, topicId))
    .limit(1);

  return topic ?? null;
}
