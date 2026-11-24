'use client';

import { Fragment } from 'react';
import styled from 'styled-components';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { NowPlayingIcon, PauseIcon, PlayIcon } from '@/features/player/icons';
import type { QueueItem } from '@/features/player/playerSlice';
import { usePlayback } from '@/features/player/usePlayback';
import { describeDuration, formatDuration } from '@/lib/format';
import type { Track } from '@/types/album';

const Note = styled.p`
  margin-bottom: ${({ theme }) => theme.space(2)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const DiscHeading = styled.h3`
  margin: ${({ theme }) => `${theme.space(6)} 0 ${theme.space(2)}`};
  padding-left: ${({ theme }) => theme.space(3)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const List = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const Row = styled.li`
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  min-height: 64px;
  padding: ${({ theme }) => `${theme.space(1)} ${theme.space(4)} ${theme.space(1)} ${theme.space(1)}`};
  border-radius: ${({ theme }) => theme.radii.md};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  &[aria-current='true'] {
    background: ${({ theme }) => theme.colors.surfaceRaised};
  }
`;

/**
 * The number column doubles as the play button (shows the track number;
 * swaps to a play icon on row hover or keyboard focus, and shows the
 * play/pause state for the current track).
 */
const RowButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;

  svg {
    width: 18px;
    height: 18px;
  }

  .icon {
    display: none;
    color: ${({ theme }) => theme.colors.text};
  }

  ${Row}:hover &:not(:disabled),
  &:focus-visible {
    .number {
      display: none;
    }
    .icon {
      display: inline-flex;
    }
  }

  &[data-current='true'] {
    color: ${({ theme }) => theme.colors.accent};

    .number {
      display: none;
    }
    .icon {
      display: inline-flex;
      color: ${({ theme }) => theme.colors.accent};
    }
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const Titles = styled.div`
  min-width: 0;
`;

const TrackTitle = styled.p<{ $current: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ $current, theme }) => ($current ? theme.colors.accent : 'inherit')};

  span:first-child {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`;

const TrackSub = styled.p`
  overflow: hidden;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Explicit = styled.abbr`
  flex: none;
  padding: 0 4px;
  border-radius: 3px;
  background: ${({ theme }) => theme.colors.textMuted};
  color: ${({ theme }) => theme.colors.bg};
  font-size: 0.625rem;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 1.5;
  text-decoration: none;
`;

const Duration = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;

interface TrackRowProps {
  track: Track;
  albumArtist: string;
  queue: readonly QueueItem[];
}

function TrackRow({ track, albumArtist, queue }: TrackRowProps) {
  const queueIndex = queue.findIndex((item) => item.trackId === track.id);
  const { isCurrent, isPlaying, toggle } = usePlayback(queue, queueIndex);
  const hasPreview = queueIndex !== -1;

  const label = !hasPreview
    ? `No preview available for ${track.title}`
    : `${isPlaying ? 'Pause' : 'Play'} preview of ${track.title}`;

  return (
    <Row aria-current={isCurrent ? 'true' : undefined}>
      <RowButton
        type="button"
        onClick={toggle}
        disabled={!hasPreview}
        aria-label={label}
        title={label}
        data-current={isCurrent}
      >
        <span className="number" aria-hidden="true">
          {track.trackNumber}
        </span>
        <span className="icon" aria-hidden="true">
          {isPlaying ? <PauseIcon /> : isCurrent ? <NowPlayingIcon /> : <PlayIcon />}
        </span>
      </RowButton>
      <Titles>
        <TrackTitle $current={isCurrent}>
          <span>{track.title}</span>
          {track.explicit && <Explicit title="Explicit">E</Explicit>}
          {isCurrent && <VisuallyHidden>(now playing)</VisuallyHidden>}
        </TrackTitle>
        {track.artist !== albumArtist && <TrackSub>{track.artist}</TrackSub>}
      </Titles>
      {track.durationMs !== null ? (
        <Duration>
          <span aria-hidden="true">{formatDuration(track.durationMs)}</span>
          <VisuallyHidden>{describeDuration(track.durationMs)}</VisuallyHidden>
        </Duration>
      ) : (
        <span />
      )}
    </Row>
  );
}

interface TrackListProps {
  tracks: readonly Track[];
  /** Track artists equal to this are not repeated under each title. */
  albumArtist: string;
  /** The album's playable previews (see buildQueue). */
  queue: readonly QueueItem[];
}

/** Songs in play order, grouped by disc when there's more than one, each with a preview button. */
export function TrackList({ tracks, albumArtist, queue }: TrackListProps) {
  const discs = [...new Set(tracks.map((t) => t.discNumber))];
  const multiDisc = discs.length > 1;

  return (
    <>
      {queue.length < tracks.length && (
        <Note>
          {queue.length} of {tracks.length} songs have previews.
        </Note>
      )}
      {discs.map((disc) => (
        <Fragment key={disc}>
          {multiDisc && <DiscHeading>Disc {disc}</DiscHeading>}
          {/* Explicit role: Safari drops list semantics when list-style is none. */}
          <List role="list" aria-label={multiDisc ? `Disc ${disc} tracks` : 'Tracks'}>
            {tracks
              .filter((t) => t.discNumber === disc)
              .map((track) => (
                <TrackRow key={track.id} track={track} albumArtist={albumArtist} queue={queue} />
              ))}
          </List>
        </Fragment>
      ))}
    </>
  );
}
