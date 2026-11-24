import { initialFiltersState, isSortKey, MAX_QUERY_LENGTH, type FiltersState } from './filtersSlice';

/** Query-string keys. Short and human-readable: `/?q=swift&genre=Pop&sort=newest`. */
export const FILTER_PARAMS = { query: 'q', genre: 'genre', sort: 'sort' } as const;

/** Minimal read interface shared by URLSearchParams and Next's ReadonlyURLSearchParams. */
interface SearchParamsLike {
  get(name: string): string | null;
}

/**
 * Reads filters from a URL. Never throws: unknown sort keys fall back to the
 * default and oversized queries are truncated, so a hand-edited or stale link
 * still opens a working page.
 */
export function parseFilters(params: SearchParamsLike): FiltersState {
  const query = (params.get(FILTER_PARAMS.query) ?? '').slice(0, MAX_QUERY_LENGTH);
  const genre = params.get(FILTER_PARAMS.genre)?.trim() || null;
  const sort = params.get(FILTER_PARAMS.sort);

  return {
    query,
    genre,
    sort: isSortKey(sort) ? sort : initialFiltersState.sort,
  };
}

/**
 * Writes filters to a query string. Defaults are omitted, so the plain
 * chart is just `/`, and every filter combination has exactly one URL.
 */
export function serializeFilters(filters: FiltersState): URLSearchParams {
  const params = new URLSearchParams();
  const query = filters.query.trim();
  if (query) params.set(FILTER_PARAMS.query, query);
  if (filters.genre) params.set(FILTER_PARAMS.genre, filters.genre);
  if (filters.sort !== initialFiltersState.sort) params.set(FILTER_PARAMS.sort, filters.sort);
  return params;
}
