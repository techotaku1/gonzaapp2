import { useCallback, useEffect, useRef } from 'react';

import { useSWRConfig } from 'swr';

import type { TransactionRecord } from '~/types';

const CACHE_KEY = 'transactions';
const DEBOUNCE_DELAY = 200; // Más rápido para edición y borrado

export function useDebouncedSave(
  saveFunction: (
    data: TransactionRecord[]
  ) => Promise<{ success: boolean; error?: string }>,
  onSuccess: () => void,
  delay = DEBOUNCE_DELAY
) {
  const { mutate } = useSWRConfig();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<TransactionRecord[] | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const latestEditRef = useRef<TransactionRecord[] | null>(null);
  const isSavingRef = useRef(false);

  // Limpia el timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Mantén los edits locales en el cache SWR hasta que el backend confirme
  const debouncedSave = useCallback(
    (data: TransactionRecord[]) => {
      pendingDataRef.current = data;
      latestEditRef.current = data;
      const dataString = JSON.stringify(
        data.map((r) => {
          const { id, ...rest } = r;
          return { id, ...rest };
        })
      );
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      // Refleja el cambio en el cache local de inmediato (sin mutationCountRef)
      mutate(
        CACHE_KEY,
        (current: TransactionRecord[] | undefined) => {
          if (!current) return data;
          const map = new Map(current.map((r) => [r.id, r]));
          data.forEach((edit) =>
            map.set(edit.id, { ...map.get(edit.id), ...edit })
          );
          return Array.from(map.values());
        },
        false // nunca revalidar aún
      );

      timeoutRef.current = setTimeout(async () => {
        if (lastSavedDataRef.current === dataString) return;
        isSavingRef.current = true;
        try {
          // --- Limpia valores vacíos antes de guardar ---
          const cleanedData = data.map((row) => {
            const cleaned: TransactionRecord = { ...row };
            Object.keys(cleaned).forEach((k) => {
              if (
                cleaned[k as keyof TransactionRecord] === '' &&
                [
                  'novedad',
                  'observaciones',
                  'tipoVehiculo',
                  'celular',
                  'cilindraje',
                ].includes(k)
              ) {
                (cleaned as unknown as Record<string, unknown>)[k] = null;
              }
            });
            return cleaned;
          });
          const _result = await saveFunction(cleanedData);
          lastSavedDataRef.current = dataString;
          onSuccess();
          await mutate(CACHE_KEY, undefined, { revalidate: true });
        } catch (error) {
          await mutate(CACHE_KEY, undefined, { revalidate: true });
          console.error('Error saving data:', error);
        } finally {
          isSavingRef.current = false;
        }
      }, delay);
    },
    [saveFunction, onSuccess, delay, mutate]
  );

  // Forzar guardado inmediato al perder el foco de un input
  useEffect(() => {
    const handleBlur = () => {
      if (pendingDataRef.current) {
        saveFunction(pendingDataRef.current).then((result) => {
          if (result.success) {
            lastSavedDataRef.current = JSON.stringify(
              pendingDataRef.current!.map((r) => {
                const { id, ...rest } = r;
                return { id, ...rest };
              })
            );
            onSuccess();
          }
        });
      }
    };
    window.addEventListener('beforeunload', handleBlur);
    return () => {
      window.removeEventListener('beforeunload', handleBlur);
    };
  }, [saveFunction, onSuccess]);

  // --- NUEVO: Mantén los edits locales hasta que el backend refleje exactamente los cambios ---
  // Esto se maneja en TransactionTableLogic, pero aquí puedes exponer helpers si lo necesitas

  return debouncedSave;
}
