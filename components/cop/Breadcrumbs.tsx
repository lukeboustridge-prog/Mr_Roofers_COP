import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CopChapter, CopSection } from '@/types/cop';

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  chapterData: CopChapter;
  currentSection?: string;
}

function buildBreadcrumbs(chapterData: CopChapter, currentSection?: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [
    { label: 'COP', href: '/cop' }
  ];

  if (!currentSection) {
    // Chapter-level page -- chapter is the current item
    crumbs.push({
      label: `Chapter ${chapterData.chapterNumber}: ${chapterData.title}`,
      href: `/cop/${chapterData.chapterNumber}`,
      current: true
    });
    return crumbs;
  }

  // Section deep-link -- walk hierarchy
  crumbs.push({
    label: `Chapter ${chapterData.chapterNumber}`,
    href: `/cop/${chapterData.chapterNumber}`
  });

  const parts = currentSection.split('.');
  // Build intermediate breadcrumbs by walking the section tree
  let currentSections = chapterData.sections;
  for (let i = 1; i < parts.length; i++) {
    const num = parts.slice(0, i + 1).join('.');
    const found = findSectionInList(currentSections, num);
    if (found) {
      const isLast = i === parts.length - 1;
      crumbs.push({
        label: `${found.number} ${found.title}`,
        href: `/cop/${found.number}`,
        current: isLast
      });
      currentSections = found.subsections || [];
    }
  }

  return crumbs;
}

function findSectionInList(sections: CopSection[], targetNumber: string): CopSection | null {
  for (const section of sections) {
    if (section.number === targetNumber) return section;
    if (section.subsections) {
      const found = findSectionInList(section.subsections, targetNumber);
      if (found) return found;
    }
  }
  return null;
}

export function Breadcrumbs({ chapterData, currentSection }: BreadcrumbsProps) {
  const crumbs = buildBreadcrumbs(chapterData, currentSection);

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center flex-wrap gap-1 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const isFirst = index === 0;
          const isMiddle = !isFirst && !isLast;

          return (
            <li
              key={crumb.href}
              className={cn(
                "flex items-center gap-1",
                // Hide middle breadcrumbs on mobile
                isMiddle && "hidden sm:flex"
              )}
            >
              {index > 0 && (
                <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
              )}
              {crumb.current ? (
                <span
                  className="text-slate-900 font-medium"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
