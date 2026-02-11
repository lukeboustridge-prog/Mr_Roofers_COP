import Link from 'next/link';
import { FileText, ArrowUpRight } from 'lucide-react';
import type { CopSection, SupplementaryData } from '@/types/cop';
import { CopImage } from './CopImage';
import { SupplementaryPanel } from './SupplementaryPanel';
import { SupplementaryDetailCard } from './SupplementaryDetailCard';
import { cn } from '@/lib/utils';

interface SectionRendererProps {
  section: CopSection;
  chapterNumber: number;
  supplementaryContent?: Record<string, SupplementaryData>;
}

const headingStyles: Record<'h2' | 'h3' | 'h4' | 'h5' | 'h6', string> = {
  h2: 'text-xl font-bold text-slate-900 md:text-2xl mt-12 mb-4 pb-2 border-b border-slate-200',
  h3: 'text-lg font-semibold text-slate-800 md:text-xl mt-10 mb-3',
  h4: 'text-base font-semibold text-slate-800 mt-8 mb-2',
  h5: 'text-sm font-semibold text-slate-700 mt-6 mb-2',
  h6: 'text-sm font-semibold text-slate-700 mt-4 mb-2',
};

function getHeadingClassName(level: number): string {
  const headingLevel = Math.min(level + 1, 6);
  const tag = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return headingStyles[tag];
}

export function SectionRenderer({ section, chapterNumber, supplementaryContent }: SectionRendererProps) {
  // For level-1 root sections, skip heading (page h1 already shows chapter title)
  const shouldRenderHeading = section.level !== 1 && section.title;

  // Calculate heading level (level 1 -> h2, level 2 -> h3, etc.)
  const headingLevel = Math.min(section.level + 1, 6);
  const HeadingTag = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  return (
    <section id={`section-${section.number}`}>
      {shouldRenderHeading && (
        <HeadingTag className={cn(getHeadingClassName(section.level))}>
          <span className="text-slate-400 font-normal mr-2">{section.number}</span>
          {section.title}
        </HeadingTag>
      )}

      {section.content && (
        <div className="whitespace-pre-line text-slate-700 leading-relaxed">
          {section.content}
        </div>
      )}

      {section.images && section.images.length > 0 && (
        <>
          {section.images.map((image, idx) => (
            <CopImage
              key={`${section.number}-img-${idx}`}
              image={image}
              chapterNumber={chapterNumber}
              sectionNumber={section.number}
            />
          ))}
        </>
      )}

      {/* Supplementary content panels (details + HTG guides) */}
      {supplementaryContent && (() => {
        const sectionId = `cop-${section.number}`;
        const supplements = supplementaryContent[sectionId];

        if (!supplements) return null;

        return (
          <>
            {supplements.details && supplements.details.length > 0 && (
              <SupplementaryPanel title="Related Installation Details">
                <div className="space-y-3">
                  {supplements.details.map(detail => (
                    <SupplementaryDetailCard key={detail.id} detail={detail} />
                  ))}
                </div>
              </SupplementaryPanel>
            )}

            {supplements.htgGuides && supplements.htgGuides.length > 0 && (
              <SupplementaryPanel title="Related HTG Guides">
                <div className="space-y-2">
                  {supplements.htgGuides.map(htg => (
                    <Link
                      key={htg.id}
                      href={`/guides/${htg.sourceDocument}`}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors group"
                    >
                      <FileText className="h-4 w-4 text-emerald-500 group-hover:text-primary" />
                      <span className="font-medium">{htg.guideName}</span>
                      <ArrowUpRight className="h-3 w-3 text-slate-400 group-hover:text-primary" />
                    </Link>
                  ))}
                </div>
              </SupplementaryPanel>
            )}
          </>
        );
      })()}

      {section.subsections && section.subsections.length > 0 && (
        <>
          {section.subsections.map((subsection) => (
            <SectionRenderer
              key={subsection.number}
              section={subsection}
              chapterNumber={chapterNumber}
              supplementaryContent={supplementaryContent}
            />
          ))}
        </>
      )}
    </section>
  );
}
