import * as fs from 'fs';
import * as path from 'path';
import type { DetailStageMetadata } from '@/components/details/Model3DViewer';

// Cache the metadata in memory (server-side only)
let cachedMetadata: Record<string, DetailStageMetadata> | null = null;

/**
 * Get stage metadata for a detail (server-side only)
 * Returns null if no metadata exists for the detail
 */
export function getStageMetadata(detailId: string): DetailStageMetadata | null {
  if (!cachedMetadata) {
    try {
      const metadataPath = path.join(process.cwd(), 'ranz_extract', 'stage_metadata.json');
      if (fs.existsSync(metadataPath)) {
        const rawData = fs.readFileSync(metadataPath, 'utf-8');
        cachedMetadata = JSON.parse(rawData);
      } else {
        cachedMetadata = {};
      }
    } catch (error) {
      console.error('Failed to load stage metadata:', error);
      cachedMetadata = {};
    }
  }

  return cachedMetadata?.[detailId] || null;
}

/**
 * Check if a detail has stage metadata (for 3D sync)
 */
export function hasStageMetadata(detailId: string): boolean {
  const metadata = getStageMetadata(detailId);
  return metadata !== null && metadata.stages && metadata.stages.length > 0;
}

/**
 * Get stage metadata for a detail, falling through to linked guides if needed
 * Used for MRM details that borrow RANZ 3D models - enables 3D step sync
 *
 * @param detailId - The detail ID to get metadata for
 * @param supplements - Array of linked guide supplements (from getDetailWithLinks)
 * @returns Stage metadata from detail or first linked guide with metadata, or null
 */
export function getStageMetadataForLinkedGuide(
  detailId: string,
  supplements?: Array<{ id: string; modelUrl: string | null }>
): DetailStageMetadata | null {
  // First try the detail's own metadata (RANZ detail viewing own page)
  const ownMetadata = getStageMetadata(detailId);
  if (ownMetadata) {
    return ownMetadata;
  }

  // If no own metadata and supplements provided, check linked guides
  if (supplements && supplements.length > 0) {
    for (const supplement of supplements) {
      const linkedMetadata = getStageMetadata(supplement.id);
      if (linkedMetadata) {
        return linkedMetadata;
      }
    }
  }

  return null;
}
