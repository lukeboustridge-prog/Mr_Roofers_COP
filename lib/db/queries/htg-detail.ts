import { db } from '@/lib/db';
import { detailHtg, htgContent, copSectionHtg, copSections } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export interface HtgDetailContent {
  htgId: string;
  guideName: string;
  sourceDocument: string;
  content: string | null;
  pdfPage: number | null;
  relevance: string | null;
  matchType: string | null;
  copSectionNumber: string | null;
  copChapterNumber: number | null;
}

/**
 * Get all HTG content mapped to a specific detail.
 * Returns HTG pages linked via detail_htg junction table,
 * with COP section deep-link info from copSectionHtg.
 * Ordered with 'primary' relevance first, then 'supplementary'.
 */
export async function getHtgForDetail(detailId: string): Promise<HtgDetailContent[]> {
  // Get HTG content with optional COP section link
  const results = await db
    .select({
      htgId: htgContent.id,
      guideName: htgContent.guideName,
      sourceDocument: htgContent.sourceDocument,
      content: htgContent.content,
      pdfPage: htgContent.pdfPage,
      relevance: detailHtg.relevance,
      matchType: detailHtg.matchType,
      copSectionNumber: sql<string | null>`${copSections.sectionNumber}`,
      copChapterNumber: sql<number | null>`${copSections.chapterNumber}`,
    })
    .from(detailHtg)
    .innerJoin(htgContent, eq(detailHtg.htgId, htgContent.id))
    .leftJoin(copSectionHtg, eq(copSectionHtg.htgId, htgContent.id))
    .leftJoin(copSections, eq(copSectionHtg.sectionId, copSections.id))
    .where(eq(detailHtg.detailId, detailId));

  // Deduplicate (an HTG record may link to multiple COP sections — take first)
  const seen = new Set<string>();
  const deduped = results.filter((r) => {
    if (seen.has(r.htgId)) return false;
    seen.add(r.htgId);
    return true;
  });

  // Sort: primary first, then supplementary
  return deduped.sort((a, b) => {
    if (a.relevance === 'primary' && b.relevance !== 'primary') return -1;
    if (a.relevance !== 'primary' && b.relevance === 'primary') return 1;
    return (a.pdfPage ?? 0) - (b.pdfPage ?? 0);
  });
}
