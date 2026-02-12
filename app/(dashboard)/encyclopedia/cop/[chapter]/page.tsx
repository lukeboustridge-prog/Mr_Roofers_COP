import fs from 'fs';
import path from 'path';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { CopChapter, CopSection } from '@/types/cop';
import { getSupplementaryContent } from '@/lib/db/queries/supplementary';
import { getSubstrateConfig, isValidSubstrate, DEFAULT_SUBSTRATE } from '@/lib/encyclopedia/substrate-config';
import { ArticleRenderer } from '@/components/encyclopedia/ArticleRenderer';

interface EncyclopediaChapterPageProps {
  params: Promise<{ chapter: string }>;
  searchParams: Promise<{ substrate?: string }>;
}

export default async function EncyclopediaChapterPage({ params, searchParams }: EncyclopediaChapterPageProps) {
  const { chapter } = await params;
  const { substrate: substrateParam } = await searchParams;

  // Resolve substrate: validate query param, fall back to default
  const resolvedSubstrate = substrateParam && isValidSubstrate(substrateParam)
    ? substrateParam
    : DEFAULT_SUBSTRATE;
  const substrateConfig = getSubstrateConfig(resolvedSubstrate);

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

  // Validate chapter belongs to the resolved substrate
  if (!substrateConfig.chapters.includes(chapterNum)) {
    notFound();
  }

  // Read chapter JSON file
  const chapterPath = path.join(process.cwd(), 'public', 'cop', `chapter-${chapterNum}.json`);

  if (!fs.existsSync(chapterPath)) {
    notFound();
  }

  const chapterData: CopChapter = JSON.parse(fs.readFileSync(chapterPath, 'utf-8'));

  // Fetch supplementary content for this chapter
  const supplementaryMap = await getSupplementaryContent(chapterNum);

  // Convert Map to plain Record for client component serialization
  const supplementaryContent: Record<string, typeof supplementaryMap extends Map<string, infer V> ? V : never> = {};
  supplementaryMap.forEach((value, key) => {
    supplementaryContent[key] = value;
  });

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

      {/* ArticleRenderer handles all article UI: TOC sidebar, scrollspy, headings, content, version banner */}
      <ArticleRenderer
        chapterData={chapterData}
        supplementaryContent={supplementaryContent}
        substrateId={resolvedSubstrate}
        substrateName={substrateConfig.shortName}
      />
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
