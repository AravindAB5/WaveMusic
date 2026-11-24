import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ALBUM_ID, COMPILATION_ID, lookupResponse } from '@/lib/itunes/__fixtures__/lookup';
import { parseAlbumLookup } from '@/lib/itunes/mapLookup';
import { useGetAlbumLookupQuery } from '@/store/itunesApi';
import { albumSet, makeAlbum } from '@/test/factories';
import { renderWithProviders } from '@/test/render';
import type { AlbumLookup } from '@/types/album';
import { AlbumDetail } from './AlbumDetail';

// Keep the real API slice (the store needs its reducer/middleware); stub only the hook.
jest.mock('@/store/itunesApi', () => ({
  ...jest.requireActual('@/store/itunesApi'),
  useGetAlbumLookupQuery: jest.fn(),
}));

const useLookup = jest.mocked(useGetAlbumLookupQuery);
const refetch = jest.fn();

type HookState = { data?: AlbumLookup; error?: unknown; isFetching?: boolean };
const hookReturns = ({ data, error, isFetching = false }: HookState) =>
  useLookup.mockReturnValue({ data, error, isFetching, refetch } as unknown as ReturnType<typeof useGetAlbumLookupQuery>);

const grateful = parseAlbumLookup(lookupResponse('album'), ALBUM_ID);
const compilation = parseAlbumLookup(lookupResponse('compilation'), COMPILATION_ID);
const chartGrateful = makeAlbum({ ...grateful.album!, rank: 3 });

describe('AlbumDetail', () => {
  it('shows the chart album header immediately while tracks load', () => {
    hookReturns({ isFetching: true });
    renderWithProviders(<AlbumDetail albumId={ALBUM_ID} chartAlbum={chartGrateful} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Grateful' })).toBeInTheDocument();
    expect(screen.getByText('#3 in Top Albums')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading tracks…');
  });

  it('lists tracks with numbers, durations and a summary', () => {
    hookReturns({ data: grateful });
    renderWithProviders(<AlbumDetail albumId={ALBUM_ID} chartAlbum={chartGrateful} />);

    const list = screen.getByRole('list', { name: 'Tracks' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Demons In Your Choir');
    expect(rows[0]).toHaveTextContent('4:16');
    expect(within(rows[0]!).getByText('4 minutes 16 seconds')).toBeInTheDocument();
    // Album artist isn't repeated under each track.
    expect(within(list).queryByText('The Red Clay Strays')).not.toBeInTheDocument();
    expect(screen.getByText(/^3 songs, \d+ min$/)).toBeInTheDocument();
  });

  it('shows per-track artists on compilations', () => {
    hookReturns({ data: compilation });
    renderWithProviders(<AlbumDetail albumId={COMPILATION_ID} chartAlbum={null} />);

    expect(screen.getByText('Whitney Peak & The Hunger Games')).toBeInTheDocument();
  });

  it('builds the header from the lookup when the album is not in the chart', () => {
    hookReturns({ data: grateful });
    renderWithProviders(<AlbumDetail albumId={ALBUM_ID} chartAlbum={null} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Grateful' })).toBeInTheDocument();
    expect(screen.getByText('Album')).toBeInTheDocument(); // no chart rank
    expect(screen.getByText('Country • June 5, 2026 • $9.99')).toBeInTheDocument();
    expect(screen.getByText(/^3 songs, \d+ min$/)).toBeInTheDocument();
  });

  it('shows a full-page skeleton when nothing is known yet', () => {
    hookReturns({ isFetching: true });
    renderWithProviders(<AlbumDetail albumId={ALBUM_ID} chartAlbum={null} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading album…');
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('says when iTunes does not know the album', () => {
    hookReturns({ data: { album: null, tracks: [] } });
    renderWithProviders(<AlbumDetail albumId="1" chartAlbum={null} />);

    expect(screen.getByRole('heading', { name: 'Album not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Top Albums/ })).toHaveAttribute('href', '/');
  });

  it('offers a retry when the lookup fails and nothing else is known', async () => {
    const user = userEvent.setup();
    hookReturns({ error: { status: 503 } });
    renderWithProviders(<AlbumDetail albumId={ALBUM_ID} chartAlbum={null} />);

    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load this album");
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('keeps the chart header and only errors the track list if the lookup fails', () => {
    hookReturns({ error: { status: 'FETCH_ERROR' } });
    renderWithProviders(<AlbumDetail albumId={ALBUM_ID} chartAlbum={chartGrateful} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Grateful' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load the tracks");
  });

  it('handles a charting album that the lookup returns empty', () => {
    hookReturns({ data: { album: null, tracks: [] } });
    renderWithProviders(<AlbumDetail albumId={ALBUM_ID} chartAlbum={chartGrateful} />);

    expect(screen.getByRole('heading', { name: 'No tracks available' })).toBeInTheDocument();
  });

  it('links out to Apple Music and the artist in new tabs, announced to screen readers', () => {
    hookReturns({ data: grateful });
    renderWithProviders(<AlbumDetail albumId={ALBUM_ID} chartAlbum={chartGrateful} />);

    const appleMusic = screen.getByRole('link', { name: 'Open in Apple Music (opens in a new tab)' });
    expect(appleMusic).toHaveAttribute('target', '_blank');
    expect(appleMusic).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: 'The Red Clay Strays (opens in a new tab)' })).toBeInTheDocument();
  });

  it('marks explicit tracks and groups multi-disc albums', () => {
    const [a, b] = grateful.tracks;
    hookReturns({
      data: {
        album: grateful.album,
        tracks: [
          { ...a!, discNumber: 1, explicit: true },
          { ...b!, discNumber: 2, trackNumber: 1 },
        ],
      },
    });
    renderWithProviders(<AlbumDetail albumId={ALBUM_ID} chartAlbum={chartGrateful} />);

    expect(screen.getByTitle('Explicit')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Disc 1 tracks' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Disc 2 tracks' })).toBeInTheDocument();
  });

  it('has a favorite toggle for the album', () => {
    hookReturns({ data: grateful });
    renderWithProviders(<AlbumDetail albumId={ALBUM_ID} chartAlbum={chartGrateful} />);
    expect(screen.getByRole('button', { name: 'Favorite Grateful' })).toBeInTheDocument();
  });
});

describe('BackLink', () => {
  it('returns to the chart with the filters the user had', () => {
    hookReturns({ data: grateful });
    renderWithProviders(<AlbumDetail albumId={ALBUM_ID} chartAlbum={albumSet[1]!} />, {
      preloadedState: { filters: { query: 'red clay', genre: 'Country', sort: 'newest', favoritesOnly: false } },
    });

    expect(screen.getByRole('link', { name: /Top Albums/ })).toHaveAttribute(
      'href',
      '/?q=red+clay&genre=Country&sort=newest',
    );
  });
});
