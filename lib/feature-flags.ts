/**
 * Feature flag utilities.
 * Uses NEXT_PUBLIC_ prefix so flags work on both server and client.
 */

export function isEncyclopediaEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENCYCLOPEDIA_ENABLED === 'true';
}
