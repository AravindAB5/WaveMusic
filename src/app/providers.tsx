'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'styled-components';
import { StyledComponentsRegistry } from '@/lib/StyledComponentsRegistry';
import { StoreProvider } from '@/store/StoreProvider';
import { GlobalStyle } from '@/styles/GlobalStyle';
import { theme } from '@/styles/theme';

/** Client-side provider stack: Redux store, styled-components SSR, theme. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <StyledComponentsRegistry>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          {children}
        </ThemeProvider>
      </StyledComponentsRegistry>
    </StoreProvider>
  );
}
