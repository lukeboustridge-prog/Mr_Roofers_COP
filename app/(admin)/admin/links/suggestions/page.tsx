'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkSuggestionCard, LinkSuggestion } from '@/components/admin/LinkSuggestionCard';

interface SuggestionsSummary {
  exact: number;
  partial: number;
  related: number;
  total: number;
}

export default function SuggestionsReviewPage() {
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [summary, setSummary] = useState<SuggestionsSummary>({ exact: 0, partial: 0, related: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        // Fetch suggestions including related (minConfidence=related)
        const response = await fetch('/api/admin/links/suggestions?minConfidence=related');
        if (!response.ok) {
          throw new Error('Failed to fetch suggestions');
        }
        const result = await response.json();
        setSuggestions(result.data || []);
        setSummary(result.summary || { exact: 0, partial: 0, related: 0, total: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load suggestions');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSuggestions();
  }, []);

  async function handleApprove(suggestion: LinkSuggestion) {
    const uniqueId = `${suggestion.mrmDetailId}:${suggestion.ranzDetailId}`;
    setApprovingId(uniqueId);

    try {
      const response = await fetch('/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryDetailId: suggestion.mrmDetailId,
          supplementaryDetailId: suggestion.ranzDetailId,
          linkType: 'installation_guide',
          matchConfidence: suggestion.confidence,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create link');
      }

      // Remove approved suggestion from list and update summary
      setSuggestions(prev => prev.filter(s =>
        !(s.mrmDetailId === suggestion.mrmDetailId && s.ranzDetailId === suggestion.ranzDetailId)
      ));
      setSummary(prev => ({
        ...prev,
        [suggestion.confidence]: Math.max(0, prev[suggestion.confidence] - 1),
        total: Math.max(0, prev.total - 1),
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve link');
    } finally {
      setApprovingId(null);
    }
  }

  function handleReject(suggestion: LinkSuggestion) {
    // Remove rejected suggestion from list (no persistence)
    setSuggestions(prev => prev.filter(s =>
      !(s.mrmDetailId === suggestion.mrmDetailId && s.ranzDetailId === suggestion.ranzDetailId)
    ));
    setSummary(prev => ({
      ...prev,
      [suggestion.confidence]: Math.max(0, prev[suggestion.confidence] - 1),
      total: Math.max(0, prev.total - 1),
    }));
  }

  async function handleApproveAllExact() {
    const exactSuggestions = suggestions.filter(s => s.confidence === 'exact');
    if (exactSuggestions.length === 0) return;

    if (!confirm(`Approve all ${exactSuggestions.length} exact matches? This will create content links for all of them.`)) {
      return;
    }

    setIsBulkApproving(true);

    let successCount = 0;
    let failCount = 0;

    for (const suggestion of exactSuggestions) {
      try {
        const response = await fetch('/api/admin/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primaryDetailId: suggestion.mrmDetailId,
            supplementaryDetailId: suggestion.ranzDetailId,
            linkType: 'installation_guide',
            matchConfidence: 'exact',
          }),
        });

        if (response.ok) {
          successCount++;
          // Remove from list
          setSuggestions(prev => prev.filter(s =>
            !(s.mrmDetailId === suggestion.mrmDetailId && s.ranzDetailId === suggestion.ranzDetailId)
          ));
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    // Update summary
    setSummary(prev => ({
      ...prev,
      exact: 0,
      total: prev.total - successCount,
    }));

    setIsBulkApproving(false);

    if (failCount > 0) {
      alert(`Approved ${successCount} links. ${failCount} failed.`);
    }
  }

  // Group suggestions by confidence
  const exactSuggestions = suggestions.filter(s => s.confidence === 'exact');
  const partialSuggestions = suggestions.filter(s => s.confidence === 'partial');
  const relatedSuggestions = suggestions.filter(s => s.confidence === 'related');

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <Link href="/admin/links" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Links
        </Link>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/links" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Links
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            Link Suggestions
          </h1>
          <p className="text-slate-600">
            Review auto-detected MRM to RANZ content links ({summary.total} pending)
          </p>
        </div>
        {exactSuggestions.length > 0 && (
          <Button
            onClick={handleApproveAllExact}
            disabled={isBulkApproving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isBulkApproving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Approve All Exact ({exactSuggestions.length})
          </Button>
        )}
      </div>

      {/* Empty state */}
      {suggestions.length === 0 && (
        <div className="rounded-lg border bg-white p-8 text-center">
          <Sparkles className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            All caught up!
          </h2>
          <p className="text-slate-600 mb-4">
            No pending suggestions. All MRM-RANZ links are up to date.
          </p>
          <Link href="/admin/links">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              View All Links
            </Button>
          </Link>
        </div>
      )}

      {/* Exact Matches */}
      {exactSuggestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-sm font-bold">
              {exactSuggestions.length}
            </span>
            Exact Matches
            <span className="text-sm font-normal text-slate-500">
              (High confidence - codes match exactly)
            </span>
          </h2>
          <div className="grid gap-4">
            {exactSuggestions.map((suggestion) => {
              const uniqueId = `${suggestion.mrmDetailId}:${suggestion.ranzDetailId}`;
              return (
                <LinkSuggestionCard
                  key={uniqueId}
                  suggestion={suggestion}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isApproving={approvingId === uniqueId || isBulkApproving}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Partial Matches */}
      {partialSuggestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-sm font-bold">
              {partialSuggestions.length}
            </span>
            Partial Matches
            <span className="text-sm font-normal text-slate-500">
              (Same code family with high similarity)
            </span>
          </h2>
          <div className="grid gap-4">
            {partialSuggestions.map((suggestion) => {
              const uniqueId = `${suggestion.mrmDetailId}:${suggestion.ranzDetailId}`;
              return (
                <LinkSuggestionCard
                  key={uniqueId}
                  suggestion={suggestion}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isApproving={approvingId === uniqueId}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Related Matches */}
      {relatedSuggestions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-sm font-bold">
              {relatedSuggestions.length}
            </span>
            Related Content
            <span className="text-sm font-normal text-slate-500">
              (Name similarity or related code family)
            </span>
          </h2>
          <div className="grid gap-4">
            {relatedSuggestions.map((suggestion) => {
              const uniqueId = `${suggestion.mrmDetailId}:${suggestion.ranzDetailId}`;
              return (
                <LinkSuggestionCard
                  key={uniqueId}
                  suggestion={suggestion}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isApproving={approvingId === uniqueId}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
