/**
 * Seed test detail_links for Phase 10 verification
 * Creates MRM -> RANZ links to test borrowed content display
 *
 * Run: npx tsx scripts/seed-test-links.ts
 */

import { db } from '@/lib/db';
import { details, detailLinks } from '@/lib/db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function seedTestLinks() {
  console.log('Seeding test detail_links...\n');

  // Find MRM details (sourceId = 'mrm-cop') that could link to RANZ
  const mrmDetails = await db
    .select({ id: details.id, code: details.code, name: details.name })
    .from(details)
    .where(eq(details.sourceId, 'mrm-cop'))
    .limit(10);

  console.log(`Found ${mrmDetails.length} MRM details`);

  // Find RANZ details (sourceId = 'ranz-guide') with 3D models or steps
  const ranzDetails = await db
    .select({ id: details.id, code: details.code, name: details.name, modelUrl: details.modelUrl })
    .from(details)
    .where(and(
      eq(details.sourceId, 'ranz-guide'),
      isNotNull(details.modelUrl)
    ))
    .limit(10);

  console.log(`Found ${ranzDetails.length} RANZ details with 3D models\n`);

  if (mrmDetails.length === 0 || ranzDetails.length === 0) {
    console.log('Not enough details to create test links');
    console.log('MRM details:', mrmDetails.length);
    console.log('RANZ details:', ranzDetails.length);
    return;
  }

  // Create test links (MRM primary -> RANZ supplementary)
  const linksToCreate = [
    // Link 1: First MRM detail to first RANZ detail (installation_guide)
    {
      id: nanoid(),
      primaryDetailId: mrmDetails[0].id,
      supplementaryDetailId: ranzDetails[0].id,
      linkType: 'installation_guide',
      matchConfidence: 'partial',
      notes: 'Test link for Phase 10 verification',
    },
    // Link 2: Second MRM to second RANZ (if available)
    ...(mrmDetails.length > 1 && ranzDetails.length > 1 ? [{
      id: nanoid(),
      primaryDetailId: mrmDetails[1].id,
      supplementaryDetailId: ranzDetails[1].id,
      linkType: 'technical_supplement',
      matchConfidence: 'related',
      notes: 'Test link for Phase 10 verification',
    }] : []),
    // Link 3: Third MRM to third RANZ (if available)
    ...(mrmDetails.length > 2 && ranzDetails.length > 2 ? [{
      id: nanoid(),
      primaryDetailId: mrmDetails[2].id,
      supplementaryDetailId: ranzDetails[2].id,
      linkType: 'installation_guide',
      matchConfidence: 'exact',
      notes: 'Test link for Phase 10 verification',
    }] : []),
  ];

  console.log(`Creating ${linksToCreate.length} test links...\n`);

  for (const link of linksToCreate) {
    try {
      await db.insert(detailLinks).values(link).onConflictDoNothing();
      const mrm = mrmDetails.find(d => d.id === link.primaryDetailId);
      const ranz = ranzDetails.find(d => d.id === link.supplementaryDetailId);
      console.log(`Created: ${mrm?.code} (MRM) -> ${ranz?.code} (RANZ) [${link.linkType}]`);
    } catch (error) {
      console.error(`Failed to create link:`, error);
    }
  }

  console.log('\nTest links seeded successfully!');
  console.log('\nTo verify:');
  console.log('1. Visit an MRM detail page (e.g., /planner/profiled-metal/flashings/<detail-id>)');
  console.log('2. Check for "Related" tab showing linked RANZ content');
  console.log('3. Verify borrowed 3D model displays with attribution (if MRM has no model)');
}

seedTestLinks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
