'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronDown, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export interface HtgDetailItem {
  htgId: string;
  guideName: string;
  sourceDocument: string;
  content: string | null;
  pdfPage: number | null;
  relevance: string | null;
  matchType: string | null;
}

interface HtgDetailPanelProps {
  items: HtgDetailItem[];
}

// Map source documents to readable guide names and COP chapter numbers
const GUIDE_INFO: Record<string, { name: string; copChapter: number }> = {
  flashings: { name: 'RANZ Metal Roof Flashings Guide', copChapter: 8 },
  penetrations: { name: 'RANZ Metal Roof Penetrations Guide', copChapter: 9 },
  cladding: { name: 'RANZ Metal Wall Cladding Guide', copChapter: 6 },
};

/**
 * Panel for displaying HTG (How-To Guide) content on detail pages.
 * Groups HTG pages by source document and shows collapsible sections.
 * Each page card includes content excerpt and link to COP Reader.
 */
export function HtgDetailPanel({ items }: HtgDetailPanelProps) {
  // Group items by sourceDocument
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.sourceDocument]) {
      acc[item.sourceDocument] = [];
    }
    acc[item.sourceDocument].push(item);
    return acc;
  }, {} as Record<string, HtgDetailItem[]>);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Relevant installation guidance from RANZ How-To Guides. For full context and
        additional detail, visit the complete guide in the COP Reader.
      </p>

      {Object.entries(groupedItems).map(([sourceDoc, pages]) => {
        const guideInfo = GUIDE_INFO[sourceDoc];
        if (!guideInfo) return null;

        // Sort pages: primary relevance first, then by PDF page number
        const sortedPages = [...pages].sort((a, b) => {
          if (a.relevance === 'primary' && b.relevance !== 'primary') return -1;
          if (a.relevance !== 'primary' && b.relevance === 'primary') return 1;
          return (a.pdfPage ?? 0) - (b.pdfPage ?? 0);
        });

        return (
          <GuideSection
            key={sourceDoc}
            guideName={guideInfo.name}
            copChapter={guideInfo.copChapter}
            pages={sortedPages}
          />
        );
      })}
    </div>
  );
}

interface GuideSectionProps {
  guideName: string;
  copChapter: number;
  pages: HtgDetailItem[];
}

function GuideSection({ guideName, copChapter, pages }: GuideSectionProps) {
  const [isOpen, setIsOpen] = useState(true); // Open by default
  const [showAll, setShowAll] = useState(false);

  const displayPages = showAll ? pages : pages.slice(0, 3);
  const hasMore = pages.length > 3;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <CardTitle className="text-base font-semibold">
                    {guideName}
                  </CardTitle>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {pages.length} relevant {pages.length === 1 ? 'page' : 'pages'}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  'h-5 w-5 text-slate-500 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-3">
            {displayPages.map((page) => (
              <PageCard
                key={page.htgId}
                page={page}
                copChapter={copChapter}
              />
            ))}

            {hasMore && !showAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(true)}
                className="w-full"
              >
                Show {pages.length - 3} more {pages.length - 3 === 1 ? 'page' : 'pages'}
              </Button>
            )}

            {hasMore && showAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(false)}
                className="w-full"
              >
                Show less
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

interface PageCardProps {
  page: HtgDetailItem;
  copChapter: number;
}

function PageCard({ page, copChapter }: PageCardProps) {
  // Truncate content to ~200 chars at sentence boundary
  const truncateContent = (text: string | null): string => {
    if (!text) return 'No content preview available.';

    if (text.length <= 200) return text;

    // Find sentence boundary (period, exclamation, or question mark followed by space or end)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    let truncated = '';

    for (const sentence of sentences) {
      if ((truncated + sentence).length > 200) break;
      truncated += sentence;
    }

    return truncated.trim() || text.substring(0, 200) + '...';
  };

  return (
    <Card className="border-slate-200 bg-slate-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            {page.pdfPage !== null && (
              <Badge variant="outline" className="font-mono text-xs">
                Page {page.pdfPage}
              </Badge>
            )}
            <Badge
              variant={page.relevance === 'primary' ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                page.relevance === 'primary' && 'bg-green-600 hover:bg-green-700'
              )}
            >
              {page.relevance === 'primary' ? 'Primary' : 'Supplementary'}
            </Badge>
          </div>
          <Link href={`/cop/${copChapter}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <span className="text-xs mr-1">View in COP Reader</span>
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          {truncateContent(page.content)}
        </p>
      </CardContent>
    </Card>
  );
}
