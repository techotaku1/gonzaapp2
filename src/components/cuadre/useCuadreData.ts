import useSWR from 'swr';

import type { ExtendedSummaryRecord } from '~/types';

export function useCuadreData(initialData?: ExtendedSummaryRecord[]) {
  const { data, mutate } = useSWR<ExtendedSummaryRecord[]>(
    '/api/cuadre',
    null,
    {
      fallbackData: initialData,
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );
  return {
    data: data ?? [],
    mutate,
  };
}
