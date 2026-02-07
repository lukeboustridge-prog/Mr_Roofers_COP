import type { CopSection } from '@/types/cop';
import { CopImage } from './CopImage';
import { cn } from '@/lib/utils';

interface SectionRendererProps {
  section: CopSection;
  chapterNumber: number;
}

const headingStyles: Record<'h2' | 'h3' | 'h4' | 'h5' | 'h6', string> = {
  h2: 'text-xl font-bold text-slate-900 md:text-2xl mt-10 mb-4',
  h3: 'text-lg font-semibold text-slate-800 md:text-xl mt-8 mb-3',
  h4: 'text-base font-semibold text-slate-800 mt-6 mb-2',
  h5: 'text-sm font-semibold text-slate-700 mt-4 mb-2',
  h6: 'text-sm font-semibold text-slate-700 mt-4 mb-2',
};

function stripLeadingNumberAndTitle(content: string, sectionNumber: string, title: string): string {
  // Escape special characters in section number and title for regex
  const escapedNumber = sectionNumber.replace(/\./g, '\\.');
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Try to strip leading section number + title from content
  const regex = new RegExp(`^${escapedNumber}\\s*\\n${escapedTitle}\\s*\\n`, 'i');
  const stripped = content.replace(regex, '').trim();

  // If stripping produced empty string or failed, return original
  return stripped || content;
}

function getHeadingClassName(level: number): string {
  const headingLevel = Math.min(level + 1, 6);
  const tag = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return headingStyles[tag];
}

export function SectionRenderer({ section, chapterNumber }: SectionRendererProps) {
  // For level-1 root sections, skip heading (page h1 already shows chapter title)
  const shouldRenderHeading = section.level !== 1 && section.title;

  // Strip leading section number and title from content if present
  const cleanContent = stripLeadingNumberAndTitle(section.content, section.number, section.title);

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

      {cleanContent && (
        <div className="whitespace-pre-line text-slate-700 leading-relaxed">
          {cleanContent}
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

      {section.subsections && section.subsections.length > 0 && (
        <>
          {section.subsections.map((subsection) => (
            <SectionRenderer
              key={subsection.number}
              section={subsection}
              chapterNumber={chapterNumber}
            />
          ))}
        </>
      )}
    </section>
  );
}
