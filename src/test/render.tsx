import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { makeStore, type AppStore, type RootState } from '@/store/store';
import { theme } from '@/styles/theme';

interface ProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  /** Pass an existing store to share it across renders. */
  store?: AppStore;
}

/** RTL `render` with a fresh Redux store and the theme. Returns the store for assertions. */
export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, store = makeStore(preloadedState), ...options }: ProviderOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}
