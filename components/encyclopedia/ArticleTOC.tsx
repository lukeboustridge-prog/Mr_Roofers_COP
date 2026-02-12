'use client';

import { useEffect, useRef } from 'react';
import type { CopSection } from '@/types/cop';
import { cn } from '@/lib/utils';

interface ArticleTOCProps {
  sections: CopSection[];
  activeId: string | null;
  onItemClick?: () => void;
}

/**
 * Recursive table of contents tree for encyclopedia articles.
 *
 * Features:
 * - Scrollspy active highlighting with primary accent
 * - Section numbers in mono font
 * - Auto-scrolls active item into view
 * - Calls onItemClick on click (for mobile drawer close)
 * - Indentation per nesting level
 */
export function ArticleTOC({ sections, activeId, onItemClick }: ArticleTOCProps) {
  return (
    <nav aria-label="Article table of contents">
      <TOCLevel sections={sections} activeId={activeId} level={0} onItemClick={onItemClick} />
    </nav>
  );
}

interface TOCLevelProps {
  sections: CopSection[];
  activeId: string | null;
  level: number;
  onItemClick?: () => void;
}

function TOCLevel({ sections, activeId, level, onItemClick }: TOCLevelProps) {
  return (
    <ul className={cn('space-y-0.5', level > 0 && 'ml-3')}>
      {sections.map((section) => (
        <TOCItem
          key={section.number}
          section={section}
          activeId={activeId}
          level={level}
          onItemClick={onItemClick}
        />
      ))}
    </ul>
  );
}

interface TOCItemProps {
  section: CopSection;
  activeId: string | null;
  level: number;
  onItemClick?: () => void;
}

function TOCItem({ section, activeId, level, onItemClick }: TOCItemProps) {
  const sectionId = `section-${section.number}`;
  const isActive = activeId === sectionId;
  const itemRef = useRef<HTMLLIElement>(null);

  // Auto-scroll active item into view
  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isActive]);

  // Text sizing: text-sm for levels 0-1 (maps to h2-h3), text-xs for level 2+
  const textSize = level >= 2 ? 'text-xs' : 'text-sm';

  return (
    <li ref={itemRef}>
      <a
        href={`#${sectionId}`}
        onClick={() => onItemClick?.()}
        className={cn(
          'block py-1.5 px-2 rounded-md transition-colors',
          textSize,
          isActive
            ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary pl-[6px]'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        )}
      >
        <span className="font-mono text-[0.85em] mr-1.5 tabular-nums opacity-60">
          {section.number}
        </span>
        <span className="truncate">{section.title}</span>
      </a>

      {/* Render subsections recursively */}
      {section.subsections && section.subsections.length > 0 && (
        <TOCLevel
          sections={section.subsections}
          activeId={activeId}
          level={level + 1}
          onItemClick={onItemClick}
        />
      )}
    </li>
  );
}
