'use client';

import { Suspense, useState } from 'react';

import { SignedIn } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ActivityMonitor from './ActivityMonitor';

import '~/styles/background.css';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <SignedIn>
        <ActivityMonitor />
      </SignedIn>
      <div className="animated-background" />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-neutral-900 text-white">
            Cargando...
          </div>
        }
      >
        {children}
      </Suspense>
    </QueryClientProvider>
  );
}
