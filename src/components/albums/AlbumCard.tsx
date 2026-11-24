'use client';

import Image from 'next/image';
import Link from 'next/link';
import styled from 'styled-components';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { useIsFavorite } from '@/features/favorites/useFavorites';
import { AlbumPlayButton } from '@/features/player/AlbumPlayButton';
import { useIsAlbumCurrent } from '@/features/player/usePlayback';
import type { Album } from '@/types/album';

export const CardShell = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(3)};
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.md};

  /* The title link is stretched over the card, so show its focus ring here.
     :has(:focus-visible) rather than :focus-within, so a mouse click on a
     card button doesn't ring the whole card. */
  &:has(a:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 4px;
  }
`;

export const Artwork = styled.div`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: box-shadow ${({ theme }) => theme.transitions.normal};

  img {
    object-fit: cover;
    transition: transform 400ms ease-out;
  }

  /* Darkens the art behind the controls on hover/focus. */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.55), transparent 55%);
    opacity: 0;
    transition: opacity ${({ theme }) => theme.transitions.normal};
  }

  ${CardShell}:hover &,
  ${CardShell}:focus-within & {
    box-shadow: ${({ theme }) => theme.shadows.md};

    &::after {
      opacity: 1;
    }
  }

  ${CardShell}:hover & img {
    transform: scale(1.04);
  }
`;

const Rank = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.space(2)};
  left: ${({ theme }) => theme.space(2)};
  z-index: 1;
  min-width: 26px;
  padding: ${({ theme }) => `1px ${theme.space(2)}`};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.overlay};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-variant-numeric: tabular-nums;
  text-align: center;
  backdrop-filter: blur(6px);
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  line-height: 1.35;
  letter-spacing: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  ${({ theme }) => theme.media.md} {
    font-size: ${({ theme }) => theme.fontSizes.md};
  }

  a {
    text-decoration: none;

    /* Stretched link: the whole card is clickable, but the link's
       accessible name is just the album title. */
    &::after {
      content: '';
      position: absolute;
      inset: 0;
    }

    &:focus-visible {
      outline: none;
    }
  }
`;

const Subtitle = styled.p`
  overflow: hidden;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
  text-overflow: ellipsis;
`;

/**
 * Controls layered over the artwork, above the stretched link. Hidden until
 * the card is hovered or focused; always visible on touch screens (no hover)
 * and while they carry state (playing / favorited).
 */
const Controls = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1;
  aspect-ratio: 1;
  pointer-events: none;

  > * {
    position: absolute;
    pointer-events: auto;
    opacity: 0;
    transform: translateY(4px);
    transition:
      opacity ${({ theme }) => theme.transitions.normal},
      transform ${({ theme }) => theme.transitions.normal};
  }

  ${CardShell}:hover &> *,
  ${CardShell}:focus-within &> *,
  > [data-active='true'] {
    opacity: 1;
    transform: none;
  }

  @media (hover: none) {
    > * {
      opacity: 1;
      transform: none;
    }
  }
`;

const FavoriteSlot = styled.div`
  top: ${({ theme }) => theme.space(2)};
  right: ${({ theme }) => theme.space(2)};
`;

const PlaySlot = styled.div`
  right: ${({ theme }) => theme.space(2)};
  bottom: ${({ theme }) => theme.space(2)};
`;

/** Rendered width per breakpoint, so the browser downloads the right size. */
const ARTWORK_SIZES = '(min-width: 1440px) 240px, (min-width: 1024px) 18vw, (min-width: 768px) 25vw, 50vw';

interface AlbumCardProps {
  album: Album;
  /** Eager-load above-the-fold artwork for a faster LCP. */
  priority?: boolean;
  /** Hidden for favorites that have left the chart: their rank is stale. */
  showRank?: boolean;
  /** Card titles are h2 in the main grid, h3 inside a titled section. */
  headingLevel?: 2 | 3;
}

export function AlbumCard({ album, priority = false, showRank = true, headingLevel = 2 }: AlbumCardProps) {
  const isFavorite = useIsFavorite(album.id);
  const { isCurrent } = useIsAlbumCurrent(album.id);
  const subtitle = [album.artist, album.releaseYear].filter(Boolean).join(' • ');

  return (
    <CardShell>
      <Artwork>
        {/* Decorative: the title right below names the album. */}
        <Image src={album.artworkUrlHiRes} alt="" fill sizes={ARTWORK_SIZES} priority={priority} />
        {showRank && (
          <Rank>
            <VisuallyHidden>Rank </VisuallyHidden>
            {album.rank}
          </Rank>
        )}
      </Artwork>
      <Body>
        <Title as={`h${headingLevel}`}>
          <Link href={`/album/${album.id}`}>{album.title}</Link>
        </Title>
        <Subtitle title={subtitle}>{subtitle}</Subtitle>
        <Subtitle>{album.genre}</Subtitle>
      </Body>
      {/* After the title in the DOM, so Tab reaches the link first. */}
      <Controls>
        <PlaySlot data-active={isCurrent}>
          <AlbumPlayButton album={album} />
        </PlaySlot>
        <FavoriteSlot data-active={isFavorite}>
          <FavoriteButton album={album} />
        </FavoriteSlot>
      </Controls>
    </CardShell>
  );
}
