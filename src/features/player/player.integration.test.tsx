import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackList } from '@/features/albumDetail/TrackList';
import { ALBUM_ID, lookupResponse } from '@/lib/itunes/__fixtures__/lookup';
import { parseAlbumLookup } from '@/lib/itunes/mapLookup';
import { renderWithProviders } from '@/test/render';
import { AudioEngine } from './AudioEngine';
import { MiniPlayer } from './MiniPlayer';
import { playbackFailed } from './playerSlice';

const { album, tracks } = parseAlbumLookup(lookupResponse('album'), ALBUM_ID);
const [first, second, third] = tracks as [(typeof tracks)[0], (typeof tracks)[0], (typeof tracks)[0]];

let play: jest.SpyInstance;

beforeEach(() => {
  play = jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const setup = (trackList = tracks) => {
  const user = userEvent.setup();
  const view = renderWithProviders(
    <>
      <section aria-label="Album tracks">
        <TrackList tracks={trackList} album={album!} />
      </section>
      <MiniPlayer />
      <AudioEngine />
    </>,
  );
  const audio = () => screen.getByTestId('audio-engine') as HTMLAudioElement;
  const tracksSection = () => screen.getByRole('region', { name: 'Album tracks' });
  const row = (title: string) => within(tracksSection()).getByText(title).closest('li')!;
  const player = () => screen.getByRole('region', { name: 'Now playing' });
  return { user, audio, row, player, tracksSection, ...view };
};

describe('preview playback', () => {
  it('shows no player until something plays', () => {
    setup();
    expect(screen.queryByRole('region', { name: 'Now playing' })).not.toBeInTheDocument();
  });

  it('plays a track from its row and shows it in the mini-player', async () => {
    const { user, audio, row, player } = setup();

    await user.click(screen.getByRole('button', { name: `Play preview of ${first.title}` }));

    expect(play).toHaveBeenCalled();
    expect(audio().getAttribute('src')).toBe(first.previewUrl);
    expect(row(first.title)).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: `Pause preview of ${first.title}` })).toBeInTheDocument();
    expect(within(player()).getByText(first.title)).toBeInTheDocument();
    expect(within(player()).getByRole('status')).toHaveTextContent(`Now playing: ${first.title} by ${first.artist}`);
    expect(within(player()).getByRole('link', { name: album!.title })).toHaveAttribute('href', `/album/${ALBUM_ID}`);
  });

  it('starting another track stops the first: one audio element, one current row', async () => {
    const { user, audio, row } = setup();

    await user.click(screen.getByRole('button', { name: `Play preview of ${first.title}` }));
    await user.click(screen.getByRole('button', { name: `Play preview of ${second.title}` }));

    expect(document.querySelectorAll('audio')).toHaveLength(1);
    expect(audio().getAttribute('src')).toBe(second.previewUrl);
    expect(row(first.title)).not.toHaveAttribute('aria-current');
    expect(row(second.title)).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: `Play preview of ${first.title}` })).toBeInTheDocument();
  });

  it('pauses from the row or the mini-player, kept in sync', async () => {
    const { user, player } = setup();

    await user.click(screen.getByRole('button', { name: `Play preview of ${first.title}` }));
    await user.click(within(player()).getByRole('button', { name: 'Pause' }));

    expect(screen.getByRole('button', { name: `Play preview of ${first.title}` })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: `Play preview of ${first.title}` }));
    expect(within(player()).getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('skips with next/previous and disables next on the last track', async () => {
    const { user, player, audio } = setup();

    await user.click(screen.getByRole('button', { name: `Play preview of ${second.title}` }));
    await user.click(within(player()).getByRole('button', { name: 'Next track' }));
    expect(audio().getAttribute('src')).toBe(third.previewUrl);
    expect(within(player()).getByRole('button', { name: 'Next track' })).toBeDisabled();

    await user.click(within(player()).getByRole('button', { name: 'Previous track' }));
    expect(audio().getAttribute('src')).toBe(second.previewUrl);
  });

  it('seeks with an accessible slider', async () => {
    const { user, player, audio } = setup();
    await user.click(screen.getByRole('button', { name: `Play preview of ${first.title}` }));
    Object.defineProperty(audio(), 'duration', { configurable: true, value: 30 });
    act(() => void audio().dispatchEvent(new Event('loadedmetadata')));

    const slider = within(player()).getByRole('slider', { name: 'Seek' });
    expect(slider).toHaveAttribute('aria-valuetext', '0:00 of 0:30');

    fireEvent.change(slider, { target: { value: '15' } });

    expect(slider).toHaveAttribute('aria-valuetext', '0:15 of 0:30');
    expect(audio().currentTime).toBe(15);
  });

  it('"Play previews" starts at the top, then pauses and resumes the album', async () => {
    const { user, audio, tracksSection } = setup();

    await user.click(within(tracksSection()).getByRole('button', { name: 'Play previews' }));
    expect(audio().getAttribute('src')).toBe(first.previewUrl);

    await user.click(within(tracksSection()).getByRole('button', { name: 'Pause' }));
    expect(within(tracksSection()).getByRole('button', { name: 'Resume' })).toBeInTheDocument();
  });

  it('disables tracks without a preview and leaves them out of the queue', async () => {
    const withGap = [first, { ...second, previewUrl: null }, third];
    const { user, player, audio } = setup(withGap);

    expect(screen.getByRole('button', { name: `No preview available for ${second.title}` })).toBeDisabled();
    expect(screen.getByText(/2 with previews/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `Play preview of ${first.title}` }));
    await user.click(within(player()).getByRole('button', { name: 'Next track' }));
    expect(audio().getAttribute('src')).toBe(third.previewUrl);
  });

  it('explains a failed or blocked preview in the mini-player', async () => {
    const { user, store, player } = setup();
    await user.click(screen.getByRole('button', { name: `Play preview of ${first.title}` }));

    act(() => void store.dispatch(playbackFailed('blocked')));
    expect(within(player()).getByRole('alert')).toHaveTextContent('Press play to start the preview.');

    act(() => void store.dispatch(playbackFailed('failed')));
    expect(within(player()).getByRole('alert')).toHaveTextContent("This preview couldn't be played.");
  });

  it('closes the player and stops playback', async () => {
    const { user, player, audio } = setup();
    await user.click(screen.getByRole('button', { name: `Play preview of ${first.title}` }));

    await user.click(within(player()).getByRole('button', { name: 'Close player' }));

    expect(screen.queryByRole('region', { name: 'Now playing' })).not.toBeInTheDocument();
    expect(audio()).not.toHaveAttribute('src');
  });
});
