import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { details } from '../lib/db/schema';
import * as fs from 'fs';
import * as path from 'path';

import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-5f4c0432c70b4389a92d23c5a0047e17.r2.dev';

interface ExtractedDetail {
  code: string;
  name: string;
  images: string[];
}

async function backfillImages() {
  console.log('Starting detail images backfill...\n');

  const mrmExtractPath = path.join(process.cwd(), 'mrm_extract');

  // Load enhanced details
  const enhancedDetailsPath = path.join(mrmExtractPath, 'details_enhanced.json');
  const originalDetailsPath = path.join(mrmExtractPath, 'details.json');
  const detailsPath = fs.existsSync(enhancedDetailsPath) ? enhancedDetailsPath : originalDetailsPath;

  const detailsData: ExtractedDetail[] = JSON.parse(
    fs.readFileSync(detailsPath, 'utf-8')
  );

  // Load R2 image manifest
  const r2ManifestPath = path.join(mrmExtractPath, 'r2_image_urls.json');
  const r2Manifest: Record<string, string> = JSON.parse(
    fs.readFileSync(r2ManifestPath, 'utf-8')
  );

  const manifestFilenames = new Set(Object.keys(r2Manifest));
  console.log(`Loaded ${detailsData.length} details`);
  console.log(`R2 manifest has ${manifestFilenames.size} images\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let totalImages = 0;

  for (const detail of detailsData) {
    if (!detail.images || detail.images.length === 0) {
      skippedCount++;
      continue;
    }

    // Filter to only images present in the R2 manifest
    const validImages = detail.images.filter(img => manifestFilenames.has(img));

    if (validImages.length === 0) {
      skippedCount++;
      continue;
    }

    // Build full R2 URLs for images
    const imageUrls = validImages.map(img => r2Manifest[img]);

    // Generate the detail ID the same way import-mrm.ts does
    const detailId = `lrm-${detail.code.toLowerCase()}`;

    // Update images and thumbnailUrl
    const thumbnailUrl = imageUrls[0];

    try {
      await db
        .update(details)
        .set({
          images: imageUrls,
          thumbnailUrl: thumbnailUrl,
        })
        .where(eq(details.id, detailId));

      updatedCount++;
      totalImages += imageUrls.length;
      console.log(`  Updated ${detailId}: ${imageUrls.length} images`);
    } catch (err) {
      console.warn(`  Failed to update ${detailId}: ${err}`);
    }
  }

  console.log(`\nBackfill complete!`);
  console.log(`  Updated: ${updatedCount} details`);
  console.log(`  Skipped: ${skippedCount} details (no images or not in manifest)`);
  console.log(`  Total images linked: ${totalImages}`);
}

backfillImages()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });
