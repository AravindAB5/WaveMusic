import { PageContainer } from '@/components/layout/PageContainer';
import { AlbumDetailSkeleton } from '@/features/albumDetail/AlbumDetailSkeleton';

/** Streamed instantly while the page looks the album up in the chart. */
export default function Loading() {
  return (
    <PageContainer>
      <AlbumDetailSkeleton />
    </PageContainer>
  );
}
