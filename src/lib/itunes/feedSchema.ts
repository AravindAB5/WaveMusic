import { z } from 'zod';

/**
 * Zod schemas for the iTunes "Top Albums" RSS JSON feed
 * (https://itunes.apple.com/us/rss/topalbums/limit=100/json).
 *
 * The feed is a JSON rendering of an Atom document, so every value is wrapped
 * as `{ label }` and/or `{ attributes }`, and all numbers arrive as strings.
 * These schemas only check shape: anything the UI can't work without is
 * required, anything decorative is optional. Converting to domain values
 * (numbers, dates, picking an image) is the mapper's job.
 */

const labelSchema = z.object({ label: z.string() });
const requiredTextSchema = z.object({ label: z.string().trim().min(1) });

const imageSchema = z.object({
  label: z.url(),
  attributes: z.object({ height: z.string() }).optional(),
});

const linkSchema = z.object({
  attributes: z.object({
    rel: z.string().optional(),
    type: z.string().optional(),
    href: z.url(),
  }),
});

export const feedEntrySchema = z.object({
  'im:name': requiredTextSchema,
  'im:image': z.array(imageSchema).min(1),
  'im:itemCount': labelSchema.optional(),
  'im:price': z
    .object({
      label: z.string(),
      attributes: z.object({ amount: z.string(), currency: z.string() }).optional(),
    })
    .optional(),
  rights: labelSchema.optional(),
  // Atom allows several links per entry; the feed currently sends one object.
  link: z.union([linkSchema, z.array(linkSchema).min(1)]),
  id: z.object({
    label: z.string(),
    // Numeric because it's passed straight to the Lookup API.
    attributes: z.object({ 'im:id': z.string().regex(/^\d+$/, 'expected a numeric album id') }),
  }),
  'im:artist': z.object({
    label: z.string().trim().min(1),
    // Absent for compilations ("Various Artists").
    attributes: z.object({ href: z.url() }).optional(),
  }),
  category: z.object({
    attributes: z.object({
      'im:id': z.string().optional(),
      term: z.string().optional(),
      label: z.string().trim().min(1),
    }),
  }),
  'im:releaseDate': z
    .object({
      label: z.string(),
      attributes: z.object({ label: z.string() }).optional(),
    })
    .optional(),
});

export type RawFeedEntry = z.infer<typeof feedEntrySchema>;

/**
 * Outer envelope. Entries stay `unknown` here so they can be validated one by
 * one; a single bad album shouldn't take down the whole grid.
 * Atom-to-JSON feeds send a lone object instead of a one-item array, and omit
 * `entry` entirely when empty, so both are normalized to an array.
 */
export const feedEnvelopeSchema = z.object({
  feed: z.object({
    entry: z
      .union([z.array(z.unknown()), z.looseObject({})])
      .optional()
      .transform((entry): unknown[] => (entry === undefined ? [] : Array.isArray(entry) ? entry : [entry])),
    updated: labelSchema.optional(),
  }),
});
