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

interface ImageManifestEntry {
  filename: string;
  source_page: number;
  detail_codes: string[];
  caption: string;
  type: string;
  dimensions: {
    width: number;
    height: number;
  };
  section: string | null;
}

interface ExtractedDetail {
  code: string;
  name: string;
  images?: string[];
}

async function populateDetailImages() {
  console.log('Starting detail images population...\n');

  const mrmExtractPath = path.join(process.cwd(), 'mrm_extract');

  // Load images_manifest.json
  const imagesManifestPath = path.join(mrmExtractPath, 'images_manifest.json');
  const imagesManifest: Record<string, ImageManifestEntry> = JSON.parse(
    fs.readFileSync(imagesManifestPath, 'utf-8')
  );

  // Load r2_image_urls.json
  const r2ManifestPath = path.join(mrmExtractPath, 'r2_image_urls.json');
  const r2Manifest: Record<string, string> = JSON.parse(
    fs.readFileSync(r2ManifestPath, 'utf-8')
  );

  // Load details.json as fallback
  const detailsPath = path.join(mrmExtractPath, 'details.json');
  const detailsData: ExtractedDetail[] = JSON.parse(
    fs.readFileSync(detailsPath, 'utf-8')
  );

  console.log(`Loaded ${Object.keys(imagesManifest).length} images from manifest`);
  console.log(`Loaded ${Object.keys(r2Manifest).length} R2 URLs`);
  console.log(`Loaded ${detailsData.length} detail records\n`);

  // Build Map<detailCode, filename[]> from images_manifest detail_codes
  const detailCodeToImages = new Map<string, string[]>();

  let manifestMappedCount = 0;
  for (const [filename, entry] of Object.entries(imagesManifest)) {
    if (entry.detail_codes && entry.detail_codes.length > 0) {
      manifestMappedCount++;
      for (const code of entry.detail_codes) {
        if (!detailCodeToImages.has(code)) {
          detailCodeToImages.set(code, []);
        }
        detailCodeToImages.get(code)!.push(filename);
      }
    }
  }

  console.log(`Found ${manifestMappedCount} images with detail_codes in manifest`);
  console.log(`Covering ${detailCodeToImages.size} unique detail codes\n`);

  // Build Map<detailCode, filename[]> from details.json as fallback
  const detailsJsonImages = new Map<string, string[]>();
  for (const detail of detailsData) {
    if (detail.images && detail.images.length > 0) {
      detailsJsonImages.set(detail.code, detail.images);
    }
  }

  console.log(`Found ${detailsJsonImages.size} details with images in details.json\n`);

  // Process all details
  let updatedCount = 0;
  let skippedCount = 0;
  let totalImagesLinked = 0;
  let fromManifestCount = 0;
  let fromDetailsJsonCount = 0;

  for (const detail of detailsData) {
    const detailCode = detail.code;
    const detailId = `lrm-${detailCode.toLowerCase()}`;

    // Merge both sources: manifest detail_codes take priority, details.json fills gaps
    let imageFilenames: string[] = [];

    // First, get images from manifest detail_codes (higher priority)
    if (detailCodeToImages.has(detailCode)) {
      imageFilenames = [...detailCodeToImages.get(detailCode)!];
    }

    // Then, add images from details.json if not already included
    if (detailsJsonImages.has(detailCode)) {
      const detailsJsonFiles = detailsJsonImages.get(detailCode)!;
      for (const filename of detailsJsonFiles) {
        if (!imageFilenames.includes(filename)) {
          imageFilenames.push(filename);
        }
      }
    }

    // Skip if no images
    if (imageFilenames.length === 0) {
      skippedCount++;
      continue;
    }

    // Filter to only images present in R2 manifest
    const validImageFilenames = imageFilenames.filter(filename =>
      r2Manifest.hasOwnProperty(filename)
    );

    if (validImageFilenames.length === 0) {
      console.warn(`  Warning: ${detailCode} has ${imageFilenames.length} images but none are in R2 manifest`);
      skippedCount++;
      continue;
    }

    // Build full R2 URLs
    const imageUrls = validImageFilenames.map(filename => r2Manifest[filename]);

    // Set thumbnailUrl to first image
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
      totalImagesLinked += imageUrls.length;

      // Track source of images for reporting
      if (detailCodeToImages.has(detailCode)) {
        fromManifestCount++;
      } else {
        fromDetailsJsonCount++;
      }

      console.log(`  ✓ ${detailCode} (${detailId}): ${imageUrls.length} images`);
    } catch (err) {
      console.warn(`  ✗ Failed to update ${detailCode}: ${err}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Population complete!\n');
  console.log(`Details processed: ${detailsData.length}`);
  console.log(`  Updated: ${updatedCount}`);
  console.log(`  Skipped: ${skippedCount} (no images or not in R2)`);
  console.log(`\nImage sources:`);
  console.log(`  From manifest detail_codes: ${fromManifestCount} details`);
  console.log(`  From details.json fallback: ${fromDetailsJsonCount} details`);
  console.log(`\nTotal images linked: ${totalImagesLinked}`);
  console.log(`Average images per detail: ${(totalImagesLinked / updatedCount).toFixed(1)}`);
  console.log(`\nIMG-03 Compliance: ${Object.values(imagesManifest).filter(v => !v.detail_codes || v.detail_codes.length === 0).length} section-only images NOT assigned to details`);
  console.log(`${'='.repeat(60)}`);
}

populateDetailImages()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Population failed:', error);
    process.exit(1);
  });
