/**
 * clean-cop-content.ts
 *
 * Cleans PDF extraction artifacts from chapter JSON files in public/cop/.
 * Run: npx tsx scripts/clean-cop-content.ts
 *
 * Cleaning operations (in order):
 * 1. Remove footer boilerplate
 * 2. Remove page navigation metadata blocks
 * 3. Strip leading section number + title from content
 * 4. Rejoin wrapped paragraph lines
 * 5. Collapse excessive blank lines
 * 6. Trim whitespace
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface CopSection {
  number: string;
  title: string;
  level: number;
  content: string;
  pdfPages: number[];
  images?: unknown[];
  subsections?: CopSection[];
}

interface CopChapter {
  chapterNumber: number;
  title: string;
  version: string;
  sectionCount: number;
  sections: CopSection[];
}

// ── Cleaning functions ──────────────────────────────────────────────────

/**
 * 1. Remove the controlled-document footer that appears on every page.
 *    Handles the "conict" typo from PDF extraction.
 */
function removeFooterBoilerplate(content: string): string {
  // The footer spans two lines in the content and appears multiple times.
  // Pattern: "This is a controlled document..." through "...prevails over any saved or printed version."
  const footerRegex = /This is a controlled document\.[^\n]*\n[^\n]*prevails over any saved or printed version\./g;
  return content.replace(footerRegex, '');
}

/**
 * 2. Remove page navigation metadata blocks.
 *
 * These are clusters of 3+ short lines at page boundaries containing:
 * - Bare numbers (page numbers, chapter numbers)
 * - Section numbers like "1.5", "8.3A"
 * - UPPERCASE section titles like "1.5 DISPUTES", "INTRODUCTION"
 */
