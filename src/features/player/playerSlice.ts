import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** One playable preview, with enough album context to show in the mini-player. */
export interface QueueItem {
  trackId: string;
  title: string;
  artist: string;
  previewUrl: string;
  album: { id: string; title: string; artworkUrl: string };
}

export type PlaybackError = 'blocked' | 'failed';

/**
 * Redux holds what *should* happen (queue, current index, play/pause,
 * seek requests); the single AudioEngine makes the <audio> element match and
 * reports back what *did* happen (progress, buffering, end, errors).
 */
export interface PlayerState {
  queue: QueueItem[];
  index: number;
  /** Desired state: the engine plays when true, pauses when false. */
  isPlaying: boolean;
  /** Reported by the engine while audio is loading. */
  isBuffering: boolean;
  /** Seconds. */
  position: number;
  /** Seconds; 0 until metadata loads. */
  duration: number;
  error: PlaybackError | null;
  /** A seek for the engine to apply, then clear. */
  pendingSeek: number | null;
}

export const initialPlayerState: PlayerState = {
  queue: [],
  index: 0,
  isPlaying: false,
  isBuffering: false,
  position: 0,
  duration: 0,
  error: null,
  pendingSeek: null,
};

/** Within this many seconds of the start, "previous" goes to the previous track instead of restarting. */
export const RESTART_THRESHOLD_SECONDS = 3;

function startTrack(state: PlayerState, index: number) {
  state.index = index;
  state.isPlaying = true;
  state.isBuffering = true;
  state.position = 0;
  state.duration = 0;
  state.error = null;
  state.pendingSeek = null;
}

export const playerSlice = createSlice({
  name: 'player',
  initialState: initialPlayerState,
  reducers: {
    /** Replace the queue and start playing `index`. */
    playRequested(state, action: PayloadAction<{ queue: QueueItem[]; index: number }>) {
      const { queue, index } = action.payload;
      if (!queue[index]) return;
      state.queue = queue;
      startTrack(state, index);
    },
    togglePlayback(state) {
      if (state.queue.length === 0) return;
      state.isPlaying = !state.isPlaying;
      if (state.isPlaying) state.error = null;
    },
    /** The audio paused for a reason outside the app (media keys, headphones unplugged). */
    playbackPaused(state) {
      state.isPlaying = false;
      state.isBuffering = false;
    },
    /** The audio resumed from outside the app (media keys). */
    playbackResumed(state) {
      if (state.queue.length > 0) state.isPlaying = true;
    },
    nextRequested(state) {
      if (state.index < state.queue.length - 1) startTrack(state, state.index + 1);
    },
    previousRequested(state) {
      if (state.position > RESTART_THRESHOLD_SECONDS || state.index === 0) {
        state.pendingSeek = 0;
        state.position = 0;
      } else {
        startTrack(state, state.index - 1);
      }
    },
    /** Auto-advance; at the end of the queue, stop and rewind. */
    trackEnded(state) {
      if (state.index < state.queue.length - 1) {
        startTrack(state, state.index + 1);
      } else {
        state.isPlaying = false;
        state.isBuffering = false;
        state.position = 0;
        state.pendingSeek = 0;
      }
    },
    progressUpdated(state, action: PayloadAction<{ position: number; duration: number }>) {
      state.position = action.payload.position;
      state.duration = action.payload.duration;
    },
    bufferingChanged(state, action: PayloadAction<boolean>) {
      state.isBuffering = action.payload;
    },
    playbackFailed(state, action: PayloadAction<PlaybackError>) {
      state.isPlaying = false;
      state.isBuffering = false;
      state.error = action.payload;
    },
    seekRequested(state, action: PayloadAction<number>) {
      const max = state.duration > 0 ? state.duration : Number.POSITIVE_INFINITY;
      const seconds = Math.min(Math.max(0, action.payload), max);
      state.pendingSeek = seconds;
      state.position = seconds;
    },
    seekApplied(state) {
      state.pendingSeek = null;
    },
    /** Stop and hide the mini-player. */
    playerClosed() {
      return initialPlayerState;
    },
  },
  selectors: {
    selectQueue: (state) => state.queue,
    selectCurrentItem: (state): QueueItem | null => state.queue[state.index] ?? null,
    selectIsPlaying: (state) => state.isPlaying,
    selectIsBuffering: (state) => state.isBuffering,
    selectPosition: (state) => state.position,
    selectDuration: (state) => state.duration,
    selectPlayerError: (state) => state.error,
    selectPendingSeek: (state) => state.pendingSeek,
    selectHasNext: (state) => state.index < state.queue.length - 1,
    selectHasPrevious: (state) => state.queue.length > 0,
  },
});

export const {
  playRequested,
  togglePlayback,
  playbackPaused,
  playbackResumed,
  nextRequested,
  previousRequested,
  trackEnded,
  progressUpdated,
  bufferingChanged,
  playbackFailed,
  seekRequested,
  seekApplied,
  playerClosed,
} = playerSlice.actions;

export const {
  selectQueue,
  selectCurrentItem,
  selectIsPlaying,
  selectIsBuffering,
  selectPosition,
  selectDuration,
  selectPlayerError,
  selectPendingSeek,
  selectHasNext,
  selectHasPrevious,
} = playerSlice.selectors;
