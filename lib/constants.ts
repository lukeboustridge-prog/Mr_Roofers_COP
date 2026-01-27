// Content sources (industry guides/COPs)
export const CONTENT_SOURCES = [
  {
    id: 'mrm-cop',
    name: 'MRM Code of Practice',
    shortName: 'MRM COP',
    description: 'Master Roofers Metallic Roofing Code of Practice',
  },
  {
    id: 'ranz-guide',
    name: 'RANZ Roofing Guide',
    shortName: 'RANZ',
    description: 'Roofing Association of New Zealand Roofing Guide',
  },
  {
    id: 'membrane-cop',
    name: 'Membrane Roofing COP',
    shortName: 'Membrane',
    description: 'Membrane Roofing Code of Practice',
  },
] as const;

export type ContentSourceId = (typeof CONTENT_SOURCES)[number]['id'];

// Detail relationship types (for cross-references)
export const RELATIONSHIP_TYPES = [
  { id: 'junction', name: 'Junction', description: 'Used together at a junction point' },
  { id: 'alternative', name: 'Alternative', description: 'Alternative approach to same situation' },
  { id: 'companion', name: 'Companion', description: 'Commonly used together' },
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number]['id'];

// Substrate types
export const SUBSTRATES = [
  { id: 'long-run-metal', name: 'Long-Run Metal', icon: 'metal' },
  { id: 'membrane', name: 'Membrane', icon: 'membrane' },
  { id: 'asphalt-shingle', name: 'Asphalt Shingle', icon: 'shingle' },
  { id: 'concrete-tile', name: 'Concrete Tile', icon: 'concrete' },
  { id: 'clay-tile', name: 'Clay Tile', icon: 'clay' },
  { id: 'pressed-metal-tile', name: 'Pressed Metal Tile', icon: 'pressed' },
] as const;

export type SubstrateId = (typeof SUBSTRATES)[number]['id'];

// Wind zones (NZS 3604)
export const WIND_ZONES = [
  { id: 'low', name: 'Low', description: 'Up to 32 m/s' },
  { id: 'medium', name: 'Medium', description: '32-37 m/s' },
  { id: 'high', name: 'High', description: '37-44 m/s' },
  { id: 'very-high', name: 'Very High', description: '44-50 m/s' },
  { id: 'extra-high', name: 'Extra High', description: 'Over 50 m/s' },
] as const;

export type WindZone = (typeof WIND_ZONES)[number]['id'];

// Corrosion zones (NZS 3604)
export const CORROSION_ZONES = [
  { id: 'a', name: 'Zone A', description: 'Benign (inland, low pollution)' },
  { id: 'b', name: 'Zone B', description: 'Mild (most urban areas)' },
  { id: 'c', name: 'Zone C', description: 'Marine (within 500m of coast)' },
  { id: 'd', name: 'Zone D', description: 'Severe marine (within 100m of breaking surf)' },
  { id: 'e', name: 'Zone E', description: 'Industrial (high pollution)' },
] as const;

export type CorrosionZone = (typeof CORROSION_ZONES)[number]['id'];

// Fixer mode tasks
export const FIXER_TASKS = [
  { id: 'flashings', name: 'Flashings', icon: 'flashings' },
  { id: 'ridges', name: 'Ridges & Hips', icon: 'ridges' },
  { id: 'valleys', name: 'Valleys', icon: 'valleys' },
  { id: 'penetrations', name: 'Penetrations', icon: 'penetrations' },
  { id: 'gutters', name: 'Gutters', icon: 'gutters' },
  { id: 'ventilation', name: 'Ventilation', icon: 'ventilation' },
  { id: 'other', name: 'Other', icon: 'other' },
] as const;

export type FixerTaskId = (typeof FIXER_TASKS)[number]['id'];

// Failure case outcomes
export const FAILURE_OUTCOMES = [
  { id: 'upheld', name: 'Upheld', color: 'red' },
  { id: 'partially-upheld', name: 'Partially Upheld', color: 'orange' },
  { id: 'dismissed', name: 'Dismissed', color: 'green' },
] as const;

export type FailureOutcome = (typeof FAILURE_OUTCOMES)[number]['id'];

// Warning severity levels
export const WARNING_SEVERITIES = [
  { id: 'info', name: 'Information', color: 'blue' },
  { id: 'warning', name: 'Warning', color: 'amber' },
  { id: 'critical', name: 'Critical', color: 'red' },
] as const;

export type WarningSeverity = (typeof WARNING_SEVERITIES)[number]['id'];

// NZBC Clauses commonly referenced
export const NZBC_CLAUSES = [
  { id: 'e2', name: 'E2 External Moisture', description: 'Protection from external moisture' },
  { id: 'e3', name: 'E3 Internal Moisture', description: 'Protection from internal moisture' },
  { id: 'b1', name: 'B1 Structure', description: 'Structural performance' },
  { id: 'b2', name: 'B2 Durability', description: 'Durability requirements' },
] as const;

// App navigation
export const NAV_ITEMS = {
  main: [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/planner', label: 'Planner', icon: 'clipboard' },
    { href: '/fixer', label: 'Fixer', icon: 'wrench' },
    { href: '/search', label: 'Search', icon: 'search' },
    { href: '/favourites', label: 'Favourites', icon: 'star' },
  ],
  secondary: [
    { href: '/failures', label: 'Failure Cases', icon: 'alert-triangle' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
  ],
} as const;

// Placeholder stats for dashboard
export const PLACEHOLDER_STATS = {
  totalDetails: 247,
  failureCases: 89,
  lastUpdated: '2024-01-15',
};
