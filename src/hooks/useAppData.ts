'use client';

import { useEffect, useRef, useState } from 'react';

import useSWR from 'swr';

import type { TransactionRecord } from '~/types';

interface TransactionSummary {
  id: string;
  hash: string;
}

// Type guard para TransactionSummary
function isTransactionSummary(item: unknown): item is TransactionSummary {
  return (
    typeof item === 'object' &&
    item !== null &&
    Object.prototype.hasOwnProperty.call(item, 'id') &&
    typeof (item as { id: unknown }).id === 'string' &&
    Object.prototype.hasOwnProperty.call(item, 'hash') &&
    typeof (item as { hash: unknown }).hash === 'string'
  );
}

// Fetch summaries (ids + hash)
const fetchSummary = async (): Promise<TransactionSummary[]> => {
  const res = await fetch('/api/transactions/summary', {
    // Agregar headers para Cache-Control
    headers: {
      'x-use-cache': '1',
    },
  });
  if (!res.ok) throw new Error('Error fetching summary');
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data.filter(isTransactionSummary);
};

// Fetch full records by ids
const fetchByIds = async (ids: string[]): Promise<TransactionRecord[]> => {
  if (!ids.length) return [];
  const res = await fetch('/api/transactions/by-ids', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Error fetching by ids');
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data.filter(
    (item): item is TransactionRecord =>
      typeof item === 'object' &&
      item !== null &&
      Object.prototype.hasOwnProperty.call(item, 'id') &&
      typeof (item as { id: unknown }).id === 'string'
  );
};

export function useAppData(
  initialData?: TransactionRecord[],
  active = true,
  date?: string
) {
  const [data, setData] = useState<TransactionRecord[]>(initialData ?? []);
  const hashesRef = useRef<Map<string, string>>(new Map());
  const lastChangeRef = useRef<number>(Date.now());

  // Determine polling frequency based on activity
  const getPollingInterval = () => {
    if (!active) return 0;

    const timeSinceLastChange = Date.now() - lastChangeRef.current;

    // If there was a change in the last minute, poll more frequently
    if (timeSinceLastChange < 60000) return 2000; // 2 seconds

    // If there was a change in the last 5 minutes, poll less frequently
    if (timeSinceLastChange < 300000) return 5000; // 5 seconds

    // Otherwise, poll very infrequently
    return 15000; // 15 seconds
  };

  // Cambia la clave de SWR para incluir la fecha (paginación por día)
  const swrKey = date ? `transactions-summary-${date}` : 'transactions-summary';

  const {
    data: summary,
    error,
    mutate,
  } = useSWR(swrKey, fetchSummary, {
    refreshInterval: getPollingInterval(),
    revalidateOnFocus: true,
    dedupingInterval: 2000,
    focusThrottleInterval: 5000,
  });

  useEffect(() => {
    if (!summary) return;
    const prevHashes = hashesRef.current;
    const changedIds: string[] = [];
    const summaryMap = new Map(summary.map((s) => [s.id, s.hash]));
    for (const item of summary) {
      if (isTransactionSummary(item)) {
        if (prevHashes.get(item.id) !== item.hash) changedIds.push(item.id);
      }
    }
    const deletedIds = Array.from(prevHashes.keys()).filter(
      (id) => !summaryMap.has(id)
    );

    if (changedIds.length > 0 || deletedIds.length > 0) {
      // Record that a change was detected
      lastChangeRef.current = Date.now();
    }

    if (changedIds.length > 0) {
      fetchByIds(changedIds).then((changedRecords) => {
        setData((prev) => {
          const map = new Map(prev.map((r) => [r.id, r]));
          for (const rec of changedRecords) map.set(rec.id, rec);
          for (const id of deletedIds) map.delete(id);
          return Array.from(map.values());
        });
        for (const item of summary) {
          if (isTransactionSummary(item)) prevHashes.set(item.id, item.hash);
        }
        for (const id of deletedIds) prevHashes.delete(id);
      });
    } else if (deletedIds.length > 0) {
      setData((prev) => prev.filter((r) => !deletedIds.includes(r.id)));
      for (const id of deletedIds) prevHashes.delete(id);
    }
    if (changedIds.length === 0 && deletedIds.length === 0) {
      for (const item of summary) {
        if (isTransactionSummary(item)) prevHashes.set(item.id, item.hash);
      }
    }
  }, [summary]);

  return {
    data,
    isLoading: !summary && !data.length,
    isError: error !== undefined,
    mutate: async () => {
      lastChangeRef.current = Date.now(); // Reset activity timer on manual mutate
      await mutate();
      return data;
    },
  };
}
