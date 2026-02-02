'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SourceBadge } from '@/components/authority/SourceBadge';
import { FileText, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAuthorityLevel, CONTENT_SOURCES } from '@/lib/constants';

interface SearchResultCardProps {
  result: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    substrateId: string | null;
    categoryId: string | null;
    sourceId: string | null;
    type: 'detail' | 'failure';
    warningCount?: number;
    failureCount?: number;
    isExactMatch?: boolean;
    relevanceScore?: number;
  };
  substrateName?: string;
}

/**
 * Individual search result card with source badge and authority styling.
 * Used within GroupedSearchResults for consistent result display.
 */
export function SearchResultCard({ result, substrateName }: SearchResultCardProps) {
  const authority = getAuthorityLevel(result.sourceId);
  const source = CONTENT_SOURCES.find(s => s.id === result.sourceId);

  const getResultLink = () => {
    if (result.type === 'failure') {
      return `/failures/${result.id}`;
    }
    return `/planner/${result.substrateId}/${result.categoryId}/${result.id}`;
  };

  return (
    <Link
      href={getResultLink()}
      aria-label={`${result.type === 'failure' ? 'Failure case' : 'Detail'}: ${result.code} - ${result.name}`}
    >
      <Card
        className={cn(
          'cursor-pointer transition-all hover:shadow-md active:scale-[0.99] touch-manipulation focus-within:ring-2 focus-within:ring-primary',
          result.type === 'failure'
            ? 'hover:border-red-300'
            : authority === 'authoritative'
            ? 'hover:border-primary/50 border-l-4 border-l-primary'
            : 'hover:border-slate-300 border-l-4 border-l-slate-200'
        )}
      >
        <CardContent className="flex items-center justify-between p-4 min-h-[80px]">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-lg flex-shrink-0',
                result.type === 'failure'
                  ? 'bg-red-100'
                  : authority === 'authoritative'
                  ? 'bg-primary/10'
                  : 'bg-slate-100'
              )}
            >
              {result.type === 'failure' ? (
                <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
              ) : result.isExactMatch ? (
                <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
              ) : (
                <FileText
                  className={cn(
                    'h-6 w-6',
                    authority === 'authoritative' ? 'text-primary' : 'text-slate-600'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    'font-mono',
                    result.type === 'failure'
                      ? 'border-red-300 text-red-700'
                      : authority === 'authoritative'
                      ? 'border-primary/50 text-primary'
                      : ''
                  )}
                >
                  {result.code}
                </Badge>
                {result.type === 'failure' ? (
                  <Badge className="bg-red-100 text-red-700 text-xs">
                    Case Law
                  </Badge>
                ) : source && (
                  <SourceBadge
                    shortName={source.shortName}
                    name={source.name}
                    authority={authority}
                    size="sm"
                  />
                )}
                <span className="font-medium text-slate-900 truncate">
                  {result.name}
                </span>
              </div>
              <p className="text-sm text-slate-500 truncate">
                {result.type === 'failure'
                  ? result.description?.slice(0, 80) + (result.description && result.description.length > 80 ? '...' : '')
                  : substrateName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(result.warningCount ?? 0) > 0 && (
              <Badge className="bg-amber-100 text-amber-700">
                <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />
                <span aria-label={`${result.warningCount} warnings`}>
                  {result.warningCount}
                </span>
              </Badge>
            )}
            {(result.failureCount ?? 0) > 0 && (
              <Badge className="bg-red-100 text-red-700">
                <span aria-label={`${result.failureCount} failure cases`}>
                  {result.failureCount}
                </span>
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
