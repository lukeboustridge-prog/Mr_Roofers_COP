import { pgTable, text, timestamp, integer, jsonb, index, primaryKey } from 'drizzle-orm/pg-core';

// ============================================
// CONTENT SOURCES (MRM COP, RANZ Guide, etc.)
// ============================================
export const contentSources = pgTable('content_sources', {
  id: text('id').primaryKey(),              // e.g., 'mrm-cop', 'ranz-guide'
  name: text('name').notNull(),              // e.g., 'MRM Code of Practice'
  shortName: text('short_name').notNull(),   // e.g., 'MRM COP'
  description: text('description'),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Users (synced from Clerk)
export const users = pgTable('users', {
  id: text('id').primaryKey(),              // Clerk user ID
  email: text('email').notNull(),
  name: text('name'),
  imageUrl: text('image_url'),
  preferences: jsonb('preferences'),         // {windZone, corrosionZone, defaultSubstrate}
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Substrates (6 types)
export const substrates = pgTable('substrates', {
  id: text('id').primaryKey(),               // e.g., 'profiled-metal'
  name: text('name').notNull(),              // e.g., 'Profiled Metal'
  description: text('description'),
  iconUrl: text('icon_url'),
  sortOrder: integer('sort_order').default(0),
  sourceId: text('source_id').references(() => contentSources.id), // null = universal
});

// Categories within substrates
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  substrateId: text('substrate_id').references(() => substrates.id),
  name: text('name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  sortOrder: integer('sort_order').default(0),
  sourceId: text('source_id').references(() => contentSources.id), // null = universal
});

// Subcategories (optional grouping)
export const subcategories = pgTable('subcategories', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').references(() => categories.id),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0),
});

// Details (the core COP entries)
export const details = pgTable('details', {
  id: text('id').primaryKey(),               // e.g., 'F07'
  code: text('code').notNull().unique(),     // Display code
  name: text('name').notNull(),
  description: text('description'),
  substrateId: text('substrate_id').references(() => substrates.id),
  categoryId: text('category_id').references(() => categories.id),
  subcategoryId: text('subcategory_id').references(() => subcategories.id),
  sourceId: text('source_id').references(() => contentSources.id), // Content source
  modelUrl: text('model_url'),               // 3D model path
  thumbnailUrl: text('thumbnail_url'),
  minPitch: integer('min_pitch'),            // Minimum roof pitch (degrees)
  maxPitch: integer('max_pitch'),            // Maximum roof pitch (degrees)
  specifications: jsonb('specifications'),    // Technical specs
  standardsRefs: jsonb('standards_refs'),     // [{standard, clause, description}]
  ventilationReqs: jsonb('ventilation_reqs'), // Ventilation requirements
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  substrateIdx: index('idx_details_substrate').on(table.substrateId),
  categoryIdx: index('idx_details_category').on(table.categoryId),
  sourceIdx: index('idx_details_source').on(table.sourceId),
}));

// Detail Steps (installation instructions)
export const detailSteps = pgTable('detail_steps', {
  id: text('id').primaryKey(),
  detailId: text('detail_id').references(() => details.id),
  stepNumber: integer('step_number').notNull(),
  instruction: text('instruction').notNull(),
  imageUrl: text('image_url'),
  cautionNote: text('caution_note'),
}, (table) => ({
  detailIdx: index('idx_detail_steps_detail').on(table.detailId),
}));

// Warning Conditions
export const warningConditions = pgTable('warning_conditions', {
  id: text('id').primaryKey(),
  detailId: text('detail_id').references(() => details.id),
  conditionType: text('condition_type').notNull(), // 'wind_zone', 'corrosion_zone', 'pitch', etc.
  conditionValue: text('condition_value').notNull(),
  warningText: text('warning_text').notNull(),
  severity: text('severity').default('warning'),   // 'info', 'warning', 'critical'
  nzbcRef: text('nzbc_ref'),                       // Reference to NZBC clause
}, (table) => ({
  detailIdx: index('idx_warning_conditions_detail').on(table.detailId),
}));

// Failure Cases (from MBIE/LBP decisions)
export const failureCases = pgTable('failure_cases', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().unique(),      // e.g., 'MBIE-2024/042'
  substrateTags: jsonb('substrate_tags'),
  detailTags: jsonb('detail_tags'),
  failureType: text('failure_type'),               // 'water-ingress', 'structural', etc.
  nzbcClauses: jsonb('nzbc_clauses'),
  outcome: text('outcome'),                        // 'upheld', 'partially-upheld', 'dismissed'
  summary: text('summary'),
  sourceUrl: text('source_url'),
  decisionDate: timestamp('decision_date'),
  sourceId: text('source_id').references(() => contentSources.id), // null = can span sources
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  failureTypeIdx: index('idx_failure_cases_type').on(table.failureType),
  outcomeIdx: index('idx_failure_cases_outcome').on(table.outcome),
}));

// Detail-Failure Links
export const detailFailureLinks = pgTable('detail_failure_links', {
  detailId: text('detail_id').references(() => details.id).notNull(),
  failureCaseId: text('failure_case_id').references(() => failureCases.id).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.detailId, table.failureCaseId] }),
}));

// User Favourites
export const userFavourites = pgTable('user_favourites', {
  userId: text('user_id').references(() => users.id).notNull(),
  detailId: text('detail_id').references(() => details.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.detailId] }),
}));

// User History
export const userHistory = pgTable('user_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  detailId: text('detail_id').references(() => details.id),
  viewedAt: timestamp('viewed_at').defaultNow(),
}, (table) => ({
  userIdx: index('idx_history_user').on(table.userId),
}));

// Checklists
export const checklists = pgTable('checklists', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  detailId: text('detail_id').references(() => details.id),
  projectRef: text('project_ref'),
  items: jsonb('items'),                           // [{item, completed, note, photoUrl}]
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdx: index('idx_checklists_user').on(table.userId),
}));

// ============================================
// DETAIL CROSS-REFERENCES (links between details)
// ============================================
export const detailCrossReferences = pgTable('detail_cross_references', {
  detailId: text('detail_id').references(() => details.id).notNull(),
  relatedDetailId: text('related_detail_id').references(() => details.id).notNull(),
  relationshipType: text('relationship_type').notNull(), // 'junction', 'alternative', 'companion'
  notes: text('notes'),
}, (table) => ({
  pk: primaryKey({ columns: [table.detailId, table.relatedDetailId] }),
}));
