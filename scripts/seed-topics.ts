/**
 * Topic Seeding Script
 *
 * Seeds topics table and creates category-topic mappings for unified navigation.
 * Also verifies all 6 core substrates exist (DATA-04).
 *
 * Usage: npx tsx scripts/seed-topics.ts
 *
 * Idempotent: Can be run multiple times safely using onConflictDoNothing().
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../lib/db';
import { topics as topicsTable, categoryTopics, substrates, categories } from '../lib/db/schema';
import { eq, sql, count } from 'drizzle-orm';
import { topics, categoryTopicMappings, coreSubstrates } from '../lib/db/seed-data/topics';
import { neon } from '@neondatabase/serverless';

async function seedTopics() {
  console.log('='.repeat(60));
  console.log(' Topic Seeding Script');
  console.log('='.repeat(60));

  // ============================================
  // Step 1: Verify/Report Substrates (DATA-04)
  // ============================================
  console.log('\n[1/4] Verifying substrates...');

  const existingSubstrates = await db.select().from(substrates);
  const existingSubstrateIds = new Set(existingSubstrates.map((s) => s.id));

  console.log(`   Found ${existingSubstrates.length} substrates in database:`);
  for (const sub of existingSubstrates) {
    console.log(`   - ${sub.id}: ${sub.name}`);
  }

  // Check which core substrates exist
  const missingSubstrates = coreSubstrates.filter((s) => !existingSubstrateIds.has(s.id));
  if (missingSubstrates.length > 0) {
    console.log(`\n   WARNING: ${missingSubstrates.length} core substrates missing:`);
    for (const sub of missingSubstrates) {
      console.log(`   - ${sub.id}: ${sub.name}`);
    }
  } else {
    console.log(`\n   All ${coreSubstrates.length} core substrates verified.`);
  }

  // ============================================
  // Step 2: Seed Topics
  // ============================================
  console.log('\n[2/4] Seeding topics...');

  const topicData = topics.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    sortOrder: t.sortOrder,
  }));

  // Check existing topics
  const existingTopics = await db.select().from(topicsTable);
  const existingTopicIds = new Set(existingTopics.map((t) => t.id));

  let topicsCreated = 0;
  let topicsSkipped = 0;

  for (const topic of topicData) {
    if (existingTopicIds.has(topic.id)) {
      topicsSkipped++;
      console.log(`   - ${topic.id}: already exists (skipped)`);
    } else {
      await db.insert(topicsTable).values(topic).onConflictDoNothing();
      topicsCreated++;
      console.log(`   + ${topic.id}: created`);
    }
  }

  console.log(`\n   Topics: ${topicsCreated} created, ${topicsSkipped} skipped`);

  // ============================================
  // Step 3: Seed Category-Topic Mappings
  // ============================================
  console.log('\n[3/4] Creating category-topic mappings...');

  // Get existing categories
  const existingCategories = await db.select().from(categories);
  const existingCategoryIds = new Set(existingCategories.map((c) => c.id));

  // Get existing mappings
  const existingMappings = await db.select().from(categoryTopics);
  const existingMappingKeys = new Set(
    existingMappings.map((m) => `${m.categoryId}:${m.topicId}`)
  );

  let mappingsCreated = 0;
  let mappingsSkipped = 0;
  let categoriesNotFound: string[] = [];

  for (const mapping of categoryTopicMappings) {
    if (!existingCategoryIds.has(mapping.categoryId)) {
      categoriesNotFound.push(mapping.categoryId);
      console.log(`   ? ${mapping.categoryId} -> ${mapping.topicId}: category not found (skipped)`);
      continue;
    }

    const mappingKey = `${mapping.categoryId}:${mapping.topicId}`;
    if (existingMappingKeys.has(mappingKey)) {
      mappingsSkipped++;
      console.log(`   - ${mapping.categoryId} -> ${mapping.topicId}: already mapped (skipped)`);
    } else {
      await db.insert(categoryTopics).values({
        categoryId: mapping.categoryId,
        topicId: mapping.topicId,
      }).onConflictDoNothing();
      mappingsCreated++;
      console.log(`   + ${mapping.categoryId} -> ${mapping.topicId}: mapped`);
    }
  }

  console.log(`\n   Mappings: ${mappingsCreated} created, ${mappingsSkipped} skipped`);
  if (categoriesNotFound.length > 0) {
    console.log(`   Categories not found: ${categoriesNotFound.length}`);
  }

  // ============================================
  // Step 4: Verification Summary
  // ============================================
  console.log('\n[4/4] Verification summary...');

  // Use raw neon client for complex queries
  const sqlClient = neon(process.env.DATABASE_URL!);

  // Query topics with category counts
  const topicsWithCounts = await sqlClient`
    SELECT t.id, t.name, COUNT(ct.category_id)::text as category_count
    FROM topics t
    LEFT JOIN category_topics ct ON t.id = ct.topic_id
    GROUP BY t.id, t.name
    ORDER BY t.sort_order
  `;

  console.log('\n   Topic | Categories');
  console.log('   ' + '-'.repeat(40));
  for (const row of topicsWithCounts) {
    console.log(`   ${String(row.name).padEnd(15)} | ${row.category_count}`);
  }

  // Check for unmapped categories
  const unmappedCategories = await sqlClient`
    SELECT c.id, c.name, c.source_id
    FROM categories c
    LEFT JOIN category_topics ct ON c.id = ct.category_id
    WHERE ct.topic_id IS NULL
  `;

  if (unmappedCategories.length > 0) {
    console.log(`\n   WARNING: ${unmappedCategories.length} categories not mapped to topics:`);
    for (const cat of unmappedCategories) {
      console.log(`   - ${cat.id} (${cat.source_id})`);
    }
  } else {
    console.log('\n   All categories mapped to topics.');
  }

  // Final counts
  const finalTopicCount = await db.select().from(topicsTable);
  const finalMappingCount = await db.select().from(categoryTopics);

  console.log('\n' + '='.repeat(60));
  console.log(' Seeding Complete');
  console.log('='.repeat(60));
  console.log(`\n   Substrates: ${existingSubstrates.length} verified`);
  console.log(`   Topics: ${finalTopicCount.length} total`);
  console.log(`   Category-Topic mappings: ${finalMappingCount.length} total`);
  console.log('');

  process.exit(0);
}

seedTopics().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
