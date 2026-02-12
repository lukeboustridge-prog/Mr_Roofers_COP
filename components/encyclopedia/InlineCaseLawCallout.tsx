import Link from 'next/link';
import { Scale } from 'lucide-react';
import type { InlineCaseLaw } from '@/types/encyclopedia';

interface InlineCaseLawCalloutProps {
  caseLaw: InlineCaseLaw;
}

/**
 * Renders a failure case as a compact margin-note-style callout annotation.
 *
 * Visual hierarchy: amber accent (border-amber-400, bg-amber-50/50) marks this
 * as case law supplementary content, visually distinct from authoritative MRM COP prose.
 * Compact padding and spacing designed for margin-note rendering within a float container.
 *
 * Shows:
 * - Scale icon annotation cue + case type label
 * - Outcome badge with colour-coded severity
 * - Case ID in monospace
 * - Summary text (4-line clamp for narrow column)
 * - PDF link if available
 */
export function InlineCaseLawCallout({ caseLaw }: InlineCaseLawCalloutProps) {
  const caseTypeLabel = caseLaw.caseType === 'mbie_determination'
    ? 'MBIE Determination'
    : caseLaw.caseType === 'lbp_complaint'
      ? 'LBP Complaint'
      : caseLaw.caseType;

  return (
    <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50/50 p-3 mt-4 mb-2">
      {/* Top bar: Scale icon + case type label + outcome badge */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 uppercase tracking-wide">
          <Scale className="h-3 w-3" />
          {caseTypeLabel}
        </span>
        {caseLaw.outcome && (
          <OutcomeBadge outcome={caseLaw.outcome} />
        )}
      </div>

      {/* Case ID */}
      <p className="font-mono text-xs text-amber-900 mb-1.5">
        {caseLaw.caseId}
      </p>

      {/* Summary */}
      {caseLaw.summary && (
        <p className="text-sm text-slate-700 line-clamp-4 mb-2">
          {caseLaw.summary}
        </p>
      )}

      {/* Failure type */}
      {caseLaw.failureType && (
        <p className="text-xs text-slate-500 mb-2">
          Failure type: {caseLaw.failureType}
        </p>
      )}

      {/* PDF link */}
      {caseLaw.pdfUrl && (
        <Link
          href={caseLaw.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-amber-700 hover:text-amber-900 underline underline-offset-2"
        >
          View determination
        </Link>
      )}
    </div>
  );
}

/**
 * Colour-coded outcome badge for case law callouts.
 * - Upheld: red (negative outcome)
 * - Partially Upheld: amber (mixed outcome)
 * - Dismissed: green (positive outcome)
 */
function OutcomeBadge({ outcome }: { outcome: string }) {
  const normalised = outcome.toLowerCase();

  let colorClasses: string;
  if (normalised.includes('upheld') && !normalised.includes('partially')) {
    colorClasses = 'bg-red-100 text-red-700';
  } else if (normalised.includes('partially')) {
    colorClasses = 'bg-amber-100 text-amber-700';
  } else if (normalised.includes('dismissed')) {
    colorClasses = 'bg-green-100 text-green-700';
  } else {
    colorClasses = 'bg-slate-100 text-slate-600';
  }

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${colorClasses}`}>
      {outcome}
    </span>
  );
}
