'use client';

import { Fragment, useMemo } from 'react';
import styled from 'styled-components';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { NowPlayingIcon, PauseIcon, PlayIcon } from '@/features/player/icons';
import { togglePlayback, type QueueItem } from '@/features/player/playerSlice';
import { buildQueue } from '@/features/player/queue';
import { useIsAlbumCurrent, usePlayback } from '@/features/player/usePlayback';
import { describeDuration, formatDuration, formatTotalDuration } from '@/lib/format';
import { useAppDispatch } from '@/store/hooks';
import type { Album, Track } from '@/types/album';

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  margin-bottom: ${({ theme }) => theme.space(3)};
`;

const Summary = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const PlayAll = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  min-height: 44px;
  padding: ${({ theme }) => `0 ${theme.space(5)} 0 ${theme.space(4)}`};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentContrast};
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const DiscHeading = styled.h3`
  margin: ${({ theme }) => `${theme.space(6)} 0 ${theme.space(2)}`};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const List = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const Row = styled.li`
  display: grid;
  grid-template-columns: 44px 1.75rem minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  min-height: 56px;
  padding: ${({ theme }) => `${theme.space(1)} ${theme.space(2)} ${theme.space(1)} 0`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &[aria-current='true'] {
    background: ${({ theme }) => theme.colors.surface};
  }
`;

const RowButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.surfaceRaised};
    color: ${({ theme }) => theme.colors.accent};
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.border};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const TrackNumber = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
  text-align: right;

  svg {
    display: inline-block;
    width: 14px;
    height: 14px;
    color: ${({ theme }) => theme.colors.accent};
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

const TrackArtist = styled.p`
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
  color: ${({ theme }) => theme.colors.surface};
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
      <RowButton type="button" onClick={toggle} disabled={!hasPreview} aria-label={label} title={label}>
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </RowButton>
      <TrackNumber aria-hidden="true">{isCurrent ? <NowPlayingIcon /> : track.trackNumber}</TrackNumber>
      <Titles>
        <TrackTitle $current={isCurrent}>
          <span>{track.title}</span>
          {track.explicit && <Explicit title="Explicit">E</Explicit>}
          {isCurrent && <VisuallyHidden>(now playing)</VisuallyHidden>}
        </TrackTitle>
        {track.artist !== albumArtist && <TrackArtist>{track.artist}</TrackArtist>}
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

function PlayAllButton({ album, queue }: { album: Pick<Album, 'id'>; queue: readonly QueueItem[] }) {
  const dispatch = useAppDispatch();
  const { isCurrent, isPlaying } = useIsAlbumCurrent(album.id);
  const startFromTop = usePlayback(queue, 0).toggle;

  // If this album is already in the player, pause/resume wherever it is;
  // otherwise start from the first preview.
  const onClick = isCurrent ? () => dispatch(togglePlayback()) : startFromTop;

  return (
    <PlayAll type="button" onClick={onClick}>
      {isPlaying ? <PauseIcon /> : <PlayIcon />}
      {isPlaying ? 'Pause' : isCurrent ? 'Resume' : 'Play previews'}
    </PlayAll>
  );
}

interface TrackListProps {
  tracks: readonly Track[];
  album: Pick<Album, 'id' | 'title' | 'artist' | 'artworkUrl'>;
}

/** Songs in play order, grouped by disc when there's more than one, each with a preview button. */
export function TrackList({ tracks, album }: TrackListProps) {
  const queue = useMemo(() => buildQueue(album, tracks), [album, tracks]);
  const totalMs = tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
  const discs = [...new Set(tracks.map((t) => t.discNumber))];
  const multiDisc = discs.length > 1;

  return (
    <>
      <Toolbar>
        <Summary>
          {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
          {totalMs > 0 && `, ${formatTotalDuration(totalMs)}`}
          {queue.length < tracks.length && ` · ${queue.length} with previews`}
        </Summary>
        {queue.length > 0 && <PlayAllButton album={album} queue={queue} />}
      </Toolbar>
      {discs.map((disc) => (
        <Fragment key={disc}>
          {multiDisc && <DiscHeading>Disc {disc}</DiscHeading>}
          {/* Explicit role: Safari drops list semantics when list-style is none. */}
          <List role="list" aria-label={multiDisc ? `Disc ${disc} tracks` : 'Tracks'}>
            {tracks
              .filter((t) => t.discNumber === disc)
              .map((track) => (
                <TrackRow key={track.id} track={track} albumArtist={album.artist} queue={queue} />
              ))}
          </List>
        </Fragment>
      ))}
    </>
  );
}
