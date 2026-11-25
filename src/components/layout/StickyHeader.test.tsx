import { act, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/render';
import { StickyHeader } from './StickyHeader';

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let callback: Callback | null = null;
let options: IntersectionObserverInit | undefined;
const observe = jest.fn();
const disconnect = jest.fn();

beforeEach(() => {
  callback = null;
  // jsdom has no IntersectionObserver; capture what the component registers.
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = jest.fn(
    (cb: Callback, opts?: IntersectionObserverInit) => {
      callback = cb;
      options = opts;
      return { observe, disconnect, unobserve: jest.fn(), takeRecords: jest.fn() };
    },
  );
});

afterEach(() => {
  delete (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
  jest.clearAllMocks();
});

const bar = () => screen.getByText('Pinned').parentElement!;

describe('StickyHeader', () => {
  it('renders its content in a bar that starts out not stuck', () => {
    renderWithProviders(
      <StickyHeader>
        <p>Pinned</p>
      </StickyHeader>,
    );
    expect(bar()).toHaveAttribute('data-stuck', 'false');
    expect(observe).toHaveBeenCalledTimes(1);
    // Watches the line just above the bar's sticky offset.
    expect(options?.rootMargin).toMatch(/^-\d+(\.\d+)?px 0px 0px 0px$/);
  });

  it('marks itself stuck once its sentinel scrolls out of view, and unstuck when it returns', () => {
    renderWithProviders(
      <StickyHeader>
        <p>Pinned</p>
      </StickyHeader>,
    );

    act(() => callback?.([{ isIntersecting: false }]));
    expect(bar()).toHaveAttribute('data-stuck', 'true');

    act(() => callback?.([{ isIntersecting: true }]));
    expect(bar()).toHaveAttribute('data-stuck', 'false');
  });

  it('stops observing on unmount', () => {
    const { unmount } = renderWithProviders(
      <StickyHeader>
        <p>Pinned</p>
      </StickyHeader>,
    );
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('still renders where IntersectionObserver is unavailable', () => {
    delete (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
    renderWithProviders(
      <StickyHeader>
        <p>Pinned</p>
      </StickyHeader>,
    );
    expect(bar()).toHaveAttribute('data-stuck', 'false');
  });
});
