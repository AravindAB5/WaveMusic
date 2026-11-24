'use client';

import Image from 'next/image';
import styled from 'styled-components';
import { ExternalIcon } from '@/components/layout/icons';
import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
import { FavoriteButton } from '@/features/favorites/FavoriteButton';
import { PlayAllButton } from '@/features/player/PlayAllButton';
import type { QueueItem } from '@/features/player/playerSlice';
import { formatTotalDuration } from '@/lib/format';
import { UNRANKED, type Album, type Track } from '@/types/album';

const Header = styled.header`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  text-align: center;

  ${({ theme }) => theme.media.lg} {
    position: sticky;
    top: ${({ theme }) => theme.space(8)};
  }
`;

const Eyebrow = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.accent};
`;

export const Cover = styled.div`
  position: relative;
  width: min(72vw, 280px);
  aspect-ratio: 1;
  margin: ${({ theme }) => `${theme.space(1)} 0 ${theme.space(4)}`};
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  box-shadow: ${({ theme }) => theme.shadows.lg};

  img {
    object-fit: cover;
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  overflow-wrap: anywhere;

  ${({ theme }) => theme.media.md} {
    font-size: ${({ theme }) => theme.fontSizes.xxl};
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
  align-items: center;
  gap: ${({ theme }) => theme.space(4)};
  margin: ${({ theme }) => `${theme.space(4)} 0 ${theme.space(2)}`};
`;

const RoundLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.surfaceRaised};
  color: ${({ theme }) => theme.colors.text};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const FavoriteSlot = styled.div`
  /* Match the round link's quiet style instead of the card overlay look. */
  button {
    background: ${({ theme }) => theme.colors.surfaceRaised};
    color: ${({ theme }) => theme.colors.text};
    backdrop-filter: none;
  }

  button[aria-pressed='true'] {
    color: ${({ theme }) => theme.colors.accent};
  }

  button:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const Rights = styled.p`
  max-width: 34ch;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

interface AlbumHeaderProps {
  album: Album;
  /** Null while the lookup is loading. */
  tracks: readonly Track[] | null;
  queue: readonly QueueItem[];
}

export function AlbumHeader({ album, tracks, queue }: AlbumHeaderProps) {
  const details = [album.genre, album.releaseDateLabel ?? album.releaseYear, album.price?.label]
    .filter(Boolean)
    .join(' • ');

  const totalMs = tracks?.reduce((sum, t) => sum + (t.durationMs ?? 0), 0) ?? 0;
  const songCount = tracks?.length ?? album.trackCount;
  const length =
    songCount !== null && songCount > 0
      ? `${songCount} ${songCount === 1 ? 'song' : 'songs'}${totalMs > 0 ? `, ${formatTotalDuration(totalMs)}` : ''}`
      : null;

  return (
    <Header>
      <Eyebrow>{album.rank !== UNRANKED ? `#${album.rank} in Top Albums` : 'Album'}</Eyebrow>
      <Cover>
        {/* Decorative: the h1 names the album. LCP element, so load it first. */}
        <Image src={album.artworkUrlHiRes} alt="" fill priority sizes="280px" />
      </Cover>
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
      {details && <Meta>{details}</Meta>}
      {length && <Meta>{length}</Meta>}
      <Actions>
        <FavoriteSlot>
          <FavoriteButton album={album} />
        </FavoriteSlot>
        <PlayAllButton albumId={album.id} queue={queue} />
        <RoundLink href={album.url} target="_blank" rel="noopener noreferrer" title="Open in Apple Music">
          <ExternalIcon />
          <VisuallyHidden>Open in Apple Music (opens in a new tab)</VisuallyHidden>
        </RoundLink>
      </Actions>
      {album.rights && <Rights>{album.rights}</Rights>}
    </Header>
  );
}
