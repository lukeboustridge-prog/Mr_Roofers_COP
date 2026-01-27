import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { contentSources, substrates, categories, details, failureCases } from './schema';
import { sql as sqlTemplate } from 'drizzle-orm';

// Load environment variables for standalone script execution
import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seedContentSources() {
  console.log('🌱 Seeding content sources and backfilling data...\n');

  // ============================================
  // Step 1: Seed Content Sources
  // ============================================
  console.log('📚 Seeding content sources...');

  const sourcesData = [
    {
      id: 'mrm-cop',
      name: 'MRM Code of Practice',
      shortName: 'MRM COP',
      description: 'Master Roofers Metallic Roofing Code of Practice - The industry standard for metal roofing installation in New Zealand',
      websiteUrl: 'https://masterroofers.co.nz',
      sortOrder: 1,
    },
    {
      id: 'ranz-guide',
      name: 'RANZ Roofing Guide',
      shortName: 'RANZ',
      description: 'Roofing Association of New Zealand Roofing Guide - Comprehensive guidance for all roofing types',
      websiteUrl: 'https://roofingassociation.org.nz',
      sortOrder: 2,
    },
    {
      id: 'membrane-cop',
      name: 'Membrane Roofing COP',
      shortName: 'Membrane',
      description: 'Membrane Roofing Code of Practice - Specialized guidance for membrane roofing systems',
      sortOrder: 3,
    },
  ];

  // Check if sources already exist
  const existingSources = await db.select().from(contentSources);

  if (existingSources.length === 0) {
    await db.insert(contentSources).values(sourcesData);
    console.log(`✅ Seeded ${sourcesData.length} content sources\n`);
  } else {
    console.log(`⏭️  Content sources already exist (${existingSources.length} found), skipping seed\n`);
  }

  // ============================================
  // Step 2: Backfill existing data with MRM COP source
  // ============================================
  console.log('🔄 Backfilling existing data with MRM COP source...');

  // Update substrates
  const substrateResult = await db.execute(
    sqlTemplate`UPDATE substrates SET source_id = 'mrm-cop' WHERE source_id IS NULL`
  );
  console.log(`   • Substrates updated`);

  // Update categories
  const categoryResult = await db.execute(
    sqlTemplate`UPDATE categories SET source_id = 'mrm-cop' WHERE source_id IS NULL`
  );
  console.log(`   • Categories updated`);

  // Update details
  const detailResult = await db.execute(
    sqlTemplate`UPDATE details SET source_id = 'mrm-cop' WHERE source_id IS NULL`
  );
  console.log(`   • Details updated`);

  // Update failure cases (optional - they can span sources)
  const failureResult = await db.execute(
    sqlTemplate`UPDATE failure_cases SET source_id = 'mrm-cop' WHERE source_id IS NULL`
  );
  console.log(`   • Failure cases updated`);

  console.log('\n✅ Backfill complete!\n');

  // ============================================
  // Step 3: Verify results
  // ============================================
  console.log('📊 Verification:');

  const substrateCountResult = await db.execute(
    sqlTemplate`SELECT COUNT(*) as count FROM substrates WHERE source_id = 'mrm-cop'`
  );
  const categoryCountResult = await db.execute(
    sqlTemplate`SELECT COUNT(*) as count FROM categories WHERE source_id = 'mrm-cop'`
  );
  const detailCountResult = await db.execute(
    sqlTemplate`SELECT COUNT(*) as count FROM details WHERE source_id = 'mrm-cop'`
  );
  const failureCountResult = await db.execute(
    sqlTemplate`SELECT COUNT(*) as count FROM failure_cases WHERE source_id = 'mrm-cop'`
  );
  const sources = await db.select().from(contentSources);

  console.log(`   • Content Sources: ${sources.length}`);
  sources.forEach(s => console.log(`     - ${s.shortName}: ${s.name}`));
  console.log(`   • Substrates with MRM COP source: ${(substrateCountResult.rows?.[0] as any)?.count ?? 'N/A'}`);
  console.log(`   • Categories with MRM COP source: ${(categoryCountResult.rows?.[0] as any)?.count ?? 'N/A'}`);
  console.log(`   • Details with MRM COP source: ${(detailCountResult.rows?.[0] as any)?.count ?? 'N/A'}`);
  console.log(`   • Failure cases with MRM COP source: ${(failureCountResult.rows?.[0] as any)?.count ?? 'N/A'}`);

  console.log('\n🎉 Content sources seeded and data backfilled successfully!');
}

seedContentSources()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error seeding content sources:', error);
    process.exit(1);
  });
