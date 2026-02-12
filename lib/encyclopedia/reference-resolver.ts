import fs from 'fs';
import path from 'path';
import type { CopChapter, CopSection } from '@/types/cop';
import type { ReferenceMap } from '@/types/encyclopedia';

/**
 * ReferenceResolver — Server-side only module.
 *
 * Builds an in-memory Map<sectionNumber, url> from all 19 COP chapter JSONs
 * for O(1) lookup of section references to encyclopedia URLs.
 *
 * DO NOT import this module in client components — it uses Node.js fs.
 */

/** Singleton cache — built once on first call */
let cachedMap: ReferenceMap | null = null;

/** Total number of COP chapter JSON files */
const CHAPTER_COUNT = 19;

/**
 * Recursively walks all sections and subsections, adding each to the map.
 * Key: section number (e.g., "8.5.4", "8.5.4A")
 * Value: URL path (e.g., "/encyclopedia/cop/8#section-8.5.4")
 */
function walkSections(
  sections: CopSection[],
  chapterNumber: number,
  map: ReferenceMap
): void {
  for (const section of sections) {
    const sectionNumber = section.number;
    const url = `/encyclopedia/cop/${chapterNumber}#section-${sectionNumber}`;
    map.set(sectionNumber, url);

    if (section.subsections) {
      walkSections(section.subsections, chapterNumber, map);
    }
  }
}

/**
 * Builds the reference map from all 19 COP chapter JSON files.
 *
 * Uses module-level singleton pattern: builds once on first call,
 * returns cached Map on subsequent calls.
 *
 * @returns Map with ~1,122 entries mapping section numbers to encyclopedia URLs
 */
export function buildReferenceMap(): ReferenceMap {
  if (cachedMap) {
    return cachedMap;
  }

  const map: ReferenceMap = new Map();

  for (let i = 1; i <= CHAPTER_COUNT; i++) {
    const filePath = path.join(process.cwd(), 'public', 'cop', `chapter-${i}.json`);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const chapter: CopChapter = JSON.parse(raw);

    // Add chapter-level reference (e.g., "8" -> "/encyclopedia/cop/8")
    map.set(String(chapter.chapterNumber), `/encyclopedia/cop/${chapter.chapterNumber}`);

    // Walk all sections recursively
    walkSections(chapter.sections, chapter.chapterNumber, map);
  }

  cachedMap = map;
  return map;
}

/**
 * Resolves a section number to its encyclopedia URL path.
 *
 * @param sectionNumber - Section number string (e.g., "8.5.4", "3.7", "8.5.4B", "8")
 * @returns URL path string (e.g., "/encyclopedia/cop/8#section-8.5.4") or null if not found
 */
export function resolveReference(sectionNumber: string): string | null {
  const map = buildReferenceMap();
  return map.get(sectionNumber) ?? null;
}
