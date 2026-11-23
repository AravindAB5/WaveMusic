export const COLOR_SCHEMES = ['light', 'dark'] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export const COLOR_TOKENS = [
  'bg',
  'surface',
  'surfaceRaised',
  'text',
  'textMuted',
  'border',
  'accent',
  'accentHover',
  'accentContrast',
  'focus',
  'danger',
  'overlay',
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

export type Palette = Readonly<Record<ColorToken, string>>;

/**
 * Raw color values per scheme. `satisfies` guarantees both palettes define
 * every token, so a missing dark-mode color is a compile error.
 * Text and accent pairs meet WCAG AA (4.5:1) against their backgrounds.
 */
export const palettes = {
  light: {
    bg: '#f6f6f8',
    surface: '#ffffff',
    surfaceRaised: '#ffffff',
    text: '#121216',
    textMuted: '#55555f',
    border: '#dcdce2',
    accent: '#5b3bd6',
    accentHover: '#4a2ec0',
    accentContrast: '#ffffff',
    focus: '#5b3bd6',
    danger: '#b42318',
    overlay: 'rgba(18, 18, 22, 0.55)',
  },
  dark: {
    bg: '#0e0e12',
    surface: '#17171d',
    surfaceRaised: '#202028',
    text: '#f2f2f5',
    textMuted: '#a6a6b3',
    border: '#2e2e38',
    accent: '#9b87ff',
    accentHover: '#b3a5ff',
    accentContrast: '#0e0e12',
    focus: '#b3a5ff',
    danger: '#f97066',
    overlay: 'rgba(0, 0, 0, 0.65)',
  },
} as const satisfies Record<ColorScheme, Palette>;

export const isColorScheme = (value: unknown): value is ColorScheme =>
  typeof value === 'string' && (COLOR_SCHEMES as readonly string[]).includes(value);
