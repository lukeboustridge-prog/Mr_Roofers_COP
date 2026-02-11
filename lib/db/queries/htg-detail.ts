import { db } from '@/lib/db';
import { detailHtg, htgContent } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface HtgDetailContent {
  htgId: string;
  guideName: string;
  sourceDocument: string;
  content: string | null;
  pdfPage: number | null;
  relevance: string | null;
  matchType: string | null;
}

/**
 * Get all HTG content mapped to a specific detail.
 * Returns HTG pages linked via detail_htg junction table,
 * ordered with 'primary' relevance first, then 'supplementary'.
 */
export async function getHtgForDetail(detailId: string): Promise<HtgDetailContent[]> {
  const results = await db
    .select({
      htgId: htgContent.id,
      guideName: htgContent.guideName,
      sourceDocument: htgContent.sourceDocument,
      content: htgContent.content,
      pdfPage: htgContent.pdfPage,
      relevance: detailHtg.relevance,
      matchType: detailHtg.matchType,
    })
    .from(detailHtg)
    .innerJoin(htgContent, eq(detailHtg.htgId, htgContent.id))
    .where(eq(detailHtg.detailId, detailId));

  // Sort: primary first, then supplementary
  return results.sort((a, b) => {
    if (a.relevance === 'primary' && b.relevance !== 'primary') return -1;
    if (a.relevance !== 'primary' && b.relevance === 'primary') return 1;
    return (a.pdfPage ?? 0) - (b.pdfPage ?? 0);
  });
}
