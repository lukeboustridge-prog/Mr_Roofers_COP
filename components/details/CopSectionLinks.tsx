'use client';

import Link from 'next/link';
import { BookOpen, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface CopSectionLinkItem {
  sectionNumber: string;
  chapterNumber: number;
  title: string;
}

interface CopSectionLinksProps {
  sections: CopSectionLinkItem[];
}

/**
 * Displays COP section links on detail pages for cross-source navigation.
 * Allows users to jump from a detail to the relevant COP section in the reader.
 */
export function CopSectionLinks({ sections }: CopSectionLinksProps) {
  if (sections.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-semibold text-slate-900">
            COP Encyclopedia Sections
          </h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            {sections.length}
          </Badge>
        </div>
        <p className="text-sm text-slate-500 mb-3">
          View this detail in context within the COP Encyclopedia articles.
        </p>
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <Link
              key={section.sectionNumber}
              href={`/encyclopedia/cop/${section.chapterNumber}#section-${section.sectionNumber}`}
              className="inline-flex items-center gap-1.5 rounded-md border bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              &sect;{section.sectionNumber}
              <span className="text-blue-500 max-w-[180px] truncate">
                &mdash; {section.title}
              </span>
              <ArrowUpRight className="h-3 w-3 ml-0.5" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
