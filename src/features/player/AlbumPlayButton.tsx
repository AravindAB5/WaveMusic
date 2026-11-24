'use client';

import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useAppDispatch } from '@/store/hooks';
import type { Album } from '@/types/album';
import { PauseIcon, PlayIcon } from './icons';
import { playAlbum, type PlayAlbumOutcome } from './playAlbum';
import { useIsAlbumCurrent } from './usePlayback';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentContrast};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition:
    transform ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    transform: scale(1.08);
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &[aria-busy='true'] svg {
    display: none;
  }

  &[aria-busy='true']::after {
    content: '';
    width: 18px;
    height: 18px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: ${spin} 0.8s linear infinite;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const NOTICE_MS = 2500;

/**
 * Round play button for an album card: fetches the album's previews (RTK
 * Query, cached) and starts the first one; pauses/resumes if it's already
 * the album in the player. Gives spoken and visual feedback when there's
 * nothing to play.
 */
export function AlbumPlayButton({ album, className }: { album: Album; className?: string }) {
  const dispatch = useAppDispatch();
  const { isPlaying } = useIsAlbumCurrent(album.id);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Exclude<PlayAlbumOutcome, 'started' | 'toggled'> | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const onClick = async () => {
    if (pending) return;
    setPending(true);
    setNotice(null);
    try {
      const outcome = await dispatch(playAlbum(album)).unwrap();
      if (outcome === 'no-previews' || outcome === 'failed') setNotice(outcome);
    } catch {
      // The thunk reports failures as outcomes, but never let an unexpected
      // rejection escape a click handler as an unhandled runtime error.
      setNotice('failed');
    } finally {
      setPending(false);
    }
  };

  const label = pending
    ? `Loading previews of ${album.title}`
    : notice === 'no-previews'
      ? `No previews available for ${album.title}`
      : notice === 'failed'
        ? `Couldn't load previews of ${album.title}. Try again`
        : `${isPlaying ? 'Pause' : 'Play'} previews of ${album.title}`;

  return (
    <Button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-busy={pending}
      data-notice={notice ?? undefined}
    >
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
    </Button>
  );
}
