/**
 * Map HTG content to detail codes
 * Creates relationships between HTG guides and specific detail codes (F07, P18, etc.)
 *
 * Usage:
 *   npm run db:map-htg-to-details -- --suggest   (outputs suggested mappings, no DB changes)
 *   npm run db:map-htg-to-details -- --insert    (inserts mappings into detail_htg table)
 */

// Load environment variables FIRST (before any other imports)
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './index';
import { detailHtg, htgContent, details } from './schema';

// ============================================
// CATEGORY-TO-SOURCEDOCUMENT MAPPING
// ============================================

const CATEGORY_TO_SOURCE: Record<string, string> = {
  flashings: 'flashings',
  penetrations: 'penetrations',
  junctions: 'cladding', // Junctions involve cladding connections
};

// ============================================
// KEYWORD GROUPS (derived from detail names)
// ============================================

const KEYWORD_GROUPS: Record<string, string[]> = {
  ridge: ['ridge', 'hip'],
  valley: ['valley'],
  barge: ['barge', 'verge'],
  apron: ['apron'],
  penetration: ['penetration', 'pipe', 'vent', 'chimney', 'skylight'],
  gutter: ['gutter', 'spouting'],
  curb: ['curb'],
  soaker: ['soaker'],
  fascia: ['fascia'],
  dormer: ['dormer'],
  wall: ['wall', 'cladding'],
  flashing: ['flashing'],
};

// ============================================
// MAPPING INTERFACE
// ============================================

interface Mapping {
  detailId: string;
  detailCode: string;
  detailName: string;
  htgId: string;
  htgGuideName: string;
  matchType: 'keyword' | 'category';
  relevance: 'primary' | 'supplementary';
  matchedKeywords?: string[];
}

// ============================================
// MODE 1: SUGGEST MAPPINGS
// ============================================

