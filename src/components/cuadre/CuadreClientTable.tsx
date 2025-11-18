'use client';

import React, { useMemo, useRef, useState } from 'react';

import Link from 'next/link';

import { HiOutlineBell } from 'react-icons/hi';
import { useDebouncedCallback } from 'use-debounce';

import Header from '~/components/Header';
import { useCuadreData } from '~/hooks/useCuadreData';
import {
  deleteCuadreRecords,
  updateCuadreRecordsBatch,
} from '~/server/actions/cuadreActions';

import CuadreTableBody from './CuadreTableBody';

import type { CuadreData, ExtendedSummaryRecord } from '~/types';

import '~/styles/deleteButton.css';

export default function CuadreClientTable({
  initialData,
}: {
  initialData: ExtendedSummaryRecord[];
}) {
  const { data: summaryData, mutate } = useCuadreData(initialData);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [rowsToDelete, setRowsToDelete] = useState<Set<string>>(new Set());
  const [editValues, setEditValues] = useState<
    Record<string, Partial<CuadreData>>
  >({});
  // bulkGroups maps a bulk source id to the set of target ids that were bulk-applied
  const [bulkGroups, setBulkGroups] = useState<Record<string, Set<string>>>({});
  // bulkApplyMap removed (no longer needed)
  const selectAllRef = useRef<HTMLInputElement>(null);

  const [isSaving, setIsSaving] = useState(false);

  const debouncedSave = useDebouncedCallback(
    async (pendingEdits: Record<string, Partial<CuadreData>>) => {
      setIsSaving(true);
      try {
        // Preparar el array de updates para el batch
        const updates = Object.entries(pendingEdits).map(
          ([transactionId, changes]) => ({
            transactionId,
            data: changes as CuadreData,
          })
        );

        // Usar el batch para guardar todo en una sola llamada
        const result = await updateCuadreRecordsBatch(updates);
        if (!result.success) {
          console.error('Error saving batch:', result.error);
        }
        // No llamar mutate() aquí, confiar en el polling de SWR
      } catch (error) {
        console.error('Error in debouncedSave:', error);
      } finally {
        setIsSaving(false);
      }
    },
    500 // Reducir delay a 500ms para guardar más rápido
  );

  // Edición masiva: actualiza todos los editValues y dispara debouncedSave una sola vez
  const handleBulkEdit = (
    batchEdits: Record<string, Partial<CuadreData>>,
    sourceId?: string | null
  ) => {
    setEditValues((prev) => {
      const updated = {
        ...prev,
        ...batchEdits,
      };
      debouncedSave(updated);
      return updated;
    });

    // register bulk group so totals can count the payment once
    if (sourceId) {
      setBulkGroups((prev) => ({
        ...prev,
        [sourceId]: new Set(Object.keys(batchEdits)),
      }));
    }
  };

  const handleLocalEdit = (
    id: string,
    field: keyof CuadreData,
    value: string | number | boolean | Date | null
  ) => {
    setEditValues((prev) => {
      const updated = {
        ...prev,
        [id]: {
          ...prev[id],
          [field]: value,
        },
      };
      debouncedSave(updated);
      return updated;
    });
  };

  const [showDeudaList, setShowDeudaList] = useState(false);

  // Calcular el total abonado teniendo en cuenta grupos bulk: cada grupo bulk cuenta una sola vez
  const grandTotals = useMemo(() => {
    const totalExpectedAcc = summaryData.reduce(
      (acc, rec) => acc + ((rec.precioNeto ?? 0) + (rec.tarifaServicio ?? 0)),
      0
    );

    // construir set de ids que pertenecen a un grupo bulk
    const allBulkIds = new Set<string>();
    Object.values(bulkGroups).forEach((s) =>
      s.forEach((id) => allBulkIds.add(id))
    );

    let totalPaidAcc = 0;

    // sumar montos de registros que no pertenecen a un bulk-group
    summaryData.forEach((rec) => {
      if (!allBulkIds.has(rec.id)) {
        totalPaidAcc += Number(editValues[rec.id]?.monto ?? rec.monto ?? 0);
      }
    });

    // para cada bulk group, sumar solo una vez (usar monto del sourceId si existe, sino el primer miembro)
    Object.entries(bulkGroups).forEach(([sourceId, idSet]) => {
      let repMonto: number | undefined;
      // preferir monto del sourceId si está en editValues
      if (sourceId && (editValues[sourceId]?.monto ?? null) != null) {
        repMonto = Number(editValues[sourceId]?.monto ?? 0);
      } else {
        // tomar primer id del grupo
        const firstId = Array.from(idSet)[0];
        const rec = summaryData.find((r) => r.id === firstId);
        if (rec)
          repMonto = Number(editValues[firstId]?.monto ?? rec.monto ?? 0);
      }
      totalPaidAcc += Number(repMonto ?? 0);
    });

    return {
      totalExpected: totalExpectedAcc,
      totalPaid: totalPaidAcc,
      faltante: Math.max(0, totalExpectedAcc - totalPaidAcc),
    };
  }, [summaryData, editValues, bulkGroups]);

  const groupedRecords = useMemo(() => {
    const map = new Map<
      string,
      { fechaGeneracion: Date; records: ExtendedSummaryRecord[] }
    >();

    const seenIds = new Set<string>();
    const unique = summaryData.filter((rec) => {
      if (seenIds.has(rec.id)) return false;
      seenIds.add(rec.id);
      return true;
    });

    unique.forEach((record) => {
      const createdAt =
        record.createdAt instanceof Date
          ? record.createdAt
          : new Date(record.createdAt as unknown as string);
      if (isNaN(createdAt.getTime())) return;
      const key = createdAt.toISOString().slice(0, 10);
      if (!map.has(key))
        map.set(key, { fechaGeneracion: createdAt, records: [] });
      map.get(key)!.records.push(record);
    });

    return Array.from(map.values())
      .map((g) => ({
        ...g,
        records: g.records.sort((a, b) => {
          const ta =
            (a.createdAt instanceof Date
              ? a.createdAt.getTime()
              : new Date(a.createdAt as unknown as string).getTime()) || 0;
          const tb =
            (b.createdAt instanceof Date
              ? b.createdAt.getTime()
              : new Date(b.createdAt as unknown as string).getTime()) || 0;
          return tb - ta;
        }),
      }))
      .sort(
        (a, b) => b.fechaGeneracion.getTime() - a.fechaGeneracion.getTime()
      );
  }, [summaryData]);

  const generationStatuses = useMemo(() => {
    return groupedRecords.map((g) => {
      const totalExpected = g.records.reduce(
        (acc, rec) => acc + ((rec.precioNeto ?? 0) + (rec.tarifaServicio ?? 0)),
        0
      );

      const idsInGen = new Set(g.records.map((r) => r.id));
      const allBulkIdsGen = new Set<string>();
      Object.values(bulkGroups).forEach((s) =>
        s.forEach((id) => {
          if (idsInGen.has(id)) allBulkIdsGen.add(id);
        })
      );

      let totalPaid = 0;
      g.records.forEach((rec) => {
        if (!allBulkIdsGen.has(rec.id)) {
          totalPaid += Number(editValues[rec.id]?.monto ?? rec.monto ?? 0);
        }
      });

      Object.entries(bulkGroups).forEach(([sourceId, idSet]) => {
        const relevantTargets = Array.from(idSet).filter((id) =>
          idsInGen.has(id)
        );
        if (relevantTargets.length > 0) {
          let repMonto: number | undefined;
          if (
            sourceId &&
            idsInGen.has(sourceId) &&
            (editValues[sourceId]?.monto ?? null) != null
          ) {
            repMonto = Number(editValues[sourceId]?.monto ?? 0);
          } else {
            const firstId = relevantTargets[0];
            const rec = g.records.find((r) => r.id === firstId);
            if (rec)
              repMonto = Number(editValues[firstId]?.monto ?? rec.monto ?? 0);
          }
          totalPaid += Number(repMonto ?? 0);
        }
      });

      const faltante = Math.max(0, totalExpected - totalPaid);
      return {
        fecha: g.fechaGeneracion.toLocaleDateString('es-CO'),
        faltante,
        totalExpected,
        totalPaid,
      };
    });
  }, [groupedRecords, editValues, bulkGroups]);

  function getEmitidoPorClass(emitidoPor: string): string | undefined {
    switch (emitidoPor?.toUpperCase()) {
      case 'GONZAAPP':
        return 'text-blue-700 font-bold';
      case 'ASESOR':
        return 'text-green-700 font-semibold';
      case 'CLIENTE':
        return 'text-purple-700 font-semibold';
      default:
        return 'text-gray-700';
    }
  }

  const handleSelectAll = (allIds: string[]) => {
    if (rowsToDelete.size === allIds.length) setRowsToDelete(new Set());
    else setRowsToDelete(new Set(allIds));
  };

  React.useEffect(() => {
    if (selectAllRef.current && groupedRecords.length > 0) {
      const allIds = groupedRecords.flatMap((g) => g.records.map((r) => r.id));
      selectAllRef.current.indeterminate =
        rowsToDelete.size > 0 && rowsToDelete.size < allIds.length;
    }
  }, [rowsToDelete, groupedRecords]);

  const handleDeleteModeToggle = () => {
    setIsDeleteMode(!isDeleteMode);
    setRowsToDelete(new Set());
  };

  const handleDeleteSelect = (id: string) => {
    const newSelected = new Set(rowsToDelete);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setRowsToDelete(newSelected);
  };

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full">
        <Header />
      </div>
      <div className="container mx-auto min-h-screen py-4 pt-20">
        <div className="py-4">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-gray-600 active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Volver al Inicio
            </Link>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Gestión de Cuadres</h1>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDeudaList((v) => !v)}
                  className={`relative flex items-center gap-3 rounded-md bg-white px-2 py-1 text-gray-800 ring-1 ring-gray-200 hover:shadow-md ${generationStatuses.every((s) => s.faltante === 0) ? 'bg-green-100' : 'bg-amber-100'}`}
                  title="Generaciones con deuda pendiente"
                >
                  <span
                    className={`inline-flex items-center justify-center rounded-full p-1 ${generationStatuses.every((s) => s.faltante === 0) ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                  >
                    <HiOutlineBell className="h-5 w-5" />
                  </span>
                  <span className="ml-0 text-sm font-bold text-gray-700">
                    {generationStatuses.filter((s) => s.faltante > 0).length}
                  </span>
                  {generationStatuses.filter((s) => s.faltante > 0).length >
                    0 && (
                    <span className="absolute -top-1 -right-2 inline-flex items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                      {generationStatuses.filter((s) => s.faltante > 0).length}
                    </span>
                  )}
                </button>

                {showDeudaList && (
                  <div className="absolute top-full right-0 mt-2 w-72 rounded bg-white p-3 shadow-lg">
                    <h4 className="mb-2 text-sm font-semibold">
                      Estados de generaciones
                    </h4>
                    <ul className="flex max-h-48 flex-col gap-1 overflow-auto">
                      {generationStatuses.map((s) => (
                        <li
                          key={s.fecha}
                          className="flex justify-between text-sm"
                        >
                          <span className="font-medium">{s.fecha}</span>
                          <span
                            className={`font-mono ${s.faltante === 0 ? 'text-green-700' : 'text-red-600'}`}
                          >
                            {s.faltante === 0
                              ? 'Pago completo'
                              : `Falta $ ${s.faltante.toLocaleString('es-CO')}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleDeleteModeToggle}
              className="rounded bg-red-500 px-4 py-2 font-semibold text-white transition-all hover:bg-red-700"
            >
              {isDeleteMode ? 'Cancelar' : 'Eliminar Registros'}
            </button>
          </div>

          <div className="mb-4 flex items-center gap-4">
            {isSaving ? (
              <span className="flex items-center gap-2 rounded-md bg-blue-300 px-3 py-2.5 text-sm font-bold text-blue-800">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Guardando cambios...
              </span>
            ) : (
              <span className="rounded-md bg-green-300 px-3 py-2.5 text-sm font-bold text-green-800">
                ✓ Todos los cambios guardados
              </span>
            )}

            {isDeleteMode && rowsToDelete.size > 0 && (
              <button
                onClick={async () => {
                  if (rowsToDelete.size === 0) return;
                  if (
                    confirm(
                      `¿Está seguro de eliminar ${rowsToDelete.size} registros?`
                    )
                  ) {
                    const ids = Array.from(rowsToDelete)
                      .map(
                        (transactionId) =>
                          summaryData.find((r) => r.id === transactionId)
                            ?.cuadreId
                      )
                      .filter((id): id is string => Boolean(id));
                    const res = await deleteCuadreRecords(ids);
                    if (res.success) {
                      mutate();
                      setRowsToDelete(new Set());
                      setIsDeleteMode(false);
                    } else {
                      alert('Error eliminando registros: ' + (res.error ?? ''));
                    }
                  }
                }}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Eliminar ({rowsToDelete.size})
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg bg-white shadow-lg">
            <table className="cuadre-table">
              <thead>
                <tr>
                  {isDeleteMode && (
                    <th className="cuadre-header font-lexend relative w-10 border-r bg-white">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <input
                          type="checkbox"
                          ref={selectAllRef}
                          checked={(() => {
                            const allIds = groupedRecords.flatMap((group) =>
                              group.records.map((r) => r.id)
                            );
                            return (
                              rowsToDelete.size === allIds.length &&
                              allIds.length > 0
                            );
                          })()}
                          onChange={() =>
                            handleSelectAll(
                              groupedRecords.flatMap((group) =>
                                group.records.map((r) => r.id)
                              )
                            )
                          }
                          className="h-4 w-4 rounded border-gray-600"
                        />
                      </div>
                    </th>
                  )}

                  {[
                    { key: 'Fecha', className: 'min-w-[110px] w-[120px]' },
                    { key: 'Placa', className: 'min-w-[90px] w-[100px]' },
                    {
                      key: 'Emitido Por',
                      className: 'min-w-[110px] w-[120px]',
                    },
                    { key: 'Asesor', className: 'min-w-[110px] w-[120px]' },
                    {
                      key: 'Tarifa Servicio',
                      className: 'min-w-[90px] w-[100px]',
                    },
                    {
                      key: 'Total (Precio + Tarifa)',
                      className: 'min-w-[110px] w-[120px]',
                    },
                    { key: 'Banco', className: 'min-w-[90px] w-[100px]' },
                    { key: 'Monto', className: 'min-w-[90px] w-[100px]' },
                    {
                      key: 'Fecha Cliente',
                      className: 'min-w-[120px] w-[130px]',
                    },
                    { key: 'Referencia', className: 'min-w-[120px] w-[130px]' },
                    { key: 'Pagado', className: 'min-w-[60px] w-[70px]' },
                  ].map(({ key, className }) => (
                    <th
                      key={key}
                      className={`cuadre-header font-lexend relative border-r bg-white ${className} ${key === 'Pagado' ? 'font-semibold' : ''}`}
                      style={
                        key === 'Fecha Cliente' ? { minWidth: 200 } : undefined
                      }
                    >
                      {key === 'Pagado' ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className="font-lexend font-semibold">
                            {key}
                          </span>
                          <input
                            type="checkbox"
                            title="Seleccionar / Deseleccionar todos pagado"
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const allIds = groupedRecords.flatMap((g) =>
                                g.records.map((r) => r.id)
                              );
                              const updated: Record<
                                string,
                                Partial<CuadreData>
                              > = {};
                              allIds.forEach((id) => {
                                updated[id] = {
                                  ...(editValues[id] ?? {}),
                                  pagado: checked,
                                };
                              });
                              setEditValues((prev) => ({
                                ...prev,
                                ...updated,
                              }));
                              debouncedSave({
                                ...(editValues ?? {}),
                                ...updated,
                              });
                            }}
                          />
                        </div>
                      ) : (
                        key
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <CuadreTableBody
                  groupedRecords={groupedRecords}
                  isDeleteMode={isDeleteMode}
                  rowsToDelete={rowsToDelete}
                  editValues={editValues}
                  handleDeleteSelect={handleDeleteSelect}
                  handleLocalEdit={handleLocalEdit}
                  handleBulkEdit={handleBulkEdit}
                  getEmitidoPorClass={getEmitidoPorClass}
                  bulkGroups={bulkGroups}
                />
              </tbody>
            </table>

            <div className="p-4">
              <div className="flex items-center justify-end gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-700">
                    Total esperado (Precio+Tarifa)
                  </div>
                  <div className="text-xl font-bold">
                    $ {grandTotals.totalExpected.toLocaleString('es-CO')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-700">Total abonado</div>
                  <div className="text-xl font-bold">
                    $ {grandTotals.totalPaid.toLocaleString('es-CO')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-700">Faltante</div>
                  <div
                    className={`text-xl font-bold ${grandTotals.faltante === 0 ? 'text-green-700' : 'text-red-700'}`}
                  >
                    $ {grandTotals.faltante.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
