'use client';

import styled from 'styled-components';
import { useAppDispatch } from '@/store/hooks';
import { PauseIcon, PlayIcon } from './icons';
import { togglePlayback, type QueueItem } from './playerSlice';
import { useIsAlbumCurrent, usePlayback } from './usePlayback';

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.bg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: transform ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    transform: scale(1.06);
  }

  &:disabled {
    cursor: progress;
    opacity: 0.5;
  }

  svg {
    width: 28px;
    height: 28px;
  }
`;

interface PlayAllButtonProps {
  albumId: string;
  /** Empty while tracks are loading (the button is then disabled). */
  queue: readonly QueueItem[];
}

/**
 * The album's big play button. Starts from the first preview; if this album
 * is already in the player it pauses/resumes wherever playback is.
 */
export function PlayAllButton({ albumId, queue }: PlayAllButtonProps) {
  const dispatch = useAppDispatch();
  const { isCurrent, isPlaying } = useIsAlbumCurrent(albumId);
  const startFromTop = usePlayback(queue, 0).toggle;

  const label = isPlaying ? 'Pause album' : isCurrent ? 'Resume album' : 'Play album previews';

  return (
    <Button
      type="button"
      onClick={isCurrent ? () => dispatch(togglePlayback()) : startFromTop}
      disabled={!isCurrent && queue.length === 0}
      aria-label={label}
      title={label}
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </Button>
  );
}
