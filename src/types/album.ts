/**
 * Domain types the UI works with. Everything here is plain, JSON-serializable
 * data so it can cross the server → client component boundary and live in
 * Redux. The raw iTunes shape stays confined to `src/lib/itunes`.
 */

export interface Price {
  amount: number;
  /** ISO 4217 code, e.g. "USD". */
  currency: string;
  /** Display string as the store formats it, e.g. "$11.99". */
  label: string;
}

export interface Album {
  /** iTunes collection id; also the key for the Lookup API. */
  id: string;
  /** 1-based chart position, from the order of the feed. */
  rank: number;
  title: string;
  artist: string;
  /** Null for compilations ("Various Artists"), which have no artist page. */
  artistUrl: string | null;
  /** Largest artwork the feed provides (170px today). */
  artworkUrl: string;
  /** Same artwork re-requested at 600px for detail views and retina grids. */
  artworkUrlHiRes: string;
  genre: string;
  genreId: string | null;
  /** Normalized ISO 8601 timestamp, or null if missing or unparseable. */
  releaseDate: string | null;
  /** Human label from the feed, e.g. "November 20, 2026". */
  releaseDateLabel: string | null;
  releaseYear: number | null;
  price: Price | null;
  trackCount: number | null;
  rights: string | null;
  /** Album page on Apple Music. */
  url: string;
}

/** An entry that failed validation and was left out of `albums`. */
export interface FeedIssue {
  /** 0-based position in the raw feed. */
  index: number;
  reason: string;
}

export interface TopAlbumsFeed {
  albums: Album[];
  /** When Apple last regenerated the feed (ISO 8601), if reported. */
  updatedAt: string | null;
  skipped: FeedIssue[];
}
