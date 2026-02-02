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
  images: jsonb('images').$type<string[]>(), // R2 keys for technical images
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

// Case Law (from MBIE Determinations and LBP decisions)
export const failureCases = pgTable('failure_cases', {
  id: text('id').primaryKey(),
  caseId: text('case_id').notNull().unique(),      // e.g., '2024-035' or 'barton-2022-cb25980'
  caseType: text('case_type').notNull().default('determination'), // 'determination' | 'lbp-complaint'
  substrateTags: jsonb('substrate_tags'),
  detailTags: jsonb('detail_tags'),
  failureType: text('failure_type'),               // 'water-ingress', 'structural', etc.
  nzbcClauses: jsonb('nzbc_clauses'),
  outcome: text('outcome'),                        // 'upheld', 'partially-upheld', 'dismissed'
  summary: text('summary'),                        // Executive summary
  pdfUrl: text('pdf_url'),                         // Local PDF path, e.g., '/determinations/2024-035.pdf'
  sourceUrl: text('source_url'),                   // Original MBIE source URL (deprecated, kept for legacy)
  decisionDate: timestamp('decision_date'),
  sourceId: text('source_id').references(() => contentSources.id), // null = can span sources
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  failureTypeIdx: index('idx_failure_cases_type').on(table.failureType),
  outcomeIdx: index('idx_failure_cases_outcome').on(table.outcome),
  caseTypeIdx: index('idx_failure_cases_case_type').on(table.caseType),
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

// ============================================
// TOPICS (semantic grouping for unified navigation) - DATA-02
// ============================================
export const topics = pgTable('topics', {
  id: text('id').primaryKey(),              // e.g., 'flashings', 'penetrations'
  name: text('name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  sortOrder: integer('sort_order').default(0),
});

// ============================================
// CATEGORY-TOPICS (maps categories to topics for unified view)
// ============================================
export const categoryTopics = pgTable('category_topics', {
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  topicId: text('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.categoryId, table.topicId] }),
}));

// ============================================
// DETAIL LINKS (authority hierarchy for cross-source linking) - DATA-01
// Primary = MRM authoritative detail, Supplementary = RANZ supporting content
// ============================================
export const detailLinks = pgTable('detail_links', {
  id: text('id').primaryKey(),
  primaryDetailId: text('primary_detail_id').references(() => details.id, { onDelete: 'cascade' }).notNull(),
  supplementaryDetailId: text('supplementary_detail_id').references(() => details.id, { onDelete: 'cascade' }).notNull(),
  linkType: text('link_type').notNull(),    // 'installation_guide', 'technical_supplement', 'alternative'
  matchConfidence: text('match_confidence'), // 'exact', 'partial', 'related'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  primaryIdx: index('idx_detail_links_primary').on(table.primaryDetailId),
  supplementaryIdx: index('idx_detail_links_supplementary').on(table.supplementaryDetailId),
}));

// ============================================
// LEGISLATIVE REFERENCES (normalized NZBC citations) - DATA-03
// ============================================
export const legislativeReferences = pgTable('legislative_references', {
  id: text('id').primaryKey(),              // e.g., 'e2-as1-table20'
  code: text('code').notNull(),              // e.g., 'E2/AS1'
  edition: text('edition'),                  // e.g., '4th'
  amendment: text('amendment'),              // e.g., 'Amd 10'
  clause: text('clause').notNull(),          // e.g., 'Table 20'
  title: text('title').notNull(),
  authorityLevel: text('authority_level').notNull(), // 'building_code', 'acceptable_solution', 'verification_method'
  sourceUrl: text('source_url'),
  effectiveDate: timestamp('effective_date'),
  supersededBy: text('superseded_by'), // FK constraint added in migration (self-ref causes TS circular issue)
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  codeIdx: index('idx_leg_refs_code').on(table.code),
}));

// ============================================
// DETAIL-LEGISLATIVE LINKS (maps details to legislative references)
// ============================================
export const detailLegislativeLinks = pgTable('detail_legislative_links', {
  detailId: text('detail_id').references(() => details.id, { onDelete: 'cascade' }).notNull(),
  legislativeRefId: text('legislative_ref_id').references(() => legislativeReferences.id, { onDelete: 'cascade' }).notNull(),
  context: text('context'),                  // 'compliance', 'guidance', 'exception'
}, (table) => ({
  pk: primaryKey({ columns: [table.detailId, table.legislativeRefId] }),
}));
