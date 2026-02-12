import type { ReferenceMap } from '@/types/encyclopedia';
import type { CrossLinkSegment } from '@/types/encyclopedia';

/**
 * CrossLinkEngine — Transforms COP plain text into cross-linked segments.
 *
 * Detects section references like "See 8.5.4", "refer to Section 3.7",
 * "Section 12.3.2", "as specified in 5.1A" in plain text and resolves them
 * to clickable encyclopedia URLs using the ReferenceMap.
 *
 * Controls:
 * - Max 5 links per paragraph (link budget)
 * - First-mention-only: each section number linked only on first occurrence
 * - Unresolvable references left as plain text
 *
 * Pure function — no side effects, no I/O. Takes ReferenceMap as parameter
 * so it can be used server-side during rendering.
 */

/** Maximum number of links allowed per paragraph */
const MAX_LINKS_PER_PARAGRAPH = 5;

/**
 * Combined regex matching all COP section reference formats.
 *
 * Patterns (in priority order):
 * 1. "See X.Y.Z" / "see X.Y.Z" (case-insensitive)
 * 2. "refer to [Section] X.Y.Z" / "Refer to [Section] X.Y.Z"
 * 3. "as specified in X.Y.Z" / "as described in X.Y.Z"
 * 4. "Section X.Y.Z" (standalone)
 * 5. Bare section number at word boundary: "X.Y.Z" where X.Y is at minimum
 *
 * Each pattern captures the full match text and the section number within it.
 * The section number is always the numeric-dot-letter portion (e.g., "8.5.4A").
 */
const SECTION_REF_PATTERN =
  /(?:(?:[Ss][Ee]{2})\s+(\d+(?:\.\d+)+[A-Z]?))|(?:(?:[Rr]efer\s+to)\s+(?:[Ss]ection\s+)?(\d+(?:\.\d+)+[A-Z]?))|(?:(?:[Aa]s\s+(?:specified|described)\s+in)\s+(\d+(?:\.\d+)+[A-Z]?))|(?:[Ss]ection\s+(\d+(?:\.\d+)+[A-Z]?))|(?:(?<=^|\s)(\d+\.\d+(?:\.\d+)*[A-Z]?)(?=\s))/g;

/**
 * Extracts the section number from a regex match.
 * The section number is in whichever capture group matched.
 */
function extractSectionNumber(match: RegExpExecArray): string | null {
  // Groups 1-5 correspond to the five alternation patterns
  for (let i = 1; i <= 5; i++) {
    if (match[i]) return match[i];
  }
  return null;
}

/**
 * Processes a single paragraph of text, producing CrossLinkSegment[].
 *
 * @param text - Paragraph text (no double-newlines within)
 * @param referenceMap - Map of section numbers to URLs
 * @param linkedSections - Set tracking already-linked section numbers (mutated)
 * @returns Array of text and link segments
 */
function processParagraph(
  text: string,
  referenceMap: ReferenceMap,
  linkedSections: Set<string>
): CrossLinkSegment[] {
  const segments: CrossLinkSegment[] = [];
  let linkCount = 0;
  let lastIndex = 0;

  // Reset regex state for this paragraph
  SECTION_REF_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = SECTION_REF_PATTERN.exec(text)) !== null) {
    const sectionNumber = extractSectionNumber(match);
    if (!sectionNumber) continue;

    const matchStart = match.index;
    const matchEnd = matchStart + match[0].length;
    const href = referenceMap.get(sectionNumber) ?? null;

    // Determine if this match should become a link
    const shouldLink =
      href !== null &&
      !linkedSections.has(sectionNumber) &&
      linkCount < MAX_LINKS_PER_PARAGRAPH;

    if (shouldLink) {
      // Add preceding text as a text segment
      if (matchStart > lastIndex) {
        segments.push({ type: 'text', content: text.slice(lastIndex, matchStart) });
      }

      // Add the link segment
      segments.push({
        type: 'link',
        content: match[0],
        href: href!,
        sectionNumber,
      });

      linkedSections.add(sectionNumber);
      linkCount++;
      lastIndex = matchEnd;
    }
    // If not linking, we skip — the text will be included in the next text segment
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  // If no segments were created, return the full text as a single segment
  if (segments.length === 0) {
    segments.push({ type: 'text', content: text });
  }

  return segments;
}

/**
 * Merges adjacent text segments for efficiency.
 */
function mergeAdjacentText(segments: CrossLinkSegment[]): CrossLinkSegment[] {
  const merged: CrossLinkSegment[] = [];

  for (const segment of segments) {
    const last = merged[merged.length - 1];
    if (last && last.type === 'text' && segment.type === 'text') {
      last.content += segment.content;
    } else {
      merged.push({ ...segment });
    }
  }

  return merged;
}

/**
 * Transforms COP plain text content into an array of cross-linked segments.
 *
 * Splits text by paragraph boundaries (\n\n), processes each paragraph
 * independently with its own link budget (max 5), and merges results.
 * The first-mention Set persists across paragraphs.
 *
 * @param text - Plain text COP content (may contain \n\n paragraph breaks)
 * @param referenceMap - Map of section numbers to encyclopedia URLs
 * @returns Array of text and link segments for React rendering
 */
export function crossLinkContent(
  text: string,
  referenceMap: ReferenceMap
): CrossLinkSegment[] {
  if (!text || referenceMap.size === 0) {
    return [{ type: 'text', content: text || '' }];
  }

  // Split by paragraph boundaries
  const paragraphs = text.split('\n\n');

  // Track first-mention across all paragraphs
  const linkedSections = new Set<string>();

  const allSegments: CrossLinkSegment[] = [];

  for (let i = 0; i < paragraphs.length; i++) {
    // Add paragraph separator between paragraphs
    if (i > 0) {
      allSegments.push({ type: 'text', content: '\n\n' });
    }

    const paragraphSegments = processParagraph(
      paragraphs[i],
      referenceMap,
      linkedSections
    );

    allSegments.push(...paragraphSegments);
  }

  return mergeAdjacentText(allSegments);
}
