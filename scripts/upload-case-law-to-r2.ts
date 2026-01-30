import { config } from 'dotenv';
config({ path: '.env.local' });

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { db } from '../lib/db';
import { failureCases } from '../lib/db/schema';
import { eq, like, or } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;
const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

async function uploadToR2(localPath: string, r2Key: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: r2Key,
    Body: fileBuffer,
    ContentType: 'application/pdf',
  });

  await s3Client.send(command);
  return `${R2_PUBLIC_URL}/${r2Key}`;
}

async function uploadCaseLawPdfs() {
  console.log('Starting Case Law PDF upload to R2...\n');

  const publicDir = path.join(process.cwd(), 'public');
  const determinationsDir = path.join(publicDir, 'determinations');
  const complaintsDir = path.join(publicDir, 'upheld_complaints');

  let determinationsUploaded = 0;
  let complaintsUploaded = 0;
  let errors = 0;

  // Upload Determinations
  console.log('📤 Uploading MBIE Determinations...');
  if (fs.existsSync(determinationsDir)) {
    const files = fs.readdirSync(determinationsDir).filter(f => f.endsWith('.pdf'));

    for (const file of files) {
      const localPath = path.join(determinationsDir, file);
      const r2Key = `case-law/determinations/${file}`;
      const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;
      const localUrl = `/determinations/${file}`;

      try {
        // Upload to R2
        await uploadToR2(localPath, r2Key);

        // Update database
        await db.update(failureCases)
          .set({ pdfUrl: r2Url })
          .where(eq(failureCases.pdfUrl, localUrl));

        console.log(`  ✓ ${file}`);
        determinationsUploaded++;
      } catch (error) {
        console.error(`  ✗ ${file}: ${error}`);
        errors++;
      }
    }
  }

  // Upload LBP Complaints
  console.log('\n📤 Uploading LBP Complaint Decisions...');
  if (fs.existsSync(complaintsDir)) {
    const files = fs.readdirSync(complaintsDir).filter(f => f.endsWith('.pdf'));

    for (const file of files) {
      const localPath = path.join(complaintsDir, file);
      // Sanitize filename for R2 key (remove spaces and special chars)
      const sanitizedFile = file.replace(/\s+/g, '-').replace(/[()]/g, '');
      const r2Key = `case-law/lbp-complaints/${sanitizedFile}`;
      const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;

      // The local URL was URL-encoded in the import script
      const localUrl = `/upheld_complaints/${encodeURIComponent(file)}`;

      try {
        // Upload to R2
        await uploadToR2(localPath, r2Key);

        // Update database - try both encoded and non-encoded paths
        const result = await db.update(failureCases)
          .set({ pdfUrl: r2Url })
          .where(eq(failureCases.pdfUrl, localUrl));

        // Also try without encoding
        if (result.rowCount === 0) {
          await db.update(failureCases)
            .set({ pdfUrl: r2Url })
            .where(eq(failureCases.pdfUrl, `/upheld_complaints/${file}`));
        }

        console.log(`  ✓ ${file}`);
        complaintsUploaded++;
      } catch (error) {
        console.error(`  ✗ ${file}: ${error}`);
        errors++;
      }
    }
  }

  console.log('\n✅ Upload complete!');
  console.log(`   Determinations uploaded: ${determinationsUploaded}`);
  console.log(`   LBP Complaints uploaded: ${complaintsUploaded}`);
  console.log(`   Errors: ${errors}`);
  console.log(`\nR2 Base URL: ${R2_PUBLIC_URL}/case-law/`);

  process.exit(errors > 0 ? 1 : 0);
}

uploadCaseLawPdfs().catch((error) => {
  console.error('Upload failed:', error);
  process.exit(1);
});
