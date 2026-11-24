'use client';

import { createGlobalStyle } from 'styled-components';
import { COLOR_TOKENS, palettes, type ColorScheme } from './palettes';
import { cssVarName } from './theme';

const paletteVars = (scheme: ColorScheme): string =>
  [`color-scheme: ${scheme};`, ...COLOR_TOKENS.map((t) => `${cssVarName(t)}: ${palettes[scheme][t]};`)].join(
    '\n',
  );

export const GlobalStyle = createGlobalStyle`
  /* Light by default; follow the OS unless the user explicitly chose a scheme. */
  :root { ${paletteVars('light')} }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) { ${paletteVars('dark')} }
  }
  :root[data-theme='dark'] { ${paletteVars('dark')} }

  *, *::before, *::after { box-sizing: border-box; }

  html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }

  body {
    margin: 0;
    min-height: 100vh;
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: ${({ theme }) => theme.lineHeights.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  ::selection {
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accentContrast};
  }

  /* Slim, theme-aware scrollbars. */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => `${theme.colors.surfaceHover} transparent`};
  }

  h1, h2, h3, h4, p, figure { margin: 0; }
  h1, h2, h3, h4 {
    line-height: ${({ theme }) => theme.lineHeights.tight};
    letter-spacing: -0.015em;
    text-wrap: balance;
  }

  img, svg, video { display: block; max-width: 100%; }

  a { color: inherit; }

  button, input, select, textarea { font: inherit; color: inherit; }
  button { cursor: pointer; }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
