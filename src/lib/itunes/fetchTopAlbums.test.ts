/** @jest-environment node */
import { sampleFeed } from './__fixtures__/feed';
import {
  FEED_REVALIDATE_SECONDS,
  FeedRequestError,
  fetchTopAlbums,
  TOP_ALBUMS_FEED_URL,
} from './fetchTopAlbums';
import { FeedParseError } from './mapFeed';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let fetchMock: jest.SpyInstance;

beforeEach(() => {
  fetchMock = jest.spyOn(global, 'fetch');
});

afterEach(() => {
  fetchMock.mockRestore();
  delete process.env.ITUNES_TOP_ALBUMS_URL;
});

describe('fetchTopAlbums', () => {
  it('fetches the feed through the Data Cache and maps it', async () => {
    fetchMock.mockResolvedValue(jsonResponse(sampleFeed));

    const result = await fetchTopAlbums();

    expect(result.albums).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledWith(
      TOP_ALBUMS_FEED_URL,
      expect.objectContaining({
        next: { revalidate: FEED_REVALIDATE_SECONDS },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('honours the ITUNES_TOP_ALBUMS_URL override', async () => {
    process.env.ITUNES_TOP_ALBUMS_URL = 'http://localhost:4010/feed.json';
    fetchMock.mockResolvedValue(jsonResponse(sampleFeed));

    await fetchTopAlbums();

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4010/feed.json', expect.anything());
  });

  it('throws FeedRequestError with the status on a non-2xx response', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 503));

    const error = await fetchTopAlbums().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(FeedRequestError);
    expect((error as FeedRequestError).status).toBe(503);
  });

  it('wraps network failures and timeouts in FeedRequestError', async () => {
    const cause = new DOMException('The operation timed out.', 'TimeoutError');
    fetchMock.mockRejectedValue(cause);

    const error = await fetchTopAlbums().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(FeedRequestError);
    expect((error as FeedRequestError).cause).toBe(cause);
  });

  it('throws FeedParseError when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Service Unavailable</html>', { status: 200 }));

    await expect(fetchTopAlbums()).rejects.toBeInstanceOf(FeedParseError);
  });

  it('throws FeedParseError when the JSON is not the feed', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ errorMessage: 'nope' }));

    await expect(fetchTopAlbums()).rejects.toBeInstanceOf(FeedParseError);
  });

  it('logs skipped entries but still returns the valid albums', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const feed = { feed: { entry: [...sampleFeed.feed.entry, { bogus: true }] } };
    fetchMock.mockResolvedValue(jsonResponse(feed));

    const result = await fetchTopAlbums();

    expect(result.albums).toHaveLength(3);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('skipped 1'), expect.any(Array));
    warn.mockRestore();
  });
});
