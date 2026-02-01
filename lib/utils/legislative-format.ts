/**
 * NZBC citation formatting utilities
 * Formats legislative references according to NZ Building Code standards
 */

export interface LegislativeRef {
  code: string;       // 'E2/AS1'
  edition?: string;   // '4th'
  amendment?: string; // 'Amd 10'
  clause: string;     // 'Table 20'
  title?: string;
}

/**
 * Format a legislative reference as a proper NZBC citation
 * Examples:
 *   { code: 'E2/AS1', edition: '4th', clause: 'Table 20' }
 *   => "E2/AS1 (4th edition) Table 20"
 *
 *   { code: 'E2/AS1', amendment: 'Amd 10', clause: '8.4.8' }
 *   => "E2/AS1 (Amd 10) 8.4.8"
 */
export function formatNZBCCitation(ref: LegislativeRef): string {
  const parts: string[] = [ref.code];

  if (ref.edition) {
    parts.push(`(${ref.edition} edition)`);
  } else if (ref.amendment) {
    parts.push(`(${ref.amendment})`);
  }

  if (ref.clause) {
    parts.push(ref.clause);
  }

  return parts.join(' ');
}

/**
 * Format with title for full display
 * => "E2/AS1 (4th edition) Table 20 - Flashing dimensions"
 */
export function formatNZBCCitationWithTitle(ref: LegislativeRef): string {
  const citation = formatNZBCCitation(ref);
  if (ref.title) {
    return `${citation} - ${ref.title}`;
  }
  return citation;
}

/**
 * Infer authority level from code format
 * - Building Code: E2, B2 (clause only)
 * - Acceptable Solution: E2/AS1
 * - Verification Method: E2/VM1
 * - Determination: everything else
 */
export function inferAuthorityLevel(code: string): 'building_code' | 'acceptable_solution' | 'verification_method' | 'determination' {
  if (code.match(/^[A-Z]\d+$/)) return 'building_code';       // E2, B2
  if (code.includes('/AS')) return 'acceptable_solution';     // E2/AS1
  if (code.includes('/VM')) return 'verification_method';     // E2/VM1
  return 'determination';
}

/**
 * Parse a citation string into components
 * Handles: "E2/AS1 Table 20", "E2/AS1 (4th edition) Table 20"
 */
export function parseCitation(citation: string): Partial<LegislativeRef> {
  const parts: Partial<LegislativeRef> = {};

  // Match code (E2/AS1, B2, etc.)
  const codeMatch = citation.match(/^([A-Z]\d+(?:\/[AV][SM]\d+)?)/);
  if (codeMatch) {
    parts.code = codeMatch[1];
  }

  // Match edition in parentheses
  const editionMatch = citation.match(/\((\d+(?:st|nd|rd|th)) edition\)/i);
  if (editionMatch) {
    parts.edition = editionMatch[1];
  }

  // Match amendment in parentheses
  const amdMatch = citation.match(/\(Amd(?:endment)?\s*(\d+)\)/i);
  if (amdMatch) {
    parts.amendment = `Amd ${amdMatch[1]}`;
  }

  // Remaining text is clause/table reference
  const clauseMatch = citation.match(/(Table|Clause|Section|Figure)\s+[\d.]+/i);
  if (clauseMatch) {
    parts.clause = clauseMatch[0];
  }

  return parts;
}
