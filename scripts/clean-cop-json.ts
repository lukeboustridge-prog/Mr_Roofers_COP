/**
 * Clean COP chapter JSON files of PDF extraction artifacts
 * Strips page numbers, footer disclaimers, header repetition, spurious whitespace
 * 
 * Usage: npx tsx scripts/clean-cop-json.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface CopSection {
  number: string;
  title: string;
  level: number;
  content: string;
  pdfPages?: number[];
  subsections?: CopSection[];
}

interface ChapterData {
  chapterNumber: number;
  title: string;
  version: string;
  sectionCount: number;
  sections: CopSection[];
}

let totalArtifactsRemoved = 0;
let totalSectionsCleaned = 0;

function cleanContent(text: string, sectionNumber: string, sectionTitle: string): string {
  if (!text) return text;
  
  const original = text;
  let cleaned = text;
  let artifactsInThis = 0;

  // 1. Remove standalone page numbers (lines that are just 1-3 digits with optional whitespace)
  // But NOT section numbers like "5.1" or "5.1A" or table data
  cleaned = cleaned.replace(/^[ \t]*\d{1,3}[ \t]*$/gm, '');
  
  // 2. Remove section number + title echo at the very start of content
  // e.g., "5 \nROOF DRAINAGE\n" at the beginning of section 5's content
  // or "5.2 \nRoof Drainage Terminology \n" at start of 5.2's content
  const escapedNumber = sectionNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Remove leading "NUMBER \n TITLE \n" pattern
  const headerPattern = new RegExp(`^\\s*${escapedNumber}\\s*\\n\\s*${escapedTitle}\\s*\\n`, 'i');
  cleaned = cleaned.replace(headerPattern, '');

  // Also remove inline header echoes like " 5 \n 5ACAPACITY CALCULATIONS\n 5 \n 5A"
  // These are section number markers repeated in the content
  const sectionMarkerPattern = new RegExp(`\\s+${escapedNumber}\\s+${escapedNumber}[A-Z]*[A-Z\\s]*\\n\\s*${escapedNumber}\\s*\\n\\s*${escapedNumber}[A-Z]*`, 'g');
  cleaned = cleaned.replace(sectionMarkerPattern, '');
  
  // 3. Remove "This is a controlled document" footer disclaimers
  cleaned = cleaned.replace(/This is a controlled document[^.]*\.[^.]*\./g, '');
  cleaned = cleaned.replace(/This copy of the Code Of Practice was issued[^.]*\./g, '');
  
  // 4. Remove repeated section headers in format " N \n NTITLE\n N \n N\nPAGENUM"
  // e.g., " 5 \n 5AROOF DRAINAGE\n 5 \n 5A\n169"
  cleaned = cleaned.replace(/\s+\d+\s*\n\s*\d+[A-Z][A-Z\s]+\n\s*\d+\s*\n\s*\d+[A-Z]?\s*\n\s*\d{1,3}/g, '');
  
  // 5. Remove standalone section number markers like " 5 \n 5.1 NZBC: CLAUSE E1 - SURFACE WATER"
  // that appear as navigation artifacts between content blocks
  cleaned = cleaned.replace(/\n\s*\d+\s*\n\s*\d+\.\d+(\.\d+)*\s+[A-Z][A-Z:.\s-]+\n/g, '\n');
  
  // 6. Normalize whitespace
  cleaned = cleaned.replace(/ +\n/g, '\n');           // trailing spaces before newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');        // 3+ newlines -> 2
  cleaned = cleaned.trim();

  if (cleaned !== original) {
    artifactsInThis = Math.max(1, Math.abs(original.length - cleaned.length) > 10 ? 
      Math.floor((original.length - cleaned.length) / 20) : 1);
    totalArtifactsRemoved += artifactsInThis;
    totalSectionsCleaned++;
  }

  return cleaned;
}

function cleanSection(section: CopSection): void {
  if (section.content) {
    section.content = cleanContent(section.content, section.number, section.title);
  }
  if (section.subsections) {
    section.subsections.forEach(sub => cleanSection(sub));
  }
}

function countSections(sections: CopSection[]): number {
  let count = sections.length;
  for (const s of sections) {
    if (s.subsections) count += countSections(s.subsections);
  }
  return count;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('COP CHAPTER JSON CLEANUP');
  console.log('═══════════════════════════════════════════════════════\n');

  const copDir = path.join(process.cwd(), 'public', 'cop');
  
  for (let i = 1; i <= 19; i++) {
    const filepath = path.join(copDir, `chapter-${i}.json`);
    
    if (!fs.existsSync(filepath)) {
      console.warn(`⚠ chapter-${i}.json not found, skipping`);
      continue;
    }

    const beforeSize = fs.statSync(filepath).size;
    const data: ChapterData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    const sectionCount = countSections(data.sections);
    
    const beforeArtifacts = totalArtifactsRemoved;
    const beforeCleaned = totalSectionsCleaned;
    
    data.sections.forEach(section => cleanSection(section));
    
    // Write back (compact JSON to save space, but readable)
    fs.writeFileSync(filepath, JSON.stringify(data));
    
    const afterSize = fs.statSync(filepath).size;
    const artifactsThisChapter = totalArtifactsRemoved - beforeArtifacts;
    const sectionsThisChapter = totalSectionsCleaned - beforeCleaned;
    
    console.log(`Chapter ${i}: ${sectionCount} sections, ${sectionsThisChapter} cleaned, ~${artifactsThisChapter} artifacts removed (${beforeSize} → ${afterSize} bytes)`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`CLEANUP COMPLETE`);
  console.log(`Total sections cleaned: ${totalSectionsCleaned}`);
  console.log(`Total artifacts removed: ~${totalArtifactsRemoved}`);
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
