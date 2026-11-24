'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { playRequested, selectCurrentItem, selectIsPlaying, togglePlayback, type QueueItem } from './playerSlice';

/**
 * Play/pause for one item within a queue (a track row, or "Play all" with
 * index 0). Clicking the item that's already current toggles it; anything
 * else replaces the queue and starts there, which also stops whatever was
 * playing, since there's only ever one audio element.
 */
export function usePlayback(queue: readonly QueueItem[], index: number) {
  const dispatch = useAppDispatch();
  const current = useAppSelector(selectCurrentItem);
  const isPlaying = useAppSelector(selectIsPlaying);

  const item = queue[index];
  const isCurrent = item !== undefined && current?.trackId === item.trackId;

  const toggle = () => {
    if (!item) return;
    if (isCurrent) dispatch(togglePlayback());
    else dispatch(playRequested({ queue: [...queue], index }));
  };

  return { isCurrent, isPlaying: isCurrent && isPlaying, toggle };
}

/** Whether any track from this album is the current one. */
export function useIsAlbumCurrent(albumId: string): { isCurrent: boolean; isPlaying: boolean } {
  const current = useAppSelector(selectCurrentItem);
  const isPlaying = useAppSelector(selectIsPlaying);
  const isCurrent = current?.album.id === albumId;
  return { isCurrent, isPlaying: isCurrent && isPlaying };
}
