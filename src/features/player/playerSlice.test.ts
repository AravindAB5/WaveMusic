/** @jest-environment node */
import { makeStore } from '@/store/store';
import type { Track } from '@/types/album';
import {
  bufferingChanged,
  initialPlayerState,
  nextRequested,
  playbackFailed,
  playbackPaused,
  playbackResumed,
  playerClosed,
  playRequested,
  previousRequested,
  progressUpdated,
  seekApplied,
  seekRequested,
  selectCurrentItem,
  selectHasNext,
  togglePlayback,
  trackEnded,
  type QueueItem,
} from './playerSlice';
import { buildQueue } from './queue';

const item = (n: number): QueueItem => ({
  trackId: `t${n}`,
  title: `Track ${n}`,
  artist: 'Artist',
  previewUrl: `https://audio-ssl.itunes.apple.com/preview${n}.m4a`,
  album: { id: 'a1', title: 'Album', artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/x/100x100bb.jpg' },
});
const queue = [item(1), item(2), item(3)];

const started = (index = 0) => {
  const store = makeStore();
  store.dispatch(playRequested({ queue, index }));
  return store;
};
const player = (store: ReturnType<typeof makeStore>) => store.getState().player;

describe('playerSlice', () => {
  it('starts idle with nothing loaded', () => {
    expect(player(makeStore())).toEqual(initialPlayerState);
    expect(selectCurrentItem(makeStore().getState())).toBeNull();
  });

  it('loads a queue and plays the requested track', () => {
    const store = started(1);
    expect(selectCurrentItem(store.getState())?.trackId).toBe('t2');
    expect(player(store)).toMatchObject({ isPlaying: true, isBuffering: true, position: 0, error: null });
  });

  it('ignores a request for an index outside the queue', () => {
    const store = makeStore();
    store.dispatch(playRequested({ queue, index: 9 }));
    expect(player(store)).toEqual(initialPlayerState);
  });

  it('replacing the queue switches track (one thing plays at a time)', () => {
    const store = started(0);
    store.dispatch(playRequested({ queue: [item(7)], index: 0 }));
    expect(selectCurrentItem(store.getState())?.trackId).toBe('t7');
    expect(player(store).queue).toHaveLength(1);
  });

  it('toggles play/pause, and clears a previous error on resume', () => {
    const store = started();
    store.dispatch(togglePlayback());
    expect(player(store).isPlaying).toBe(false);
    store.dispatch(playbackFailed('blocked'));
    store.dispatch(togglePlayback());
    expect(player(store)).toMatchObject({ isPlaying: true, error: null });
  });

  it('does nothing on toggle with an empty queue', () => {
    const store = makeStore();
    store.dispatch(togglePlayback());
    expect(player(store).isPlaying).toBe(false);
  });

  it('follows pauses and resumes from outside the app', () => {
    const store = started();
    store.dispatch(playbackPaused());
    expect(player(store).isPlaying).toBe(false);
    store.dispatch(playbackResumed());
    expect(player(store).isPlaying).toBe(true);
  });

  it('moves to the next track and stops at the end of the queue', () => {
    const store = started(1);
    store.dispatch(nextRequested());
    expect(selectCurrentItem(store.getState())?.trackId).toBe('t3');
    expect(selectHasNext(store.getState())).toBe(false);
    store.dispatch(nextRequested());
    expect(selectCurrentItem(store.getState())?.trackId).toBe('t3');
  });

  it('"previous" restarts the track after 3 seconds, otherwise goes back', () => {
    const store = started(1);
    store.dispatch(progressUpdated({ position: 12, duration: 30 }));
    store.dispatch(previousRequested());
    expect(player(store)).toMatchObject({ index: 1, pendingSeek: 0, position: 0 });

    store.dispatch(previousRequested());
    expect(selectCurrentItem(store.getState())?.trackId).toBe('t1');
  });

  it('"previous" on the first track restarts it', () => {
    const store = started(0);
    store.dispatch(previousRequested());
    expect(player(store)).toMatchObject({ index: 0, pendingSeek: 0 });
  });

  it('auto-advances when a track ends, then stops and rewinds after the last', () => {
    const store = started(1);
    store.dispatch(trackEnded());
    expect(player(store)).toMatchObject({ index: 2, isPlaying: true });

    store.dispatch(trackEnded());
    expect(player(store)).toMatchObject({ index: 2, isPlaying: false, position: 0, pendingSeek: 0 });
  });

  it('records progress, buffering and failures', () => {
    const store = started();
    store.dispatch(progressUpdated({ position: 4.2, duration: 29.9 }));
    store.dispatch(bufferingChanged(false));
    expect(player(store)).toMatchObject({ position: 4.2, duration: 29.9, isBuffering: false });

    store.dispatch(playbackFailed('failed'));
    expect(player(store)).toMatchObject({ isPlaying: false, error: 'failed' });
  });

  it('clamps seeks to the track and hands them to the engine once', () => {
    const store = started();
    store.dispatch(progressUpdated({ position: 0, duration: 30 }));
    store.dispatch(seekRequested(45));
    expect(player(store)).toMatchObject({ pendingSeek: 30, position: 30 });
    store.dispatch(seekRequested(-5));
    expect(player(store).pendingSeek).toBe(0);
    store.dispatch(seekApplied());
    expect(player(store).pendingSeek).toBeNull();
  });

  it('closing resets everything', () => {
    const store = started();
    store.dispatch(playerClosed());
    expect(player(store)).toEqual(initialPlayerState);
  });
});

describe('buildQueue', () => {
  const album = { id: 'a1', title: 'Album', artworkUrl: 'https://example.com/a.jpg' };
  const track = (n: number, previewUrl: string | null): Track => ({
    id: `t${n}`,
    title: `Track ${n}`,
    artist: 'Artist',
    trackNumber: n,
    discNumber: 1,
    durationMs: 1000,
    previewUrl,
    explicit: false,
  });

  it('keeps only tracks with previews, in order, with album context', () => {
    const result = buildQueue(album, [track(1, 'https://p/1.m4a'), track(2, null), track(3, 'https://p/3.m4a')]);
    expect(result.map((q) => q.trackId)).toEqual(['t1', 't3']);
    expect(result[0]).toEqual({
      trackId: 't1',
      title: 'Track 1',
      artist: 'Artist',
      previewUrl: 'https://p/1.m4a',
      album,
    });
  });
});
