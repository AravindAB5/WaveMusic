import { COLOR_TOKENS, isColorScheme, palettes } from './palettes';
import { cssVarName, theme } from './theme';

describe('palettes', () => {
  it.each(['light', 'dark'] as const)('%s palette defines exactly the color tokens', (scheme) => {
    expect(Object.keys(palettes[scheme]).sort()).toEqual([...COLOR_TOKENS].sort());
  });

  it('narrows color scheme strings', () => {
    expect(isColorScheme('dark')).toBe(true);
    expect(isColorScheme('light')).toBe(true);
    expect(isColorScheme('sepia')).toBe(false);
    expect(isColorScheme(null)).toBe(false);
  });
});

describe('theme', () => {
  it('maps every color token to its CSS variable', () => {
    expect(theme.colors.surfaceRaised).toBe('var(--wm-color-surface-raised)');
    for (const token of COLOR_TOKENS) {
      expect(theme.colors[token]).toBe(`var(${cssVarName(token)})`);
    }
  });

  it('uses a 4px spacing scale', () => {
    expect(theme.space(0)).toBe('0px');
    expect(theme.space(4)).toBe('16px');
  });

  it('builds mobile-first media queries from breakpoints', () => {
    expect(theme.media.md).toBe('@media (min-width: 768px)');
    expect(Object.keys(theme.media)).toEqual(Object.keys(theme.breakpoints));
  });
});
