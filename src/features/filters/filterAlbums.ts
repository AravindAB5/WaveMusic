import type { Album } from '@/types/album';
import type { FiltersState, SortKey } from './filtersSlice';

/** Lowercase and strip accents, so "beyonce" finds "Beyoncé". */
export const normalizeText = (text: string): string =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Fixed locale so server and client sort identically (no hydration mismatch). */
const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

const byRank = (a: Album, b: Album) => a.rank - b.rank;

const releaseTime = (album: Album): number | null =>
  album.releaseDate === null ? null : Date.parse(album.releaseDate);

/** Albums without a date sort last in both directions; ties fall back to chart rank. */
const byRelease =
  (direction: 1 | -1) =>
  (a: Album, b: Album): number => {
    const ta = releaseTime(a);
    const tb = releaseTime(b);
    if (ta === tb) return byRank(a, b);
    if (ta === null) return 1;
    if (tb === null) return -1;
    return (ta - tb) * direction || byRank(a, b);
  };

const COMPARATORS: Readonly<Record<SortKey, (a: Album, b: Album) => number>> = {
  rank: byRank,
  title: (a, b) => collator.compare(a.title, b.title) || byRank(a, b),
  artist: (a, b) => collator.compare(a.artist, b.artist) || byRank(a, b),
  newest: byRelease(-1),
  oldest: byRelease(1),
};

/**
 * Every whitespace-separated word of the query must appear in the title or
 * artist ("taylor swift" and "swift showgirl" both match).
 */
export function matchesQuery(album: Album, query: string): boolean {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = normalizeText(`${album.title} ${album.artist}`);
  return terms.every((term) => haystack.includes(term));
}

/** Applies search, genre and sort. Pure; never mutates the input. */
export function filterAndSortAlbums(albums: readonly Album[], filters: FiltersState): Album[] {
  return albums
    .filter((album) => (filters.genre === null || album.genre === filters.genre) && matchesQuery(album, filters.query))
    .sort(COMPARATORS[filters.sort]);
}

export interface GenreOption {
  genre: string;
  count: number;
}

/**
 * Genres present in the chart, alphabetical, with album counts. A selected
 * genre that isn't in the chart (stale or hand-edited URL) is kept with a
 * count of 0, so the select can still show what's active.
 */
export function getGenreOptions(albums: readonly Album[], selected: string | null = null): GenreOption[] {
  const counts = new Map<string, number>();
  for (const album of albums) counts.set(album.genre, (counts.get(album.genre) ?? 0) + 1);
  if (selected !== null && !counts.has(selected)) counts.set(selected, 0);
  return [...counts]
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => collator.compare(a.genre, b.genre));
}
