'use client';

import { SWRConfig } from 'swr';

export function SWRProvider({
  children,
  active = true,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  const swrConfig = {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: active ? 2000 : 0, // Pooling solo si activo
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    dedupingInterval: 1000,
    keepPreviousData: true,
  };
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
