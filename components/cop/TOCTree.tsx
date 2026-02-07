'use client';

import { useEffect, useRef } from 'react';
import type { CopSection } from '@/types/cop';
import { cn } from '@/lib/utils';

interface TOCTreeProps {
  sections: CopSection[];
  chapterNumber: number;
  activeId: string;
  level?: number;
  onItemClick?: () => void;
}

/**
 * Recursive table of contents tree component
 *
 * Renders a hierarchical list of chapter sections with:
 * - Active section highlighting (from scrollspy)
 * - Smooth scrolling to sections on click
 * - Auto-scroll to keep active item visible
 * - Nested subsections with indentation
 */
export function TOCTree({
  sections,
  chapterNumber,
  activeId,
  level = 0,
  onItemClick,
}: TOCTreeProps) {
  return (
    <ul className={cn('space-y-0.5', level > 0 && 'ml-3')}>
      {sections.map((section) => (
        <TOCTreeItem
          key={section.number}
          section={section}
          chapterNumber={chapterNumber}
          activeId={activeId}
          level={level}
          onItemClick={onItemClick}
        />
      ))}
    </ul>
  );
}

interface TOCTreeItemProps {
  section: CopSection;
  chapterNumber: number;
  activeId: string;
  level: number;
  onItemClick?: () => void;
}

function TOCTreeItem({
  section,
  chapterNumber,
  activeId,
  level,
  onItemClick,
}: TOCTreeItemProps) {
  const sectionId = `section-${section.number}`;
  const isActive = activeId === sectionId;
  const itemRef = useRef<HTMLLIElement>(null);

  // Auto-scroll active item into view when activeId changes
  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isActive]);

  // Determine text size based on nesting level
  const textSize = level >= 3 ? 'text-xs' : 'text-sm';

  return (
    <li ref={itemRef}>
      <a
        href={`#${sectionId}`}
        onClick={() => {
          // Let the browser handle the hash navigation
          // but call the callback (to close mobile drawer)
          onItemClick?.();
        }}
        className={cn(
          'block py-1.5 px-2 rounded-md transition-colors',
          textSize,
          isActive
            ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary pl-[6px]'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        )}
      >
        <span className="text-slate-400 mr-1.5 tabular-nums">{section.number}</span>
        <span className="truncate">{section.title}</span>
      </a>

      {/* Render subsections recursively */}
      {section.subsections && section.subsections.length > 0 && (
        <TOCTree
          sections={section.subsections}
          chapterNumber={chapterNumber}
          activeId={activeId}
          level={level + 1}
          onItemClick={onItemClick}
        />
      )}
    </li>
  );
}
