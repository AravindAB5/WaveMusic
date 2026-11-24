/** @jest-environment node */
import { albumSet, makeAlbum } from '@/test/factories';
import { filterAndSortAlbums, getGenreOptions, matchesQuery, normalizeText } from './filterAlbums';
import { initialFiltersState, type FiltersState } from './filtersSlice';

const ids = (filters: Partial<FiltersState>) =>
  filterAndSortAlbums(albumSet, { ...initialFiltersState, ...filters }).map((a) => a.id);

describe('normalizeText', () => {
  it('lowercases and strips accents', () => {
    expect(normalizeText('Beyoncé ÁLVARO')).toBe('beyonce alvaro');
  });
});

describe('search', () => {
  it('matches title or artist, case- and accent-insensitively', () => {
    expect(ids({ query: 'SHOWGIRL' })).toEqual(['1']);
    expect(ids({ query: 'beyonce' })).toEqual(['3']);
    expect(ids({ query: 'clay' })).toEqual(['2']);
  });

  it('requires every word, across title and artist', () => {
    expect(ids({ query: 'swift showgirl' })).toEqual(['1']);
    expect(ids({ query: 'swift grateful' })).toEqual([]);
  });

  it('ignores surrounding and repeated whitespace', () => {
    expect(ids({ query: '   ' })).toHaveLength(albumSet.length);
    expect(ids({ query: '  taylor   swift ' })).toEqual(['1']);
  });

  it('does not search the genre', () => {
    expect(matchesQuery(makeAlbum({ id: 'x', title: 'A', artist: 'B', genre: 'Country' }), 'country')).toBe(false);
  });
});

describe('genre filter', () => {
  it('keeps only the selected genre', () => {
    expect(ids({ genre: 'Country' })).toEqual(['2', '3']);
  });

  it('combines with search', () => {
    expect(ids({ genre: 'Country', query: 'beyonce' })).toEqual(['3']);
    expect(ids({ genre: 'Pop', query: 'beyonce' })).toEqual([]);
  });

  it('returns nothing for a genre not in the chart', () => {
    expect(ids({ genre: 'Polka' })).toEqual([]);
  });
});

describe('sorting', () => {
  it('sorts by chart position by default', () => {
    expect(ids({})).toEqual(['1', '2', '3', '4', '5']);
  });

  it('sorts titles case-insensitively with natural numbers', () => {
    const albums = [
      makeAlbum({ id: 'a', rank: 1, title: 'Album 10' }),
      makeAlbum({ id: 'b', rank: 2, title: 'album 9' }),
      makeAlbum({ id: 'c', rank: 3, title: 'Zed' }),
      makeAlbum({ id: 'd', rank: 4, title: 'abbey' }),
    ];
    const sorted = filterAndSortAlbums(albums, { ...initialFiltersState, sort: 'title' }).map((a) => a.id);
    expect(sorted).toEqual(['d', 'b', 'a', 'c']);
  });

  it('sorts by artist', () => {
    expect(ids({ sort: 'artist' })).toEqual(['5', '3', '1', '4', '2']);
  });

  it('sorts newest first, breaking ties by rank, undated last', () => {
    expect(ids({ sort: 'newest' })).toEqual(['2', '5', '1', '3', '4']);
  });

  it('sorts oldest first, undated still last', () => {
    expect(ids({ sort: 'oldest' })).toEqual(['3', '1', '2', '5', '4']);
  });

  it('never mutates the input', () => {
    const copy = [...albumSet];
    filterAndSortAlbums(albumSet, { ...initialFiltersState, sort: 'title' });
    expect(albumSet).toEqual(copy);
  });
});

describe('getGenreOptions', () => {
  it('lists genres alphabetically with counts', () => {
    expect(getGenreOptions(albumSet)).toEqual([
      { genre: 'Country', count: 2 },
      { genre: 'Pop', count: 1 },
      { genre: 'R&B/Soul', count: 1 },
      { genre: 'Rock', count: 1 },
    ]);
  });

  it('keeps a selected genre that is missing from the chart, with count 0', () => {
    expect(getGenreOptions(albumSet, 'Polka')).toContainEqual({ genre: 'Polka', count: 0 });
    expect(getGenreOptions(albumSet, 'Pop')).toHaveLength(4);
  });
});
