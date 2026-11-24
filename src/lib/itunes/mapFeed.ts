import type { z } from 'zod';
import type { Album, FeedIssue, Price, TopAlbumsFeed } from '@/types/album';
import { resizeArtwork } from './artwork';
import { feedEntrySchema, feedEnvelopeSchema, type RawFeedEntry } from './feedSchema';

export const HI_RES_ARTWORK_SIZE = 600;

/** The response isn't the feed at all (wrong endpoint, HTML error page, API change). */
export class FeedParseError extends Error {
  override readonly name = 'FeedParseError';

  constructor(
    message: string,
    readonly issues: readonly string[],
  ) {
    super(message);
  }
}

const formatIssues = (error: z.ZodError): string[] =>
  error.issues.map((issue) => `${issue.path.length ? issue.path.join('.') : '(root)'}: ${issue.message}`);

const toFiniteNumber = (value: string | undefined): number | null => {
  if (value === undefined || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const toIsoDate = (value: string | undefined): string | null => {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
};

function pickLargestImage(images: RawFeedEntry['im:image']): string {
  // Schema guarantees at least one image. Without heights, assume the feed's
  // usual ascending order and take the last one.
  let best = images[images.length - 1]!;
  let bestHeight = -1;
  for (const image of images) {
    const height = toFiniteNumber(image.attributes?.height) ?? -1;
    if (height > bestHeight) {
      best = image;
      bestHeight = height;
    }
  }
  return best.label;
}

function pickAlbumUrl(link: RawFeedEntry['link']): string {
  const links = Array.isArray(link) ? link : [link];
  const alternate = links.find((l) => l.attributes.rel === 'alternate') ?? links[0]!;
  return alternate.attributes.href;
}

function mapPrice(price: RawFeedEntry['im:price']): Price | null {
  const amount = toFiniteNumber(price?.attributes?.amount);
  if (!price?.attributes || amount === null) return null;
  return { amount, currency: price.attributes.currency, label: price.label };
}

/** Maps one validated feed entry to the domain `Album`. Pure; no I/O. */
export function mapEntryToAlbum(entry: RawFeedEntry, rank: number): Album {
  const artworkUrl = pickLargestImage(entry['im:image']);
  const release = entry['im:releaseDate'];
  // Read the year from the string itself: converting "2026-01-01T00:00-07:00"
  // to a Date and back can shift it into the previous year in some time zones.
  const yearMatch = release?.label.match(/^(\d{4})-/);
  const trackCount = toFiniteNumber(entry['im:itemCount']?.label);
  const rights = entry.rights?.label.trim();

  return {
    id: entry.id.attributes['im:id'],
    rank,
    title: entry['im:name'].label,
    artist: entry['im:artist'].label,
    artistUrl: entry['im:artist'].attributes?.href ?? null,
    artworkUrl,
    artworkUrlHiRes: resizeArtwork(artworkUrl, HI_RES_ARTWORK_SIZE),
    genre: entry.category.attributes.label,
    genreId: entry.category.attributes['im:id'] ?? null,
    releaseDate: toIsoDate(release?.label),
    releaseDateLabel: release?.attributes?.label ?? null,
    releaseYear: yearMatch?.[1] ? Number(yearMatch[1]) : null,
    price: mapPrice(entry['im:price']),
    trackCount: trackCount !== null && Number.isInteger(trackCount) && trackCount >= 0 ? trackCount : null,
    rights: rights || null,
    url: pickAlbumUrl(entry.link),
  };
}

/**
 * Validates and maps the raw feed JSON.
 *
 * - Throws `FeedParseError` only if the envelope itself is wrong.
 * - Invalid or duplicate entries are skipped and reported in `skipped`; the
 *   rest still render. Render whatever comes back: the feed is "limit=100"
 *   but routinely returns fewer.
 * - `rank` is the entry's position in the raw feed, so skipping an entry
 *   doesn't renumber the chart.
 */
export function parseTopAlbumsFeed(json: unknown): TopAlbumsFeed {
  const envelope = feedEnvelopeSchema.safeParse(json);
  if (!envelope.success) {
    throw new FeedParseError('Top albums feed has an unexpected shape', formatIssues(envelope.error));
  }

  const albums: Album[] = [];
  const skipped: FeedIssue[] = [];
  const seenIds = new Set<string>();

  envelope.data.feed.entry.forEach((raw, index) => {
    const parsed = feedEntrySchema.safeParse(raw);
    if (!parsed.success) {
      skipped.push({ index, reason: formatIssues(parsed.error).join('; ') });
      return;
    }
    const album = mapEntryToAlbum(parsed.data, index + 1);
    if (seenIds.has(album.id)) {
      skipped.push({ index, reason: `duplicate album id ${album.id}` });
      return;
    }
    seenIds.add(album.id);
    albums.push(album);
  });

  return { albums, updatedAt: toIsoDate(envelope.data.feed.updated?.label), skipped };
}
