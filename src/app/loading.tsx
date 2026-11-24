import { AlbumGridSkeleton } from '@/components/albums/AlbumGridSkeleton';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';

/** Streamed instantly while the page awaits the feed. Mirrors the page layout. */
export default function Loading() {
  return (
    <PageContainer>
      <PageHeader>
        <h1>Top Albums</h1>
        <p>The most popular albums on iTunes right now.</p>
      </PageHeader>
      <AlbumGridSkeleton />
    </PageContainer>
  );
}
