'use client';

import styled from 'styled-components';
import { Button } from '@/components/ui/Button';
import { StatusPanel } from '@/components/ui/StatusPanel';
import { useGetAlbumLookupQuery } from '@/store/itunesApi';
import type { Album } from '@/types/album';
import { AlbumDetailSkeleton, TrackListSkeleton } from './AlbumDetailSkeleton';
import { AlbumHeader } from './AlbumHeader';
import { BackLink } from './BackLink';
import { TrackList } from './TrackList';

const Section = styled.section`
  h2 {
    margin-bottom: ${({ theme }) => theme.space(1)};
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
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
      <BackLink />
      <AlbumHeader album={album} />
      <Section aria-labelledby="tracks-heading">
        <h2 id="tracks-heading">Tracks</h2>
        {data ? (
          data.tracks.length > 0 ? (
            <TrackList tracks={data.tracks} albumArtist={album.artist} />
          ) : (
            <StatusPanel title="No tracks available">
              iTunes didn&apos;t list any songs for this album.
            </StatusPanel>
          )
        ) : error && !isFetching ? (
          <StatusPanel role="alert" title="We couldn't load the tracks" action={retry}>
            The album details above are from the chart; the track list comes from a separate iTunes lookup.
          </StatusPanel>
        ) : (
          <TrackListSkeleton />
        )}
      </Section>
    </>
  );
}
