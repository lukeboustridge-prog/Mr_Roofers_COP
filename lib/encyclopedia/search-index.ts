import fs from 'fs';
import path from 'path';
import type { CopChapter, CopSection } from '@/types/cop';

/**
 * SearchIndex — Server-side only module.
 *
 * Builds an in-memory flat array of all COP sections from 19 chapter JSONs
 * for full-text search with title + content matching and snippet generation.
 *
 * DO NOT import this module in client components — it uses Node.js fs.
 */

/** Internal search index entry — includes full content for searching */
interface SearchIndexEntry {
  sectionNumber: string;
  title: string;
  chapterNumber: number;
  chapterTitle: string;
  content: string;
  level: number;
  url: string;
}

/** Public search result — returned to callers (no full content, includes snippet) */
export interface SearchResult {
  sectionNumber: string;
  title: string;
  chapterNumber: number;
  chapterTitle: string;
  level: number;
  url: string;
  snippet: string;
}

/** Singleton cache — built once on first call */
let cachedIndex: SearchIndexEntry[] | null = null;

/** Total number of COP chapter JSON files */
const CHAPTER_COUNT = 19;

/**
 * Recursively walks all sections and subsections, adding each to the index array.
 */
function walkSections(
  sections: CopSection[],
  chapterNumber: number,
  chapterTitle: string,
  index: SearchIndexEntry[]
): void {
  for (const section of sections) {
    index.push({
      sectionNumber: section.number,
      title: section.title,
      chapterNumber,
      chapterTitle,
      content: section.content || '',
      level: section.level,
      url: `/encyclopedia/cop/${chapterNumber}#section-${section.number}`,
    });

    if (section.subsections) {
      walkSections(section.subsections, chapterNumber, chapterTitle, index);
    }
  }
}

/**
 * Builds the search index from all 19 COP chapter JSON files.
 *
 * Uses module-level singleton pattern: builds once on first call,
 * returns cached array on subsequent calls.
 */
function buildSearchIndex(): SearchIndexEntry[] {
  if (cachedIndex) {
    return cachedIndex;
  }

  const index: SearchIndexEntry[] = [];

  for (let i = 1; i <= CHAPTER_COUNT; i++) {
    const filePath = path.join(process.cwd(), 'public', 'cop', `chapter-${i}.json`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const chapter: CopChapter = JSON.parse(raw);

    walkSections(chapter.sections, chapter.chapterNumber, chapter.title, index);
  }

  cachedIndex = index;
  return index;
}

/**
 * Generates a text snippet around the first occurrence of query in content.
 * Returns ~120 chars around the match with "..." truncation.
 */
function generateSnippet(content: string, query: string): string {
  if (!content) return '';

  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerContent.indexOf(lowerQuery);

  if (matchIndex === -1) {
    // No match in content — return beginning of content
    return content.length > 120 ? content.slice(0, 120).trim() + '...' : content.trim();
  }

  // Extract ~120 chars centered around the match
  const snippetHalf = 60;
  const start = Math.max(0, matchIndex - snippetHalf);
  const end = Math.min(content.length, matchIndex + query.length + snippetHalf);

  let snippet = content.slice(start, end).trim();

  // Clean up line breaks
  snippet = snippet.replace(/\n+/g, ' ').replace(/\s+/g, ' ');

  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Searches COP sections by query string with ranked results.
 *
 * Scoring:
 * - Exact section number match: returned first (score 100)
 * - Section number starts with query: score 50
 * - Full word match in title: 10 points per occurrence
 * - Partial match in title: 5 points
 * - Content match: 1 point per occurrence (capped at 5)
 *
 * @param query - Search query string (minimum 2 characters)
 * @param limit - Maximum results to return (default 10)
 * @returns Scored and ranked search results with snippets
 */
export function searchCopSections(query: string, limit: number = 10): SearchResult[] {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const index = buildSearchIndex();
  const lowerQuery = query.toLowerCase().trim();

  // Build word boundary regex for full-word matching in titles
  // Escape regex special chars in query
  const escapedQuery = lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundaryRegex = new RegExp(`\\b${escapedQuery}\\b`, 'gi');
  const partialRegex = new RegExp(escapedQuery, 'gi');

  const scored: { entry: SearchIndexEntry; score: number }[] = [];

  for (const entry of index) {
    let score = 0;

    const lowerSectionNumber = entry.sectionNumber.toLowerCase();
    const lowerTitle = entry.title.toLowerCase();
    const lowerContent = entry.content.toLowerCase();

    // Exact section number match — highest priority
    if (lowerSectionNumber === lowerQuery) {
      score = 100;
    } else if (lowerSectionNumber.startsWith(lowerQuery)) {
      score = 50;
    } else {
      // Title scoring
      const fullWordMatches = lowerTitle.match(wordBoundaryRegex);
      if (fullWordMatches) {
        score += fullWordMatches.length * 10;
      } else {
        const partialTitleMatches = lowerTitle.match(partialRegex);
        if (partialTitleMatches) {
          score += 5;
        }
      }

      // Content scoring — 1 point per occurrence, capped at 5
      const contentMatches = lowerContent.match(partialRegex);
      if (contentMatches) {
        score += Math.min(contentMatches.length, 5);
      }
    }

    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  // Sort by score descending, then by section number for stable ordering
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.entry.sectionNumber.localeCompare(b.entry.sectionNumber, undefined, { numeric: true });
  });

  // Take top results and generate snippets
  return scored.slice(0, limit).map(({ entry }) => ({
    sectionNumber: entry.sectionNumber,
    title: entry.title,
    chapterNumber: entry.chapterNumber,
    chapterTitle: entry.chapterTitle,
    level: entry.level,
    url: entry.url,
    snippet: generateSnippet(entry.content, query),
  }));
}
