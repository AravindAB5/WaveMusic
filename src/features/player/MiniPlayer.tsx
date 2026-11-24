'use client';

import Image from 'next/image';
import Link from 'next/link';
import styled from 'styled-components';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { formatDuration } from '@/lib/format';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { CloseIcon, NextIcon, PauseIcon, PlayIcon, PreviousIcon } from './icons';
import {
  nextRequested,
  playerClosed,
  previousRequested,
  seekRequested,
  selectCurrentItem,
  selectDuration,
  selectHasNext,
  selectIsBuffering,
  selectIsPlaying,
  selectPlayerError,
  selectPosition,
  togglePlayback,
} from './playerSlice';

/** iTunes previews are ~30s; used for the scrubber until real metadata loads. */
const FALLBACK_DURATION = 30;

const PLAYER_HEIGHT = { mobile: 116, desktop: 80 };

const Bar = styled.section`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: ${({ theme }) => theme.zIndices.player};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  padding-bottom: env(safe-area-inset-bottom);
`;

const Inner = styled.div`
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto auto;
  grid-template-areas:
    'art info controls close'
    'progress progress progress progress';
  align-items: center;
  column-gap: ${({ theme }) => theme.space(3)};
  row-gap: ${({ theme }) => theme.space(1)};
  max-width: ${({ theme }) => theme.layout.maxWidth};
  min-height: ${PLAYER_HEIGHT.mobile}px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.space(2)} ${theme.space(4)}`};

  ${({ theme }) => theme.media.md} {
    grid-template-columns: 48px minmax(0, 1fr) auto minmax(200px, 2fr) auto;
    grid-template-areas: 'art info controls progress close';
    min-height: ${PLAYER_HEIGHT.desktop}px;
    padding: ${({ theme }) => `${theme.space(2)} ${theme.space(6)}`};
  }
`;

const Art = styled.div`
  grid-area: art;
  position: relative;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surfaceRaised};
`;

const Info = styled.div`
  grid-area: info;
  min-width: 0;

  p {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`;

const NowTitle = styled.p`
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const NowSub = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  a {
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
`;

const Controls = styled.div`
  grid-area: controls;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
`;

const IconButton = styled.button<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $primary, theme }) => ($primary ? theme.colors.accent : 'transparent')};
  color: ${({ $primary, theme }) => ($primary ? theme.colors.accentContrast : theme.colors.text)};

  &:hover:not(:disabled) {
    background: ${({ $primary, theme }) => ($primary ? theme.colors.accentHover : theme.colors.surfaceRaised)};
  }

  &:disabled {
    cursor: default;
    opacity: 0.4;
  }

  svg {
    width: ${({ $primary }) => ($primary ? '20px' : '18px')};
    height: ${({ $primary }) => ($primary ? '20px' : '18px')};
  }
`;

const Progress = styled.div`
  grid-area: progress;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;

  input {
    width: 100%;
    accent-color: ${({ theme }) => theme.colors.accent};
    cursor: pointer;
  }
`;

const Close = styled.div`
  grid-area: close;
`;

/** Keeps page content from ending up underneath the fixed bar. */
const Spacer = styled.div`
  height: ${PLAYER_HEIGHT.mobile}px;

  ${({ theme }) => theme.media.md} {
    height: ${PLAYER_HEIGHT.desktop}px;
  }
`;

/**
 * Persistent now-playing bar, mounted in the root layout so it (and the
 * audio) survive navigation between pages. Hidden until something plays.
 */
export function MiniPlayer() {
  const dispatch = useAppDispatch();
  const current = useAppSelector(selectCurrentItem);
  const isPlaying = useAppSelector(selectIsPlaying);
  const isBuffering = useAppSelector(selectIsBuffering);
  const position = useAppSelector(selectPosition);
  const duration = useAppSelector(selectDuration);
  const hasNext = useAppSelector(selectHasNext);
  const error = useAppSelector(selectPlayerError);

  if (!current) return null;

  const max = duration > 0 ? duration : FALLBACK_DURATION;
  const valueText = `${formatDuration(position * 1000)} of ${formatDuration(max * 1000)}`;

  return (
    <>
      <Spacer aria-hidden="true" />
      <Bar aria-label="Now playing">
        {/* Announces track changes (including auto-advance) without moving focus. */}
        <VisuallyHidden role="status" aria-live="polite">
          {`Now playing: ${current.title} by ${current.artist}`}
        </VisuallyHidden>
        <Inner>
          <Art>
            <Image src={current.album.artworkUrl} alt="" fill sizes="48px" />
          </Art>
          <Info>
            <NowTitle title={current.title}>{current.title}</NowTitle>
            {error ? (
              <ErrorText role="alert">
                {error === 'blocked' ? 'Press play to start the preview.' : "This preview couldn't be played."}
              </ErrorText>
            ) : (
              <NowSub>
                {current.artist} · <Link href={`/album/${current.album.id}`}>{current.album.title}</Link>
              </NowSub>
            )}
          </Info>
          <Controls>
            <IconButton type="button" onClick={() => dispatch(previousRequested())} aria-label="Previous track">
              <PreviousIcon />
            </IconButton>
            <IconButton
              type="button"
              $primary
              onClick={() => dispatch(togglePlayback())}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              aria-busy={isBuffering && isPlaying}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
            <IconButton type="button" onClick={() => dispatch(nextRequested())} disabled={!hasNext} aria-label="Next track">
              <NextIcon />
            </IconButton>
          </Controls>
          <Progress>
            <span aria-hidden="true">{formatDuration(position * 1000)}</span>
            <input
              type="range"
              min={0}
              max={max}
              step={0.1}
              value={Math.min(position, max)}
              aria-label="Seek"
              aria-valuetext={valueText}
              onChange={(event) => dispatch(seekRequested(Number(event.target.value)))}
            />
            <span aria-hidden="true">{formatDuration(max * 1000)}</span>
          </Progress>
          <Close>
            <IconButton type="button" onClick={() => dispatch(playerClosed())} aria-label="Close player">
              <CloseIcon />
            </IconButton>
          </Close>
        </Inner>
      </Bar>
    </>
  );
}
