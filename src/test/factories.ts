import type { Album } from '@/types/album';

const ART = 'https://is1-ssl.mzstatic.com/image/thumb/Music/v4/aa/bb/cc/test.jpg';

/** A valid Album; override only the fields a test cares about. */
export function makeAlbum(overrides: Partial<Album> & Pick<Album, 'id'>): Album {
  return {
    rank: 1,
    title: `Album ${overrides.id}`,
    artist: `Artist ${overrides.id}`,
    artistUrl: null,
    artworkUrl: `${ART}/170x170bb.png`,
    artworkUrlHiRes: `${ART}/600x600bb.jpg`,
    genre: 'Pop',
    genreId: null,
    releaseDate: null,
    releaseDateLabel: null,
    releaseYear: null,
    price: null,
    trackCount: null,
    rights: null,
    url: `https://music.apple.com/us/album/test/${overrides.id}`,
    ...overrides,
  };
}

/** Five albums covering genres, accents, ties and missing dates. */
export const albumSet: Album[] = [
  makeAlbum({ id: '1', rank: 1, title: 'Showgirl', artist: 'Taylor Swift', genre: 'Pop', releaseDate: '2025-10-03T07:00:00.000Z', releaseYear: 2025 }),
  makeAlbum({ id: '2', rank: 2, title: 'Grateful', artist: 'The Red Clay Strays', genre: 'Country', releaseDate: '2026-07-18T07:00:00.000Z', releaseYear: 2026 }),
  makeAlbum({ id: '3', rank: 3, title: 'Cowboy Carter', artist: 'Beyoncé', genre: 'Country', releaseDate: '2024-03-29T07:00:00.000Z', releaseYear: 2024 }),
  makeAlbum({ id: '4', rank: 4, title: 'abbey road', artist: 'The Beatles', genre: 'Rock', releaseDate: null }),
  makeAlbum({ id: '5', rank: 5, title: 'Album 10', artist: 'artist b', genre: 'R&B/Soul', releaseDate: '2026-07-18T07:00:00.000Z', releaseYear: 2026 }),
];
