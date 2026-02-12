import { SourceBadge } from '@/components/authority';
import type { HtgGuidanceBlock } from '@/types/encyclopedia';
import { normalizeContent } from '@/lib/encyclopedia/normalize-content';

interface PracticalGuidanceBlockProps {
  guidance: HtgGuidanceBlock;
}

/**
 * Renders HTG content as an inline "Practical Guidance" block within the article flow.
 *
 * Visual hierarchy: emerald accent (border-emerald-400, bg-emerald-50/50) marks this
 * as RANZ HTG supplementary content, visually distinct from authoritative MRM COP prose.
 *
 * Shows:
 * - "Practical Guidance" label with RANZ HTG source badge
 * - Guide name as heading
 * - Full text content with normalized paragraphs
 * - Source document and page reference
 */
export function PracticalGuidanceBlock({ guidance }: PracticalGuidanceBlockProps) {
  return (
    <div className="rounded-lg border-l-4 border-emerald-400 bg-emerald-50/50 p-4 mt-4 mb-2">
      {/* Top bar: label + source badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">
          Practical Guidance
        </span>
        <SourceBadge
          shortName="RANZ HTG"
          name="RANZ How To Guide"
          authority="supplementary"
          size="sm"
        />
      </div>

      {/* Guide name */}
      <h4 className="text-sm font-semibold text-slate-900 mb-2">
        {guidance.guideName}
      </h4>

      {/* Content or fallback */}
      {guidance.content ? (
        <div className="text-sm text-slate-700 leading-relaxed space-y-3">
          {normalizeContent(guidance.content).map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 italic">
          See source document: {guidance.sourceDocument}
          {guidance.pdfPage != null && `, p.${guidance.pdfPage}`}
        </p>
      )}

      {/* Source reference */}
      {guidance.sourceDocument && (
        <p className="text-xs text-slate-400 mt-3">
          Source: {guidance.sourceDocument}
          {guidance.pdfPage != null && `, p.${guidance.pdfPage}`}
        </p>
      )}
    </div>
  );
}
