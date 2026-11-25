'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import styled from 'styled-components';

/**
 * Bleeds to the page edges (cancelling PageContainer's side padding) so the
 * background covers the full width while content stays aligned.
 */
const Bar = styled.div`
  position: sticky;
  /* Phones/tablets: below the sticky top bar. Desktop: the sidebar layout has no top bar. */
  top: ${({ theme }) => theme.layout.headerHeight};
  z-index: ${({ theme }) => theme.zIndices.header - 1};
  margin: ${({ theme }) => `-${theme.space(3)} -${theme.space(4)} 0`};
  padding: ${({ theme }) => `${theme.space(3)} ${theme.space(4)} ${theme.space(4)}`};
  border-bottom: 1px solid transparent;
  background: color-mix(in srgb, ${({ theme }) => theme.colors.bg} 92%, transparent);
  backdrop-filter: saturate(1.4) blur(14px);
  transition:
    border-color ${({ theme }) => theme.transitions.normal},
    box-shadow ${({ theme }) => theme.transitions.normal};

  /* Only once it's actually pinned: a hairline and soft shadow separate it from the scrolling grid. */
  &[data-stuck='true'] {
    border-bottom-color: ${({ theme }) => theme.colors.border};
    box-shadow: 0 10px 24px -18px rgba(0, 0, 0, 0.6);
  }

  ${({ theme }) => theme.media.md} {
    margin: ${({ theme }) => `-${theme.space(3)} -${theme.space(8)} 0`};
    padding: ${({ theme }) => `${theme.space(3)} ${theme.space(8)} ${theme.space(4)}`};
  }

  ${({ theme }) => theme.media.lg} {
    top: 0;
    padding-top: ${({ theme }) => theme.space(5)};
  }

  ${({ theme }) => theme.media.xl} {
    margin: ${({ theme }) => `-${theme.space(3)} -${theme.space(12)} 0`};
    padding-left: ${({ theme }) => theme.space(12)};
    padding-right: ${({ theme }) => theme.space(12)};
  }
`;

/**
 * Keeps its children (page title, filters, result count) pinned while the
 * content below scrolls. A 1px sentinel just above the bar tells us when it
 * has become stuck, so the divider only appears while it's pinned.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const bar = barRef.current;
    if (!sentinel || !bar || typeof IntersectionObserver === 'undefined') return;

    let observer: IntersectionObserver | null = null;
    const observe = () => {
      observer?.disconnect();
      // The bar's `top` differs by breakpoint (below the top bar, or 0).
      const top = parseFloat(getComputedStyle(bar).top) || 0;
      observer = new IntersectionObserver(([entry]) => setStuck(entry ? !entry.isIntersecting : false), {
        rootMargin: `-${top + 1}px 0px 0px 0px`,
      });
      observer.observe(sentinel);
    };

    observe();
    window.addEventListener('resize', observe);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', observe);
    };
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" style={{ height: 1, marginBottom: -1 }} />
      <Bar ref={barRef} data-stuck={stuck}>
        {children}
      </Bar>
    </>
  );
}
