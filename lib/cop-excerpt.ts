import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { CopSection, CopChapter } from '@/types/cop';

export interface CopExcerptData {
  sectionNumber: string;    // e.g. "5.1", "8.5.4"
  title: string;            // Section title from JSON
  excerpt: string;          // First ~200 chars of content, trimmed to sentence boundary
  deepLinkUrl: string;      // e.g. "/cop/5#section-5.1" or "/cop/8#section-8.5.4"
  chapterNumber: number;
  chapterTitle: string;
}

/**
 * Extracts section number from step instruction text.
 * Matches patterns like "5.1", "5.1A", "8.5.4", "1", "4.7 Gutter Capacity Calculator"
 * Returns null if no section number pattern found.
 */
export function parseSectionNumber(instruction: string): string | null {
  // Match leading section number pattern: digits with optional dots and letter suffix
  const match = instruction.match(/^(\d+(?:\.\d+)*[A-Z]?)/);
  return match ? match[1] : null;
}

/**
 * Recursively searches chapter sections/subsections for matching section number.
 */
export function findSectionInChapter(
  sections: CopSection[],
  sectionNumber: string
): CopSection | null {
  for (const section of sections) {
    if (section.number === sectionNumber) {
      return section;
    }
    if (section.subsections) {
      const found = findSectionInChapter(section.subsections, sectionNumber);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Truncates text to nearest sentence boundary within maxLength.
 * If no sentence boundary found, truncates at word boundary and appends "..."
 */
export function truncateToSentence(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Try to find sentence boundary within maxLength
  const sentenceEndings = ['. ', '.\n'];
  let bestEnd = -1;

  for (const ending of sentenceEndings) {
    let pos = 0;
    while ((pos = text.indexOf(ending, pos)) !== -1 && pos <= maxLength) {
      bestEnd = pos + 1; // Include the period
      pos += ending.length;
    }
  }

  if (bestEnd > 0) {
    return text.substring(0, bestEnd).trim();
  }

  // No sentence boundary found - truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace).trim() + '...';
  }

  return truncated.trim() + '...';
}

/**
 * Resolves COP excerpts for detail steps that reference COP sections.
 * Loads chapter JSON files, finds matching sections, and returns excerpt data.
 *
 * @param steps - Array of step objects with instruction text and step number
 * @returns Array of resolved COP excerpt data (may be fewer than input if some don't match)
 */
export function resolveCopExcerpts(
  steps: Array<{ instruction: string; stepNumber: number }>
): CopExcerptData[] {
  const excerpts: CopExcerptData[] = [];
  const chapterCache = new Map<number, CopChapter>();

  for (const step of steps) {
    // Parse section number from instruction
    const sectionNumber = parseSectionNumber(step.instruction);
    if (!sectionNumber) {
      continue; // Skip steps without section number pattern
    }

    // Determine chapter number (first integer before any dot)
    const chapterMatch = sectionNumber.match(/^(\d+)/);
    if (!chapterMatch) {
      continue; // Should not happen given parseSectionNumber logic, but be safe
    }
    const chapterNum = parseInt(chapterMatch[1], 10);

    // Validate chapter number range (COP has chapters 1-19)
    if (chapterNum < 1 || chapterNum > 19) {
      continue;
    }

    // Load chapter JSON (use cache to avoid re-reading)
    let chapterData: CopChapter;
    if (chapterCache.has(chapterNum)) {
      chapterData = chapterCache.get(chapterNum)!;
    } else {
      const chapterPath = join(
        process.cwd(),
        'public',
        'cop',
        `chapter-${chapterNum}.json`
      );

      // Skip if chapter file doesn't exist
      if (!existsSync(chapterPath)) {
        continue;
      }

      try {
        const fileContent = readFileSync(chapterPath, 'utf-8');
        chapterData = JSON.parse(fileContent) as CopChapter;
        chapterCache.set(chapterNum, chapterData);
      } catch (error) {
        console.error(`Failed to load chapter ${chapterNum}:`, error);
        continue;
      }
    }

    // Find section in chapter
    const section = findSectionInChapter(chapterData.sections, sectionNumber);
    if (!section) {
      continue; // Section not found in chapter
    }

    // Build excerpt data
    excerpts.push({
      sectionNumber,
      title: section.title,
      excerpt: truncateToSentence(section.content),
      deepLinkUrl: `/cop/${chapterNum}#section-${sectionNumber}`,
      chapterNumber: chapterNum,
      chapterTitle: chapterData.title,
    });
  }

  return excerpts;
}
