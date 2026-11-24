import sample from './topAlbumsFeed.sample.json';

/** Three real entries captured from the live feed on 2026-11-24. */
export const sampleFeed = sample;

type JsonObject = Record<string, unknown>;

/** A deep copy of a real, valid feed entry, to mutate per test. */
export function rawEntry(index = 0): JsonObject {
  const entry = sample.feed.entry[index];
  if (!entry) throw new Error(`fixture has no entry ${index}`);
  // JSON round-trip rather than structuredClone: jsdom test envs lack the latter.
  return JSON.parse(JSON.stringify(entry)) as JsonObject;
}

/** Wraps raw entries in a minimal feed envelope. */
export function feedWith(entry: unknown, extra: JsonObject = {}): unknown {
  return { feed: { entry, ...extra } };
}
