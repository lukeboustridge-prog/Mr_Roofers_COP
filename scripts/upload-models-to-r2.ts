import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'master-roofers-cop';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-5f4c0432c70b4389a92d23c5a0047e17.r2.dev';

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('❌ Missing R2 credentials in .env.local');
  console.error('Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  process.exit(1);
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function listExistingModels(): Promise<Set<string>> {
  const existing = new Set<string>();
  try {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: 'models/',
      })
    );
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) {
          existing.add(obj.Key);
        }
      }
    }
  } catch (error) {
    console.log('ℹ️  Could not list existing objects (bucket may be empty)');
  }
  return existing;
}

async function uploadModel(filePath: string, fileName: string): Promise<string> {
  const fileContent = readFileSync(filePath);
  const key = `models/${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: 'model/gltf-binary',
      CacheControl: 'public, max-age=31536000', // 1 year cache
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

async function main() {
  console.log('🚀 Starting R2 model upload...\n');
  console.log(`📦 Bucket: ${R2_BUCKET_NAME}`);
  console.log(`🌐 Public URL: ${R2_PUBLIC_URL}\n`);

  const modelsDir = join(process.cwd(), 'public', 'models');
  const files = readdirSync(modelsDir).filter((f) => f.endsWith('.glb'));

  console.log(`📁 Found ${files.length} GLB files to upload\n`);

  // Check existing files
  const existing = await listExistingModels();
  console.log(`☁️  ${existing.size} models already in R2\n`);

  let uploaded = 0;
  let skipped = 0;
  const urls: Record<string, string> = {};

  for (const file of files) {
    const key = `models/${file}`;
    if (existing.has(key)) {
      console.log(`⏭️  Skipping ${file} (already exists)`);
      urls[file] = `${R2_PUBLIC_URL}/${key}`;
      skipped++;
      continue;
    }

    try {
      const filePath = join(modelsDir, file);
      const url = await uploadModel(filePath, file);
      console.log(`✅ Uploaded ${file}`);
      urls[file] = url;
      uploaded++;
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error);
    }
  }

  console.log('\n========================================');
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📊 Total: ${files.length}`);
  console.log('========================================\n');

  // Output URL mapping for reference
  console.log('📋 Model URLs:');
  console.log('----------------------------------------');
  for (const [file, url] of Object.entries(urls)) {
    const code = file.replace('.glb', '');
    console.log(`${code}: ${url}`);
  }
}

main().catch((error) => {
  console.error('❌ Upload failed:', error);
  process.exit(1);
});
