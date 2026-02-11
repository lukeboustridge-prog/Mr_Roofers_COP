import { db } from '@/lib/db';
import { htgContent, copSectionHtg, copSections } from '@/lib/db/schema';
import { eq, sql, asc } from 'drizzle-orm';

export interface HtgGuideOverview {
  sourceDocument: string;
  guideName: string;
  pageCount: number;
}

export interface HtgPage {
  id: string;
  sourceDocument: string;
  guideName: string;
  content: string | null;
  pdfPage: number | null;
}

export interface HtgPageWithCopLinks extends HtgPage {
  copLinks: {
    sectionId: string;
    sectionNumber: string;
    chapterNumber: number;
    sectionTitle: string | null;
  }[];
}

/**
 * Get overview of all HTG guides grouped by source document.
 */
export async function getHtgGuideOverviews(): Promise<HtgGuideOverview[]> {
  const results = await db
    .select({
      sourceDocument: htgContent.sourceDocument,
      guideName: htgContent.guideName,
      pageCount: sql<number>`count(*)`.as('page_count'),
    })
    .from(htgContent)
    .groupBy(htgContent.sourceDocument, htgContent.guideName)
    .orderBy(htgContent.sourceDocument);

  return results;
}

/**
 * Get all pages for a specific HTG guide by source document.
 */
export async function getHtgGuidePages(sourceDocument: string): Promise<HtgPage[]> {
  return db
    .select({
      id: htgContent.id,
      sourceDocument: htgContent.sourceDocument,
      guideName: htgContent.guideName,
      content: htgContent.content,
      pdfPage: htgContent.pdfPage,
    })
    .from(htgContent)
    .where(eq(htgContent.sourceDocument, sourceDocument))
    .orderBy(asc(htgContent.pdfPage));
}

/**
 * Get a single HTG page with its linked COP sections.
 */
export async function getHtgPageWithCopLinks(pageId: string): Promise<HtgPageWithCopLinks | null> {
  const pageResults = await db
    .select({
      id: htgContent.id,
      sourceDocument: htgContent.sourceDocument,
      guideName: htgContent.guideName,
      content: htgContent.content,
      pdfPage: htgContent.pdfPage,
    })
    .from(htgContent)
    .where(eq(htgContent.id, pageId))
    .limit(1);

  if (pageResults.length === 0) return null;

  const page = pageResults[0];

  // Get linked COP sections
  const copLinks = await db
    .select({
      sectionId: copSections.id,
      sectionNumber: copSections.sectionNumber,
      chapterNumber: copSections.chapterNumber,
      sectionTitle: copSections.title,
    })
    .from(copSectionHtg)
    .innerJoin(copSections, eq(copSectionHtg.sectionId, copSections.id))
    .where(eq(copSectionHtg.htgId, pageId))
    .orderBy(asc(copSections.sectionNumber));

  return { ...page, copLinks };
}
