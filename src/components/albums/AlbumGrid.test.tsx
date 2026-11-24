import { screen, within } from '@testing-library/react';
import { sampleFeed } from '@/lib/itunes/__fixtures__/feed';
import { parseTopAlbumsFeed } from '@/lib/itunes/mapFeed';
import { renderWithProviders } from '@/test/render';
import { AlbumGrid } from './AlbumGrid';
import { AlbumGridSkeleton } from './AlbumGridSkeleton';

const { albums } = parseTopAlbumsFeed(sampleFeed);

describe('AlbumGrid', () => {
  it('renders one list item per album, in chart order', () => {
    renderWithProviders(<AlbumGrid albums={albums} />);

    const list = screen.getByRole('list', { name: 'Top albums' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(albums.length);
    expect(within(items[0]!).getByRole('heading', { level: 2 })).toHaveTextContent(albums[0]!.title);
  });

  it('links each title to its detail page with a concise accessible name', () => {
    renderWithProviders(<AlbumGrid albums={albums} />);

    const first = albums[0]!;
    const link = screen.getByRole('link', { name: first.title });
    expect(link).toHaveAttribute('href', `/album/${first.id}`);
    expect(screen.getAllByRole('link')).toHaveLength(albums.length);
  });

  it('shows rank, "artist • year" and genre', () => {
    renderWithProviders(<AlbumGrid albums={albums} />);

    const first = albums[0]!;
    const card = screen.getAllByRole('listitem')[0]!;
    // Visible "1", announced as "Rank 1".
    expect(card).toHaveTextContent(/Rank\s*1/);
    expect(within(card).getByText(`${first.artist} • ${first.releaseYear}`)).toBeInTheDocument();
    expect(within(card).getByText(first.genre)).toBeInTheDocument();
  });

  it('omits the year when the album has none', () => {
    const [first] = albums;
    renderWithProviders(<AlbumGrid albums={[{ ...first!, releaseYear: null }]} />);
    expect(screen.getByText(first!.artist)).toBeInTheDocument();
  });

  it('gives each card a named play button and favorite toggle', () => {
    renderWithProviders(<AlbumGrid albums={albums} />);
    const first = albums[0]!;
    expect(screen.getByRole('button', { name: `Play previews of ${first.title}` })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: `Favorite ${first.title}` })).toBeInTheDocument();
  });

  it('treats artwork as decorative', () => {
    const { container } = renderWithProviders(<AlbumGrid albums={albums} />);
    const images = container.querySelectorAll('img');
    expect(images).toHaveLength(albums.length);
    images.forEach((img) => expect(img).toHaveAttribute('alt', ''));
  });

  it('shows an empty state when there are no albums', () => {
    renderWithProviders(<AlbumGrid albums={[]} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No albums right now' })).toBeInTheDocument();
  });
});

describe('AlbumGridSkeleton', () => {
  it('announces loading and hides the placeholders from assistive tech', () => {
    renderWithProviders(<AlbumGridSkeleton count={4} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading top albums…');
    expect(screen.queryByRole('list')).not.toBeInTheDocument(); // aria-hidden
    expect(screen.getByTestId('album-grid-skeleton').querySelectorAll('li')).toHaveLength(4);
  });
});
