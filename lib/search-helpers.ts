/**
 * Search helper utilities for query type detection and section navigation.
 * Used by search API to route queries appropriately.
 */

// Section number format: "4.3" or "4.3.2" (COP chapter.section or chapter.section.subsection)
const SECTION_NUMBER_REGEX = /^\d+\.\d+(\.\d+)?$/;

// Detail code format: Letter followed by 1-3 digits (e.g., "F07", "R12", "V3")
const DETAIL_CODE_REGEX = /^[A-Z]\d{1,3}$/i;

export type SearchType = 'section' | 'code' | 'text';

/**
 * Detects the type of search query to determine routing.
 * - 'section': COP section number (e.g., "4.3.2") -> navigates to COP structure
 * - 'code': Detail code (e.g., "F07") -> exact code lookup
 * - 'text': General text search -> full-text search with ts_rank
 */
export function detectSearchType(query: string): SearchType {
  const trimmed = query.trim();

  // Check for section number first (e.g., "4.3.2")
  if (SECTION_NUMBER_REGEX.test(trimmed)) {
    return 'section';
  }

  // Check for exact detail code (e.g., "F07")
  if (DETAIL_CODE_REGEX.test(trimmed)) {
    return 'code';
  }

  return 'text';
}

/**
 * Generates navigation URL for COP section number.
 * Maps section numbers to detail filter URLs.
 *
 * Example: "4.3.2" -> "/search?section=4.3.2&source=mrm-cop"
 *
 * Note: Full section hierarchy navigation requires copSectionNumber field
 * to be populated in details table (future content import task).
 * For now, passes section number as search query with MRM filter.
 */
export function getSectionNavigationUrl(sectionNumber: string): string {
  const normalized = sectionNumber.trim();
  // Until section numbers are seeded in database, search by section number text
  // with MRM source filter (section numbers only exist in MRM COP)
  return `/search?q=${encodeURIComponent(normalized)}&source=mrm-cop`;
}

/**
 * Source authority multipliers for search relevance scoring.
 * MRM COP is authoritative (2x boost), RANZ Guide is supplementary (1x).
 */
export const SOURCE_RELEVANCE_MULTIPLIERS: Record<string, number> = {
  'mrm-cop': 2.0,
  'ranz-guide': 1.0,
  'membrane-cop': 1.0, // Future source
};

/**
 * Gets relevance multiplier for a source ID.
 * Unknown sources default to 1.0 (no boost).
 */
export function getSourceRelevanceMultiplier(sourceId: string | null): number {
  if (!sourceId) return 1.0;
  return SOURCE_RELEVANCE_MULTIPLIERS[sourceId] ?? 1.0;
}
