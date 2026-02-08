import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { details, copSectionDetails } from './schema';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface ChapterSection {
  number: string;
  content: string;
  subsections?: ChapterSection[];
}

interface ChapterJSON {
  chapterNumber: number;
  sections: ChapterSection[];
}

/**
 * Extract all section numbers and content from chapter JSON (recursive)
 */
function extractSectionsFromChapter(sections: ChapterSection[]): Array<{ number: string; content: string }> {
  const result: Array<{ number: string; content: string }> = [];

  for (const section of sections) {
    result.push({ number: section.number, content: section.content });

    if (section.subsections) {
      result.push(...extractSectionsFromChapter(section.subsections));
    }
  }

  return result;
}

/**
 * Find detail code references in section content
 * Looks for patterns like "F07", "P12", "D03" (common MRM detail codes)
 */
function findDetailReferences(content: string): string[] {
  const detailCodePattern = /\b([A-Z]\d{2,3})\b/g;
  const matches = content.match(detailCodePattern) || [];

  // Remove duplicates
  return Array.from(new Set(matches));
}

/**
 * Link COP sections to detail records
 */
async function linkCopSectionDetails() {
  console.log('Starting section-detail linking...\n');

  // Load all existing details
  console.log('Loading existing details...');
  const existingDetails = await db.select({ code: details.code, id: details.id }).from(details);
  const detailCodeMap = new Map(existingDetails.map(d => [d.code, d.id]));
  console.log(`Loaded ${detailCodeMap.size} existing details\n`);

  // Clear existing links
  console.log('Clearing existing section-detail links...');
  await db.delete(copSectionDetails);
  console.log('Existing links cleared\n');

  const linksToCreate: Array<{
    sectionId: string;
    detailId: string;
    relationshipType: string;
    notes: string | null;
  }> = [];

  // Process each chapter JSON file
  const copDir = path.join(process.cwd(), 'public', 'cop');
  const chapterFiles = fs.readdirSync(copDir).filter(f => f.startsWith('chapter-'));

  console.log(`Processing ${chapterFiles.length} chapter files...\n`);

  for (const file of chapterFiles) {
    const chapterPath = path.join(copDir, file);
    const chapterData: ChapterJSON = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));

    console.log(`Chapter ${chapterData.chapterNumber}:`);

    const sections = extractSectionsFromChapter(chapterData.sections);
    let chapterLinks = 0;

    for (const section of sections) {
      const sectionId = `cop-${section.number}`;

      // Find detail code references in content
      const referencedCodes = findDetailReferences(section.content);

      for (const code of referencedCodes) {
        const detailId = detailCodeMap.get(code);

        if (detailId) {
          linksToCreate.push({
            sectionId,
            detailId,
            relationshipType: 'referenced',
            notes: `Detail ${code} referenced in section ${section.number} content`,
          });
          chapterLinks++;
        }
      }
    }

    console.log(`  Found ${chapterLinks} detail references\n`);
  }

  console.log(`Total links to create: ${linksToCreate.length}\n`);

  // Batch insert links
  if (linksToCreate.length > 0) {
    console.log('Inserting section-detail links...');
    const BATCH_SIZE = 50;

    for (let i = 0; i < linksToCreate.length; i += BATCH_SIZE) {
      const batch = linksToCreate.slice(i, i + BATCH_SIZE);
      await db.insert(copSectionDetails).values(batch);
      console.log(`  Inserted links ${i + 1}-${Math.min(i + BATCH_SIZE, linksToCreate.length)} of ${linksToCreate.length}`);
    }

    console.log('\n✓ Linking complete!');
  } else {
    console.log('No links found to create.');
    console.log('This is expected if detail codes are not explicitly referenced in COP text.');
    console.log('Manual curation may be needed to establish relationships.\n');
  }
}

linkCopSectionDetails()
  .then(() => {
    console.log('\nSection-detail linking completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Linking failed:', error);
    process.exit(1);
  });
