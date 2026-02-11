import { db } from '@/lib/db';
import {
  copSectionDetails,
  copSections,
  detailHtg,
  htgContent,
  details,
  contentSources,
} from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export interface CopSectionLink {
  sectionId: string;
  sectionNumber: string;
  chapterNumber: number;
  title: string;
  relationshipType: string;
}

export interface HtgPageLink {
  htgId: string;
  guideName: string;
  sourceDocument: string;
  pdfPage: number | null;
  relevance: string | null;
}

export interface DetailLink {
  detailId: string;
  detailCode: string;
  detailName: string;
  description: string | null;
  sourceShortName: string | null;
  substrateId: string | null;
  categoryId: string | null;
  modelUrl: string | null;
}

/**
 * Get COP sections linked to a specific detail via copSectionDetails.
 */
export async function getCopSectionsForDetail(detailId: string): Promise<CopSectionLink[]> {
  return db
    .select({
      sectionId: copSections.id,
      sectionNumber: copSections.sectionNumber,
      chapterNumber: copSections.chapterNumber,
      title: copSections.title,
      relationshipType: copSectionDetails.relationshipType,
    })
    .from(copSectionDetails)
    .innerJoin(copSections, eq(copSectionDetails.sectionId, copSections.id))
    .where(eq(copSectionDetails.detailId, detailId))
    .orderBy(asc(copSections.sectionNumber));
}

/**
 * Get RANZ details linked to a specific HTG page via detailHtg.
 */
export async function getDetailsForHtgPage(htgId: string): Promise<DetailLink[]> {
  return db
    .select({
      detailId: details.id,
      detailCode: details.code,
      detailName: details.name,
      description: details.description,
      sourceShortName: contentSources.shortName,
      substrateId: details.substrateId,
      categoryId: details.categoryId,
      modelUrl: details.modelUrl,
    })
    .from(detailHtg)
    .innerJoin(details, eq(detailHtg.detailId, details.id))
    .leftJoin(contentSources, eq(details.sourceId, contentSources.id))
    .where(eq(detailHtg.htgId, htgId))
    .orderBy(asc(details.code));
}

/**
 * Get RANZ details linked to all HTG pages in a source document (batch query).
 * Returns a Map keyed by htgId for efficient lookup.
 */
export async function getDetailsForHtgGuide(
  sourceDocument: string
): Promise<Map<string, DetailLink[]>> {
  const results = await db
    .select({
      htgId: detailHtg.htgId,
      detailId: details.id,
      detailCode: details.code,
      detailName: details.name,
      description: details.description,
      sourceShortName: contentSources.shortName,
      substrateId: details.substrateId,
      categoryId: details.categoryId,
      modelUrl: details.modelUrl,
    })
    .from(detailHtg)
    .innerJoin(details, eq(detailHtg.detailId, details.id))
    .innerJoin(htgContent, eq(detailHtg.htgId, htgContent.id))
    .leftJoin(contentSources, eq(details.sourceId, contentSources.id))
    .where(eq(htgContent.sourceDocument, sourceDocument))
    .orderBy(asc(details.code));

  const map = new Map<string, DetailLink[]>();
  for (const row of results) {
    const existing = map.get(row.htgId) || [];
    // Deduplicate by detailId
    if (!existing.some((d) => d.detailId === row.detailId)) {
      existing.push(row);
    }
    map.set(row.htgId, existing);
  }
  return map;
}
