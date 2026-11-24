/** @jest-environment node */
import { rawEntry, sampleFeed } from './__fixtures__/feed';
import { feedEntrySchema, feedEnvelopeSchema } from './feedSchema';

describe('feedEntrySchema', () => {
  it.each(sampleFeed.feed.entry.map((_, i) => i))('accepts real entry %i', (i) => {
    expect(feedEntrySchema.safeParse(rawEntry(i)).success).toBe(true);
  });

  it('strips fields the app does not use', () => {
    const parsed = feedEntrySchema.parse({ ...rawEntry(), extra: 'ignored' });
    expect(parsed).not.toHaveProperty('extra');
    expect(parsed).not.toHaveProperty('im:contentType');
  });

  it('allows a missing artist link (compilations)', () => {
    const entry = rawEntry();
    entry['im:artist'] = { label: 'Various Artists' };
    expect(feedEntrySchema.safeParse(entry).success).toBe(true);
  });
});

describe('feedEnvelopeSchema', () => {
  it('normalizes entry to an array', () => {
    expect(feedEnvelopeSchema.parse({ feed: {} }).feed.entry).toEqual([]);
    expect(feedEnvelopeSchema.parse({ feed: { entry: { a: 1 } } }).feed.entry).toEqual([{ a: 1 }]);
    expect(feedEnvelopeSchema.parse({ feed: { entry: [1, 2] } }).feed.entry).toEqual([1, 2]);
  });
});
