/** @jest-environment node */
import { ALBUM_ID, lookupResponse } from '@/lib/itunes/__fixtures__/lookup';
import { itunesApi } from './itunesApi';
import { makeStore, type AppStore } from './store';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });

let fetchMock: jest.SpyInstance;

beforeEach(() => {
  fetchMock = jest.spyOn(global, 'fetch');
});

/**
 * Stores created in a test. Unsubscribing from a lookup starts RTK Query's
 * cache-removal timer (keepUnusedDataFor, 10 min), which would keep Jest
 * from exiting; resetApiState clears those timers.
 */
const stores: AppStore[] = [];
const newStore = () => {
  const store = makeStore();
  stores.push(store);
  return store;
};

afterEach(() => {
  fetchMock.mockRestore();
  stores.splice(0).forEach((store) => store.dispatch(itunesApi.util.resetApiState()));
});

const lookup = (store: ReturnType<typeof makeStore>, id = ALBUM_ID) =>
  store.dispatch(itunesApi.endpoints.getAlbumLookup.initiate(id));

describe('itunesApi.getAlbumLookup', () => {
  it('requests the Lookup API with the album id and song entity', async () => {
    fetchMock.mockResolvedValue(json(lookupResponse('album')));

    await lookup(newStore());

    const request = fetchMock.mock.calls[0]![0] as Request;
    const url = new URL(request.url);
    expect(url.origin + url.pathname).toBe('https://itunes.apple.com/lookup');
    expect(Object.fromEntries(url.searchParams)).toEqual({ id: ALBUM_ID, entity: 'song' });
  });

  it('stores the validated, mapped result', async () => {
    fetchMock.mockResolvedValue(json(lookupResponse('album')));

    const result = await lookup(newStore());

    expect(result.isSuccess).toBe(true);
    expect(result.data?.album?.title).toBe('Grateful');
    expect(result.data?.tracks).toHaveLength(3);
  });

  it('serves repeat lookups from the cache', async () => {
    fetchMock.mockResolvedValue(json(lookupResponse('album')));
    const store = newStore();

    const first = lookup(store);
    await first;
    const second = lookup(store);
    await second;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    first.unsubscribe();
    second.unsubscribe();
  });

  it('reports HTTP failures as errors with the status', async () => {
    fetchMock.mockResolvedValue(json({ errorMessage: 'nope' }, 503));

    const result = await lookup(newStore());

    expect(result.isError).toBe(true);
    expect(result.error).toMatchObject({ status: 503 });
  });

  it('reports malformed responses as errors instead of storing bad data', async () => {
    // RTK logs errors thrown from transformResponse (development only).
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockResolvedValue(json({ unexpected: true }));

    const result = await lookup(newStore());

    expect(result.isError).toBe(true);
    expect(result.data).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('getAlbumLookup'), expect.any(Error));
    consoleError.mockRestore();
  });

  it('treats an unknown id as a successful "not found"', async () => {
    fetchMock.mockResolvedValue(json({ resultCount: 0, results: [] }));

    const result = await lookup(newStore(), '1');

    expect(result.isSuccess).toBe(true);
    expect(result.data).toEqual({ album: null, tracks: [] });
  });
});
