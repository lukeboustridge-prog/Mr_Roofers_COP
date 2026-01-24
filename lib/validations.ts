import { z } from 'zod';

// Common schemas
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const idSchema = z.string().min(1, 'ID is required');

// Favourites
export const addFavouriteSchema = z.object({
  detailId: z.string().min(1, 'Detail ID is required'),
});

// History
export const addHistorySchema = z.object({
  detailId: z.string().min(1, 'Detail ID is required'),
});

// Details query params
export const detailsQuerySchema = z.object({
  substrate: z.string().optional(),
  category: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Search query params
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  substrate: z.string().optional(),
  category: z.string().optional(),
  hasWarnings: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  hasFailures: z.enum(['true', 'false']).optional().transform(v => v === 'true'),
  type: z.enum(['details', 'failures', 'all', 'code']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Fixer query params
export const fixerQuerySchema = z.object({
  substrate: z.string().min(1, 'Substrate is required'),
  task: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// Failures query params
export const failuresQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  outcome: z.enum(['upheld', 'partially-upheld', 'dismissed']).optional(),
  type: z.string().optional(),
  substrate: z.string().optional(),
});

// Categories query params
export const categoriesQuerySchema = z.object({
  substrateId: z.string().optional(),
});

// History query params
export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// Upload validation
export const uploadFolderSchema = z.enum(['checklists', 'models', 'thumbnails']).default('checklists');

// Create detail schema (admin)
export const createDetailSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  substrateId: z.string().min(1, 'Substrate ID is required'),
  categoryId: z.string().min(1, 'Category ID is required'),
  subcategoryId: z.string().optional().nullable(),
  modelUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  minPitch: z.number().int().min(0).max(90).optional().nullable(),
  maxPitch: z.number().int().min(0).max(90).optional().nullable(),
  specifications: z.record(z.string(), z.string()).optional().nullable(),
  standardsRefs: z.array(z.object({
    code: z.string(),
    clause: z.string(),
    title: z.string(),
  })).optional().nullable(),
  ventilationReqs: z.array(z.object({
    check: z.string(),
    required: z.boolean(),
  })).optional().nullable(),
});

// Substrate ID validation (for offline route)
export const substrateIdSchema = z.string().min(1, 'Substrate ID is required');

// Helper to parse search params into an object
export function parseSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// Helper to validate and return typed result or error response
export function validateQuery<T extends z.ZodType>(
  schema: T,
  params: Record<string, string>
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(params);
  if (!result.success) {
    const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, error: errors };
  }
  return { success: true, data: result.data };
}

// Helper to validate request body
export async function validateBody<T extends z.ZodType>(
  schema: T,
  request: Request
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: errors };
    }
    return { success: true, data: result.data };
  } catch {
    return { success: false, error: 'Invalid JSON body' };
  }
}
