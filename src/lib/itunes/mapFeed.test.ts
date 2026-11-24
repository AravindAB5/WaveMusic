/** @jest-environment node */
import type { Album } from '@/types/album';
import { feedWith, rawEntry, sampleFeed } from './__fixtures__/feed';
import { FeedParseError, parseTopAlbumsFeed } from './mapFeed';

const IMG = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/d2/d1/24/d2d1248a-d0ca-b7d7-b0ae-74b557d89bf7/196875002307.jpg';

/** Parses a feed made of the given entries and returns the albums. */
const albumsFrom = (...entries: unknown[]): Album[] => parseTopAlbumsFeed(feedWith(entries)).albums;
const only = (...entries: unknown[]): Album => {
  const [album] = albumsFrom(...entries);
  if (!album) throw new Error('expected one album');
  return album;
};

describe('parseTopAlbumsFeed — real sample', () => {
  const result = parseTopAlbumsFeed(sampleFeed);

  it('maps every entry and skips nothing', () => {
    expect(result.albums).toHaveLength(3);
    expect(result.skipped).toEqual([]);
  });

  it('normalizes the feed update time', () => {
    expect(result.updatedAt).toBe('2026-11-23T18:49:55.000Z');
  });

  it('maps a full entry to the domain Album', () => {
    expect(result.albums[0]).toEqual<Album>({
      id: '6835557871',
      rank: 1,
      title: "Hallelujah! It's Christmas Again!",
      artist: 'Phil Wickham',
      artistUrl: 'https://music.apple.com/us/artist/phil-wickham/133485322?uo=2',
      artworkUrl: `${IMG}/170x170bb.png`,
      artworkUrlHiRes: `${IMG}/600x600bb.jpg`,
      genre: 'Christian',
      genreId: '22',
      releaseDate: '2026-11-20T07:00:00.000Z',
      releaseDateLabel: 'November 20, 2026',
      releaseYear: 2026,
      price: { amount: 11.99, currency: 'USD', label: '$11.99' },
      trackCount: 22,
      rights: '℗ 2026 Phil Wickham under exclusive license to Fair Trade Services, LLC',
      url: 'https://music.apple.com/us/album/hallelujah-its-christmas-again/6835557871?uo=2',
    });
  });

  it('gives compilations a null artist URL', () => {
    const compilation = result.albums.find((a) => a.artist === 'Various Artists');
    expect(compilation).toBeDefined();
    expect(compilation?.artistUrl).toBeNull();
  });

  it('ranks by feed order', () => {
    expect(result.albums.map((a) => a.rank)).toEqual([1, 2, 3]);
  });

  it('produces JSON-serializable albums (safe to pass to client components)', () => {
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});

describe('parseTopAlbumsFeed — envelope', () => {
  it.each([
    ['null', null],
    ['a string', 'oops'],
    ['an empty object', {}],
    ['a non-object feed', { feed: 'nope' }],
    ['a scalar entry', { feed: { entry: 42 } }],
  ])('throws FeedParseError for %s', (_label, input) => {
    expect(() => parseTopAlbumsFeed(input)).toThrow(FeedParseError);
  });

  it('reports where the envelope is wrong', () => {
    try {
      parseTopAlbumsFeed({});
      throw new Error('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(FeedParseError);
      expect((error as FeedParseError).issues[0]).toMatch(/^feed:/);
    }
  });

  it('treats a missing entry list as an empty chart', () => {
    expect(parseTopAlbumsFeed({ feed: {} })).toEqual({ albums: [], updatedAt: null, skipped: [] });
  });

  it('accepts a single entry sent as an object instead of an array', () => {
    const result = parseTopAlbumsFeed(feedWith(rawEntry()));
    expect(result.albums).toHaveLength(1);
  });

  it('returns null for an unparseable update time', () => {
    expect(parseTopAlbumsFeed(feedWith([], { updated: { label: 'whenever' } })).updatedAt).toBeNull();
  });
});

describe('parseTopAlbumsFeed — skipping bad entries', () => {
  it('skips an invalid entry, keeps the rest, and keeps original ranks', () => {
    const broken = rawEntry(1);
    delete broken['im:name'];
    const result = parseTopAlbumsFeed(feedWith([rawEntry(0), broken, rawEntry(2)]));

    expect(result.albums.map((a) => a.rank)).toEqual([1, 3]);
    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]?.index).toBe(1);
    expect(result.skipped[0]?.reason).toContain('im:name');
  });

  it('skips non-object entries', () => {
    const result = parseTopAlbumsFeed(feedWith([null, 'x', rawEntry()]));
    expect(result.albums).toHaveLength(1);
    expect(result.skipped.map((s) => s.index)).toEqual([0, 1]);
  });

  it('skips duplicate album ids after the first', () => {
    const result = parseTopAlbumsFeed(feedWith([rawEntry(), rawEntry()]));
    expect(result.albums).toHaveLength(1);
    expect(result.skipped).toEqual([{ index: 1, reason: 'duplicate album id 6835557871' }]);
  });

  it.each<[string, (e: Record<string, unknown>) => void]>([
    ['blank title', (e) => (e['im:name'] = { label: '   ' })],
    ['no images', (e) => (e['im:image'] = [])],
    ['non-numeric id', (e) => (e.id = { label: 'x', attributes: { 'im:id': 'abc' } })],
    ['missing artist', (e) => delete e['im:artist']],
    ['missing genre', (e) => delete e.category],
    ['missing link', (e) => delete e.link],
    ['non-URL image', (e) => (e['im:image'] = [{ label: 'not a url' }])],
  ])('rejects an entry with %s', (_label, mutate) => {
    const entry = rawEntry();
    mutate(entry);
    const result = parseTopAlbumsFeed(feedWith([entry]));
    expect(result.albums).toEqual([]);
    expect(result.skipped).toHaveLength(1);
  });
});

describe('mapEntryToAlbum — field handling', () => {
  it('trims padded text', () => {
    const entry = rawEntry();
    entry['im:name'] = { label: '  Padded  ' };
    entry['im:artist'] = { label: ' Someone ' };
    expect(only(entry)).toMatchObject({ title: 'Padded', artist: 'Someone' });
  });

  it('nulls optional fields that are missing', () => {
    const entry = rawEntry();
    delete entry['im:price'];
    delete entry['im:itemCount'];
    delete entry.rights;
    delete entry['im:releaseDate'];
    delete (entry.category as { attributes: Record<string, unknown> }).attributes['im:id'];

    expect(only(entry)).toMatchObject({
      price: null,
      trackCount: null,
      rights: null,
      releaseDate: null,
      releaseDateLabel: null,
      releaseYear: null,
      genreId: null,
    });
  });

  it('nulls malformed numbers and dates instead of rejecting the album', () => {
    const entry = rawEntry();
    entry['im:price'] = { label: 'Free', attributes: { amount: 'free', currency: 'USD' } };
    entry['im:itemCount'] = { label: '12.5' };
    entry['im:releaseDate'] = { label: 'someday' };
    entry.rights = { label: '   ' };

    expect(only(entry)).toMatchObject({
      price: null,
      trackCount: null,
      releaseDate: null,
      releaseYear: null,
      rights: null,
    });
  });

  it('reads the release year without time-zone drift', () => {
    const entry = rawEntry();
    entry['im:releaseDate'] = { label: '2026-01-01T00:00:00-07:00' };
    expect(only(entry).releaseYear).toBe(2026);
  });

  it('picks the tallest image regardless of order', () => {
    const entry = rawEntry();
    entry['im:image'] = [
      { label: `${IMG}/170x170bb.png`, attributes: { height: '170' } },
      { label: `${IMG}/55x55bb.png`, attributes: { height: '55' } },
    ];
    expect(only(entry).artworkUrl).toBe(`${IMG}/170x170bb.png`);
  });

  it('falls back to the last image when heights are missing', () => {
    const entry = rawEntry();
    entry['im:image'] = [{ label: `${IMG}/55x55bb.png` }, { label: `${IMG}/100x100bb.png` }];
    expect(only(entry).artworkUrl).toBe(`${IMG}/100x100bb.png`);
  });

  it('prefers the rel="alternate" link when several are present', () => {
    const entry = rawEntry();
    entry.link = [
      { attributes: { rel: 'enclosure', href: 'https://example.com/preview.m4a' } },
      { attributes: { rel: 'alternate', href: 'https://music.apple.com/us/album/x/1' } },
    ];
    expect(only(entry).url).toBe('https://music.apple.com/us/album/x/1');
  });
});
