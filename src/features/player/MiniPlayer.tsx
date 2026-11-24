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

const Bar = styled.section`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: ${({ theme }) => theme.zIndices.player};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: color-mix(in srgb, ${({ theme }) => theme.colors.surface} 92%, transparent);
  backdrop-filter: saturate(1.4) blur(18px);
  padding-bottom: env(safe-area-inset-bottom);
`;

const Inner = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  grid-template-areas: 'now controls actions';
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  height: ${({ theme }) => theme.layout.playerHeightMobile};
  padding: ${({ theme }) => `0 ${theme.space(2)} 0 ${theme.space(3)}`};

  ${({ theme }) => theme.media.md} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 1fr);
    grid-template-areas: 'controls now actions';
    gap: ${({ theme }) => theme.space(4)};
    height: ${({ theme }) => theme.layout.playerHeight};
    padding: ${({ theme }) => `0 ${theme.space(4)}`};
  }
`;

/**
 * Seek bar along the top edge: a thin line that thickens and shows a thumb on
 * hover/focus. The native range input keeps it keyboard- and AT-operable.
 */
const Scrubber = styled.input`
  --track: ${({ theme }) => theme.colors.surfaceHover};
  --fill: ${({ theme }) => theme.colors.accent};
  position: absolute;
  top: -8px;
  right: 0;
  left: 0;
  width: 100%;
  height: 16px;
  margin: 0;
  background: transparent;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;

  &::-webkit-slider-runnable-track {
    height: 3px;
    background: linear-gradient(to right, var(--fill) var(--progress), var(--track) var(--progress));
    transition: height ${({ theme }) => theme.transitions.fast};
  }
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    margin-top: -5.5px;
    border: 0;
    border-radius: 50%;
    background: var(--fill);
    opacity: 0;
    transition: opacity ${({ theme }) => theme.transitions.fast};
  }
  &::-moz-range-track {
    height: 3px;
    background: var(--track);
  }
  &::-moz-range-progress {
    height: 3px;
    background: var(--fill);
  }
  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: 0;
    border-radius: 50%;
    background: var(--fill);
    opacity: 0;
  }

  &:hover::-webkit-slider-thumb,
  &:focus-visible::-webkit-slider-thumb {
    opacity: 1;
  }
  &:hover::-moz-range-thumb,
  &:focus-visible::-moz-range-thumb {
    opacity: 1;
  }
  &:focus-visible {
    outline: none;
  }
  &:focus-visible::-webkit-slider-runnable-track {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
  }
`;

const Controls = styled.div`
  grid-area: controls;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
`;

const Time = styled.span`
  display: none;
  margin-left: ${({ theme }) => theme.space(2)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;

  ${({ theme }) => theme.media.md} {
    display: inline;
  }
`;

const Now = styled.div`
  grid-area: now;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  min-width: 0;

  ${({ theme }) => theme.media.md} {
    justify-content: center;
  }
`;

const Art = styled.div`
  position: relative;
  flex: none;
  width: 48px;
  height: 48px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surfaceRaised};
`;

const Info = styled.div`
  min-width: 0;

  p {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`;

const NowTitle = styled.p`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const NowSub = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};

  a {
    text-decoration: none;

    &:hover {
      color: ${({ theme }) => theme.colors.text};
      text-decoration: underline;
    }
  }
`;

const ErrorText = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
`;

const Actions = styled.div`
  grid-area: actions;
  display: flex;
  justify-content: flex-end;
`;

const IconButton = styled.button<{ $primary?: boolean; $desktopOnly?: boolean }>`
  display: ${({ $desktopOnly }) => ($desktopOnly ? 'none' : 'inline-flex')};
  align-items: center;
  justify-content: center;
  width: ${({ $primary }) => ($primary ? '48px' : '44px')};
  height: ${({ $primary }) => ($primary ? '48px' : '44px')};
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $primary, theme }) => ($primary ? theme.colors.text : 'transparent')};
  color: ${({ $primary, theme }) => ($primary ? theme.colors.bg : theme.colors.text)};
  transition:
    background ${({ theme }) => theme.transitions.fast},
    transform ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ $primary, theme }) => ($primary ? theme.colors.text : theme.colors.surfaceHover)};
    transform: ${({ $primary }) => ($primary ? 'scale(1.05)' : 'none')};
  }

  &:disabled {
    cursor: default;
    opacity: 0.35;
  }

  svg {
    width: ${({ $primary }) => ($primary ? '22px' : '20px')};
    height: ${({ $primary }) => ($primary ? '22px' : '20px')};
  }

  ${({ theme }) => theme.media.md} {
    display: inline-flex;
  }
`;

/** Keeps page content from ending up underneath the fixed bar. */
const Spacer = styled.div`
  height: ${({ theme }) => theme.layout.playerHeightMobile};

  ${({ theme }) => theme.media.md} {
    height: ${({ theme }) => theme.layout.playerHeight};
  }
`;

const MobileRow = styled.div`
  display: flex;
  align-items: center;
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
  const clamped = Math.min(position, max);
  const elapsed = formatDuration(clamped * 1000);
  const total = formatDuration(max * 1000);
  const progressStyle = { '--progress': `${(clamped / max) * 100}%` } as React.CSSProperties;

  return (
    <>
      <Spacer aria-hidden="true" />
      <Bar aria-label="Now playing">
        {/* Announces track changes (including auto-advance) without moving focus. */}
        <VisuallyHidden role="status" aria-live="polite">
          {`Now playing: ${current.title} by ${current.artist}`}
        </VisuallyHidden>
        <Scrubber
          type="range"
          min={0}
          max={max}
          step={0.1}
          value={clamped}
          style={progressStyle}
          aria-label="Seek"
          aria-valuetext={`${elapsed} of ${total}`}
          onChange={(event) => dispatch(seekRequested(Number(event.target.value)))}
        />
        <Inner>
          <Controls>
            <MobileRow>
              <IconButton
                type="button"
                $desktopOnly
                onClick={() => dispatch(previousRequested())}
                aria-label="Previous track"
              >
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
              <IconButton
                type="button"
                onClick={() => dispatch(nextRequested())}
                disabled={!hasNext}
                aria-label="Next track"
              >
                <NextIcon />
              </IconButton>
              <Time aria-hidden="true">
                {elapsed} / {total}
              </Time>
            </MobileRow>
          </Controls>
          <Now>
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
                  {current.artist} • <Link href={`/album/${current.album.id}`}>{current.album.title}</Link>
                </NowSub>
              )}
            </Info>
          </Now>
          <Actions>
            <IconButton type="button" onClick={() => dispatch(playerClosed())} aria-label="Close player">
              <CloseIcon />
            </IconButton>
          </Actions>
        </Inner>
      </Bar>
    </>
  );
}
