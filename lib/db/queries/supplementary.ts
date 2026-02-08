import { db } from '@/lib/db';
import {
  copSections,
  copSectionDetails,
  copSectionHtg,
  details,
  contentSources,
  htgContent,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { SupplementaryData } from '@/types/cop';

/**
 * Fetches all supplementary content (details + HTG guides) linked to COP sections
 * in a given chapter.
 *
 * Returns a Map keyed by section ID (e.g., "cop-8.5.4") for efficient lookup.
 * Each value contains arrays of linked details and HTG guides.
 *
 * Gracefully handles empty tables (returns empty Map when no links exist).
 */
export async function getSupplementaryContent(
  chapterNumber: number
): Promise<Map<string, SupplementaryData>> {
  // Query 1: Get all detail links for sections in this chapter
  const detailResults = await db
    .select({
      sectionId: copSections.id,
      detailId: details.id,
      detailCode: details.code,
      detailName: details.name,
      detailDescription: details.description,
      modelUrl: details.modelUrl,
      thumbnailUrl: details.thumbnailUrl,
      sourceName: contentSources.shortName,
      relationshipType: copSectionDetails.relationshipType,
    })
    .from(copSectionDetails)
    .innerJoin(copSections, eq(copSectionDetails.sectionId, copSections.id))
    .innerJoin(details, eq(copSectionDetails.detailId, details.id))
    .leftJoin(contentSources, eq(details.sourceId, contentSources.id))
    .where(eq(copSections.chapterNumber, chapterNumber));

  // Query 2: Get all HTG links for sections in this chapter
  const htgResults = await db
    .select({
      sectionId: copSections.id,
      htgId: htgContent.id,
      guideName: htgContent.guideName,
      sourceDocument: htgContent.sourceDocument,
      relevance: copSectionHtg.relevance,
    })
    .from(copSectionHtg)
    .innerJoin(copSections, eq(copSectionHtg.sectionId, copSections.id))
    .innerJoin(htgContent, eq(copSectionHtg.htgId, htgContent.id))
    .where(eq(copSections.chapterNumber, chapterNumber));

  // Group results by section ID
  const supplementaryMap = new Map<string, SupplementaryData>();

  // Process detail results
  for (const row of detailResults) {
    if (!supplementaryMap.has(row.sectionId)) {
      supplementaryMap.set(row.sectionId, { details: [], htgGuides: [] });
    }
    const data = supplementaryMap.get(row.sectionId)!;
    data.details.push({
      id: row.detailId,
      code: row.detailCode,
      name: row.detailName,
      description: row.detailDescription,
      modelUrl: row.modelUrl,
      thumbnailUrl: row.thumbnailUrl,
      sourceName: row.sourceName || 'Unknown',
      relationshipType: row.relationshipType,
    });
  }

  // Process HTG results
  for (const row of htgResults) {
    if (!supplementaryMap.has(row.sectionId)) {
      supplementaryMap.set(row.sectionId, { details: [], htgGuides: [] });
    }
    const data = supplementaryMap.get(row.sectionId)!;
    data.htgGuides.push({
      id: row.htgId,
      guideName: row.guideName,
      sourceDocument: row.sourceDocument,
      relevance: row.relevance,
    });
  }

  return supplementaryMap;
}
