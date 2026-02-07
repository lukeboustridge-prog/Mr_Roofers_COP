/**
 * Import COP section images from images_manifest.json and r2_image_urls.json
 * Links images to cop_sections records
 */

// Load environment variables for standalone script execution
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './index';
import { copSectionImages } from './schema';
import * as fs from 'fs';
import * as path from 'path';

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

type ImageManifest = Record<string, ImageManifestEntry>;
type R2ImageUrls = Record<string, string>;

async function main() {
  console.log('Starting COP images import...');

  // Read the images manifest JSON
  const manifestPath = path.join(process.cwd(), 'mrm_extract', 'images_manifest.json');
  const r2UrlsPath = path.join(process.cwd(), 'mrm_extract', 'r2_image_urls.json');

  console.log(`Reading images manifest from: ${manifestPath}`);
  console.log(`Reading R2 URLs from: ${r2UrlsPath}`);

  const manifestData = fs.readFileSync(manifestPath, 'utf-8');
  const r2UrlsData = fs.readFileSync(r2UrlsPath, 'utf-8');

  const imageManifest: ImageManifest = JSON.parse(manifestData);
  const r2ImageUrls: R2ImageUrls = JSON.parse(r2UrlsData);

  console.log(`Loaded ${Object.keys(imageManifest).length} images from manifest`);
  console.log(`Loaded ${Object.keys(r2ImageUrls).length} R2 URLs`);

  // Collect all image records to insert
  const imagesToInsert: Array<{
    id: string;
    sectionId: string;
    imageFilename: string;
    imageUrl: string;
    caption: string | null;
    imageType: string | null;
    sortOrder: number;
    dimensions: { width: number; height: number } | null;
  }> = [];

  let skippedCount = 0;
  let unmappedCount = 0;

  // Process each image in the manifest
  for (const [filename, imageData] of Object.entries(imageManifest)) {
    // Skip images with no section mapping (there are 3 of these)
    if (!imageData.section) {
      skippedCount++;
      unmappedCount++;
      continue;
    }

    // Get R2 URL - try both with and without "section-" prefix
    let imageUrl = r2ImageUrls[filename];

    // If not found, try without "section-" prefix
    if (!imageUrl && filename.startsWith('section-')) {
      const altFilename = filename.replace('section-', '');
      imageUrl = r2ImageUrls[altFilename];
    }

    if (!imageUrl) {
      console.warn(`Warning: No R2 URL found for ${filename}`);
      skippedCount++;
      continue;
    }

    // Create section ID
    const sectionId = `cop-${imageData.section}`;

    // Create unique image ID
    const imageId = `img-${imageData.section}-${filename.replace(/\.[^.]+$/, '')}`;

    imagesToInsert.push({
      id: imageId,
      sectionId: sectionId,
      imageFilename: filename,
      imageUrl: imageUrl,
      caption: imageData.caption || null,
      imageType: imageData.type || null,
      sortOrder: imageData.source_page || 0,
      dimensions: imageData.dimensions || null,
    });
  }

  console.log(`Collected ${imagesToInsert.length} images to import`);
  console.log(`Skipped ${skippedCount} images (${unmappedCount} unmapped to sections)`);

  // Clear existing cop_section_images (idempotent)
  console.log('Clearing existing cop_section_images...');
  await db.delete(copSectionImages);

  // Insert all images in batches of 50
  const batchSize = 50;
  for (let i = 0; i < imagesToInsert.length; i += batchSize) {
    const batch = imagesToInsert.slice(i, i + batchSize);
    await db.insert(copSectionImages).values(batch);
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(imagesToInsert.length / batchSize)}`);
  }

  console.log(`\n✓ Import complete!`);
  console.log(`  Total images imported: ${imagesToInsert.length}`);
  console.log(`  Images skipped: ${skippedCount}`);
  console.log(`  Unmapped to sections: ${unmappedCount}`);

  // Show sample of imported images
  console.log(`\nSample images imported:`);
  const samples = imagesToInsert.slice(0, 5);
  samples.forEach(img => {
    console.log(`  ${img.imageFilename} -> ${img.sectionId} (${img.imageType})`);
  });

  // Show section distribution
  const sectionCounts = imagesToInsert.reduce((acc, img) => {
    acc[img.sectionId] = (acc[img.sectionId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSections = Object.entries(sectionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  console.log(`\nTop 5 sections by image count:`);
  topSections.forEach(([sectionId, count]) => {
    console.log(`  ${sectionId}: ${count} images`);
  });

  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
