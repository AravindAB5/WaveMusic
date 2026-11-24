import { COLOR_TOKENS, type ColorToken } from './palettes';

const toKebab = (token: string): string => token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** CSS custom property for a color token, e.g. `surfaceRaised` → `--wm-color-surface-raised`. */
export const cssVarName = (token: ColorToken): string => `--wm-color-${toKebab(token)}`;

/**
 * Theme colors are CSS variable references, not raw values. GlobalStyle emits
 * the real light/dark values and `<html data-theme>` switches between them, so
 * the server never needs to know the user's scheme and the first paint never
 * flashes the wrong theme.
 */
const colors = Object.fromEntries(
  COLOR_TOKENS.map((token) => [token, `var(${cssVarName(token)})`]),
) as Readonly<Record<ColorToken, string>>;

const breakpoints = { sm: 480, md: 768, lg: 1024, xl: 1280 } as const;
type Breakpoint = keyof typeof breakpoints;

const media = Object.fromEntries(
  (Object.keys(breakpoints) as Breakpoint[]).map((bp) => [bp, `@media (min-width: ${breakpoints[bp]}px)`]),
) as Readonly<Record<Breakpoint, string>>;

export const theme = {
  colors,
  /** 4px spacing scale: `space(4)` → `'16px'`. */
  space: (multiple: number): string => `${multiple * 4}px`,
  radii: { sm: '6px', md: '8px', lg: '12px', xl: '20px', pill: '999px' },
  fonts: {
    // --font-geist-sans is set on <html> by next/font (self-hosted, no network at build).
    body: 'var(--font-geist-sans), system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  },
  fontSizes: { xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.25rem', xl: '1.5rem', xxl: '2rem', display: '2.75rem' },
  fontWeights: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeights: { tight: 1.2, normal: 1.5 },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.12)',
    md: '0 6px 20px rgba(0, 0, 0, 0.22)',
    lg: '0 16px 48px rgba(0, 0, 0, 0.35)',
  },
  transitions: { fast: '120ms ease-out', normal: '200ms ease-out' },
  zIndices: { header: 10, sidebar: 15, player: 20, overlay: 30, skipLink: 40 },
  breakpoints,
  /** Mobile-first media queries: `${({ theme }) => theme.media.md} { ... }`. */
  media,
  layout: {
    maxWidth: '1440px',
    headerHeight: '64px',
    sidebarWidth: '240px',
    /** Mini-player bar height: full controls on desktop, compact on phones. */
    playerHeight: '84px',
    playerHeightMobile: '76px',
  },
} as const;

export type AppTheme = typeof theme;
