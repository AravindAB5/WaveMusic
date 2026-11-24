import { connection } from 'next/server';
import { AlbumGrid } from '@/components/albums/AlbumGrid';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { getTopAlbums } from '@/lib/itunes/fetchTopAlbums';

export default async function HomePage() {
  // Render per request instead of at build time: builds (CI, Docker) don't
  // depend on Apple being reachable. The feed itself is still served from
  // Next's Data Cache (revalidated hourly), so this costs no extra upstream calls.
  await connection();
  const { albums } = await getTopAlbums();

  return (
    <PageContainer>
      <PageHeader>
        <h1>Top Albums</h1>
        <p>
          {albums.length > 0
            ? `The ${albums.length} most popular albums on iTunes right now.`
            : 'The most popular albums on iTunes right now.'}
        </p>
      </PageHeader>
      <AlbumGrid albums={albums} />
    </PageContainer>
  );
}
