import 'server-only';
import { cache } from 'react';
import type { TopAlbumsFeed } from '@/types/album';
import { FeedParseError, parseTopAlbumsFeed } from './mapFeed';

export const TOP_ALBUMS_FEED_URL = 'https://itunes.apple.com/us/rss/topalbums/limit=100/json';

/** Apple regenerates the chart a few times a day; an hour keeps it fresh and fast. */
export const FEED_REVALIDATE_SECONDS = 3600;
export const FEED_TIMEOUT_MS = 10_000;

/** The feed couldn't be fetched: network failure, timeout or a non-2xx status. */
export class FeedRequestError extends Error {
  override readonly name = 'FeedRequestError';

  constructor(
    message: string,
    readonly status?: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

/**
 * Fetches, validates and maps the Top Albums feed. Server-only: it runs in
 * Server Components and goes through Next's Data Cache, so Apple is hit at
 * most once per revalidation window rather than once per visitor.
 *
 * `ITUNES_TOP_ALBUMS_URL` overrides the source, so e2e tests and local dev can
 * point at a fixture server instead of Apple.
 */
export async function fetchTopAlbums(): Promise<TopAlbumsFeed> {
  const url = process.env.ITUNES_TOP_ALBUMS_URL || TOP_ALBUMS_FEED_URL;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: FEED_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
    });
  } catch (cause) {
    throw new FeedRequestError('Could not reach the iTunes Top Albums feed', undefined, { cause });
  }

  if (!response.ok) {
    throw new FeedRequestError(`iTunes Top Albums feed responded with HTTP ${response.status}`, response.status);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new FeedParseError('iTunes Top Albums feed returned invalid JSON', ['(root): invalid JSON']);
  }

  const feed = parseTopAlbumsFeed(json);
  if (feed.skipped.length > 0) {
    // Visible in server logs; the page still renders the valid albums.
    console.warn(`[itunes] skipped ${feed.skipped.length} invalid feed entries`, feed.skipped);
  }
  return feed;
}

/** Request-scoped memo: the page and its metadata share a single fetch. */
export const getTopAlbums = cache(fetchTopAlbums);
