// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  preferences: UserPreferences | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  windZone: string | null;
  corrosionZone: string | null;
  defaultSubstrate: string | null;
}

// Substrate types
export interface Substrate {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
}

// Category types
export interface Category {
  id: string;
  substrateId: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  sortOrder: number;
}

// Detail types
export interface Detail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  substrateId: string;
  categoryId: string;
  subcategoryId: string | null;
  modelUrl: string | null;
  thumbnailUrl: string | null;
  minPitch: number | null;       // Minimum roof pitch (degrees)
  maxPitch: number | null;       // Maximum roof pitch (degrees)
  specifications: Record<string, unknown> | null;
  standardsRefs: StandardRef[] | null;
  ventilationReqs: VentilationRequirement[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StandardRef {
  code: string;      // e.g., 'E2/AS1'
  clause: string;    // e.g., 'Table 20'
  title: string;     // Description of the reference
}

export interface VentilationRequirement {
  type: string;
  requirement: string;
  notes?: string;
}

export interface DetailStep {
  id: string;
  detailId: string;
  stepNumber: number;
  instruction: string;
  imageUrl: string | null;
  cautionNote: string | null;
}

// Warning types
export interface WarningCondition {
  id: string;
  detailId: string;
  conditionType: 'wind_zone' | 'corrosion_zone' | 'pitch' | 'exposure' | 'other';
  conditionValue: string;
  warningText: string;
  severity: 'info' | 'warning' | 'critical';
}

// Failure case types
export interface FailureCase {
  id: string;
  caseId: string;
  substrateTags: string[] | null;
  detailTags: string[] | null;
  failureType: string | null;
  nzbcClauses: string[] | null;
  outcome: 'upheld' | 'partially-upheld' | 'dismissed' | null;
  summary: string | null;
  sourceUrl: string | null;
  decisionDate: Date | null;
  createdAt: Date;
}

// Checklist types
export interface Checklist {
  id: string;
  userId: string;
  detailId: string;
  projectRef: string | null;
  items: ChecklistItem[] | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChecklistItem {
  item: string;
  completed: boolean;
  note: string | null;
  photoUrl: string | null;
}

// Favourite types
export interface UserFavourite {
  userId: string;
  detailId: string;
  createdAt: Date;
}

// History types
export interface UserHistory {
  id: string;
  userId: string;
  detailId: string;
  viewedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Search types
export interface SearchResult {
  details: Detail[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Fixer mode types
export type FixerTask =
  | 'flashings'
  | 'ridges'
  | 'valleys'
  | 'penetrations'
  | 'gutters'
  | 'ventilation'
  | 'other';

export interface FixerContext {
  substrate: string | null;
  task: FixerTask | null;
}
