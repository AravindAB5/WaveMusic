'use client';

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector, useAppStore } from '@/store/hooks';
import {
  bufferingChanged,
  nextRequested,
  playbackFailed,
  playbackPaused,
  playbackResumed,
  previousRequested,
  progressUpdated,
  seekApplied,
  selectCurrentItem,
  selectIsPlaying,
  selectPendingSeek,
  trackEnded,
} from './playerSlice';

const finite = (n: number) => (Number.isFinite(n) ? n : 0);

/**
 * The app's only <audio> element, mounted once in the root layout. Having a
 * single element is what guarantees no two previews ever play at once, and
 * keeps playback going across client-side navigation.
 *
 * It makes the element match the player slice (source, play/pause, seeks)
 * and reports back what actually happened (progress, buffering, end, errors,
 * and pauses/plays triggered outside the app, e.g. hardware media keys).
 */
export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
  // True from a src swap until the new track is actually playing. Some
  // browsers fire "pause" during the swap; that must not read as the user
  // pausing (it would stop the track we're switching to).
  const switchingRef = useRef(false);
  const store = useAppStore();
  const dispatch = useAppDispatch();
  const current = useAppSelector(selectCurrentItem);
  const isPlaying = useAppSelector(selectIsPlaying);
  const pendingSeek = useAppSelector(selectPendingSeek);

  const trackId = current?.trackId ?? null;
  const previewUrl = current?.previewUrl ?? null;

  // Source: swap only when the track actually changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!previewUrl) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }
    switchingRef.current = true;
    audio.src = previewUrl;
  }, [trackId, previewUrl]);

  // Play / pause. Re-runs on track change so a new track starts playing.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !trackId) return;
    if (!isPlaying) {
      audio.pause();
      return;
    }
    audio.play().catch((error: unknown) => {
      const name = error instanceof DOMException ? error.name : '';
      // AbortError: a newer src/pause interrupted this play(); not a failure.
      if (name === 'AbortError') return;
      // NotAllowedError: the browser's autoplay policy wants a user gesture.
      dispatch(playbackFailed(name === 'NotAllowedError' ? 'blocked' : 'failed'));
    });
  }, [isPlaying, trackId, dispatch]);

  // Seeks requested from the UI (scrubber, "previous" restart, end-of-queue rewind).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || pendingSeek === null) return;
    audio.currentTime = pendingSeek;
    dispatch(seekApplied());
  }, [pendingSeek, dispatch]);

  // Element events → store.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const playing = () => store.getState().player.isPlaying;

    const onTimeUpdate = () =>
      dispatch(progressUpdated({ position: finite(audio.currentTime), duration: finite(audio.duration) }));
    const onWaiting = () => dispatch(bufferingChanged(true));
    const onPlaying = () => {
      switchingRef.current = false;
      dispatch(bufferingChanged(false));
    };
    const onEnded = () => dispatch(trackEnded());
    const onError = () => {
      // Clearing the source also fires "error" in some browsers; ignore that.
      if (audio.getAttribute('src')) dispatch(playbackFailed('failed'));
    };
    // Only react to pauses/plays the store didn't ask for.
    const onPause = () => {
      if (!audio.ended && !switchingRef.current && playing()) dispatch(playbackPaused());
    };
    const onPlay = () => {
      if (!playing()) dispatch(playbackResumed());
    };

    const handlers = {
      timeupdate: onTimeUpdate,
      loadedmetadata: onTimeUpdate,
      waiting: onWaiting,
      playing: onPlaying,
      ended: onEnded,
      error: onError,
      pause: onPause,
      play: onPlay,
    } as const;
    for (const [event, handler] of Object.entries(handlers)) audio.addEventListener(event, handler);
    return () => {
      for (const [event, handler] of Object.entries(handlers)) audio.removeEventListener(event, handler);
    };
  }, [dispatch, store]);

  // OS media controls (lock screen, hardware keys, browser media hub).
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !current) return;
    const session = navigator.mediaSession;
    session.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.album.title,
      artwork: [{ src: current.album.artworkUrl }],
    });
    const actions: [MediaSessionAction, () => void][] = [
      ['play', () => dispatch(playbackResumed())],
      ['pause', () => dispatch(playbackPaused())],
      ['nexttrack', () => dispatch(nextRequested())],
      ['previoustrack', () => dispatch(previousRequested())],
    ];
    for (const [action, handler] of actions) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Unsupported action in this browser.
      }
    }
    return () => {
      for (const [action] of actions) {
        try {
          session.setActionHandler(action, null);
        } catch {
          // ignore
        }
      }
    };
  }, [current, dispatch]);

  // No `controls`: the element is invisible; the mini-player is the UI.
  return <audio ref={audioRef} preload="none" data-testid="audio-engine" />;
}
