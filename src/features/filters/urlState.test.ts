/** @jest-environment node */
import { initialFiltersState, MAX_QUERY_LENGTH, type FiltersState } from './filtersSlice';
import { parseFilters, serializeFilters } from './urlState';

const parse = (qs: string) => parseFilters(new URLSearchParams(qs));

describe('parseFilters', () => {
  it('returns defaults for an empty query string', () => {
    expect(parse('')).toEqual(initialFiltersState);
  });

  it('reads q, genre, sort and favorites', () => {
    expect(parse('q=taylor+swift&genre=Pop&sort=newest&favorites=1')).toEqual({
      query: 'taylor swift',
      genre: 'Pop',
      sort: 'newest',
      favoritesOnly: true,
    });
  });

  it.each([
    ['favorites=1', true],
    ['favorites=true', true],
    ['favorites=0', false],
    ['favorites=yes', false],
    ['favorites=', false],
  ])('parses %s as favoritesOnly=%s', (qs, expected) => {
    expect(parse(qs).favoritesOnly).toBe(expected);
  });

  it('decodes genres with reserved characters', () => {
    expect(parse('genre=R%26B%2FSoul').genre).toBe('R&B/Soul');
  });

  it('falls back to the default sort for unknown values', () => {
    expect(parse('sort=price').sort).toBe('rank');
    expect(parse('sort=').sort).toBe('rank');
  });

  it('treats a blank genre as all genres', () => {
    expect(parse('genre=%20%20').genre).toBeNull();
  });

  it('truncates oversized queries', () => {
    expect(parse(`q=${'a'.repeat(500)}`).query).toHaveLength(MAX_QUERY_LENGTH);
  });

  it('ignores unrelated params', () => {
    expect(parse('utm_source=x')).toEqual(initialFiltersState);
  });
});

describe('serializeFilters', () => {
  it('omits defaults, so the plain chart is an empty query string', () => {
    expect(serializeFilters(initialFiltersState).toString()).toBe('');
  });

  it('trims the query and drops it when blank', () => {
    expect(serializeFilters({ ...initialFiltersState, query: '  swift ' }).toString()).toBe('q=swift');
    expect(serializeFilters({ ...initialFiltersState, query: '   ' }).toString()).toBe('');
  });

  it('encodes every non-default filter', () => {
    const qs = serializeFilters({ query: 'a b', genre: 'R&B/Soul', sort: 'oldest', favoritesOnly: true }).toString();
    expect(qs).toBe('q=a+b&genre=R%26B%2FSoul&sort=oldest&favorites=1');
  });

  it.each<FiltersState>([
    { query: 'beyoncé', genre: 'Country', sort: 'title', favoritesOnly: false },
    { query: '', genre: 'Hip-Hop/Rap', sort: 'rank', favoritesOnly: true },
    { query: 'x y z', genre: null, sort: 'newest', favoritesOnly: false },
  ])('round-trips %j', (filters) => {
    expect(parseFilters(serializeFilters(filters))).toEqual(filters);
  });
});
