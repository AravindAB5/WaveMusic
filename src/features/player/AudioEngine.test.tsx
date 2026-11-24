import { act, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { AudioEngine } from './AudioEngine';
import {
  playRequested,
  playerClosed,
  seekRequested,
  selectCurrentItem,
  togglePlayback,
  type QueueItem,
} from './playerSlice';

const item = (n: number): QueueItem => ({
  trackId: `t${n}`,
  title: `Track ${n}`,
  artist: 'Artist',
  previewUrl: `https://audio-ssl.itunes.apple.com/preview${n}.m4a`,
  album: { id: 'a1', title: 'Album', artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/x/100x100bb.jpg' },
});
const queue = [item(1), item(2)];

// jsdom doesn't implement media playback.
let play: jest.SpyInstance;
let pause: jest.SpyInstance;

beforeEach(() => {
  play = jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  pause = jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

const setup = () => {
  const view = renderWithProviders(<AudioEngine />);
  const audio = screen.getByTestId('audio-engine') as HTMLAudioElement;
  const fire = (type: string) => act(() => void audio.dispatchEvent(new Event(type)));
  return { ...view, audio, fire };
};

describe('AudioEngine', () => {
  it('renders one invisible audio element and stays idle until asked', () => {
    const { audio } = setup();
    expect(document.querySelectorAll('audio')).toHaveLength(1);
    expect(audio).not.toHaveAttribute('controls');
    expect(play).not.toHaveBeenCalled();
  });

  it('loads the requested preview and plays it', () => {
    const { audio, store } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));

    expect(audio.getAttribute('src')).toBe(queue[0]!.previewUrl);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('switching tracks reuses the same element, so nothing plays concurrently', () => {
    const { audio, store } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));
    act(() => void store.dispatch(playRequested({ queue: [item(9)], index: 0 })));

    expect(document.querySelectorAll('audio')).toHaveLength(1);
    expect(audio.getAttribute('src')).toBe(item(9).previewUrl);
  });

  it('pauses and resumes with the store', () => {
    const { store } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));
    act(() => void store.dispatch(togglePlayback()));
    expect(pause).toHaveBeenCalled();
    act(() => void store.dispatch(togglePlayback()));
    expect(play).toHaveBeenCalledTimes(2);
  });

  it('reports progress and duration', () => {
    const { audio, store, fire } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));
    Object.defineProperty(audio, 'currentTime', { configurable: true, value: 7.5, writable: true });
    Object.defineProperty(audio, 'duration', { configurable: true, value: 29.98 });

    fire('timeupdate');

    expect(store.getState().player).toMatchObject({ position: 7.5, duration: 29.98 });
  });

  it('treats an unknown (NaN/Infinity) duration as 0', () => {
    const { audio, store, fire } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));
    Object.defineProperty(audio, 'duration', { configurable: true, value: Number.NaN });
    fire('loadedmetadata');
    expect(store.getState().player.duration).toBe(0);
  });

  it('advances to the next preview when one ends', () => {
    const { audio, store, fire } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));
    fire('ended');

    expect(selectCurrentItem(store.getState())?.trackId).toBe('t2');
    expect(audio.getAttribute('src')).toBe(queue[1]!.previewUrl);
  });

  it('tracks buffering', () => {
    const { store, fire } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));
    fire('playing');
    expect(store.getState().player.isBuffering).toBe(false);
    fire('waiting');
    expect(store.getState().player.isBuffering).toBe(true);
  });

  it('marks playback failed on a media error', () => {
    const { store, fire } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));
    fire('error');
    expect(store.getState().player).toMatchObject({ isPlaying: false, error: 'failed' });
  });

  it('reports a blocked autoplay distinctly, and ignores AbortError', async () => {
    const { store } = setup();
    play.mockRejectedValueOnce(new DOMException('interrupted', 'AbortError'));
    await act(async () => void store.dispatch(playRequested({ queue, index: 0 })));
    expect(store.getState().player.error).toBeNull();

    play.mockRejectedValueOnce(new DOMException('needs gesture', 'NotAllowedError'));
    await act(async () => void store.dispatch(playRequested({ queue, index: 1 })));
    expect(store.getState().player).toMatchObject({ isPlaying: false, error: 'blocked' });
  });

  it('follows a pause from outside the app (media keys), but not one during a track switch', () => {
    const { store, fire } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));

    fire('pause'); // fired while the new src is loading
    expect(store.getState().player.isPlaying).toBe(true);

    fire('playing');
    fire('pause'); // a real external pause
    expect(store.getState().player.isPlaying).toBe(false);
  });

  it('follows a play from outside the app', () => {
    const { store, fire } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));
    act(() => void store.dispatch(togglePlayback()));
    fire('play');
    expect(store.getState().player.isPlaying).toBe(true);
  });

  it('applies seeks to the element', () => {
    const { audio, store } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));
    let applied = 0;
    Object.defineProperty(audio, 'currentTime', {
      configurable: true,
      get: () => applied,
      set: (v: number) => {
        applied = v;
      },
    });

    act(() => void store.dispatch(seekRequested(12)));

    expect(applied).toBe(12);
    expect(store.getState().player.pendingSeek).toBeNull();
  });

  it('stops and unloads when the player is closed', () => {
    const { audio, store } = setup();
    act(() => void store.dispatch(playRequested({ queue, index: 0 })));
    act(() => void store.dispatch(playerClosed()));
    expect(pause).toHaveBeenCalled();
    expect(audio).not.toHaveAttribute('src');
  });
});
