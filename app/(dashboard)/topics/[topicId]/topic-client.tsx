'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DetailCard } from '@/components/details/DetailCard';
import {
  SourceFilterTabs,
  CapabilityFilters,
  ComingSoonPlaceholder,
} from '@/components/navigation';
import { ArrowRight, X } from 'lucide-react';

interface TopicDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  modelUrl: string | null;
  categoryId: string | null;
  sourceId: string | null;
  sourceName: string | null;
  hasSteps: boolean;
  hasWarnings: boolean;
  hasCaseLaw: boolean;
}

interface Topic {
  id: string;
  name: string;
  description: string | null;
}

interface TopicDetailsClientProps {
  topic: Topic;
  details: TopicDetail[];
  initialSourceFilter: string;
  initialCapabilities: string[];
  sourceCounts: {
    all: number;
    'mrm-cop': number;
    'ranz-guide': number;
  };
}

export function TopicDetailsClient({
  topic,
  details,
  initialSourceFilter: _initialSourceFilter,
  initialCapabilities: _initialCapabilities,
  sourceCounts,
}: TopicDetailsClientProps) {
  // Initial values passed from server but we use URL as source of truth
  void _initialSourceFilter;
  void _initialCapabilities;

  const searchParams = useSearchParams();

  // Hydration safety: only apply capability filters after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get capabilities from URL
  const capabilities = useMemo(() => {
    return searchParams.get('capabilities')?.split(',').filter(Boolean) || [];
  }, [searchParams]);

  // Check if any filters are active
  const hasActiveFilters = capabilities.length > 0;

  // Apply client-side capability filtering (only after mount to avoid hydration mismatch)
  const filteredDetails = useMemo(() => {
    if (!mounted || capabilities.length === 0) {
      return details;
    }

    return details.filter(detail => {
      return capabilities.every(cap => {
        switch (cap) {
          case '3d':
            return detail.modelUrl !== null;
          case 'steps':
            return detail.hasSteps;
          case 'warnings':
            return detail.hasWarnings;
          case 'caselaw':
            return detail.hasCaseLaw;
          default:
            return true;
        }
      });
    });
  }, [details, capabilities, mounted]);

  // Clear all capability filters
  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('capabilities');
    const queryString = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${queryString ? `?${queryString}` : ''}`);
    // Force re-render by updating the URL
    window.location.href = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`;
  };

  // Determine substrate name for DetailCard
  const getSubstrateName = (): string => {
    // Use topic name as substrate context for unified view
    return topic.name;
  };

  // Generate href for detail
  const getDetailHref = (detail: TopicDetail): string => {
    // For now, link to planner route if we have category info
    // Future: could link to a unified /topics/[topicId]/[detailId] route
    if (detail.categoryId) {
      // We need substrate info - for now use a generic search link
      return `/search?q=${encodeURIComponent(detail.code)}`;
    }
    return `/search?q=${encodeURIComponent(detail.code)}`;
  };

  // If topic has no details at all, show Coming Soon placeholder
  if (sourceCounts.all === 0) {
    return (
      <ComingSoonPlaceholder
        title={topic.name}
        subtitle="Check back soon or explore other topics"
        showBrowseButtons={true}
      />
    );
  }

  return (
    <div>
      {/* Source Filter Tabs wrapping the content */}
      <SourceFilterTabs
        allCount={sourceCounts.all}
        mrmCount={sourceCounts['mrm-cop']}
        ranzCount={sourceCounts['ranz-guide']}
      >
        {/* Capability Filters */}
        <CapabilityFilters className="mb-4" />

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="mb-4 flex items-center gap-2 text-sm text-slate-600">
            <span>
              Showing {filteredDetails.length} of {details.length} details
              {filteredDetails.length !== details.length && ' matching filters'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-auto py-1 px-2 text-slate-500 hover:text-slate-700"
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          </div>
        )}

        {/* No results from filter (but topic has content) */}
        {filteredDetails.length === 0 && details.length > 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600 mb-4">
              No details match your selected filters.
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear all filters
            </Button>
          </div>
        )}

        {/* No content from selected source (but topic has content in other sources) */}
        {details.length === 0 && sourceCounts.all > 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600 mb-4">
              No details from this source for {topic.name}. Try viewing all sources.
            </p>
            <Link href={`/topics/${topic.id}`}>
              <Button variant="outline" size="sm">
                View All Sources
              </Button>
            </Link>
          </div>
        )}

        {/* Details List */}
        {filteredDetails.length > 0 && (
          <div className="space-y-3">
            {filteredDetails.map((detail) => (
              <DetailCard
                key={detail.id}
                code={detail.code}
                name={detail.name}
                substrate={getSubstrateName()}
                sourceId={detail.sourceId}
                sourceShortName={detail.sourceName || undefined}
                has3DModel={detail.modelUrl !== null}
                hasSteps={detail.hasSteps}
                hasWarning={detail.hasWarnings}
                warningCount={detail.hasWarnings ? 1 : 0}
                failureCount={detail.hasCaseLaw ? 1 : 0}
                href={getDetailHref(detail)}
              />
            ))}
          </div>
        )}

        {/* Summary */}
        {filteredDetails.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 mb-4">
              Viewing {filteredDetails.length} of {sourceCounts.all} total details in {topic.name}
            </p>
            <Link href={`/search?q=${encodeURIComponent(topic.name)}`}>
              <Button variant="outline">
                Search in {topic.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </SourceFilterTabs>
    </div>
  );
}
