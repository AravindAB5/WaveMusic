export const COLOR_SCHEMES = ['light', 'dark'] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

export const COLOR_TOKENS = [
  'bg',
  'surface',
  'surfaceRaised',
  'surfaceHover',
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
    bg: '#f7f7f9',
    surface: '#ffffff',
    surfaceRaised: '#f0f0f4',
    surfaceHover: '#e8e8ef',
    text: '#111116',
    textMuted: '#585864',
    border: '#e0e0e8',
    accent: '#5b3bd6',
    accentHover: '#4a2ec0',
    accentContrast: '#ffffff',
    focus: '#5b3bd6',
    danger: '#b42318',
    overlay: 'rgba(10, 10, 14, 0.55)',
  },
  dark: {
    bg: '#09090c',
    surface: '#121217',
    surfaceRaised: '#1b1b22',
    surfaceHover: '#24242d',
    text: '#f4f4f6',
    textMuted: '#a3a3ae',
    border: '#2a2a33',
    accent: '#9583ff',
    accentHover: '#ab9dff',
    accentContrast: '#0b0b10',
    focus: '#b9adff',
    danger: '#ff7a70',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const satisfies Record<ColorScheme, Palette>;

export const isColorScheme = (value: unknown): value is ColorScheme =>
  typeof value === 'string' && (COLOR_SCHEMES as readonly string[]).includes(value);
