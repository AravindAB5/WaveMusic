import { createAsyncThunk } from '@reduxjs/toolkit';
import { itunesApi } from '@/store/itunesApi';
import type { Album, AlbumLookup } from '@/types/album';
import { playRequested, selectCurrentItem, togglePlayback } from './playerSlice';
import { buildQueue } from './queue';

type AlbumRef = Pick<Album, 'id' | 'title' | 'artworkUrl'>;

/** What happened, so the triggering control can give feedback. */
export type PlayAlbumOutcome = 'started' | 'toggled' | 'no-previews' | 'failed';

/**
 * Play an album's previews from anywhere (e.g. a grid card) without visiting
 * its page. Tracks come from the same RTK Query cache the album page uses, so
 * opening the album afterwards needs no refetch (and vice versa).
 *
 * If the album is already the one in the player, this just pauses/resumes.
 */
export const playAlbum = createAsyncThunk<PlayAlbumOutcome, AlbumRef>(
  'player/playAlbum',
  async (album, { dispatch, getState }) => {
    const current = selectCurrentItem(getState() as Parameters<typeof selectCurrentItem>[0]);
    if (current?.album.id === album.id) {
      dispatch(togglePlayback());
      return 'toggled';
    }

    // Dispatching can itself throw (e.g. RTK Query's dev-only middleware
    // check), so it lives inside the try: every failure becomes 'failed'.
    let request: { unwrap(): Promise<AlbumLookup>; unsubscribe(): void } | undefined;
    try {
      request = dispatch(itunesApi.endpoints.getAlbumLookup.initiate(album.id));
      const { tracks } = await request.unwrap();
      const queue = buildQueue(album, tracks);
      if (queue.length === 0) return 'no-previews';
      dispatch(playRequested({ queue, index: 0 }));
      return 'started';
    } catch {
      return 'failed';
    } finally {
      // Drop our subscription; the cached result stays for keepUnusedDataFor.
      request?.unsubscribe();
    }
  },
);
