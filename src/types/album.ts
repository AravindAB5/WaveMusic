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
  /**
   * 1-based chart position, from the order of the feed. 0 for an album built
   * from a direct Lookup (not in the chart), see `UNRANKED`.
   */
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

/** `Album.rank` for albums that came from a direct Lookup rather than the chart. */
export const UNRANKED = 0;

/** One song on an album, from the iTunes Lookup API. */
export interface Track {
  id: string;
  title: string;
  /** Per-track performer; differs from the album artist on compilations. */
  artist: string;
  trackNumber: number;
  discNumber: number;
  durationMs: number | null;
  /** ~30s AAC preview; null when Apple doesn't offer one. */
  previewUrl: string | null;
  explicit: boolean;
}

/** Result of looking up one album: its details and its songs, in play order. */
export interface AlbumLookup {
  /** Null when iTunes doesn't know the id (unknown or withdrawn album). */
  album: Album | null;
  tracks: Track[];
}
