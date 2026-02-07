import * as fs from 'fs';
import * as path from 'path';

interface SectionNode {
  number: string;
  title: string;
  content: string;
  pdf_pages: number[];
  subsections: Record<string, SectionNode>;
}

type SectionsData = Record<string, SectionNode>;

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

type ImagesManifest = Record<string, ImageManifestEntry>;
type R2UrlMap = Record<string, string>;

interface ChapterImage {
  filename: string;
  url: string;
  caption: string;
  dimensions: { width: number; height: number };
}

interface ChapterSection {
  number: string;
  title: string;
  level: number;
  content: string;
  pdfPages: number[];
  images?: ChapterImage[];
  subsections?: ChapterSection[];
}

interface ChapterJSON {
  chapterNumber: number;
  title: string;
  version: string;
  sectionCount: number;
  sections: ChapterSection[];
}

// Load data files
const sectionsPath = path.join(process.cwd(), 'mrm_extract', 'sections_hierarchy.json');
const manifestPath = path.join(process.cwd(), 'mrm_extract', 'images_manifest.json');
const r2UrlsPath = path.join(process.cwd(), 'mrm_extract', 'r2_image_urls.json');
const metadataPath = path.join(process.cwd(), 'mrm_extract', 'metadata.json');

const sectionsData: SectionsData = JSON.parse(fs.readFileSync(sectionsPath, 'utf-8'));
const imagesManifest: ImagesManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
const r2UrlMap: R2UrlMap = JSON.parse(fs.readFileSync(r2UrlsPath, 'utf-8'));
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

/**
 * Find images for a specific section number
 */
function findImagesForSection(sectionNum: string): ChapterImage[] {
  const images: ChapterImage[] = [];

  for (const [filename, img] of Object.entries(imagesManifest)) {
    if (img.section === sectionNum) {
      const url = r2UrlMap[filename];
      if (url) {
        images.push({
          filename,
          url,
          caption: img.caption || '',
          dimensions: img.dimensions,
        });
      }
    }
  }

  return images;
}

/**
 * Recursively build chapter section structure with images
 */
function buildSection(sectionNum: string, node: SectionNode, level: number): ChapterSection {
  const images = findImagesForSection(sectionNum);

  const section: ChapterSection = {
    number: sectionNum,
    title: node.title,
    level,
    content: node.content,
    pdfPages: node.pdf_pages,
  };

  // Only add images array if there are images
  if (images.length > 0) {
    section.images = images;
  }

  // Recursively build subsections
  const subsections = Object.entries(node.subsections || {}).map(([subNum, subNode]) =>
    buildSection(subNum, subNode, level + 1)
  );

  // Only add subsections array if there are subsections
  if (subsections.length > 0) {
    section.subsections = subsections;
  }

  return section;
}

/**
 * Count total sections in a chapter (recursive)
 */
function countSections(node: SectionNode): number {
  let count = 1;
  for (const sub of Object.values(node.subsections || {})) {
    count += countSections(sub);
  }
  return count;
}

/**
 * Generate per-chapter JSON files
 */
function splitChapterJson() {
  console.log('Starting chapter JSON split...\n');
  console.log(`Source version: ${metadata.version}`);
  console.log(`Total chapters: ${Object.keys(sectionsData).length}\n`);

  // Create output directory
  const outDir = path.join(process.cwd(), 'public', 'cop');
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`Output directory: ${outDir}\n`);

  // Process each chapter
  const chapters = Object.entries(sectionsData).sort(([a], [b]) => parseInt(a) - parseInt(b));
  const fileSizes: Array<{ chapter: number; size: number; sizeKB: number }> = [];

  for (const [chNum, chapter] of chapters) {
    const chapterNumber = parseInt(chNum);
    const sectionCount = countSections(chapter);

    console.log(`Processing Chapter ${chapterNumber}: ${chapter.title}`);
    console.log(`  Sections: ${sectionCount}`);

    const chapterJSON: ChapterJSON = {
      chapterNumber,
      title: chapter.title,
      version: metadata.version,
      sectionCount,
      sections: [buildSection(chNum, chapter, 1)],
    };

    // Write minified JSON (not pretty-printed) for production
    const outputPath = path.join(outDir, `chapter-${chapterNumber}.json`);
    const jsonString = JSON.stringify(chapterJSON);
    fs.writeFileSync(outputPath, jsonString, 'utf-8');

    const sizeBytes = Buffer.byteLength(jsonString, 'utf-8');
    const sizeKB = Math.round(sizeBytes / 1024);
    fileSizes.push({ chapter: chapterNumber, size: sizeBytes, sizeKB });

    console.log(`  Output: chapter-${chapterNumber}.json (${sizeKB} KB uncompressed)\n`);
  }

  console.log('✓ Split complete!\n');
  console.log('File sizes:');

  fileSizes.sort((a, b) => b.size - a.size);

  for (const { chapter, sizeKB } of fileSizes) {
    const bar = '█'.repeat(Math.ceil(sizeKB / 10));
    console.log(`  Chapter ${chapter.toString().padStart(2)}: ${sizeKB.toString().padStart(4)} KB ${bar}`);
  }

  const totalKB = fileSizes.reduce((sum, f) => sum + f.sizeKB, 0);
  const avgKB = Math.round(totalKB / fileSizes.length);
  const maxKB = fileSizes[0].sizeKB;

  console.log(`\n  Total: ${totalKB} KB`);
  console.log(`  Average: ${avgKB} KB`);
  console.log(`  Largest: Chapter ${fileSizes[0].chapter} (${maxKB} KB)`);

  if (maxKB > 200) {
    console.log(`\n⚠ Warning: Chapter ${fileSizes[0].chapter} exceeds 200KB uncompressed`);
    console.log(`  This may exceed 100KB compressed target on mobile`);
    console.log(`  Consider splitting large chapters or paginating content`);
  }
}

splitChapterJson();
