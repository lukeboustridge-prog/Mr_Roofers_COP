/**
 * Map HTG content to COP sections
 * Creates relationships between HTG guides and relevant COP chapter sections
 *
 * Usage:
 *   npm run db:map-htg-to-cop -- --suggest   (outputs suggested mappings, no DB changes)
 *   npm run db:map-htg-to-cop -- --insert    (inserts curated mappings into cop_section_htg table)
 */

// Load environment variables FIRST (before any other imports)
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './index';
import { copSectionHtg, htgContent, copSections } from './schema';
import { eq, inArray } from 'drizzle-orm';

// ============================================
// MAPPING RULES
// ============================================

interface MappingRule {
  sourceDocument: string;
  copChapters: number[];
  keywords: string[];
}

const MAPPING_RULES: MappingRule[] = [
  {
    sourceDocument: 'flashings',
    copChapters: [8],
    keywords: ['flashing', 'ridge', 'valley', 'apron', 'soaker', 'barge', 'gutter'],
  },
  {
    sourceDocument: 'penetrations',
    copChapters: [9],
    keywords: ['penetration', 'pipe', 'vent', 'chimney', 'skylight', 'plumbing'],
  },
  {
    sourceDocument: 'cladding',
    copChapters: [6, 7],
    keywords: ['cladding', 'wall', 'fixing', 'fastener', 'flashing'],
  },
];

// ============================================
// MODE 1: SUGGEST MAPPINGS (keyword-based)
// ============================================

