import { formatPrice, formatReleaseDate } from '@/lib/format';
import { UNRANKED, type Album, type AlbumLookup, type Track } from '@/types/album';
import { resizeArtwork } from './artwork';
import { lookupCollectionSchema, lookupEnvelopeSchema, lookupSongSchema, type LookupCollection, type LookupSong } from './lookupSchema';
import { HI_RES_ARTWORK_SIZE } from './mapFeed';

/** The response isn't a Lookup result at all (HTML error page, API change). */
export class LookupParseError extends Error {
  override readonly name = 'LookupParseError';
}

const toIsoDate = (value: string | undefined): string | null => {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
};

/** Album built from the Lookup's collection row; used when the album isn't in today's chart. */
export function mapCollectionToAlbum(collection: LookupCollection): Album {
  const releaseDate = toIsoDate(collection.releaseDate);
  const yearMatch = collection.releaseDate?.match(/^(\d{4})-/);
  const priceLabel =
    collection.collectionPrice !== undefined && collection.currency
      ? formatPrice(collection.collectionPrice, collection.currency)
      : null;
  const rights = collection.copyright?.trim();

  return {
    id: String(collection.collectionId),
    rank: UNRANKED,
    title: collection.collectionName,
    artist: collection.artistName,
    artistUrl: collection.artistViewUrl ?? null,
    artworkUrl: collection.artworkUrl100,
    artworkUrlHiRes: resizeArtwork(collection.artworkUrl100, HI_RES_ARTWORK_SIZE),
    genre: collection.primaryGenreName?.trim() || 'Music',
    genreId: null,
    releaseDate,
    releaseDateLabel: formatReleaseDate(releaseDate),
    releaseYear: yearMatch?.[1] ? Number(yearMatch[1]) : null,
    price:
      priceLabel && collection.collectionPrice !== undefined && collection.currency
        ? { amount: collection.collectionPrice, currency: collection.currency, label: priceLabel }
        : null,
    trackCount: collection.trackCount ?? null,
    rights: rights || null,
    url: collection.collectionViewUrl,
  };
}

export function mapSongToTrack(song: LookupSong): Track {
  return {
    id: String(song.trackId),
    title: song.trackName,
    artist: song.artistName,
    trackNumber: song.trackNumber,
    discNumber: song.discNumber ?? 1,
    durationMs: song.trackTimeMillis ?? null,
    previewUrl: song.previewUrl ?? null,
    explicit: song.trackExplicitness === 'explicit',
  };
}

const byPlayOrder = (a: Track, b: Track) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber;

/**
 * Validates and maps a Lookup response for `albumId`.
 *
 * - Throws `LookupParseError` only if the envelope is wrong.
 * - Rows for other collections, non-songs (music videos) and invalid rows are
 *   ignored; duplicate track ids keep the first.
 * - No matching collection row → `{ album: null }` ("not found").
 */
export function parseAlbumLookup(json: unknown, albumId: string): AlbumLookup {
  const envelope = lookupEnvelopeSchema.safeParse(json);
  if (!envelope.success) throw new LookupParseError('Lookup response has an unexpected shape');

  let album: Album | null = null;
  const tracks: Track[] = [];
  const seen = new Set<string>();

  for (const row of envelope.data.results) {
    const collection = lookupCollectionSchema.safeParse(row);
    if (collection.success) {
      if (album === null && String(collection.data.collectionId) === albumId) {
        album = mapCollectionToAlbum(collection.data);
      }
      continue;
    }

    const song = lookupSongSchema.safeParse(row);
    if (!song.success || String(song.data.collectionId) !== albumId) continue;
    const track = mapSongToTrack(song.data);
    if (seen.has(track.id)) continue;
    seen.add(track.id);
    tracks.push(track);
  }

  // Tracks without their album are meaningless here; treat as not found.
  return album ? { album, tracks: tracks.sort(byPlayOrder) } : { album: null, tracks: [] };
}
