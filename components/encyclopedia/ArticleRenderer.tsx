'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { List, ArrowUp, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { CopChapter, CopSection } from '@/types/cop';
import type { SubstrateId, ComposedSupplementary } from '@/types/encyclopedia';
import { ArticleTOC } from './ArticleTOC';
import { ArticleContent } from './ArticleContent';
import { ArticleVersionBanner } from './ArticleVersionBanner';
import { useScrollspy } from '@/components/cop/use-scrollspy';
import { useHashScroll } from '@/components/cop/use-hash-scroll';

interface ArticleRendererProps {
  chapterData: CopChapter;
  supplementaryContent?: Record<string, ComposedSupplementary>;
  substrateId?: SubstrateId;
  substrateName?: string;
}

/**
 * Client wrapper for encyclopedia article rendering.
 *
 * Provides:
 * - Desktop: Sticky TOC sidebar with scrollspy active highlighting
 * - Mobile: Sheet drawer for TOC navigation
 * - Hash scroll navigation for deep-linking
 * - Floating back-to-top button
 * - Breadcrumb navigation (COP Reader > Encyclopedia > Chapter N)
 * - Version banner for MBIE citation
 * - Legislative typography with formal section numbering
 */
export function ArticleRenderer({ chapterData, supplementaryContent, substrateName }: ArticleRendererProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Flatten all section IDs in DOM order (depth-first)
  const sectionIds = useMemo(() => flattenSectionIds(chapterData.sections), [chapterData.sections]);

  // Track currently visible section
  const activeId = useScrollspy(sectionIds);

  // Enable hash scroll navigation
  useHashScroll();

  // Show/hide back-to-top button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="flex gap-0">
      {/* Desktop TOC sidebar -- hidden on mobile */}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-0 h-screen overflow-y-auto border-r border-slate-200 py-4 px-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
          Contents
        </h2>
        <ArticleTOC
          sections={chapterData.sections}
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
                <ArticleTOC
                  sections={chapterData.sections}
                  activeId={activeId}
                  onItemClick={() => setDrawerOpen(false)}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Content with padding */}
        <div className="container max-w-4xl p-4 md:p-6 lg:p-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1 text-sm">
              <li className="flex items-center gap-1">
                <Link
                  href="/cop"
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                  COP Reader
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <Link
                  href="/encyclopedia/cop"
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Encyclopedia
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <span className="text-slate-900 font-medium" aria-current="page">
                  Chapter {chapterData.chapterNumber}
                </span>
              </li>
            </ol>
          </nav>

          {/* Chapter title */}
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Chapter {chapterData.chapterNumber}: {chapterData.title}
          </h1>

          {/* Version banner */}
          <div className="mt-4">
            <ArticleVersionBanner version={chapterData.version} substrateName={substrateName} />
          </div>

          {/* Visual separator */}
          <hr className="border-slate-200 my-6" />

          {/* Article content */}
          <div id="article-content" className="mt-8">
            {chapterData.sections.map((section) => (
              <ArticleContent
                key={section.number}
                section={section}
                chapterNumber={chapterData.chapterNumber}
                supplementaryContent={supplementaryContent}
              />
            ))}
          </div>

          {/* Bottom spacer */}
          <div className="mt-12 mb-8" />
        </div>
      </div>

      {/* Floating back-to-top button */}
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className={`fixed bottom-6 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg transition-all hover:bg-slate-700 ${
          showBackToTop ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
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
