import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { parseAlbumLookup } from '@/lib/itunes/mapLookup';
import type { AlbumLookup } from '@/types/album';

export const ITUNES_API_BASE_URL = 'https://itunes.apple.com/';

/**
 * Lookup results barely change (Apple itself sends max-age=86400), so keep
 * them for a while after the last subscriber leaves: going back and forth
 * between albums then needs no refetch.
 */
export const LOOKUP_CACHE_SECONDS = 10 * 60;

/**
 * RTK Query slice for the iTunes Lookup API. Called straight from the browser:
 * the API sends `Access-Control-Allow-Origin: *`, so no proxy is needed.
 */
export const itunesApi = createApi({
  reducerPath: 'itunesApi',
  baseQuery: fetchBaseQuery({ baseUrl: ITUNES_API_BASE_URL }),
  keepUnusedDataFor: LOOKUP_CACHE_SECONDS,
  // A lookup that failed while offline retries when the connection returns.
  refetchOnReconnect: true,
  endpoints: (build) => ({
    /** An album's details and songs. `album` is null if iTunes doesn't know the id. */
    getAlbumLookup: build.query<AlbumLookup, string>({
      query: (albumId) => ({ url: 'lookup', params: { id: albumId, entity: 'song' } }),
      // Validates and maps the raw JSON; a thrown LookupParseError surfaces
      // as the query's `error`.
      transformResponse: (raw: unknown, _meta, albumId) => parseAlbumLookup(raw, albumId),
    }),
  }),
});

export const { useGetAlbumLookupQuery } = itunesApi;
