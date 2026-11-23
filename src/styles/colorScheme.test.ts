import {
  applyScheme,
  COLOR_SCHEME_STORAGE_KEY,
  colorSchemeInitScript,
  readStoredScheme,
  resolveScheme,
} from './colorScheme';

const mockSystemDark = (dark: boolean) => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: dark && query === '(prefers-color-scheme: dark)',
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
};

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe('colorScheme', () => {
  it('ignores invalid stored values', () => {
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'neon');
    expect(readStoredScheme()).toBeNull();
  });

  it('prefers an explicit choice over the OS', () => {
    mockSystemDark(true);
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'light');
    expect(resolveScheme()).toBe('light');
  });

  it('falls back to the OS preference', () => {
    mockSystemDark(true);
    expect(resolveScheme()).toBe('dark');
    mockSystemDark(false);
    expect(resolveScheme()).toBe('light');
  });

  it('applies and persists a scheme', () => {
    applyScheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');
  });

  it('survives storage that throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readStoredScheme()).toBeNull();
    spy.mockRestore();
  });

  it('init script applies a stored scheme before React runs', () => {
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, 'dark');
    new Function(colorSchemeInitScript)();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('init script leaves data-theme unset when nothing is stored', () => {
    new Function(colorSchemeInitScript)();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
