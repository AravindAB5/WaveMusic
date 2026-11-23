'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { StyledComponentsRegistry } from '@/lib/StyledComponentsRegistry';
import { GlobalStyle } from '@/styles/GlobalStyle';
import { theme } from '@/styles/theme';

/** Client-side provider stack. The Redux store joins it in a later step. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <StyledComponentsRegistry>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </StyledComponentsRegistry>
  );
}
