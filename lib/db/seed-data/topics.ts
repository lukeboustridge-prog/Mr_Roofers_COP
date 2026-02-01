/**
 * Topic Seed Data
 *
 * Defines semantic topics for unified navigation across MRM and RANZ sources.
 * Topics group related categories (e.g., all "flashings" categories from different sources).
 */

/**
 * Core topics for semantic grouping (DATA-02)
 * These provide unified navigation: "show all flashings from all sources"
 */
export const topics = [
  {
    id: 'flashings',
    name: 'Flashings',
    description: 'Ridge, valley, barge, apron, and other flashing details',
    sortOrder: 1,
  },
  {
    id: 'penetrations',
    name: 'Penetrations',
    description: 'Pipe, vent, and other roof penetration details',
    sortOrder: 2,
  },
  {
    id: 'junctions',
    name: 'Junctions',
    description: 'Wall, gutter, and other junction details',
    sortOrder: 3,
  },
  {
    id: 'ventilation',
    name: 'Ventilation',
    description: 'Roof space and underlay ventilation details',
    sortOrder: 4,
  },
  {
    id: 'drainage',
    name: 'Drainage',
    description: 'Gutter, downpipe, and roof drainage details',
    sortOrder: 5,
  },
  {
    id: 'cladding',
    name: 'Cladding',
    description: 'Roof cladding installation and fixing details',
    sortOrder: 6,
  },
] as const;

/**
 * Category-to-topic mappings
 * Maps existing categories from both MRM and RANZ sources to unified topics.
 *
 * Current categories in database:
 * - MRM: lrm-drainage, lrm-flashings, lrm-junctions, lrm-penetrations, lrm-ventilation
 * - RANZ: ranz-flashings, ranz-penetrations-corrugated, ranz-penetrations-rib,
 *         ranz-cladding-horizontal, ranz-cladding-vertical
 */
export const categoryTopicMappings = [
  // MRM Long-Run Metal categories
  { categoryId: 'lrm-flashings', topicId: 'flashings' },
  { categoryId: 'lrm-penetrations', topicId: 'penetrations' },
  { categoryId: 'lrm-junctions', topicId: 'junctions' },
  { categoryId: 'lrm-ventilation', topicId: 'ventilation' },
  { categoryId: 'lrm-drainage', topicId: 'drainage' },

  // RANZ categories
  { categoryId: 'ranz-flashings', topicId: 'flashings' },
  { categoryId: 'ranz-penetrations-corrugated', topicId: 'penetrations' },
  { categoryId: 'ranz-penetrations-rib', topicId: 'penetrations' },
  { categoryId: 'ranz-cladding-horizontal', topicId: 'cladding' },
  { categoryId: 'ranz-cladding-vertical', topicId: 'cladding' },
] as const;

/**
 * Core substrates (DATA-04 - substrate preservation)
 * All 6 substrate types that the COP supports.
 *
 * Note: Database already has these but with slightly different naming:
 * - long-run-metal (not profiled-metal)
 * - pressed-metal-tile (not pressed-metal)
 * - asphalt-shingle (not shingle)
 *
 * This list is for verification/reference, not for overwriting existing data.
 */
export const coreSubstrates = [
  { id: 'long-run-metal', name: 'Long-Run Metal', sortOrder: 1 },
  { id: 'pressed-metal-tile', name: 'Pressed Metal Tile', sortOrder: 2 },
  { id: 'concrete-tile', name: 'Concrete Tile', sortOrder: 3 },
  { id: 'clay-tile', name: 'Clay Tile', sortOrder: 4 },
  { id: 'membrane', name: 'Membrane', sortOrder: 5 },
  { id: 'asphalt-shingle', name: 'Asphalt Shingle', sortOrder: 6 },
] as const;

// Type exports for TypeScript inference
export type Topic = (typeof topics)[number];
export type CategoryTopicMapping = (typeof categoryTopicMappings)[number];
export type CoreSubstrate = (typeof coreSubstrates)[number];
