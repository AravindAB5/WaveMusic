import { z } from 'zod';

/**
 * Zod schemas for the iTunes Lookup API
 * (https://itunes.apple.com/lookup?id=<collectionId>&entity=song).
 *
 * The response is a flat `results` array: one `collection` row for the album,
 * then one `track` row per song. Rows are validated individually so one odd
 * track (or a music video, which also has wrapperType "track") doesn't fail
 * the whole album.
 */

export const lookupEnvelopeSchema = z.object({
  resultCount: z.number().int().nonnegative(),
  results: z.array(z.unknown()),
});

export const lookupCollectionSchema = z.object({
  wrapperType: z.literal('collection'),
  collectionId: z.number().int().positive(),
  collectionName: z.string().trim().min(1),
  artistName: z.string().trim().min(1),
  // Absent for compilations.
  artistViewUrl: z.url().optional(),
  collectionViewUrl: z.url(),
  artworkUrl100: z.url(),
  collectionPrice: z.number().optional(),
  currency: z.string().optional(),
  trackCount: z.number().int().nonnegative().optional(),
  copyright: z.string().optional(),
  releaseDate: z.string().optional(),
  primaryGenreName: z.string().optional(),
});

export const lookupSongSchema = z.object({
  wrapperType: z.literal('track'),
  kind: z.literal('song'),
  collectionId: z.number().int().positive(),
  trackId: z.number().int().positive(),
  trackName: z.string().trim().min(1),
  artistName: z.string().trim().min(1),
  trackNumber: z.number().int().positive(),
  discNumber: z.number().int().positive().optional(),
  trackTimeMillis: z.number().nonnegative().optional(),
  // Some tracks have no preview (e.g. album-only or region-locked).
  previewUrl: z.url().optional(),
  trackExplicitness: z.string().optional(),
});

export type LookupCollection = z.infer<typeof lookupCollectionSchema>;
export type LookupSong = z.infer<typeof lookupSongSchema>;