async function suggestMappings(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('HTG-TO-COP MAPPING SUGGESTIONS (KEYWORD-BASED)');
  console.log('═══════════════════════════════════════════════════════\n');

  let totalSuggestions = 0;
  const suggestionsBySource: Record<string, number> = {};

  for (const rule of MAPPING_RULES) {
    console.log(`\n📌 Source: ${rule.sourceDocument}`);
    console.log(`   COP Chapters: ${rule.copChapters.join(', ')}`);
    console.log(`   Keywords: ${rule.keywords.join(', ')}\n`);

    // Fetch HTG content for this sourceDocument
    const htgRecords = await db
      .select()
      .from(htgContent)
      .where(eq(htgContent.sourceDocument, rule.sourceDocument));

    if (htgRecords.length === 0) {
      console.log(`   ⚠ No HTG content found for ${rule.sourceDocument}\n`);
      continue;
    }

    console.log(`   Found ${htgRecords.length} HTG record(s)\n`);

    // Fetch COP sections for relevant chapters
    const copSectionsData = await db
      .select()
      .from(copSections)
      .where(inArray(copSections.chapterNumber, rule.copChapters));

    console.log(`   Found ${copSectionsData.length} COP sections in chapters ${rule.copChapters.join(', ')}\n`);

    let ruleCount = 0;

    // For each HTG record, check each COP section for keyword matches
    for (const htg of htgRecords) {
      const htgContentLower = (htg.content || '').toLowerCase();

      for (const section of copSectionsData) {
        const sectionTitleLower = section.title.toLowerCase();

        // Find matching keywords in both HTG content AND section title
        const matchedKeywords = rule.keywords.filter(
          (kw) =>
            htgContentLower.includes(kw.toLowerCase()) &&
            sectionTitleLower.includes(kw.toLowerCase())
        );

        if (matchedKeywords.length > 0) {
          console.log(
            `   SUGGEST: ${htg.id} -> ${section.sectionNumber} "${section.title}" (matched: ${matchedKeywords.join(', ')})`
          );
          ruleCount++;
          totalSuggestions++;
        }
      }
    }

    suggestionsBySource[rule.sourceDocument] = ruleCount;
    console.log(`\n   Total suggestions for ${rule.sourceDocument}: ${ruleCount}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`TOTAL SUGGESTIONS: ${totalSuggestions}\n`);

  for (const [source, count] of Object.entries(suggestionsBySource)) {
    console.log(`  ${source}: ${count} suggestion(s)`);
  }

  console.log('\n⚠ These are keyword-based suggestions - expect noise.');
  console.log('   Use --insert mode to create conservative chapter-level mappings.\n');
}

// ============================================
// MODE 2: INSERT CURATED MAPPINGS
// ============================================

async function insertCuratedMappings(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('HTG-TO-COP MAPPING INSERT (CONSERVATIVE)');
  console.log('═══════════════════════════════════════════════════════\n');

  // Clear existing mappings (idempotent)
  console.log('Clearing existing cop_section_htg mappings...');
  await db.delete(copSectionHtg);
  console.log('✓ Cleared\n');

  const mappingsToInsert: Array<{
    sectionId: string;
    htgId: string;
    relevance: string;
    notes: string;
  }> = [];

  for (const rule of MAPPING_RULES) {
    console.log(`Processing: ${rule.sourceDocument}`);

    // Fetch all HTG records for this sourceDocument
    const htgRecords = await db
      .select()
      .from(htgContent)
      .where(eq(htgContent.sourceDocument, rule.sourceDocument));

    if (htgRecords.length === 0) {
      console.log(`  ⚠ No HTG content found for ${rule.sourceDocument}, skipping\n`);
      continue;
    }

    console.log(`  Found ${htgRecords.length} HTG record(s)`);

    // For each chapter, get the root section (e.g., cop-8, cop-9, cop-6)
    for (const chapterNumber of rule.copChapters) {
      const rootSectionId = `cop-${chapterNumber}`;

      // Verify the root section exists
      const rootSection = await db
        .select()
        .from(copSections)
        .where(eq(copSections.id, rootSectionId))
        .limit(1);

      if (rootSection.length === 0) {
        console.warn(`  ⚠ Root section ${rootSectionId} not found, skipping chapter ${chapterNumber}`);
        continue;
      }

      // Map ALL HTG records for this sourceDocument to this chapter root
      for (const htg of htgRecords) {
        mappingsToInsert.push({
          sectionId: rootSectionId,
          htgId: htg.id,
          relevance: 'supplementary',
          notes: 'Auto-generated initial mapping — requires manual curation',
        });
      }

      console.log(`  Mapped ${htgRecords.length} HTG record(s) to ${rootSectionId}`);
    }

    console.log('');
  }

  // Batch insert
  if (mappingsToInsert.length > 0) {
    console.log(`Inserting ${mappingsToInsert.length} mapping(s)...`);

    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < mappingsToInsert.length; i += batchSize) {
      const batch = mappingsToInsert.slice(i, i + batchSize);
      await db.insert(copSectionHtg).values(batch);
      insertedCount += batch.length;
    }

    console.log(`✓ Inserted ${insertedCount} mapping(s)\n`);
  } else {
    console.log('⚠ No mappings to insert\n');
  }

  // Summary breakdown by sourceDocument
  const summaryBySource: Record<string, number> = {};

  for (const mapping of mappingsToInsert) {
    const htgRecord = await db
      .select()
      .from(htgContent)
      .where(eq(htgContent.id, mapping.htgId))
      .limit(1);

    if (htgRecord.length > 0) {
      const source = htgRecord[0].sourceDocument;
      summaryBySource[source] = (summaryBySource[source] || 0) + 1;
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('MAPPING INSERT COMPLETE\n');

  console.log(`Total mappings inserted: ${mappingsToInsert.length}\n`);

  console.log('Breakdown by sourceDocument:');
  for (const [source, count] of Object.entries(summaryBySource)) {
    console.log(`  ${source}: ${count} mapping(s)`);
  }

  console.log('\n✓ Initial mappings created!\n');
  console.log('   These are broad chapter-level mappings.');
  console.log('   Fine-grained section-level mappings require manual expert curation.\n');
}

// ============================================
// MAIN ENTRY POINT
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const mode = args.find((arg) => arg === '--suggest' || arg === '--insert');

  if (!mode) {
    console.error('Usage: npm run db:map-htg-to-cop -- [--suggest | --insert]');
    console.error('');
    console.error('  --suggest  Output suggested mappings (no DB changes)');
    console.error('  --insert   Insert curated chapter-level mappings into cop_section_htg');
    process.exit(1);
  }

  if (mode === '--suggest') {
    await suggestMappings();
  } else if (mode === '--insert') {
    await insertCuratedMappings();
  }
}

// Run
main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
