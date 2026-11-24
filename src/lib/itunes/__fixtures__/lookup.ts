import sample from './lookup.sample.json';

/**
 * Real Lookup responses captured 2026-11-24, trimmed:
 * - `album`: Grateful by The Red Clay Strays (id 1893402542), first 3 songs.
 * - `compilation`: The Hunger Games soundtrack (id 6814870921), first 2 songs,
 *   with per-track artists and no artistViewUrl on the collection.
 */
export const lookupSample = sample;
export const ALBUM_ID = '1893402542';
export const COMPILATION_ID = '6814870921';

type Row = Record<string, unknown>;

/** Deep copy of a fixture response, to mutate per test. */
export function lookupResponse(which: 'album' | 'compilation' = 'album'): { resultCount: number; results: Row[] } {
  return JSON.parse(JSON.stringify(sample[which])) as { resultCount: number; results: Row[] };
}
