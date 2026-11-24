/** @jest-environment node */
import { UNRANKED, type Album } from '@/types/album';
import { ALBUM_ID, COMPILATION_ID, lookupResponse } from './__fixtures__/lookup';
import { LookupParseError, parseAlbumLookup } from './mapLookup';

const ART = 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/7a/7a/e4/7a7ae4aa-c96a-bc93-5d04-7c03aa5f35f5/196874013465.jpg';

describe('parseAlbumLookup — real responses', () => {
  it('maps the collection row to an unranked Album', () => {
    const { album } = parseAlbumLookup(lookupResponse('album'), ALBUM_ID);

    expect(album).toEqual<Album>({
      id: ALBUM_ID,
      rank: UNRANKED,
      title: 'Grateful',
      artist: 'The Red Clay Strays',
      artistUrl: 'https://music.apple.com/us/artist/the-red-clay-strays/1483812664?uo=4',
      artworkUrl: `${ART}/100x100bb.jpg`,
      artworkUrlHiRes: `${ART}/600x600bb.jpg`,
      genre: 'Country',
      genreId: null,
      releaseDate: '2026-06-05T07:00:00.000Z',
      releaseDateLabel: 'June 5, 2026',
      releaseYear: 2026,
      price: { amount: 9.99, currency: 'USD', label: '$9.99' },
      trackCount: 11,
      rights: '℗ 2026 RCA Records, under exclusive license from HBYCO Records',
      url: expect.stringContaining('music.apple.com/us/album/grateful/1893402542') as unknown as string,
    });
  });

  it('maps songs to tracks in play order', () => {
    const { tracks } = parseAlbumLookup(lookupResponse('album'), ALBUM_ID);

    expect(tracks.map((t) => t.trackNumber)).toEqual([1, 2, 3]);
    expect(tracks[0]).toEqual({
      id: '1893402543',
      title: 'Demons In Your Choir',
      artist: 'The Red Clay Strays',
      trackNumber: 1,
      discNumber: 1,
      durationMs: 256096,
      previewUrl: expect.stringMatching(/^https:\/\/audio-ssl\.itunes\.apple\.com\/.+\.m4a$/) as unknown as string,
      explicit: false,
    });
  });

  it('keeps per-track artists on compilations, and a null artist URL', () => {
    const { album, tracks } = parseAlbumLookup(lookupResponse('compilation'), COMPILATION_ID);

    expect(album?.artist).toBe('Various Artists');
    expect(album?.artistUrl).toBeNull();
    expect(tracks.map((t) => t.artist)).toEqual(['Whitney Peak & The Hunger Games', 'Noah Cyrus & The Hunger Games']);
  });
});

describe('parseAlbumLookup — not found and bad input', () => {
  it('returns album: null for an empty result (unknown id)', () => {
    expect(parseAlbumLookup({ resultCount: 0, results: [] }, '1')).toEqual({ album: null, tracks: [] });
  });

  it('returns album: null when the collection row is for a different id', () => {
    expect(parseAlbumLookup(lookupResponse('album'), '999').album).toBeNull();
  });

  it.each([
    ['null', null],
    ['an HTML string', '<html>'],
    ['no results array', { resultCount: 1 }],
  ])('throws LookupParseError for %s', (_label, input) => {
    expect(() => parseAlbumLookup(input, ALBUM_ID)).toThrow(LookupParseError);
  });
});

describe('parseAlbumLookup — row handling', () => {
  const withRows = (mutate: (rows: Record<string, unknown>[]) => void) => {
    const response = lookupResponse('album');
    mutate(response.results);
    return parseAlbumLookup(response, ALBUM_ID);
  };

  it('ignores music videos and rows from other collections', () => {
    const { tracks } = withRows((rows) => {
      rows.push({ ...rows[1], trackId: 1, kind: 'music-video' });
      rows.push({ ...rows[1], trackId: 2, collectionId: 42 });
    });
    expect(tracks).toHaveLength(3);
  });

  it('skips invalid song rows without failing the album', () => {
    const { album, tracks } = withRows((rows) => {
      delete rows[2]!.trackName;
    });
    expect(album).not.toBeNull();
    expect(tracks.map((t) => t.trackNumber)).toEqual([1, 3]);
  });

  it('drops duplicate track ids', () => {
    const { tracks } = withRows((rows) => {
      rows.push({ ...rows[1] });
    });
    expect(tracks).toHaveLength(3);
  });

  it('orders multi-disc albums by disc, then track', () => {
    const { tracks } = withRows((rows) => {
      rows[1] = { ...rows[1], discNumber: 2, trackNumber: 1 };
      rows[2] = { ...rows[2], discNumber: 1, trackNumber: 2 };
      rows[3] = { ...rows[3], discNumber: 1, trackNumber: 1 };
    });
    expect(tracks.map((t) => [t.discNumber, t.trackNumber])).toEqual([
      [1, 1],
      [1, 2],
      [2, 1],
    ]);
  });

  it('handles missing previews, durations and disc numbers, and explicit tracks', () => {
    const { tracks } = withRows((rows) => {
      delete rows[1]!.previewUrl;
      delete rows[1]!.trackTimeMillis;
      delete rows[1]!.discNumber;
      rows[1]!.trackExplicitness = 'explicit';
    });
    expect(tracks[0]).toMatchObject({ previewUrl: null, durationMs: null, discNumber: 1, explicit: true });
  });

  it('falls back gracefully when optional collection fields are missing', () => {
    const { album } = withRows((rows) => {
      const c = rows[0]!;
      delete c.collectionPrice;
      delete c.releaseDate;
      delete c.copyright;
      delete c.primaryGenreName;
      delete c.trackCount;
    });
    expect(album).toMatchObject({
      price: null,
      releaseDate: null,
      releaseDateLabel: null,
      releaseYear: null,
      rights: null,
      genre: 'Music',
      trackCount: null,
    });
  });
});
