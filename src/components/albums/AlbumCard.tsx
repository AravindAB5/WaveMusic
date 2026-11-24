'use client';

import Image from 'next/image';
import Link from 'next/link';
import styled from 'styled-components';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import type { Album } from '@/types/album';

export const CardShell = styled.article`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  transition:
    transform ${({ theme }) => theme.transitions.normal},
    box-shadow ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  /* The title link is stretched over the card, so show its focus ring here.
     :has(:focus-visible) rather than :focus-within, so a mouse click on the
     favorite button doesn't ring the whole card. */
  &:has(:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const Artwork = styled.div`
  position: relative;
  aspect-ratio: 1;
  background: ${({ theme }) => theme.colors.surfaceRaised};

  img {
    object-fit: cover;
  }
`;

const Rank = styled.span`
  position: absolute;
  top: ${({ theme }) => theme.space(2)};
  left: ${({ theme }) => theme.space(2)};
  min-width: 28px;
  padding: ${({ theme }) => `2px ${theme.space(2)}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.overlay};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-align: center;
  backdrop-filter: blur(4px);
`;

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(1)};
  padding: ${({ theme }) => theme.space(3)};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

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

const Artist = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** Sits above the stretched link so it stays independently clickable. */
const FavoriteSlot = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.space(2)};
  right: ${({ theme }) => theme.space(2)};
  z-index: 1;
`;

const Meta = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** Rendered width per breakpoint, so the browser downloads the right size. */
const ARTWORK_SIZES = '(min-width: 1280px) 220px, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, 50vw';

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
  const meta = [album.genre, album.releaseYear].filter(Boolean).join(' · ');

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
        <Artist>{album.artist}</Artist>
        {meta && <Meta>{meta}</Meta>}
      </Body>
      {/* After the title in the DOM, so Tab reaches the link first. */}
      <FavoriteSlot>
        <FavoriteButton album={album} />
      </FavoriteSlot>
    </CardShell>
  );
}
