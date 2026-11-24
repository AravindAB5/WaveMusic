'use client';

import Image from 'next/image';
import styled from 'styled-components';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { UNRANKED, type Album } from '@/types/album';

const Header = styled.header`
  display: grid;
  gap: ${({ theme }) => theme.space(5)};
  margin-bottom: ${({ theme }) => theme.space(8)};

  ${({ theme }) => theme.media.md} {
    grid-template-columns: 280px 1fr;
    align-items: end;
    gap: ${({ theme }) => theme.space(8)};
  }

  ${({ theme }) => theme.media.lg} {
    grid-template-columns: 320px 1fr;
  }
`;

export const Cover = styled.div`
  position: relative;
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  box-shadow: ${({ theme }) => theme.shadows.lg};

  img {
    object-fit: cover;
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(2)};
  min-width: 0;
`;

const Eyebrow = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accent};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  overflow-wrap: anywhere;

  ${({ theme }) => theme.media.md} {
    font-size: 2.5rem;
  }
`;

const Artist = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.medium};

  a {
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Meta = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  margin-top: ${({ theme }) => theme.space(2)};
`;

const ExternalLink = styled.a`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: ${({ theme }) => `0 ${theme.space(5)}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.accent};
  color: ${({ theme }) => theme.colors.accentContrast};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`;

const Rights = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

interface AlbumHeaderProps {
  album: Album;
}

export function AlbumHeader({ album }: AlbumHeaderProps) {
  const meta = [
    album.genre,
    album.releaseDateLabel ?? album.releaseYear,
    album.trackCount !== null ? `${album.trackCount} ${album.trackCount === 1 ? 'song' : 'songs'}` : null,
    album.price?.label,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Header>
      <Cover>
        {/* Decorative: the h1 names the album. LCP element, so load it first. */}
        <Image src={album.artworkUrlHiRes} alt="" fill priority sizes="(min-width: 1024px) 320px, (min-width: 768px) 280px, 100vw" />
      </Cover>
      <Info>
        <Eyebrow>{album.rank !== UNRANKED ? `#${album.rank} in Top Albums` : 'Album'}</Eyebrow>
        <Title>{album.title}</Title>
        <Artist>
          {album.artistUrl ? (
            <a href={album.artistUrl} target="_blank" rel="noopener noreferrer">
              {album.artist}
              <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
            </a>
          ) : (
            album.artist
          )}
        </Artist>
        {meta && <Meta>{meta}</Meta>}
        <Actions>
          <FavoriteButton album={album} />
          <ExternalLink href={album.url} target="_blank" rel="noopener noreferrer">
            Open in Apple Music
            <VisuallyHidden> (opens in a new tab)</VisuallyHidden>
          </ExternalLink>
        </Actions>
        {album.rights && <Rights>{album.rights}</Rights>}
      </Info>
    </Header>
  );
}
