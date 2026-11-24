import type { Album, Track } from '@/types/album';
import type { QueueItem } from './playerSlice';

/**
 * The album's playable previews, in play order. Tracks without a preview are
 * left out, so next/previous and auto-advance never land on a silent track.
 */
export function buildQueue(album: Pick<Album, 'id' | 'title' | 'artworkUrl'>, tracks: readonly Track[]): QueueItem[] {
  return tracks.flatMap((track) =>
    track.previewUrl
      ? [
          {
            trackId: track.id,
            title: track.title,
            artist: track.artist,
            previewUrl: track.previewUrl,
            album: { id: album.id, title: album.title, artworkUrl: album.artworkUrl },
          },
        ]
      : [],
  );
}
