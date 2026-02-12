import type { SubstrateConfig, SubstrateId } from '@/types/encyclopedia';

/**
 * Substrate configurations for the encyclopedia
 *
 * Metal roofing is the first and only populated substrate.
 * Future substrates will be added here as content is ingested.
 */
const SUBSTRATE_CONFIGS: Record<SubstrateId, SubstrateConfig> = {
  'profiled-metal': {
    id: 'profiled-metal',
    name: 'Profiled Metal Roofing',
    shortName: 'Metal',
    description: 'NZ Metal Roof and Wall Cladding Code of Practice',
    copSourceId: 'mrm-cop',
    chapters: Array.from({ length: 19 }, (_, i) => i + 1),
    isPopulated: true,
  },
  'pressed-metal': {
    id: 'pressed-metal',
    name: 'Pressed Metal Tiles',
    shortName: 'Pressed Metal',
    description: 'Pressed metal tile roofing systems',
    copSourceId: 'mrm-cop',
    chapters: [],
    isPopulated: false,
  },
  'concrete-tile': {
    id: 'concrete-tile',
    name: 'Concrete Tile Roofing',
    shortName: 'Concrete Tile',
    description: 'Concrete roof tile systems',
    copSourceId: '',
    chapters: [],
    isPopulated: false,
  },
  'clay-tile': {
    id: 'clay-tile',
    name: 'Clay Tile Roofing',
    shortName: 'Clay Tile',
    description: 'Clay roof tile systems',
    copSourceId: '',
    chapters: [],
    isPopulated: false,
  },
  'membrane': {
    id: 'membrane',
    name: 'Membrane Roofing',
    shortName: 'Membrane',
    description: 'Membrane roofing systems',
    copSourceId: '',
    chapters: [],
    isPopulated: false,
  },
  'shingle': {
    id: 'shingle',
    name: 'Shingle Roofing',
    shortName: 'Shingle',
    description: 'Asphalt and composite shingle systems',
    copSourceId: '',
    chapters: [],
    isPopulated: false,
  },
};

/** Default substrate when none specified */
export const DEFAULT_SUBSTRATE: SubstrateId = 'profiled-metal';

/** Get config for a specific substrate */
export function getSubstrateConfig(id: SubstrateId): SubstrateConfig {
  return SUBSTRATE_CONFIGS[id];
}

/** Get all substrate configs */
export function getAllSubstrates(): SubstrateConfig[] {
  return Object.values(SUBSTRATE_CONFIGS);
}

/** Get only populated substrates (ready for display) */
export function getPopulatedSubstrates(): SubstrateConfig[] {
  return Object.values(SUBSTRATE_CONFIGS).filter(s => s.isPopulated);
}

/** Validate a string is a valid substrate ID */
export function isValidSubstrate(id: string): id is SubstrateId {
  return id in SUBSTRATE_CONFIGS;
}
