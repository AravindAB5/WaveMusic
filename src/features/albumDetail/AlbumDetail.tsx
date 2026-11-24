'use client';

import { useMemo } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/Button';
import { StatusPanel } from '@/components/ui/StatusPanel';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { buildQueue } from '@/features/player/queue';
import { useGetAlbumLookupQuery } from '@/store/itunesApi';
import type { Album } from '@/types/album';
import { AlbumBackdrop } from './AlbumBackdrop';
import { AlbumDetailSkeleton, TrackListSkeleton } from './AlbumDetailSkeleton';
import { AlbumHeader } from './AlbumHeader';
import { BackLink } from './BackLink';
import { TrackList } from './TrackList';

/** Hero column + tracks column from 1024px; stacked and centered below. */
const Layout = styled.div`
  position: relative;
  display: grid;
  gap: ${({ theme }) => theme.space(8)};

  ${({ theme }) => theme.media.lg} {
    grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
    align-items: start;
    gap: ${({ theme }) => theme.space(12)};
  }
`;

const Section = styled.section`
  min-width: 0;
`;

interface AlbumDetailProps {
  albumId: string;
  /**
   * The album as it appears in today's chart, from the server. Lets the header
   * render immediately (and in the server HTML) while tracks load. Null when
   * the album isn't charting (e.g. an old favorite) or the feed was unreachable.
   */
  chartAlbum: Album | null;
}

/**
 * Album page body. The header comes from the chart when possible, otherwise
 * from the Lookup's collection row; the track list always comes from the
 * Lookup via RTK Query (cached, shared across visits to the same album).
 */
export function AlbumDetail({ albumId, chartAlbum }: AlbumDetailProps) {
  const { data, error, isFetching, refetch } = useGetAlbumLookupQuery(albumId);

  // Prefer the chart's copy: it carries the current rank.
  const album = chartAlbum ?? data?.album ?? null;
  const tracks = data?.tracks ?? null;
  const queue = useMemo(() => (album && tracks ? buildQueue(album, tracks) : []), [album, tracks]);

  const retry = (
    <Button type="button" onClick={() => refetch()} disabled={isFetching}>
      {isFetching ? 'Retrying…' : 'Try again'}
    </Button>
  );

  if (!album) {
    if (error && !isFetching) {
      return (
        <>
          <BackLink />
          <StatusPanel role="alert" title="We couldn't load this album" action={retry}>
            iTunes didn&apos;t respond as expected. This is usually temporary.
          </StatusPanel>
        </>
      );
    }
    if (data && !data.album) {
      return (
        <>
          <BackLink />
          <StatusPanel title="Album not found">
            iTunes doesn&apos;t have an album with this id. It may have been removed from the store.
          </StatusPanel>
        </>
      );
    }
    return (
      <>
        <BackLink />
        <AlbumDetailSkeleton />
      </>
    );
  }

  return (
    <>
      <AlbumBackdrop artworkUrl={album.artworkUrl} />
      <BackLink />
      <Layout>
        <AlbumHeader album={album} tracks={tracks} queue={queue} />
        <Section aria-labelledby="tracks-heading">
          <VisuallyHidden as="h2" id="tracks-heading">
            Tracks
          </VisuallyHidden>
          {data ? (
            data.tracks.length > 0 ? (
              <TrackList tracks={data.tracks} albumArtist={album.artist} queue={queue} />
            ) : (
              <StatusPanel title="No tracks available">
                iTunes didn&apos;t list any songs for this album.
              </StatusPanel>
            )
          ) : error && !isFetching ? (
            <StatusPanel role="alert" title="We couldn't load the tracks" action={retry}>
              The album details are from the chart; the track list comes from a separate iTunes lookup.
            </StatusPanel>
          ) : (
            <TrackListSkeleton />
          )}
        </Section>
      </Layout>
    </>
  );
}
