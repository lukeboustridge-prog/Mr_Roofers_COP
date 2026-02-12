import Link from 'next/link';
import type { ReferenceMap } from '@/types/encyclopedia';
import { crossLinkContent } from '@/lib/encyclopedia/cross-link-engine';

interface CrossLinkedTextProps {
  content: string;
  referenceMap: ReferenceMap;
}

/**
 * Server Component that renders COP text with cross-linked section references.
 *
 * Calls crossLinkContent() to detect section references (e.g., "See 8.5.4",
 * "Section 3.7") and renders them as Next.js Link elements for client-side
 * navigation. Non-reference text renders as spans preserving whitespace.
 *
 * Link density is controlled upstream by the CrossLinkEngine:
 * - Max 5 links per paragraph
 * - First-mention-only (each section number linked once)
 * - Unresolvable references remain as plain text
 */
export function CrossLinkedText({ content, referenceMap }: CrossLinkedTextProps) {
  const segments = crossLinkContent(content, referenceMap);

  return (
    <div className="whitespace-pre-line text-slate-700 leading-relaxed">
      {segments.map((segment, idx) => {
        if (segment.type === 'link') {
          return (
            <Link
              key={`link-${idx}`}
              href={segment.href}
              className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 transition-colors"
              title={`Go to Section ${segment.sectionNumber}`}
            >
              {segment.content}
            </Link>
          );
        }

        return (
          <span key={`text-${idx}`}>
            {segment.content}
          </span>
        );
      })}
    </div>
  );
}
