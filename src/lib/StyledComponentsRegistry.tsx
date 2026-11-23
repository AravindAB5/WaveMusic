'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

/**
 * Collects the styles rendered during SSR and flushes them into the streamed
 * HTML, so server-rendered markup arrives already styled (no unstyled flash).
 * On the client it is a pass-through. Follows the Next.js App Router
 * CSS-in-JS guide.
 */
export function StyledComponentsRegistry({ children }: { children: ReactNode }) {
  // Lazy initial state: exactly one sheet per server render.
  const [sheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = sheet.getStyleElement();
    sheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== 'undefined') return <>{children}</>;

  return <StyleSheetManager sheet={sheet.instance}>{children}</StyleSheetManager>;
}
