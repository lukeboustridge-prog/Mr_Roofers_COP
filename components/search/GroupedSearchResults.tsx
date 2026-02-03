'use client';

import { SourceBadge } from '@/components/authority/SourceBadge';
import { SearchResultCard } from './SearchResultCard';
import { BookOpen, Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUBSTRATES } from '@/lib/constants';

interface SearchResult {
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
}

interface GroupedSearchResultsProps {
  results: SearchResult[];
  consentMode: boolean;
  className?: string;
}

interface SectionHeaderProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  badgeVariant: 'authoritative' | 'supplementary';
  badgeText: string;
}

function SectionHeader({ title, count, icon, badgeVariant, badgeText }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center',
          badgeVariant === 'authoritative' ? 'bg-primary/10' : 'bg-slate-100'
        )}>
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">
            {count} result{count !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <SourceBadge shortName={badgeText} authority={badgeVariant} size="md" />
    </div>
  );
}

/**
 * Groups search results by source with visual separation.
 * MRM COP results appear first (authoritative), followed by RANZ Guide (supplementary).
 * When consent mode is enabled, only MRM results are shown.
 */
export function GroupedSearchResults({ results, consentMode, className }: GroupedSearchResultsProps) {
  // Group results by source
  const mrmResults = results.filter(r => r.sourceId === 'mrm-cop');
  const ranzResults = results.filter(r => r.sourceId === 'ranz-guide');
  const otherResults = results.filter(r => r.sourceId !== 'mrm-cop' && r.sourceId !== 'ranz-guide');

  const getSubstrateName = (id: string | null) => {
    if (!id) return 'Unknown';
    return SUBSTRATES.find(s => s.id === id)?.name || id;
  };

  // If consent mode, only show MRM
  if (consentMode) {
    if (mrmResults.length === 0) {
      return (
        <div className={cn('text-center py-8', className)}>
          <BookOpen className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No authoritative MRM COP content found for this search.</p>
          <p className="text-sm text-slate-400 mt-2">
            Try disabling Building Code Citation Mode to see supplementary content.
          </p>
        </div>
      );
    }

    return (
      <div className={className}>
        <SectionHeader
          title="MRM Code of Practice"
          count={mrmResults.length}
          icon={<BookOpen className="h-5 w-5 text-primary" />}
          badgeVariant="authoritative"
          badgeText="MRM COP"
        />
        <div className="space-y-3" role="list" aria-label="MRM COP search results">
          {mrmResults.map(result => (
            <SearchResultCard
              key={result.id}
              result={result}
              substrateName={getSubstrateName(result.substrateId)}
            />
          ))}
        </div>
      </div>
    );
  }

  // Show both sections with visual separation
  const hasMrmResults = mrmResults.length > 0;
  const hasRanzResults = ranzResults.length > 0;
  const hasOtherResults = otherResults.length > 0;

  if (!hasMrmResults && !hasRanzResults && !hasOtherResults) {
    return null;
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* MRM COP Section (Authoritative) */}
      {hasMrmResults && (
        <section aria-labelledby="mrm-section-heading">
          <SectionHeader
            title="MRM Code of Practice"
            count={mrmResults.length}
            icon={<BookOpen className="h-5 w-5 text-primary" />}
            badgeVariant="authoritative"
            badgeText="Authoritative"
          />
          <div className="space-y-3" role="list" aria-label="MRM COP search results">
            {mrmResults.map(result => (
              <SearchResultCard
                key={result.id}
                result={result}
                substrateName={getSubstrateName(result.substrateId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Visual Separator */}
      {hasMrmResults && hasRanzResults && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-sm text-slate-500">
              Supplementary Content
            </span>
          </div>
        </div>
      )}

      {/* RANZ Guide Section (Supplementary) */}
      {hasRanzResults && (
        <section aria-labelledby="ranz-section-heading">
          <SectionHeader
            title="RANZ Roofing Guide"
            count={ranzResults.length}
            icon={<Library className="h-5 w-5 text-slate-500" />}
            badgeVariant="supplementary"
            badgeText="Supplementary"
          />
          <div className="space-y-3" role="list" aria-label="RANZ Guide search results">
            {ranzResults.map(result => (
              <SearchResultCard
                key={result.id}
                result={result}
                substrateName={getSubstrateName(result.substrateId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Other sources (failures, etc.) */}
      {hasOtherResults && (
        <section>
          <div className="text-sm text-slate-500 mb-3">Other Results</div>
          <div className="space-y-3" role="list" aria-label="Other search results">
            {otherResults.map(result => (
              <SearchResultCard
                key={result.id}
                result={result}
                substrateName={getSubstrateName(result.substrateId)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