async function suggestMappings(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('HTG-TO-DETAIL MAPPING SUGGESTIONS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Fetch all HTG content
  const htgRecords = await db.select().from(htgContent);
  console.log(`Found ${htgRecords.length} HTG records\n`);

  // Fetch all details
  const detailRecords = await db.select().from(details);
  console.log(`Found ${detailRecords.length} detail records\n`);

  const mappings: Mapping[] = [];

  // For each HTG record
  for (const htg of htgRecords) {
    const htgContentLower = (htg.content || '').toLowerCase();
    const htgGuideNameLower = htg.guideName.toLowerCase();

    console.log(`\n📌 HTG: ${htg.guideName} (${htg.sourceDocument})`);

    let htgMappingCount = 0;

    // Check each detail
    for (const detail of detailRecords) {
      const detailNameLower = detail.name.toLowerCase();
      const detailCategory = detail.categoryId;

      // KEYWORD MATCHING: check if detail name appears in HTG content
      const detailNameTokens = detailNameLower
        .split(/[\s\-]+/)
        .filter((t) => t.length > 3); // Skip short words

      const matchedKeywords: string[] = [];

      // Check if any significant word from detail name appears in HTG content
      for (const token of detailNameTokens) {
        if (htgContentLower.includes(token) || htgGuideNameLower.includes(token)) {
          matchedKeywords.push(token);
        }
      }

      // Also check keyword groups
      for (const [, keywords] of Object.entries(KEYWORD_GROUPS)) {
        for (const keyword of keywords) {
          if (
            detailNameLower.includes(keyword) &&
            (htgContentLower.includes(keyword) || htgGuideNameLower.includes(keyword))
          ) {
            if (!matchedKeywords.includes(keyword)) {
              matchedKeywords.push(keyword);
            }
          }
        }
      }

      if (matchedKeywords.length > 0) {
        // Keyword match found
        mappings.push({
          detailId: detail.id,
          detailCode: detail.code,
          detailName: detail.name,
          htgId: htg.id,
          htgGuideName: htg.guideName,
          matchType: 'keyword',
          relevance: 'primary',
          matchedKeywords,
        });
        console.log(
          `   KEYWORD: ${detail.code} "${detail.name}" (matched: ${matchedKeywords.join(', ')})`
        );
        htgMappingCount++;
      } else if (
        detailCategory &&
        CATEGORY_TO_SOURCE[detailCategory] === htg.sourceDocument
      ) {
        // Category-level match (no keywords, but same category)
        mappings.push({
          detailId: detail.id,
          detailCode: detail.code,
          detailName: detail.name,
          htgId: htg.id,
          htgGuideName: htg.guideName,
          matchType: 'category',
          relevance: 'supplementary',
        });
        // Don't print category matches to reduce noise
        htgMappingCount++;
      }
    }

    console.log(`   Total mappings for this HTG: ${htgMappingCount}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('SUMMARY BY SOURCE DOCUMENT\n');

  const summaryBySource: Record<
    string,
    { keyword: number; category: number; total: number }
  > = {};

  for (const mapping of mappings) {
    const htg = htgRecords.find((h) => h.id === mapping.htgId);
    if (!htg) continue;

    if (!summaryBySource[htg.sourceDocument]) {
      summaryBySource[htg.sourceDocument] = { keyword: 0, category: 0, total: 0 };
    }

    (summaryBySource[htg.sourceDocument] as Record<string, number>)[mapping.matchType]++;
    summaryBySource[htg.sourceDocument].total++;
  }

  for (const [source, counts] of Object.entries(summaryBySource)) {
    console.log(`${source}:`);
    console.log(`  Keyword matches: ${counts.keyword}`);
    console.log(`  Category matches: ${counts.category}`);
    console.log(`  Total: ${counts.total}\n`);
  }

  console.log(`TOTAL MAPPINGS: ${mappings.length}\n`);
  console.log('⚠ Run with --insert to populate the database.\n');
}

// ============================================
// MODE 2: INSERT MAPPINGS
// ============================================

async function insertMappings(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('HTG-TO-DETAIL MAPPING INSERT');
  console.log('═══════════════════════════════════════════════════════\n');

  // Clear existing mappings (idempotent)
  console.log('Clearing existing detail_htg mappings...');
  await db.delete(detailHtg);
  console.log('✓ Cleared\n');

  // Fetch all HTG content
  const htgRecords = await db.select().from(htgContent);
  console.log(`Found ${htgRecords.length} HTG records`);

  // Fetch all details
  const detailRecords = await db.select().from(details);
  console.log(`Found ${detailRecords.length} detail records\n`);

  const mappingsToInsert: Array<{
    detailId: string;
    htgId: string;
    relevance: string;
    matchType: string;
    notes: string | null;
  }> = [];

  // Generate mappings
  for (const htg of htgRecords) {
    const htgContentLower = (htg.content || '').toLowerCase();
    const htgGuideNameLower = htg.guideName.toLowerCase();

    for (const detail of detailRecords) {
      const detailNameLower = detail.name.toLowerCase();
      const detailCategory = detail.categoryId;

      // KEYWORD MATCHING
      const detailNameTokens = detailNameLower
        .split(/[\s\-]+/)
        .filter((t) => t.length > 3);

      const matchedKeywords: string[] = [];

      for (const token of detailNameTokens) {
        if (htgContentLower.includes(token) || htgGuideNameLower.includes(token)) {
          matchedKeywords.push(token);
        }
      }

      for (const [, keywords] of Object.entries(KEYWORD_GROUPS)) {
        for (const keyword of keywords) {
          if (
            detailNameLower.includes(keyword) &&
            (htgContentLower.includes(keyword) || htgGuideNameLower.includes(keyword))
          ) {
            if (!matchedKeywords.includes(keyword)) {
              matchedKeywords.push(keyword);
            }
          }
        }
      }

      if (matchedKeywords.length > 0) {
        // Keyword match
        mappingsToInsert.push({
          detailId: detail.id,
          htgId: htg.id,
          relevance: 'primary',
          matchType: 'keyword',
          notes: `Matched keywords: ${matchedKeywords.join(', ')}`,
        });
      } else if (
        detailCategory &&
        CATEGORY_TO_SOURCE[detailCategory] === htg.sourceDocument
      ) {
        // Category match
        mappingsToInsert.push({
          detailId: detail.id,
          htgId: htg.id,
          relevance: 'supplementary',
          matchType: 'category',
          notes: null,
        });
      }
    }
  }

  // Batch insert
  if (mappingsToInsert.length > 0) {
    console.log(`Inserting ${mappingsToInsert.length} mapping(s)...`);

    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < mappingsToInsert.length; i += batchSize) {
      const batch = mappingsToInsert.slice(i, i + batchSize);
      await db.insert(detailHtg).values(batch);
      insertedCount += batch.length;
    }

    console.log(`✓ Inserted ${insertedCount} mapping(s)\n`);
  } else {
    console.log('⚠ No mappings to insert\n');
  }

  // Summary
  const summaryBySource: Record<
    string,
    { keyword: number; category: number; total: number }
  > = {};

  for (const mapping of mappingsToInsert) {
    const htg = htgRecords.find((h) => h.id === mapping.htgId);
    if (!htg) continue;

    if (!summaryBySource[htg.sourceDocument]) {
      summaryBySource[htg.sourceDocument] = { keyword: 0, category: 0, total: 0 };
    }

    (summaryBySource[htg.sourceDocument] as Record<string, number>)[mapping.matchType]++;
    summaryBySource[htg.sourceDocument].total++;
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('MAPPING INSERT COMPLETE\n');

  console.log(`Total mappings inserted: ${mappingsToInsert.length}\n`);

  console.log('Breakdown by sourceDocument:');
  for (const [source, counts] of Object.entries(summaryBySource)) {
    console.log(`  ${source}:`);
    console.log(`    Keyword (primary): ${counts.keyword}`);
    console.log(`    Category (supplementary): ${counts.category}`);
    console.log(`    Total: ${counts.total}`);
  }

  console.log('\n✓ HTG-to-detail mappings created!\n');
}

// ============================================
// MAIN ENTRY POINT
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const mode = args.find((arg) => arg === '--suggest' || arg === '--insert');

  if (!mode) {
    console.error('Usage: npm run db:map-htg-to-details -- [--suggest | --insert]');
    console.error('');
    console.error('  --suggest  Output suggested mappings (no DB changes)');
    console.error('  --insert   Insert mappings into detail_htg table');
    process.exit(1);
  }

  if (mode === '--suggest') {
    await suggestMappings();
  } else if (mode === '--insert') {
    await insertMappings();
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
