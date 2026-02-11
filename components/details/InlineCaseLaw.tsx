'use client';

import Link from 'next/link';
import { AlertTriangle, FileText, ExternalLink, Gavel, ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface InlineCaseItem {
  id: string;
  caseId: string;
  summary: string | null;
  outcome: 'upheld' | 'partially-upheld' | 'dismissed' | null;
  pdfUrl?: string | null;
  failureType?: string | null;
  caseType?: string | null;
}

interface InlineCaseLawProps {
  failures: InlineCaseItem[];
}

const outcomeConfig: Record<string, { label: string; color: string }> = {
  upheld: { label: 'Upheld', color: 'bg-red-100 text-red-800 border-red-200' },
  'partially-upheld': { label: 'Partially Upheld', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  dismissed: { label: 'Dismissed', color: 'bg-green-100 text-green-800 border-green-200' },
  'not-upheld': { label: 'Not Upheld', color: 'bg-green-100 text-green-800 border-green-200' },
};

const failureTypeLabels: Record<string, string> = {
  'water-ingress': 'Water Ingress',
  structural: 'Structural',
  'design-error': 'Design Error',
  workmanship: 'Workmanship',
  durability: 'Durability',
};

/**
 * Inline case law display for detail pages.
 * Shows summary and key finding directly without requiring click-through.
 * Each entry has a one-click PDF link.
 */
export function InlineCaseLaw({ failures }: InlineCaseLawProps) {
  if (failures.length === 0) return null;

  return (
    <Card className="border-red-200">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-700" />
          <h3 className="text-lg font-semibold text-red-800">
            Related Case Law
          </h3>
          <Badge variant="secondary" className="ml-auto text-xs">
            {failures.length} {failures.length === 1 ? 'case' : 'cases'}
          </Badge>
        </div>

        <div className="space-y-3">
          {failures.map((failure) => {
            const outcome = failure.outcome ? outcomeConfig[failure.outcome] : null;
            const isLbp = failure.caseType === 'lbp-complaint';

            return (
              <div
                key={failure.id}
                className="rounded-lg border bg-slate-50 p-4"
              >
                {/* Header: case ID, type, outcome */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isLbp ? (
                      <ClipboardList className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Gavel className="h-4 w-4 text-slate-500" />
                    )}
                    <Link
                      href={`/failures/${failure.id}`}
                      className="font-mono text-sm font-medium text-primary hover:underline"
                    >
                      {failure.caseId}
                    </Link>
                    {failure.failureType && (
                      <Badge variant="secondary" className="text-xs">
                        {failureTypeLabels[failure.failureType] || failure.failureType}
                      </Badge>
                    )}
                  </div>
                  {outcome && (
                    <Badge className={cn('text-xs shrink-0', outcome.color)}>
                      {outcome.label}
                    </Badge>
                  )}
                </div>

                {/* Summary - visible inline */}
                <p className="text-sm text-slate-700 leading-relaxed mb-3">
                  {failure.summary || 'No summary available for this case.'}
                </p>

                {/* Actions: PDF link + detail link */}
                <div className="flex items-center gap-2">
                  {failure.pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      asChild
                    >
                      <a
                        href={failure.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="mr-1 h-3.5 w-3.5" />
                        View PDF
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-slate-500"
                    asChild
                  >
                    <Link href={`/failures/${failure.id}`}>
                      Full details
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
