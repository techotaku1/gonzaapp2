import { type SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  dedupingInterval: 60000,
  focusThrottleInterval: 300000,
  revalidateIfStale: false,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  keepPreviousData: true,
  refreshInterval: 2000, // Refresca cada 2 segundos
  refreshWhenHidden: false,
  refreshWhenOffline: false,
  suspense: false,
};
