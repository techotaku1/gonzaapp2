import useSWR from 'swr';

interface UseTransactionTotalsParams {
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  page: number;
  pageSize?: number;
}

interface TotalsByDate {
  date: string;
  transactionCount: number;
  precioNetoTotal: number;
  tarifaServicioTotal: number;
  impuesto4x1000Total: number;
  gananciaBrutaTotal: number;
}

interface TransactionTotalsResponse {
  totals: TotalsByDate[];
  totalPages: number;
}

export function useTransactionTotals({
  startDate,
  endDate,
  searchTerm,
  page,
  pageSize = 10,
}: UseTransactionTotalsParams) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (searchTerm) params.append('searchTerm', searchTerm);
  params.append('page', String(page));
  params.append('pageSize', String(pageSize));

  const url = `/api/transactions/totals?${params.toString()}`;
  const { data, error, isLoading } = useSWR<TransactionTotalsResponse>(url, (url: string) =>
    fetch(url).then((r) => r.json() as Promise<TransactionTotalsResponse>)
  );
  return {
    totals: data?.totals ?? [],
    totalPages: data?.totalPages ?? 1,
    isLoading,
    isError: !!error,
  };
}
