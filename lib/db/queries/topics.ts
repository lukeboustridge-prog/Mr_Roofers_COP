import { db } from '@/lib/db';
import { topics, categoryTopics, details, contentSources } from '@/lib/db/schema';
import { eq, inArray, and, asc, desc, sql } from 'drizzle-orm';

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
}

export interface TopicDetailsResult {
  data: TopicDetail[];
  total: number;
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
    return { data: [], total: 0, limit, offset };
  }

  const categoryIds = topicCategories.map(c => c.categoryId);

  // Build conditions
  const conditions = [inArray(details.categoryId, categoryIds)];
  if (sourceId) {
    conditions.push(eq(details.sourceId, sourceId));
  }

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(details)
    .where(and(...conditions));

  // Get details with source info
  const orderColumn = orderBy === 'code' ? details.code
    : orderBy === 'name' ? details.name
    : details.updatedAt;

  const data = await db
    .select({
      id: details.id,
      code: details.code,
      name: details.name,
      description: details.description,
      thumbnailUrl: details.thumbnailUrl,
      modelUrl: details.modelUrl,
      categoryId: details.categoryId,
      sourceId: details.sourceId,
      sourceName: contentSources.shortName,
    })
    .from(details)
    .leftJoin(contentSources, eq(details.sourceId, contentSources.id))
    .where(and(...conditions))
    .orderBy(orderBy === 'updatedAt' ? desc(orderColumn) : asc(orderColumn))
    .limit(limit)
    .offset(offset);

  return {
    data,
    total: Number(countResult.count),
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
