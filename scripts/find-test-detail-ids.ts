/**
 * Find detail IDs for E2E test scenarios
 * Queries database to identify details matching the four content scenarios
 *
 * Run: npx tsx scripts/find-test-detail-ids.ts
 */

// Load environment variables for standalone script execution
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db';
import { details, warningConditions, detailLinks, substrates, categories } from '@/lib/db/schema';
import { eq, and, isNotNull, isNull, sql, notExists } from 'drizzle-orm';

interface TestDetail {
  id: string;
  code: string;
  name: string;
  substrateId: string | null;
  categoryId: string | null;
  substrateName?: string;
  categoryName?: string;
}

async function findTestDetailIds() {
  console.log('Finding test detail IDs for E2E content scenario tests...\n');

  // 1. MRM-only detail (has warnings, no model, no links)
  console.log('1. MRM-only detail (has warnings, no model, no links):');
  const mrmOnlyResult = await db.execute(sql`
    SELECT d.id, d.code, d.name, d.substrate_id as "substrateId", d.category_id as "categoryId",
           s.name as "substrateName", c.name as "categoryName"
    FROM details d
    JOIN substrates s ON s.id = d.substrate_id
    JOIN categories c ON c.id = d.category_id
    WHERE d.source_id = 'mrm-cop'
      AND d.model_url IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM detail_links dl
        WHERE dl.primary_detail_id = d.id OR dl.supplementary_detail_id = d.id
      )
      AND EXISTS (
        SELECT 1 FROM warning_conditions wc WHERE wc.detail_id = d.id
      )
    LIMIT 1
  `);
  const mrmOnly = mrmOnlyResult.rows[0] as TestDetail | undefined;
  if (mrmOnly) {
    console.log(`   ID: ${mrmOnly.id}`);
    console.log(`   Code: ${mrmOnly.code}`);
    console.log(`   Name: ${mrmOnly.name}`);
    console.log(`   Path: /planner/${mrmOnly.substrateId}/${mrmOnly.categoryId}/${mrmOnly.id}`);
    console.log(`   Substrate: ${mrmOnly.substrateName}`);
    console.log(`   Category: ${mrmOnly.categoryName}\n`);
  } else {
    console.log('   NOT FOUND - No MRM detail with warnings but no model/links\n');
  }

  // 2. RANZ-only detail (has model, no warnings, no links)
  console.log('2. RANZ-only detail (has model, no warnings, no links):');
  const ranzOnlyResult = await db.execute(sql`
    SELECT d.id, d.code, d.name, d.substrate_id as "substrateId", d.category_id as "categoryId",
           s.name as "substrateName", c.name as "categoryName"
    FROM details d
    JOIN substrates s ON s.id = d.substrate_id
    JOIN categories c ON c.id = d.category_id
    WHERE d.source_id = 'ranz-guide'
      AND d.model_url IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM detail_links dl
        WHERE dl.primary_detail_id = d.id OR dl.supplementary_detail_id = d.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM warning_conditions wc WHERE wc.detail_id = d.id
      )
    LIMIT 1
  `);
  const ranzOnly = ranzOnlyResult.rows[0] as TestDetail | undefined;
  if (ranzOnly) {
    console.log(`   ID: ${ranzOnly.id}`);
    console.log(`   Code: ${ranzOnly.code}`);
    console.log(`   Name: ${ranzOnly.name}`);
    console.log(`   Path: /planner/${ranzOnly.substrateId}/${ranzOnly.categoryId}/${ranzOnly.id}`);
    console.log(`   Substrate: ${ranzOnly.substrateName}`);
    console.log(`   Category: ${ranzOnly.categoryName}\n`);
  } else {
    console.log('   NOT FOUND - No RANZ detail with model but no warnings/links\n');
  }

  // 3. Linked MRM detail (MRM linked to RANZ with model)
  console.log('3. Linked MRM detail (MRM primary linked to RANZ supplementary with model):');
  const linkedResult = await db.execute(sql`
    SELECT d.id, d.code, d.name, d.substrate_id as "substrateId", d.category_id as "categoryId",
           s.name as "substrateName", c.name as "categoryName",
           dl.supplementary_detail_id as "linkedDetailId"
    FROM details d
    JOIN detail_links dl ON dl.primary_detail_id = d.id
    JOIN details rd ON rd.id = dl.supplementary_detail_id
    JOIN substrates s ON s.id = d.substrate_id
    JOIN categories c ON c.id = d.category_id
    WHERE d.source_id = 'mrm-cop'
      AND rd.model_url IS NOT NULL
    LIMIT 1
  `);
  const linked = linkedResult.rows[0] as (TestDetail & { linkedDetailId: string }) | undefined;
  if (linked) {
    console.log(`   ID: ${linked.id}`);
    console.log(`   Code: ${linked.code}`);
    console.log(`   Name: ${linked.name}`);
    console.log(`   Path: /planner/${linked.substrateId}/${linked.categoryId}/${linked.id}`);
    console.log(`   Substrate: ${linked.substrateName}`);
    console.log(`   Category: ${linked.categoryName}`);
    console.log(`   Linked to: ${linked.linkedDetailId}\n`);
  } else {
    console.log('   NOT FOUND - No MRM detail linked to RANZ with model\n');
  }

  // 4. Standalone detail (no model, no warnings, no links)
  console.log('4. Standalone detail (no model, no warnings, no links):');
  const standaloneResult = await db.execute(sql`
    SELECT d.id, d.code, d.name, d.substrate_id as "substrateId", d.category_id as "categoryId",
           s.name as "substrateName", c.name as "categoryName"
    FROM details d
    JOIN substrates s ON s.id = d.substrate_id
    JOIN categories c ON c.id = d.category_id
    WHERE d.model_url IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM warning_conditions wc WHERE wc.detail_id = d.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM detail_links dl
        WHERE dl.primary_detail_id = d.id OR dl.supplementary_detail_id = d.id
      )
    LIMIT 1
  `);
  const standalone = standaloneResult.rows[0] as TestDetail | undefined;
  if (standalone) {
    console.log(`   ID: ${standalone.id}`);
    console.log(`   Code: ${standalone.code}`);
    console.log(`   Name: ${standalone.name}`);
    console.log(`   Path: /planner/${standalone.substrateId}/${standalone.categoryId}/${standalone.id}`);
    console.log(`   Substrate: ${standalone.substrateName}`);
    console.log(`   Category: ${standalone.categoryName}\n`);
  } else {
    console.log('   NOT FOUND - No detail without model, warnings, or links\n');
  }

  // Output summary for test file
  console.log('\n=== TEST CONFIGURATION ===\n');
  console.log('export const TEST_DETAILS = {');
  if (mrmOnly) {
    console.log(`  mrmOnly: {`);
    console.log(`    id: '${mrmOnly.id}',`);
    console.log(`    code: '${mrmOnly.code}',`);
    console.log(`    path: '/planner/${mrmOnly.substrateId}/${mrmOnly.categoryId}/${mrmOnly.id}',`);
    console.log(`  },`);
  } else {
    console.log(`  mrmOnly: null, // Not found in database`);
  }
  if (ranzOnly) {
    console.log(`  ranzOnly: {`);
    console.log(`    id: '${ranzOnly.id}',`);
    console.log(`    code: '${ranzOnly.code}',`);
    console.log(`    path: '/planner/${ranzOnly.substrateId}/${ranzOnly.categoryId}/${ranzOnly.id}',`);
    console.log(`  },`);
  } else {
    console.log(`  ranzOnly: null, // Not found in database`);
  }
  if (linked) {
    console.log(`  linked: {`);
    console.log(`    id: '${linked.id}',`);
    console.log(`    code: '${linked.code}',`);
    console.log(`    path: '/planner/${linked.substrateId}/${linked.categoryId}/${linked.id}',`);
    console.log(`    linkedTo: '${linked.linkedDetailId}',`);
    console.log(`  },`);
  } else {
    console.log(`  linked: null, // Not found in database`);
  }
  if (standalone) {
    console.log(`  standalone: {`);
    console.log(`    id: '${standalone.id}',`);
    console.log(`    code: '${standalone.code}',`);
    console.log(`    path: '/planner/${standalone.substrateId}/${standalone.categoryId}/${standalone.id}',`);
    console.log(`  },`);
  } else {
    console.log(`  standalone: null, // Not found in database`);
  }
  console.log('};');
}

findTestDetailIds()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Query failed:', error);
    process.exit(1);
  });
