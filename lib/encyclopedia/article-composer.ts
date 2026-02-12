import { getSupplementaryContent } from '@/lib/db/queries/supplementary';
import {
  getHtgContentForChapter,
  getFailureCasesForChapter,
} from '@/lib/db/queries/encyclopedia-content';
import type { ComposedSupplementary } from '@/types/encyclopedia';

/**
 * Composes article content by fetching from multiple sources in parallel.
 *
 * Sources:
 * 1. Supplementary details + HTG guide links (existing query)
 * 2. HTG full text content (new query — includes the content field)
 * 3. Failure cases via detail links (new query — traverses full join chain)
 *
 * Returns a Record<string, ComposedSupplementary> keyed by section ID
 * for efficient lookup during article rendering. Uses Record (not Map)
 * because the result is serialized to client components.
 */
export async function composeArticleContent(
  chapterNumber: number
): Promise<Record<string, ComposedSupplementary>> {
  // Parallel fetch from all three sources
  const [supplementaryMap, htgContentMap, caseLawMap] = await Promise.all([
    getSupplementaryContent(chapterNumber),
    getHtgContentForChapter(chapterNumber),
    getFailureCasesForChapter(chapterNumber),
  ]);

  // Merge all sources into a single Record keyed by section ID
  // Use Array.from() to avoid downlevelIteration requirement with Map.keys()
  const allSectionIds = new Set<string>([
    ...Array.from(supplementaryMap.keys()),
    ...Array.from(htgContentMap.keys()),
    ...Array.from(caseLawMap.keys()),
  ]);

  const composed: Record<string, ComposedSupplementary> = {};

  for (const sectionId of Array.from(allSectionIds)) {
    const supplementary = supplementaryMap.get(sectionId);
    composed[sectionId] = {
      details: supplementary?.details ?? [],
      htgGuides: supplementary?.htgGuides ?? [],
      htgContent: htgContentMap.get(sectionId) ?? [],
      caseLaw: caseLawMap.get(sectionId) ?? [],
    };
  }

  return composed;
}
