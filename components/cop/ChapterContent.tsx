'use client';

import { useState, useMemo } from 'react';
import { List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { CopChapter, CopSection } from '@/types/cop';
import { SectionRenderer } from './SectionRenderer';
import { Breadcrumbs } from './Breadcrumbs';
import { TOCTree } from './TOCTree';
import { useScrollspy } from './use-scrollspy';
import { useHashScroll } from './use-hash-scroll';

interface ChapterContentProps {
  chapterData: CopChapter;
}

/**
 * Client-side wrapper for chapter content
 *
 * Provides:
 * - Desktop: Sticky TOC sidebar with scrollspy
 * - Mobile: Floating "Contents" button opening slide-out drawer
 * - Hash scroll navigation for deep-linking to sections
 * - Auto-highlighting of currently visible section
 */
export function ChapterContent({ chapterData }: ChapterContentProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Flatten all section IDs in DOM order (depth-first)
  const sectionIds = useMemo(() => flattenSectionIds(chapterData.sections), [chapterData.sections]);

  // Track currently visible section
  const activeId = useScrollspy(sectionIds);

  // Enable hash scroll navigation
  useHashScroll();

  return (
    <div className="flex gap-0">
      {/* Desktop TOC sidebar -- hidden on mobile */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-slate-200 py-4 px-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
          Contents
        </h2>
        <TOCTree
          sections={chapterData.sections}
          chapterNumber={chapterData.chapterNumber}
          activeId={activeId}
        />
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0">
        {/* Mobile TOC trigger -- visible on mobile/tablet only */}
        <div className="lg:hidden sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-2">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 py-1">
                <List className="h-4 w-4" />
                <span>Contents</span>
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              {/* Drawer header */}
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-sm font-semibold text-slate-900">
                  Chapter {chapterData.chapterNumber}: {chapterData.title}
                </h2>
              </div>
              {/* Drawer content */}
              <div className="overflow-y-auto h-[calc(100vh-65px)] py-3 px-3">
                <TOCTree
                  sections={chapterData.sections}
                  chapterNumber={chapterData.chapterNumber}
                  activeId={activeId}
                  onItemClick={() => setDrawerOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Content with padding */}
        <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
          {/* Breadcrumbs */}
          <Breadcrumbs chapterData={chapterData} />

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

          {/* Visual separator */}
          <hr className="border-slate-200 my-6" />

          {/* Chapter content */}
          <div id="chapter-content" className="mt-8">
            {chapterData.sections.map((section) => (
              <SectionRenderer
                key={section.number}
                section={section}
                chapterNumber={chapterData.chapterNumber}
              />
            ))}
          </div>

          {/* Scroll to top anchor */}
          <div className="mt-12 mb-8 text-center">
            <a href="#" className="text-sm text-slate-400 hover:text-slate-600">
              Back to top
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Recursively flatten section hierarchy into array of IDs (depth-first order)
 */
function flattenSectionIds(sections: CopSection[]): string[] {
  const ids: string[] = [];
  for (const section of sections) {
    ids.push(`section-${section.number}`);
    if (section.subsections) {
      ids.push(...flattenSectionIds(section.subsections));
    }
  }
  return ids;
}
