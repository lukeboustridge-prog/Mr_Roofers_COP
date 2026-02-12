/**
 * Normalize COP content text extracted from PDFs.
 *
 * PDF extraction inserts \n at column-width line wraps, creating
 * irregular line breaks mid-sentence. This normalizer:
 * - Splits on double newlines (\n\n) to identify real paragraphs
 * - Joins single newlines within paragraphs back into flowing prose
 * - Collapses whitespace runs
 */
export function normalizeContent(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map(p => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 0);
}