function removeNavMetadataBlocks(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];

  // Classify each line
  const isNavLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (trimmed === '') return false;

    // Bare number (page number, chapter number)
    if (/^\d+$/.test(trimmed)) return true;

    // Section number only (e.g., "1.5", "8.3A", "12.4.1")
    if (/^\d+(\.\d+[A-Z]?)+$/.test(trimmed)) return true;

    // Chapter/section number + ALL CAPS title
    // e.g., "1 INTRODUCTION", "1.5 DISPUTES", "8 FLASHINGS"
    if (/^\d+(\.\d+[A-Z]?)*\s+[A-Z][A-Z\s,&()\-\/.']+$/.test(trimmed)) return true;

    return false;
  };

  // Find runs of consecutive nav lines (with possible blank lines between)
  let i = 0;
  while (i < lines.length) {
    // Look ahead to see if we're at the start of a nav block
    let navCount = 0;
    let blockEnd = i;
    let j = i;

    while (j < lines.length) {
      const trimmed = lines[j].trim();
      if (isNavLine(lines[j])) {
        navCount++;
        blockEnd = j + 1;
        j++;
      } else if (trimmed === '' && j > i) {
        // Allow blank lines within a nav block, but only if there are more nav lines after
        let hasMoreNav = false;
        for (let k = j + 1; k < Math.min(j + 3, lines.length); k++) {
          if (isNavLine(lines[k])) {
            hasMoreNav = true;
            break;
          }
        }
        if (hasMoreNav) {
          j++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    if (navCount >= 3) {
      // Skip this block entirely
      i = blockEnd;
    } else {
      result.push(lines[i]);
      i++;
    }
  }

  return result.join('\n');
}

/**
 * 3. Strip leading section number + title from start of content.
 *    e.g., "1.5 \nDisputes \n..." → "..."
 */
function stripLeadingNumberAndTitle(content: string, sectionNumber: string, title: string): string {
  const escapedNumber = sectionNumber.replace(/\./g, '\\.');
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Match: section number (with optional trailing spaces), newline, title (with optional trailing spaces), newline
  const regex = new RegExp(`^\\s*${escapedNumber}\\s*\\n${escapedTitle}\\s*\\n`, 'i');
  const stripped = content.replace(regex, '');

  return stripped || content;
}

/**
 * 4. Rejoin wrapped paragraph lines.
 *
 * PDF extraction wraps at fixed line width. Join lines where:
 * - Current line doesn't end with terminal punctuation or list markers
 * - Next line starts with a lowercase letter (continuation)
 * - Neither line is blank
 *
 * Preserves:
 * - Blank line paragraph breaks
 * - List items (starting with bullets, dashes, letters/numbers followed by . or ))
 * - Lines ending with colons (introducing lists)
 * - Short standalone lines (titles, table data)
 */
function rejoinWrappedLines(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];

  let i = 0;
  while (i < lines.length) {
    let currentLine = lines[i];

    // Try to join with subsequent lines
    while (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const trimmedCurrent = currentLine.trimEnd();
      const trimmedNext = nextLine.trim();

      // Don't join if either line is empty
      if (trimmedCurrent === '' || trimmedNext === '') break;

      // Don't join if current line ends with terminal punctuation
      if (/[.:;?!)\]"]$/.test(trimmedCurrent)) break;

      // Don't join if next line starts with a list marker or uppercase (new sentence/heading)
      // List markers: •, -, *, numbers/letters with ) or .
      if (/^[•\-\*]/.test(trimmedNext)) break;
      if (/^\(?[a-z]\)/.test(trimmedNext)) break;
      if (/^\d+[.)]/.test(trimmedNext)) break;

      // Don't join if next line starts with uppercase (likely a new sentence or heading)
      if (/^[A-Z]/.test(trimmedNext)) break;

      // Don't join if current line is very short and looks like a heading/label
      if (trimmedCurrent.length < 30 && !trimmedCurrent.includes(' ')) break;

      // Next line starts with lowercase - this is a paragraph continuation
      if (/^[a-z]/.test(trimmedNext)) {
        currentLine = trimmedCurrent + '\n' + nextLine;
        i++;
        continue;
      }

      // Next line starts with ( or other continuation chars following lowercase context
      if (/^[(]/.test(trimmedNext) && /[a-z,]$/.test(trimmedCurrent)) {
        currentLine = trimmedCurrent + '\n' + nextLine;
        i++;
        continue;
      }

      break;
    }

    result.push(currentLine);
    i++;
  }

  return result.join('\n');
}

/**
 * 5. Collapse 3+ consecutive blank lines to 2.
 */
function collapseBlankLines(content: string): string {
  return content.replace(/\n{4,}/g, '\n\n\n');
}

/**
 * 6. Trim leading/trailing whitespace.
 */
function trimContent(content: string): string {
  return content.trim();
}

// ── Main pipeline ───────────────────────────────────────────────────────

function cleanContent(content: string, sectionNumber: string, title: string): string {
  let cleaned = content;

  // Apply cleaning steps in order
  cleaned = removeFooterBoilerplate(cleaned);
  cleaned = removeNavMetadataBlocks(cleaned);
  cleaned = stripLeadingNumberAndTitle(cleaned, sectionNumber, title);
  cleaned = rejoinWrappedLines(cleaned);
  cleaned = collapseBlankLines(cleaned);
  cleaned = trimContent(cleaned);

  return cleaned;
}

function cleanSectionRecursive(section: CopSection): CopSection {
  return {
    ...section,
    content: cleanContent(section.content, section.number, section.title),
    subsections: section.subsections?.map(cleanSectionRecursive),
  };
}

function cleanChapter(chapter: CopChapter): CopChapter {
  return {
    ...chapter,
    sections: chapter.sections.map(cleanSectionRecursive),
  };
}

// ── Entry point ─────────────────────────────────────────────────────────

function main() {
  const copDir = join(__dirname, '..', 'public', 'cop');
  const files = readdirSync(copDir).filter(f => /^chapter-\d+\.json$/.test(f)).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)![0]);
    const numB = parseInt(b.match(/\d+/)![0]);
    return numA - numB;
  });

  console.log(`Found ${files.length} chapter files to clean.\n`);

  let totalSections = 0;
  let totalCleaned = 0;

  for (const file of files) {
    const filePath = join(copDir, file);
    const raw = readFileSync(filePath, 'utf-8');
    const chapter: CopChapter = JSON.parse(raw);

    const originalSize = raw.length;
    const cleaned = cleanChapter(chapter);
    const output = JSON.stringify(cleaned, null, 2);
    const newSize = output.length;

    writeFileSync(filePath, output, 'utf-8');

    const sectionCount = countSections(chapter);
    totalSections += sectionCount;
    totalCleaned++;

    const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
    console.log(
      `  ${file}: ${sectionCount} sections, ${(originalSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB (${reduction}% reduction)`
    );
  }

  console.log(`\nDone! Cleaned ${totalSections} sections across ${totalCleaned} chapters.`);
}

function countSections(chapter: CopChapter): number {
  let count = 0;
  function walk(sections: CopSection[]) {
    for (const s of sections) {
      count++;
      if (s.subsections) walk(s.subsections);
    }
  }
  walk(chapter.sections);
  return count;
}

main();
