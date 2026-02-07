/**
 * Import COP hierarchy from sections_hierarchy.json
 * Creates cop_sections records with proper parent/child relationships
 */

import { db } from './index';
import { copSections } from './schema';
import * as fs from 'fs';
import * as path from 'path';

interface Section {
  number: string;
  title: string;
  content?: string;
  pdf_pages?: number[];
  subsections?: Record<string, Section>;
}

type SectionsData = Record<string, Section>;

// Track global sort order for proper tree traversal
let globalSortOrder = 0;

/**
 * Calculate section level from section number
 * "1" -> 1, "1.1" -> 2, "1.1.1" -> 3, "8.5.4A" -> 3
 */
function calculateLevel(sectionNumber: string): number {
  const parts = sectionNumber.split('.');
  return parts.length;
}

/**
 * Calculate parent ID from section number
 * "1.1" -> "cop-1", "1.1.1" -> "cop-1.1", "8.5.4A" -> "cop-8.5.4"
 */
function calculateParentId(sectionNumber: string): string | null {
  const parts = sectionNumber.split('.');
  if (parts.length === 1) {
    // Top-level chapter - no parent
    return null;
  }
  // Remove last part to get parent
  const parentNumber = parts.slice(0, -1).join('.');
  return `cop-${parentNumber}`;
}

/**
 * Extract chapter number from section number
 * "1" -> 1, "1.1" -> 1, "8.5.4A" -> 8
 */
function extractChapterNumber(sectionNumber: string): number {
  const firstPart = sectionNumber.split('.')[0];
  // Remove any trailing letters (e.g., "8A" -> "8")
  const numericPart = firstPart.replace(/[A-Z]/g, '');
  return parseInt(numericPart, 10);
}

/**
 * Recursively import sections and their subsections
 */
async function importSection(
  section: Section,
  sectionsToInsert: Array<{
    id: string;
    sectionNumber: string;
    chapterNumber: number;
    parentId: string | null;
    title: string;
    level: number;
    sortOrder: number;
    pdfPages: number[] | null;
    hasContent: boolean;
    sourceId: string;
  }>
): Promise<void> {
  const sectionNumber = section.number;
  const sectionId = `cop-${sectionNumber}`;
  const level = calculateLevel(sectionNumber);
  const parentId = calculateParentId(sectionNumber);
  const chapterNumber = extractChapterNumber(sectionNumber);
  const hasContent = !!section.content && section.content.trim().length > 0;
  const currentSortOrder = globalSortOrder++;

  // Add this section to the batch
  sectionsToInsert.push({
    id: sectionId,
    sectionNumber: sectionNumber,
    chapterNumber: chapterNumber,
    parentId: parentId,
    title: section.title,
    level: level,
    sortOrder: currentSortOrder,
    pdfPages: section.pdf_pages || null,
    hasContent: hasContent,
    sourceId: 'mrm-cop',
  });

  // Recursively process subsections
  if (section.subsections) {
    // Sort subsection keys for consistent ordering
    const subsectionKeys = Object.keys(section.subsections).sort((a, b) => {
      // Natural sort for section numbers
      const aParts = a.split('.').map(p => {
        const num = parseInt(p.replace(/[A-Z]/g, ''), 10);
        return isNaN(num) ? 0 : num;
      });
      const bParts = b.split('.').map(p => {
        const num = parseInt(p.replace(/[A-Z]/g, ''), 10);
        return isNaN(num) ? 0 : num;
      });

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        if (aVal !== bVal) return aVal - bVal;
      }
      return 0;
    });

    for (const key of subsectionKeys) {
      await importSection(section.subsections[key], sectionsToInsert);
    }
  }
}

async function main() {
  console.log('Starting COP hierarchy import...');

  // Read the sections hierarchy JSON
  const jsonPath = path.join(process.cwd(), 'mrm_extract', 'sections_hierarchy.json');
  console.log(`Reading from: ${jsonPath}`);

  const jsonData = fs.readFileSync(jsonPath, 'utf-8');
  const sectionsData: SectionsData = JSON.parse(jsonData);

  console.log(`Loaded ${Object.keys(sectionsData).length} top-level chapters`);

  // Collect all sections to insert
  const sectionsToInsert: Array<{
    id: string;
    sectionNumber: string;
    chapterNumber: number;
    parentId: string | null;
    title: string;
    level: number;
    sortOrder: number;
    pdfPages: number[] | null;
    hasContent: boolean;
    sourceId: string;
  }> = [];

  // Sort chapter keys (1, 2, 3, ... 19)
  const chapterKeys = Object.keys(sectionsData).sort((a, b) => {
    return parseInt(a, 10) - parseInt(b, 10);
  });

  // Process each chapter and its subsections
  for (const chapterKey of chapterKeys) {
    await importSection(sectionsData[chapterKey], sectionsToInsert);
  }

  console.log(`Collected ${sectionsToInsert.length} sections to import`);

  // Clear existing cop_sections (idempotent)
  console.log('Clearing existing cop_sections...');
  await db.delete(copSections);

  // Reset global sort order for next run
  globalSortOrder = 0;

  // Insert all sections in batches of 100
  const batchSize = 100;
  for (let i = 0; i < sectionsToInsert.length; i += batchSize) {
    const batch = sectionsToInsert.slice(i, i + batchSize);
    await db.insert(copSections).values(batch);
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sectionsToInsert.length / batchSize)}`);
  }

  console.log(`\n✓ Import complete!`);
  console.log(`  Total sections imported: ${sectionsToInsert.length}`);
  console.log(`  Chapters: ${chapterKeys.length}`);
  console.log(`  Sections with content: ${sectionsToInsert.filter(s => s.hasContent).length}`);

  // Show sample of imported sections
  console.log(`\nSample sections imported:`);
  const samples = [
    sectionsToInsert.find(s => s.sectionNumber === '1'),
    sectionsToInsert.find(s => s.sectionNumber === '1.1'),
    sectionsToInsert.find(s => s.sectionNumber === '8.5.4'),
    sectionsToInsert.find(s => s.sectionNumber === '19'),
  ].filter(Boolean);

  samples.forEach(section => {
    console.log(`  ${section!.sectionNumber} (Level ${section!.level}): ${section!.title}`);
  });

  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
