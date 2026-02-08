import fs from 'fs';
import path from 'path';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { CopChapter, CopSection } from '@/types/cop';
import { ChapterContent } from '@/components/cop/ChapterContent';
import { getSupplementaryContent } from '@/lib/db/queries/supplementary';

interface ChapterPageProps {
  params: Promise<{ chapterNumber: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { chapterNumber } = await params;

  // Handle section deep-links (e.g., /cop/8.5.4 -> redirect to /cop/8#section-8.5.4)
  if (chapterNumber.includes('.')) {
    const parts = chapterNumber.split('.');
    const chapterNum = parseInt(parts[0], 10);
    if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > 19) {
      notFound();
    }
    // Verify chapter file exists
    const chapterPath = path.join(process.cwd(), 'public', 'cop', `chapter-${chapterNum}.json`);
    if (!fs.existsSync(chapterPath)) {
      notFound();
    }
    // Verify section exists in chapter data
    const chapterData: CopChapter = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));
    const sectionExists = findSection(chapterData.sections, chapterNumber);
    if (!sectionExists) {
      notFound();
    }
    redirect(`/cop/${chapterNum}#section-${chapterNumber}`);
  }

  // Validate chapterNumber is a number between 1 and 19
  const chapterNum = parseInt(chapterNumber, 10);
  if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > 19) {
    notFound();
  }

  // Read chapter JSON file
  const chapterPath = path.join(process.cwd(), 'public', 'cop', `chapter-${chapterNum}.json`);

  // Check if file exists
  if (!fs.existsSync(chapterPath)) {
    notFound();
  }

  // Load and parse chapter data
  const chapterData: CopChapter = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));

  // Fetch supplementary content for this chapter
  const supplementaryMap = await getSupplementaryContent(chapterNum);
  const supplementaryContent = Object.fromEntries(supplementaryMap);

  return (
    <div className="flex flex-col">
      {/* Back navigation -- stays in server component */}
      <div className="px-4 pt-4 md:px-6 lg:px-8">
        <Link
          href="/cop"
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to COP
        </Link>
      </div>

      {/* Client component handles TOC sidebar, drawer, scrollspy, content rendering */}
      <ChapterContent chapterData={chapterData} supplementaryContent={supplementaryContent} />
    </div>
  );
}

function findSection(sections: CopSection[], targetNumber: string): boolean {
  for (const section of sections) {
    if (section.number === targetNumber) return true;
    if (section.subsections) {
      if (findSection(section.subsections, targetNumber)) return true;
    }
  }
  return false;
}
