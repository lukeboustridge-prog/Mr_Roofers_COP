/**
 * Encyclopedia type definitions
 * Supports substrate-aware content architecture for the COP encyclopedia
 */

/** Substrate identifier — matches database substrate IDs */
export type SubstrateId =
  | 'profiled-metal'
  | 'pressed-metal'
  | 'concrete-tile'
  | 'clay-tile'
  | 'membrane'
  | 'shingle';

/** Configuration for a substrate within the encyclopedia */
export interface SubstrateConfig {
  id: SubstrateId;
  name: string;
  shortName: string;
  description: string;
  /** COP source identifier (matches content_sources.id) */
  copSourceId: string;
  /** Which COP chapters apply to this substrate (all 19 for metal) */
  chapters: number[];
  /** Whether content is populated and ready */
  isPopulated: boolean;
}

/** Article metadata for an encyclopedia page */
export interface EncyclopediaArticle {
  chapterNumber: number;
  title: string;
  version: string;
  sectionCount: number;
  substrate: SubstrateId;
  /** ISO date of COP edition (for citation) */
  editionDate: string;
  /** Source identifier for authority attribution */
  sourceId: string;
}

/** HTG guide content block for inline "Practical Guidance" rendering */
export interface HtgGuidanceBlock {
  id: string;
  guideName: string;
  sourceDocument: string;
  content: string | null;
  pdfPage: number | null;
  relevance: string | null;
}

/** Failure case for inline case law callout rendering */
export interface InlineCaseLaw {
  id: string;
  caseId: string;
  caseType: string;
  summary: string | null;
  outcome: string | null;
  pdfUrl: string | null;
  failureType: string | null;
}

/** Composed supplementary content for a single COP section */
export interface ComposedSupplementary {
  details: import('@/types/cop').SupplementaryDetail[];
  htgGuides: import('@/types/cop').SupplementaryHtg[];
  htgContent: HtgGuidanceBlock[];
  caseLaw: InlineCaseLaw[];
}
