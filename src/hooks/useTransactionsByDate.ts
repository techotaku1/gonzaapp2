import useSWR from 'swr';

import type { TransactionRecord } from '~/types';

interface TransactionsByDateResponse {
  data: TransactionRecord[];
  total: number;
}

export function useTransactionsByDate(
  date: string,
  page: number,
  pageSize = 50
) {
  const offset = (page - 1) * pageSize;
  const url = `/api/transactions?date=${date}&limit=${pageSize}&offset=${offset}`;
  const { data, error, isLoading } = useSWR<TransactionsByDateResponse>(
    url,
    (url: string) =>
      fetch(url).then(
        (res) => res.json() as Promise<TransactionsByDateResponse>
      )
  );
  return {
    transactions: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    isError: !!error,
  };
}
