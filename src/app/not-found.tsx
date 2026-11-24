import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatusPanel } from '@/components/ui/StatusPanel';

export default function NotFound() {
  return (
    <PageContainer>
      <StatusPanel title="Page not found" action={<Link href="/">Back to Top Albums</Link>}>
        That page doesn&apos;t exist. It may have moved, or the link may be wrong.
      </StatusPanel>
    </PageContainer>
  );
}
