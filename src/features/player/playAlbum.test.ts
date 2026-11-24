/** @jest-environment node */
import { ALBUM_ID, lookupResponse } from '@/lib/itunes/__fixtures__/lookup';
import { configureStore } from '@reduxjs/toolkit';
import { itunesApi } from '@/store/itunesApi';
import { makeStore, type AppStore, rootReducer } from '@/store/store';
import { makeAlbum } from '@/test/factories';
import { playAlbum } from './playAlbum';
import { selectCurrentItem, selectIsPlaying } from './playerSlice';

const album = makeAlbum({ id: ALBUM_ID, title: 'Grateful' });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

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

describe('playAlbum', () => {
  it('looks up the album and starts its first preview', async () => {
    fetchMock.mockImplementation(async () => json(lookupResponse('album')));
    const store = newStore();

    const outcome = await store.dispatch(playAlbum(album)).unwrap();

    expect(outcome).toBe('started');
    expect(selectCurrentItem(store.getState())).toMatchObject({ title: 'Demons In Your Choir', album: { id: ALBUM_ID } });
    expect(store.getState().player.queue).toHaveLength(3);
  });

  it('pauses/resumes instead of refetching when the album is already playing', async () => {
    fetchMock.mockImplementation(async () => json(lookupResponse('album')));
    const store = newStore();
    await store.dispatch(playAlbum(album));

    const outcome = await store.dispatch(playAlbum(album)).unwrap();

    expect(outcome).toBe('toggled');
    expect(selectIsPlaying(store.getState())).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reuses the cached lookup (shared with the album page)', async () => {
    fetchMock.mockImplementation(async () => json(lookupResponse('album')));
    const store = newStore();
    await store.dispatch(playAlbum(album));
    await store.dispatch(playAlbum(makeAlbum({ id: '42' }))); // switch away (fetch #2)
    await store.dispatch(playAlbum(album)); // back: served from cache

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reports albums without previews and leaves the player alone', async () => {
    const response = lookupResponse('album');
    response.results.forEach((row) => delete row.previewUrl);
    fetchMock.mockImplementation(async () => json(response));
    const store = newStore();

    expect(await store.dispatch(playAlbum(album)).unwrap()).toBe('no-previews');
    expect(selectCurrentItem(store.getState())).toBeNull();
  });

  it('reports a failed lookup', async () => {
    fetchMock.mockImplementation(async () => json({}, 503));
    const store = newStore();

    expect(await store.dispatch(playAlbum(album)).unwrap()).toBe('failed');
    expect(selectCurrentItem(store.getState())).toBeNull();
  });

  it('reports "failed" instead of throwing when dispatching the lookup itself throws', async () => {
    // A store missing the RTK Query middleware: what Fast Refresh used to
    // leave behind. RTK starts the query, then its dev-only check throws.
    fetchMock.mockImplementation(async () => json(lookupResponse('album')));
    const store = configureStore({ reducer: rootReducer });

    await expect(store.dispatch(playAlbum(album)).unwrap()).resolves.toBe('failed');
    expect(selectCurrentItem(store.getState())).toBeNull();
  });
});
