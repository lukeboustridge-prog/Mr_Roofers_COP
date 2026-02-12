import fs from 'fs';
import path from 'path';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { CopChapter, CopSection } from '@/types/cop';
import { getSupplementaryContent } from '@/lib/db/queries/supplementary';

interface EncyclopediaChapterPageProps {
  params: Promise<{ chapter: string }>;
}

export default async function EncyclopediaChapterPage({ params }: EncyclopediaChapterPageProps) {
  const { chapter } = await params;

  // Handle section deep-links (e.g., /encyclopedia/cop/8.5.4 -> redirect to /encyclopedia/cop/8#section-8.5.4)
  if (chapter.includes('.')) {
    const parts = chapter.split('.');
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
    const sectionExists = findSection(chapterData.sections, chapter);
    if (!sectionExists) {
      notFound();
    }
    redirect(`/encyclopedia/cop/${chapterNum}#section-${chapter}`);
  }

  // Validate chapter is a number between 1 and 19
  const chapterNum = parseInt(chapter, 10);
  if (isNaN(chapterNum) || chapterNum < 1 || chapterNum > 19) {
    notFound();
  }

  // Read chapter JSON file
  const chapterPath = path.join(process.cwd(), 'public', 'cop', `chapter-${chapterNum}.json`);

  if (!fs.existsSync(chapterPath)) {
    notFound();
  }

  const chapterData: CopChapter = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));

  // Fetch supplementary content for this chapter
  // Will be passed to ArticleRenderer in Plan 02; for now used to show linked content count
  const supplementaryMap = await getSupplementaryContent(chapterNum);
  const supplementaryCount = supplementaryMap.size;

  return (
    <div className="flex flex-col">
      {/* Back navigation */}
      <div className="px-4 pt-4 md:px-6 lg:px-8">
        <Link
          href="/encyclopedia/cop"
          className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Encyclopedia
        </Link>
      </div>

      {/* Chapter header */}
      <div className="px-4 pb-4 md:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Chapter {chapterData.chapterNumber}: {chapterData.title}
          </h1>
          <Badge variant="secondary">{chapterData.version}</Badge>
        </div>
        <p className="text-sm text-slate-500">
          {chapterData.sectionCount} sections
          {supplementaryCount > 0 && (
            <span className="ml-2 text-slate-400">
              ({supplementaryCount} sections with linked content)
            </span>
          )}
        </p>
      </div>

      {/* Article content -- basic rendering, will be replaced by ArticleRenderer in Plan 02 */}
      <div className="px-4 pb-8 md:px-6 lg:px-8">
        <div className="max-w-4xl">
          {chapterData.sections.map((section) => (
            <SectionRenderer key={section.number} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Basic recursive section renderer.
 * Renders section heading, content with prose styling, and subsections.
 * Will be replaced by ArticleRenderer component in Plan 02.
 */
function SectionRenderer({ section }: { section: CopSection }) {
  // Determine heading level based on section level (capped at h6)
  const level = Math.min(section.level + 1, 6);

  const heading = (
    <>
      <span className="text-slate-400 mr-2">{section.number}</span>
      {section.title}
    </>
  );

  return (
    <div className="mb-6" id={`section-${section.number}`}>
      {level === 2 && <h2 className="font-semibold text-slate-900 mb-2 text-xl">{heading}</h2>}
      {level === 3 && <h3 className="font-semibold text-slate-900 mb-2 text-lg">{heading}</h3>}
      {level === 4 && <h4 className="font-semibold text-slate-900 mb-2 text-base">{heading}</h4>}
      {level === 5 && <h5 className="font-semibold text-slate-900 mb-2 text-sm">{heading}</h5>}
      {level >= 6 && <h6 className="font-semibold text-slate-900 mb-2 text-sm">{heading}</h6>}

      {section.content && (
        <div className="prose prose-slate max-w-none">
          {section.content.split('\n').map((paragraph, idx) => (
            paragraph.trim() ? <p key={idx}>{paragraph}</p> : null
          ))}
        </div>
      )}

      {section.subsections?.map((subsection) => (
        <SectionRenderer key={subsection.number} section={subsection} />
      ))}
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
