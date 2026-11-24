import { z } from 'zod';
import type { Album } from '@/types/album';
import type { FavoriteEntry } from './favoritesSlice';

export const FAVORITES_STORAGE_KEY = 'wm-favorites';

/** Bump when the stored shape changes; older payloads are then ignored. */
export const FAVORITES_STORAGE_VERSION = 1;

/**
 * localStorage is user-controlled and outlives deploys, so everything read
 * back is validated. `satisfies` keeps this schema in lockstep with `Album`:
 * adding a field to the type without adding it here is a compile error.
 */
const albumSchema = z.object({
  id: z.string().min(1),
  rank: z.number(),
  title: z.string(),
  artist: z.string(),
  artistUrl: z.string().nullable(),
  artworkUrl: z.string(),
  artworkUrlHiRes: z.string(),
  genre: z.string(),
  genreId: z.string().nullable(),
  releaseDate: z.string().nullable(),
  releaseDateLabel: z.string().nullable(),
  releaseYear: z.number().nullable(),
  price: z.object({ amount: z.number(), currency: z.string(), label: z.string() }).nullable(),
  trackCount: z.number().nullable(),
  rights: z.string().nullable(),
  url: z.string(),
}) satisfies z.ZodType<Album>;

const entrySchema = z.object({ album: albumSchema, addedAt: z.iso.datetime() });

const storedSchema = z.object({
  version: z.literal(FAVORITES_STORAGE_VERSION),
  favorites: z.array(z.unknown()),
});

const hasStorage = (): boolean => typeof window !== 'undefined' && 'localStorage' in window;

/**
 * Reads saved favorites. Never throws: missing, corrupt, outdated or
 * blocked storage all yield an empty list, and individual bad entries are
 * dropped without discarding the good ones.
 */
export function loadFavorites(): FavoriteEntry[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const stored = storedSchema.safeParse(JSON.parse(raw));
    if (!stored.success) return [];
    return stored.data.favorites.flatMap((item) => {
      const entry = entrySchema.safeParse(item);
      return entry.success ? [entry.data] : [];
    });
  } catch {
    return [];
  }
}

/** Saves favorites. Failures (quota, private mode) are non-fatal. */
export function saveFavorites(favorites: readonly FavoriteEntry[]): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify({ version: FAVORITES_STORAGE_VERSION, favorites }),
    );
  } catch {
    // The in-memory state is still correct for this session.
  }
}
