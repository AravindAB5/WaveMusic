import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { albumSet } from '@/test/factories';
import { renderWithProviders } from '@/test/render';
import { AlbumPlayButton } from './AlbumPlayButton';
import { playAlbum, type PlayAlbumOutcome } from './playAlbum';
import { playRequested } from './playerSlice';

// The thunk's own behavior is covered in playAlbum.test.ts; here only the
// button's feedback matters, so stub the thunk with a controllable result.
jest.mock('./playAlbum', () => ({ playAlbum: jest.fn() }));

const album = albumSet[0]!;
const stubOutcome = (outcome: PlayAlbumOutcome) => {
  let resolve!: (value: PlayAlbumOutcome) => void;
  const promise = new Promise<PlayAlbumOutcome>((r) => (resolve = r));
  jest.mocked(playAlbum).mockReturnValue((() => ({ unwrap: () => promise })) as never);
  return () => act(async () => resolve(outcome));
};

describe('AlbumPlayButton', () => {
  it('is named after the album and shows a busy state while loading', async () => {
    const user = userEvent.setup();
    const finish = stubOutcome('started');
    renderWithProviders(<AlbumPlayButton album={album} />);

    await user.click(screen.getByRole('button', { name: `Play previews of ${album.title}` }));
    expect(screen.getByRole('button', { name: `Loading previews of ${album.title}` })).toHaveAttribute('aria-busy', 'true');

    await finish();
    expect(screen.getByRole('button', { name: `Play previews of ${album.title}` })).toHaveAttribute('aria-busy', 'false');
  });

  it.each([
    ['no-previews', `No previews available for ${album.title}`],
    ['failed', `Couldn't load previews of ${album.title}. Try again`],
  ] as const)('explains a %s outcome', async (outcome, label) => {
    const user = userEvent.setup();
    const finish = stubOutcome(outcome);
    renderWithProviders(<AlbumPlayButton album={album} />);

    await user.click(screen.getByRole('button'));
    await finish();

    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
  });

  it('turns an unexpected rejection into "couldn\'t load" feedback, not a runtime error', async () => {
    const user = userEvent.setup();
    jest.mocked(playAlbum).mockReturnValue((() => ({ unwrap: () => Promise.reject(new Error('boom')) })) as never);
    renderWithProviders(<AlbumPlayButton album={album} />);

    await user.click(screen.getByRole('button'));

    expect(
      await screen.findByRole('button', { name: `Couldn't load previews of ${album.title}. Try again` }),
    ).toBeInTheDocument();
  });

  it('shows pause while this album is the one playing', () => {
    const { store } = renderWithProviders(<AlbumPlayButton album={album} />);
    act(() => {
      store.dispatch(
        playRequested({
          queue: [{ trackId: 't', title: 'T', artist: 'A', previewUrl: 'https://p/1.m4a', album: { id: album.id, title: album.title, artworkUrl: album.artworkUrl } }],
          index: 0,
        }),
      );
    });
    expect(screen.getByRole('button', { name: `Pause previews of ${album.title}` })).toBeInTheDocument();
  });
});
