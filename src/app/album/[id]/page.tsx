import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageContainer } from '@/components/layout/PageContainer';
import { AlbumDetail } from '@/features/albumDetail/AlbumDetail';
import { getTopAlbums } from '@/lib/itunes/fetchTopAlbums';
import type { Album } from '@/types/album';

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

/** iTunes collection ids are numeric; anything else can't be an album. */
const isAlbumId = (id: string) => /^\d{1,20}$/.test(id);

/**
 * The album's chart entry, if it's charting. The chart is optional here: if
 * the feed is down, the page still works from the client-side Lookup.
 */
async function findChartAlbum(id: string): Promise<Album | null> {
  try {
    const { albums } = await getTopAlbums();
    return albums.find((album) => album.id === id) ?? null;
  } catch (error) {
    console.warn('[album] top albums feed unavailable; rendering from lookup only', error);
    return null;
  }
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { id } = await params;
  if (!isAlbumId(id)) return { title: 'Album not found — WaveMusic' };
  const album = await findChartAlbum(id); // deduped with the page's call by React cache()
  return album
    ? {
        title: `${album.title} — ${album.artist} | WaveMusic`,
        description: `#${album.rank} on the iTunes Top Albums chart. Preview tracks from ${album.title} by ${album.artist}.`,
      }
    : { title: 'Album — WaveMusic' };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { id } = await params;
  if (!isAlbumId(id)) notFound();

  const chartAlbum = await findChartAlbum(id);

  return (
    <PageContainer>
      <AlbumDetail albumId={id} chartAlbum={chartAlbum} />
    </PageContainer>
  );
}
