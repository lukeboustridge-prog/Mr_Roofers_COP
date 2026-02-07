import fs from 'fs';
import path from 'path';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CopChapter, CopSection } from '@/types/cop';
import { SectionRenderer } from '@/components/cop/SectionRenderer';

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

  return (
    <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
      {/* Back navigation */}
      <Link
        href="/cop"
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to COP
      </Link>

      {/* Chapter header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Chapter {chapterData.chapterNumber}: {chapterData.title}
        </h1>
        <div className="mt-3 flex items-center gap-3">
          <Badge variant="secondary">{chapterData.version}</Badge>
          <span className="text-sm text-slate-500">
            {chapterData.sectionCount} sections
          </span>
        </div>
      </div>

      {/* Visual separator */}
      <hr className="border-slate-200 my-6" />

      {/* Chapter content */}
      <div id="chapter-content" className="mt-8">
        {chapterData.sections.map((section) => (
          <SectionRenderer
            key={section.number}
            section={section}
            chapterNumber={chapterData.chapterNumber}
          />
        ))}
      </div>

      {/* Scroll to top anchor */}
      <div className="mt-12 mb-8 text-center">
        <a href="#" className="text-sm text-slate-400 hover:text-slate-600">
          Back to top
        </a>
      </div>
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
