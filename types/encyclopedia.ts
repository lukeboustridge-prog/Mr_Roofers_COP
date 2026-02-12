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
