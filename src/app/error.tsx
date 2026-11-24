'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/Button';
import { StatusPanel } from '@/components/ui/StatusPanel';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Route error boundary (feed unreachable, bad response). The header stays
 * usable because the root layout sits outside this boundary.
 *
 * In production Next strips server error messages (only `digest` survives),
 * so the copy here is deliberately generic.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // reset() alone only re-renders on the client; the failure happened on the
  // server, so refresh to re-run the server component, then clear the boundary.
  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <PageContainer>
      <StatusPanel
        role="alert"
        title="We couldn't load the charts"
        action={
          <Button type="button" onClick={retry} disabled={isRetrying}>
            {isRetrying ? 'Retrying…' : 'Try again'}
          </Button>
        }
      >
        The iTunes feed didn&apos;t respond as expected. This is usually temporary.
      </StatusPanel>
    </PageContainer>
  );
}
