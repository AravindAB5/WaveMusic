import { albumSet } from '@/test/factories';
import type { FavoriteEntry } from './favoritesSlice';
import { FAVORITES_STORAGE_KEY, FAVORITES_STORAGE_VERSION, loadFavorites, saveFavorites } from './storage';

const entries: FavoriteEntry[] = albumSet.slice(0, 2).map((album, i) => ({
  album,
  addedAt: `2026-11-2${i}T12:00:00.000Z`,
}));

const writeRaw = (value: unknown) =>
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, typeof value === 'string' ? value : JSON.stringify(value));

afterEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe('favorites storage', () => {
  it('round-trips favorites in a versioned envelope', () => {
    saveFavorites(entries);

    const raw = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY)!);
    expect(raw.version).toBe(FAVORITES_STORAGE_VERSION);
    expect(loadFavorites()).toEqual(entries);
  });

  it('returns an empty list when nothing is stored', () => {
    expect(loadFavorites()).toEqual([]);
  });

  it.each([
    ['corrupt JSON', '{not json'],
    ['a bare array (no envelope)', [entries[0]]],
    ['an unknown version', { version: 99, favorites: [entries[0]] }],
    ['a non-array favorites field', { version: FAVORITES_STORAGE_VERSION, favorites: 'nope' }],
  ])('ignores %s', (_label, value) => {
    writeRaw(value);
    expect(loadFavorites()).toEqual([]);
  });

  it('drops invalid entries but keeps the valid ones', () => {
    const [good] = entries;
    const missingField = { ...good, album: { ...good!.album, title: undefined } };
    const badDate = { ...good, addedAt: 'yesterday' };
    writeRaw({ version: FAVORITES_STORAGE_VERSION, favorites: [missingField, good, badDate, null] });

    expect(loadFavorites()).toEqual([good]);
  });

  it('survives storage that throws on read and write', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    expect(loadFavorites()).toEqual([]);
    expect(() => saveFavorites(entries)).not.toThrow();
  });
});
