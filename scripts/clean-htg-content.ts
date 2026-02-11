import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../lib/db/index';
import { htgContent } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

function cleanHtgContent(text: string): string {
  if (!text) return text;
  let cleaned = text;
  cleaned = cleaned.replace(/^[ \t]*\d{1,3}[ \t]*$/gm, '');
  cleaned = cleaned.replace(/This is a controlled document[^.]*\.[^.]*\./g, '');
  cleaned = cleaned.replace(/This copy of the Code Of Practice was issued[^.]*\./g, '');
  cleaned = cleaned.replace(/\n\s*\d+\s*\n\s*\d+[A-Z][A-Z\s]+\n\s*\d+\s*\n\s*\d+[A-Z]?\s*\n\s*\d{1,3}/g, '');
  cleaned = cleaned.replace(/\n\s*RANZ Metal Roof (Flashings|Penetrations)\s*(Guide|-)?\s*\n/gi, '\n');
  cleaned = cleaned.replace(/\n\s*RANZ Metal Wall Cladding\s*(Guide|-)?\s*\n/gi, '\n');
  cleaned = cleaned.replace(/\n\s*Page \d+ of \d+\s*\n/g, '\n');
  cleaned = cleaned.replace(/\n\s*www\.metalroofing\.org\.nz\s*\n/g, '\n');
  cleaned = cleaned.replace(/ +\n/g, '\n');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  return cleaned;
}

async function main() {
  console.log('HTG CONTENT CLEANUP\n');
  const records = await db.select().from(htgContent);
  console.log(`Found ${records.length} HTG records\n`);
  let cleaned = 0;
  let totalReduction = 0;
  for (const record of records) {
    if (!record.content) continue;
    const original = record.content;
    const result = cleanHtgContent(original);
    if (result !== original) {
      await db.update(htgContent).set({ content: result }).where(eq(htgContent.id, record.id));
      cleaned++;
      totalReduction += original.length - result.length;
    }
  }
  console.log(`Records cleaned: ${cleaned}/${records.length}`);
  console.log(`Total chars removed: ${totalReduction}`);
  console.log('\nDone!');
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
