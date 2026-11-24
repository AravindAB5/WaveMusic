'use client';

import { Fragment } from 'react';
import styled from 'styled-components';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { describeDuration, formatDuration, formatTotalDuration } from '@/lib/format';
import type { Track } from '@/types/album';

const Summary = styled.p`
  margin-bottom: ${({ theme }) => theme.space(3)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
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
  grid-template-columns: 2.5rem minmax(0, 1fr) auto;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  min-height: 56px;
  padding: ${({ theme }) => `${theme.space(2)} ${theme.space(2)}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TrackNumber = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const Titles = styled.div`
  min-width: 0;
`;

const TrackTitle = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  font-weight: ${({ theme }) => theme.fontWeights.medium};

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

interface TrackListProps {
  tracks: readonly Track[];
  /** Track artists equal to this are not repeated under each title. */
  albumArtist: string;
}

/** Songs in play order, grouped by disc when there's more than one. */
export function TrackList({ tracks, albumArtist }: TrackListProps) {
  const totalMs = tracks.reduce((sum, t) => sum + (t.durationMs ?? 0), 0);
  const discs = [...new Set(tracks.map((t) => t.discNumber))];
  const multiDisc = discs.length > 1;

  return (
    <>
      <Summary>
        {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
        {totalMs > 0 && `, ${formatTotalDuration(totalMs)}`}
      </Summary>
      {discs.map((disc) => (
        <Fragment key={disc}>
          {multiDisc && <DiscHeading>Disc {disc}</DiscHeading>}
          {/* Explicit role: Safari drops list semantics when list-style is none. */}
          <List role="list" aria-label={multiDisc ? `Disc ${disc} tracks` : 'Tracks'}>
            {tracks
              .filter((t) => t.discNumber === disc)
              .map((track) => (
                <Row key={track.id}>
                  <TrackNumber aria-hidden="true">{track.trackNumber}</TrackNumber>
                  <Titles>
                    <TrackTitle>
                      <span>{track.title}</span>
                      {track.explicit && <Explicit title="Explicit">E</Explicit>}
                    </TrackTitle>
                    {track.artist !== albumArtist && <TrackArtist>{track.artist}</TrackArtist>}
                  </Titles>
                  {track.durationMs !== null && (
                    <Duration>
                      <span aria-hidden="true">{formatDuration(track.durationMs)}</span>
                      <VisuallyHidden>{describeDuration(track.durationMs)}</VisuallyHidden>
                    </Duration>
                  )}
                </Row>
              ))}
          </List>
        </Fragment>
      ))}
    </>
  );
}
