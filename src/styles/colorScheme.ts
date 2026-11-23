import { isColorScheme, type ColorScheme } from './palettes';

export const COLOR_SCHEME_STORAGE_KEY = 'wm-theme';

/** The user's explicit choice, or null when they're following the OS. */
export function readStoredScheme(): ColorScheme | null {
  try {
    const value = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    return isColorScheme(value) ? value : null;
  } catch {
    // Storage can throw in private mode or when site data is blocked.
    return null;
  }
}

export function getSystemScheme(): ColorScheme {
  if (typeof window.matchMedia !== 'function') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** What the page is showing right now: explicit choice first, then the OS. */
export function resolveScheme(): ColorScheme {
  return readStoredScheme() ?? getSystemScheme();
}

export function applyScheme(scheme: ColorScheme): void {
  document.documentElement.dataset.theme = scheme;
  try {
    window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme);
  } catch {
    // Non-fatal: the choice just won't survive a reload.
  }
}

/**
 * Inlined into <head> and run before first paint, so a stored choice applies
 * before any CSS renders. Dependency-free and tiny on purpose.
 */
export const colorSchemeInitScript =
  `(function(){try{var t=localStorage.getItem(${JSON.stringify(COLOR_SCHEME_STORAGE_KEY)});` +
  `if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}})();`;
