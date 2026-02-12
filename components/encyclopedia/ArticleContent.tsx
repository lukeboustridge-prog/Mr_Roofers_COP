import Link from 'next/link';
import { FileText, ArrowUpRight } from 'lucide-react';
import type { CopSection, SupplementaryData } from '@/types/cop';
import { ArticleSectionHeading } from './ArticleSectionHeading';
import { CopImage } from '@/components/cop/CopImage';
import { SupplementaryPanel } from '@/components/cop/SupplementaryPanel';
import { SupplementaryDetailCard } from '@/components/cop/SupplementaryDetailCard';

interface ArticleContentProps {
  section: CopSection;
  chapterNumber: number;
  supplementaryContent?: Record<string, SupplementaryData>;
}

/**
 * Recursive article section renderer with encyclopedia prose styling.
 *
 * Renders COP sections as continuous prose with:
 * - ArticleSectionHeading for heading hierarchy (h2-h6) with anchor links
 * - Prose typography via @tailwindcss/typography
 * - whitespace-pre-line for content line breaks
 * - Images via CopImage component
 * - Supplementary panels (details + HTG guides) via existing components
 * - Recursive subsection rendering
 * - scroll-mt-20 for proper anchor scroll offset
 */
export function ArticleContent({
  section,
  chapterNumber,
  supplementaryContent,
}: ArticleContentProps) {
  const sectionId = `section-${section.number}`;

  return (
    <section id={sectionId} className="scroll-mt-20">
      {/* Section heading (level > 1 only; level 1 is the chapter h1) */}
      <ArticleSectionHeading
        number={section.number}
        title={section.title}
        level={section.level}
      />

      {/* Section content with prose styling */}
      {section.content && (
        <div className="prose prose-slate max-w-none prose-headings:scroll-mt-20">
          <div className="whitespace-pre-line text-slate-700 leading-relaxed">
            {section.content}
          </div>
        </div>
      )}

      {/* Images */}
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
        const supSectionId = `cop-${section.number}`;
        const supplements = supplementaryContent[supSectionId];

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

      {/* Recursive subsections */}
      {section.subsections && section.subsections.length > 0 && (
        <>
          {section.subsections.map((subsection) => (
            <ArticleContent
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
