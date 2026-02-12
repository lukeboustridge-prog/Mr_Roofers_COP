import { Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArticleSectionHeadingProps {
  number: string;
  title: string;
  level: number;
  className?: string;
}

const headingStyles: Record<number, string> = {
  2: 'text-2xl font-bold border-b border-slate-200 pb-2 mt-14 mb-6',
  3: 'text-xl font-semibold mt-10 mb-4',
  4: 'text-lg font-semibold mt-8 mb-3',
  5: 'text-base font-semibold mt-6 mb-2',
  6: 'text-sm font-semibold mt-4 mb-2',
};

/**
 * Section heading with anchor link and section number.
 *
 * Renders heading (h2-h6) based on level with:
 * - Prominent section number for citation (select-all for easy copying)
 * - Deep-link anchor ID (section-{number})
 * - Hover-visible link icon for shareable URLs (ARTICLE-05)
 * - High-contrast text for legislative readability
 */
export function ArticleSectionHeading({
  number,
  title,
  level,
  className,
}: ArticleSectionHeadingProps) {
  // Level 1 is the chapter heading (h1), handled by page — skip rendering
  if (level <= 1) return null;

  // Map section level to heading level: level 2 -> h2, level 3 -> h3, etc.
  const headingLevel = Math.min(level, 6);
  const sectionId = `section-${number}`;
  const style = headingStyles[headingLevel] || headingStyles[6];

  const innerContent = (
    <>
      <span className="text-primary/60 font-mono text-[0.85em] mr-3 select-all">
        {number}
      </span>
      {title}
      <a
        href={`#${sectionId}`}
        className="ml-2 opacity-0 group-hover:opacity-40 transition-opacity"
        aria-label={`Link to section ${number}`}
      >
        <Link2 className="inline h-4 w-4" />
      </a>
    </>
  );

  const baseClasses = cn('group text-slate-900', style, className);

  // Use explicit heading tags to avoid TypeScript dynamic tag issues
  if (headingLevel === 2) return <h2 id={sectionId} className={baseClasses}>{innerContent}</h2>;
  if (headingLevel === 3) return <h3 id={sectionId} className={baseClasses}>{innerContent}</h3>;
  if (headingLevel === 4) return <h4 id={sectionId} className={baseClasses}>{innerContent}</h4>;
  if (headingLevel === 5) return <h5 id={sectionId} className={baseClasses}>{innerContent}</h5>;
  return <h6 id={sectionId} className={baseClasses}>{innerContent}</h6>;
}
