import Link from 'next/link';
import type { ReferenceMap } from '@/types/encyclopedia';
import { crossLinkContent } from '@/lib/encyclopedia/cross-link-engine';
import { normalizeContent } from '@/lib/encyclopedia/normalize-content';

interface CrossLinkedTextProps {
  content: string;
  referenceMap: ReferenceMap;
}

/**
 * Server Component that renders COP text with cross-linked section references.
 *
 * Normalizes PDF-extracted content (joining line wraps, preserving paragraphs),
 * then calls crossLinkContent() per paragraph to detect section references
 * (e.g., "See 8.5.4", "Section 3.7") and renders them as Next.js Link elements.
 *
 * Link density is controlled upstream by the CrossLinkEngine:
 * - Max 5 links per paragraph
 * - First-mention-only (each section number linked once)
 * - Unresolvable references remain as plain text
 */
export function CrossLinkedText({ content, referenceMap }: CrossLinkedTextProps) {
  const paragraphs = normalizeContent(content);

  return (
    <div className="text-slate-700 leading-relaxed space-y-4">
      {paragraphs.map((paragraph, pIdx) => {
        const segments = crossLinkContent(paragraph, referenceMap);

        return (
          <p key={pIdx}>
            {segments.map((segment, idx) => {
              if (segment.type === 'link') {
                return (
                  <Link
                    key={`link-${pIdx}-${idx}`}
                    href={segment.href}
                    className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 transition-colors"
                    title={`Go to Section ${segment.sectionNumber}`}
                  >
                    {segment.content}
                  </Link>
                );
              }

              return (
                <span key={`text-${pIdx}-${idx}`}>
                  {segment.content}
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}
