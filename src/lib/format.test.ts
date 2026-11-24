/** @jest-environment node */
import { describeDuration, formatDuration, formatPrice, formatReleaseDate, formatTotalDuration } from './format';

describe('formatReleaseDate', () => {
  it('formats in UTC so it never shifts a day across time zones', () => {
    expect(formatReleaseDate('2026-06-05T07:00:00Z')).toBe('June 5, 2026');
    expect(formatReleaseDate('2026-01-01T00:00:00Z')).toBe('January 1, 2026');
  });

  it('returns null for missing or invalid dates', () => {
    expect(formatReleaseDate(null)).toBeNull();
    expect(formatReleaseDate('soon')).toBeNull();
  });
});

describe('formatPrice', () => {
  it('formats with the currency symbol', () => {
    expect(formatPrice(9.99, 'USD')).toBe('$9.99');
    expect(formatPrice(14, 'EUR')).toBe('€14.00');
  });

  it('returns null for an unusable currency code', () => {
    expect(formatPrice(1, 'not-a-currency')).toBeNull();
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [45_946, '0:46'],
    [256_096, '4:16'],
    [3_723_000, '1:02:03'],
  ])('%i ms → %s', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});

describe('formatTotalDuration', () => {
  it.each([
    [0, '0 min'],
    [2_520_000, '42 min'],
    [3_900_000, '1 hr 5 min'],
    [7_200_000, '2 hr'],
  ])('%i ms → %s', (ms, expected) => {
    expect(formatTotalDuration(ms)).toBe(expected);
  });
});

describe('describeDuration', () => {
  it.each([
    [256_096, '4 minutes 16 seconds'],
    [61_000, '1 minute 1 second'],
    [120_000, '2 minutes'],
    [5_000, '5 seconds'],
    [0, '0 seconds'],
  ])('%i ms → %s', (ms, expected) => {
    expect(describeDuration(ms)).toBe(expected);
  });
});
