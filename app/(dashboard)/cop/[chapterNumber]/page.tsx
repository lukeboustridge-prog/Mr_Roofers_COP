import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CopChapter } from '@/types/cop';

interface ChapterPageProps {
  params: Promise<{ chapterNumber: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const { chapterNumber } = await params;

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

      {/* Chapter content - basic rendering for Plan 01 */}
      {/* Plan 02 will replace this with recursive SectionRenderer component */}
      <div id="chapter-content" className="space-y-8">
        {chapterData.sections.map((section) => (
          <section key={section.number} className="border-b border-slate-200 pb-6 last:border-0">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">
              {section.number} {section.title}
            </h2>
            <div className="whitespace-pre-line text-slate-700 leading-relaxed">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
