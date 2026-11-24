'use client';

import styled from 'styled-components';

/**
 * A soft, blurred wash of the album's own artwork behind the top of the page,
 * fading into the page background. Purely decorative and cheap: it reuses the
 * small (100–170px) artwork already in the cache, since it's blurred anyway.
 *
 * Positioned against AppShell's content column (not the max-width page
 * container), so it spans edge to edge on wide screens.
 */
const Wash = styled.div`
  position: absolute;
  inset: 0 0 auto;
  height: 560px;
  overflow: hidden;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);

  &::before {
    content: '';
    position: absolute;
    inset: -80px;
    background-image: var(--wm-backdrop);
    background-position: center;
    background-size: cover;
    filter: blur(70px) saturate(1.5);
    opacity: 0.4;
    transform: scale(1.2);
  }

  @media (prefers-reduced-transparency: reduce) {
    display: none;
  }
`;

export function AlbumBackdrop({ artworkUrl }: { artworkUrl: string }) {
  // CSS custom property (not a styled prop) so each album doesn't mint a new class.
  const style = { '--wm-backdrop': `url("${artworkUrl}")` } as React.CSSProperties;
  return <Wash aria-hidden="true" style={style} />;
}
