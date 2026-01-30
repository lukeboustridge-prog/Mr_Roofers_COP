import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../lib/db';
import { details } from '../lib/db/schema';
import { eq, like, isNull, and } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

async function updateMrmThumbnails() {
  console.log('Updating MRM detail thumbnails from R2...\n');

  // Load the R2 image URLs mapping
  const r2UrlsPath = path.join(process.cwd(), 'mrm_extract', 'r2_image_urls.json');
  const r2Urls: Record<string, string> = JSON.parse(fs.readFileSync(r2UrlsPath, 'utf-8'));

  // Load the enhanced details to get image mappings
  const detailsPath = path.join(process.cwd(), 'mrm_extract', 'details_enhanced.json');
  const mrmDetails: Array<{
    code: string;
    name: string;
    images: string[];
  }> = JSON.parse(fs.readFileSync(detailsPath, 'utf-8'));

  console.log(`Loaded ${Object.keys(r2Urls).length} R2 image URLs`);
  console.log(`Loaded ${mrmDetails.length} MRM details\n`);

  let updated = 0;
  let noImage = 0;
  let notFound = 0;

  for (const detail of mrmDetails) {
    // Get the first image as thumbnail
    const firstImage = detail.images?.[0];

    if (!firstImage) {
      noImage++;
      continue;
    }

    // Check if image exists in R2
    const r2Url = r2Urls[firstImage];
    if (!r2Url) {
      // Try to construct URL directly
      const constructedUrl = `${R2_PUBLIC_URL}/images/mrm/${firstImage}`;
      // We'll use this as fallback
    }

    const thumbnailUrl = r2Url || `${R2_PUBLIC_URL}/images/mrm/${firstImage}`;

    // Update in database - match by code prefix (MRM details have codes like D01, F01, etc.)
    try {
      const result = await db.update(details)
        .set({ thumbnailUrl })
        .where(
          and(
            eq(details.code, detail.code),
            eq(details.sourceId, 'mrm-cop')
          )
        );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`✓ ${detail.code}: ${firstImage}`);
        updated++;
      } else {
        // Try without source filter
        const result2 = await db.update(details)
          .set({ thumbnailUrl })
          .where(eq(details.code, detail.code));

        if (result2.rowCount && result2.rowCount > 0) {
          console.log(`✓ ${detail.code}: ${firstImage}`);
          updated++;
        } else {
          console.log(`- ${detail.code}: not found in DB`);
          notFound++;
        }
      }
    } catch (error) {
      console.error(`✗ ${detail.code}: ${error}`);
    }
  }

  console.log('\n✅ Thumbnail update complete!');
  console.log(`   Updated: ${updated}`);
  console.log(`   No image: ${noImage}`);
  console.log(`   Not in DB: ${notFound}`);

  process.exit(0);
}

updateMrmThumbnails().catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
