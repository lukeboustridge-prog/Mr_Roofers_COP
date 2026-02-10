'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, FileWarning, ExternalLink, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CautionaryTagProps {
  caseId: string;
  failureCaseId: string;
  summary?: string;
  outcome?: 'upheld' | 'partially-upheld' | 'dismissed' | null;
  className?: string;
}

export function CautionaryTag({
  caseId,
  failureCaseId,
  summary,
  outcome,
  className,
}: CautionaryTagProps) {
  const outcomeColors = {
    'upheld': 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
    'partially-upheld': 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200',
    'dismissed': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
  };

  const color = outcome ? outcomeColors[outcome] : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={`/failures/${failureCaseId}`}>
            <Badge
              variant="outline"
              className={cn(
                'cursor-pointer transition-colors font-mono text-xs',
                color,
                className
              )}
            >
              <FileWarning className="mr-1 h-3 w-3" />
              {caseId}
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium text-sm">{caseId}</p>
            {summary && (
              <p className="text-xs text-slate-600">{summary}</p>
            )}
            {outcome && (
              <p className="text-xs">
                Outcome: <span className="font-medium capitalize">{outcome.replace('-', ' ')}</span>
              </p>
            )}
            <p className="text-xs text-blue-600 flex items-center gap-1">
              Click to view details <ExternalLink className="h-3 w-3" />
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Failure count badge for detail cards
export function FailureCountBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  if (count === 0) return null;

  return (
    <Badge
      className={cn(
        'bg-red-100 text-red-700 border-red-200 text-xs',
        className
      )}
    >
      <AlertTriangle className="mr-1 h-3 w-3" />
      {count} failure{count > 1 ? 's' : ''}
    </Badge>
  );
}

// Linked failure cases section for detail pages
interface LinkedFailure {
  id: string;
  caseId: string;
  summary: string | null;
  outcome: 'upheld' | 'partially-upheld' | 'dismissed' | null;
  pdfUrl?: string | null;
}

function FailureEntryWithPdf({ failure }: { failure: LinkedFailure }) {
  const [showPdf, setShowPdf] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <CautionaryTag
          caseId={failure.caseId}
          failureCaseId={failure.id}
          summary={failure.summary || undefined}
          outcome={failure.outcome}
        />
        {failure.pdfUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
            onClick={() => setShowPdf(!showPdf)}
          >
            <FileText className="mr-1 h-3 w-3" />
            {showPdf ? 'Hide' : 'View'} PDF
            {showPdf ? (
              <ChevronUp className="ml-1 h-3 w-3" />
            ) : (
              <ChevronDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      {showPdf && failure.pdfUrl && (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <iframe
            src={failure.pdfUrl}
            className="w-full h-[600px]"
            title={`PDF: ${failure.caseId}`}
          />
        </div>
      )}
    </div>
  );
}

export function LinkedFailuresList({
  failures,
  className,
}: {
  failures: LinkedFailure[];
  className?: string;
}) {
  if (failures.length === 0) return null;

  const hasPdfs = failures.some((f) => f.pdfUrl);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-red-800">
        <AlertTriangle className="h-4 w-4" />
        Related Case Law ({failures.length})
      </div>
      {hasPdfs ? (
        <div className="space-y-3">
          {failures.map((failure) => (
            <FailureEntryWithPdf key={failure.id} failure={failure} />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {failures.map((failure) => (
            <CautionaryTag
              key={failure.id}
              caseId={failure.caseId}
              failureCaseId={failure.id}
              summary={failure.summary || undefined}
              outcome={failure.outcome}
            />
          ))}
        </div>
      )}
    </div>
  );
}
