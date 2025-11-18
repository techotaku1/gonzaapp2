import React, { useMemo, useState } from 'react';

import { createPortal } from 'react-dom';

import { bancoOptions } from '~/utils/constants';
import {
  fromDatetimeLocalStringToColombiaDate,
  toColombiaDatetimeLocalString,
} from '~/utils/dateUtils';

import type { CuadreData, ExtendedSummaryRecord } from '~/types';

interface CuadreTableBodyProps {
  groupedRecords: {
    fechaGeneracion: Date;
    records: ExtendedSummaryRecord[];
  }[];
  isDeleteMode: boolean;
  rowsToDelete: Set<string>;
  editValues: Record<string, Partial<CuadreData>>;
  handleDeleteSelect: (id: string) => void;
  handleLocalEdit: (
    id: string,
    field: keyof CuadreData,
    value: string | number | boolean | Date | null
  ) => void;
  handleBulkEdit: (
    batchEdits: Record<string, Partial<CuadreData>>,
    sourceId?: string | null
  ) => void;
  getEmitidoPorClass: (emitidoPor: string) => string | undefined;
  onBulkApply?: (srcId: string, targets: string[]) => void;
  bulkGroups: Record<string, Set<string>>;
}

const CuadreTableBody: React.FC<CuadreTableBodyProps> = ({
  groupedRecords,
  isDeleteMode,
  rowsToDelete,
  editValues,
  handleDeleteSelect,
  handleLocalEdit,
  handleBulkEdit,
  getEmitidoPorClass,
  onBulkApply,
  bulkGroups,
}) => {
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applySourceId, setApplySourceId] = useState<string | null>(null);
  const [applyTargets, setApplyTargets] = useState<string[]>([]);
  const [applyAlternateTargets, setApplyAlternateTargets] = useState<string[]>(
    []
  );
  const [applyScope, setApplyScope] = useState<'subgroup' | 'generation'>(
    'subgroup'
  );

  // Crear mapa plano id -> record para búsquedas rápidas
  const idToRecord = useMemo(() => {
    const map = new Map<string, ExtendedSummaryRecord>();
    groupedRecords.forEach((g) => g.records.forEach((r) => map.set(r.id, r)));
    return map;
  }, [groupedRecords]);

  // Helper para obtener valores efectivos (editValues override)
  const getEffectiveValue = (
    recordId: string,
    field: keyof CuadreData
  ): unknown => {
    if (editValues[recordId]?.[field] !== undefined) {
      return editValues[recordId]?.[field as keyof CuadreData];
    }
    return undefined;
  };

  return (
    <>
      {groupedRecords.map((grupo) => {
        // Agrupa por asesor y fecha (como antes)
        const asesorFechaMap = new Map<
          string,
          { asesor: string; fecha: Date; records: ExtendedSummaryRecord[] }
        >();
        grupo.records.forEach((record) => {
          const asesor = record.asesor ?? 'Sin Asesor';
          const fecha =
            record.fecha instanceof Date
              ? record.fecha
              : new Date(record.fecha);
          const key = asesor + '__' + fecha.toLocaleDateString('es-CO');
          if (!asesorFechaMap.has(key)) {
            asesorFechaMap.set(key, { asesor, fecha, records: [] });
          }
          asesorFechaMap.get(key)!.records.push(record);
        });

        // Nota: el total por generación se calcula en el componente padre (total general)

        return (
          <React.Fragment key={`gen_${grupo.fechaGeneracion.getTime()}`}>
            {/* Encabezado de fecha de generación */}
            <tr>
              <td
                colSpan={isDeleteMode ? 12 : 11}
                className="border-b border-gray-400 bg-yellow-100 px-1 py-2 text-left text-base font-bold"
              >
                <span className="text-yellow-900">Fecha de generación:</span>{' '}
                {grupo.fechaGeneracion.toLocaleDateString('es-CO')}
              </td>
            </tr>
            {/* Subgrupos por asesor y fecha */}
            {Array.from(asesorFechaMap.values()).map((asesorFecha) => {
              const subTotal = asesorFecha.records.reduce(
                (acc, r) => acc + (r.precioNeto + (r.tarifaServicio ?? 0)),
                0
              );
              // El subtotal solo muestra el total esperado y el faltante, no el total abonado
              const faltante = subTotal; // No restar monto abonado en subtotales
              return (
                <React.Fragment
                  key={
                    asesorFecha.asesor +
                    '__' +
                    asesorFecha.fecha.toLocaleDateString('es-CO')
                  }
                >
                  {/* Encabezado asesor/fecha */}
                  <tr>
                    <td
                      colSpan={isDeleteMode ? 12 : 11}
                      className="border-b border-gray-400 bg-gray-200 px-1 py-2 text-left text-lg font-bold"
                    >
                      <span className="text-blue-900">Asesor:</span>{' '}
                      {asesorFecha.asesor} &nbsp;|&nbsp;
                      <span className="text-gray-700">Fecha:</span>{' '}
                      {asesorFecha.fecha.toLocaleDateString('es-CO')}
                    </td>
                  </tr>
                  {/* Filas de registros */}
                  {asesorFecha.records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      {isDeleteMode && (
                        <td className="cuadre-cell">
                          <div className="flex h-full items-center justify-center">
                            <input
                              type="checkbox"
                              checked={rowsToDelete.has(record.id)}
                              onChange={() => handleDeleteSelect(record.id)}
                              className="h-4 w-4 rounded border-gray-600"
                            />
                          </div>
                        </td>
                      )}
                      <td className="cuadre-cell font-lexend">
                        {new Date(record.fecha).toLocaleDateString('es-CO')}
                      </td>
                      <td className="cuadre-cell font-lexend font-bold uppercase">
                        {record.placa}
                      </td>
                      <td className="cuadre-cell font-lexend">
                        <div className={getEmitidoPorClass(record.emitidoPor)}>
                          {record.emitidoPor}
                        </div>
                      </td>
                      <td className="cuadre-cell font-lexend font-semibold">
                        {record.asesor}
                      </td>
                      <td className="cuadre-cell font-lexend">
                        ${' '}
                        {Number(record.tarifaServicio).toLocaleString('es-CO')}
                      </td>
                      <td className="cuadre-cell font-lexend font-bold">
                        $
                        {(
                          record.precioNeto + (record.tarifaServicio ?? 0)
                        ).toLocaleString('es-CO')}
                      </td>
                      <td className="cuadre-cell">
                        <select
                          value={
                            editValues[record.id]?.banco ?? record.banco ?? ''
                          }
                          onChange={(e) =>
                            handleLocalEdit(record.id, 'banco', e.target.value)
                          }
                          className="cuadre-select font-lexend text-xs"
                          style={{ fontSize: '0.75rem' }}
                          title={
                            editValues[record.id]?.banco ?? record.banco ?? ''
                          }
                        >
                          <option value="">Seleccionar...</option>
                          {bancoOptions.map((option) => (
                            <option key={option} value={option} title={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="cuadre-cell">
                        <div style={{ position: 'relative', width: '100%' }}>
                          <input
                            type="text"
                            value={
                              editValues[record.id]?.monto !== undefined
                                ? editValues[record.id]?.monto === 0
                                  ? '$ 0'
                                  : `$ ${Number(editValues[record.id]?.monto).toLocaleString('es-CO')}`
                                : record.monto === 0 ||
                                    record.monto === undefined ||
                                    record.monto === null
                                  ? '$ 0'
                                  : `$ ${Number(record.monto).toLocaleString('es-CO')}`
                            }
                            onChange={(e) => {
                              const value = e.target.value.replace(
                                /[^\d]/g,
                                ''
                              );
                              handleLocalEdit(
                                record.id,
                                'monto',
                                value === '' ? 0 : Number(value)
                              );
                            }}
                            className="cuadre-input font-lexend"
                            style={{
                              paddingLeft: '0.5rem',
                              appearance: 'textfield',
                              WebkitAppearance: 'none',
                              MozAppearance: 'textfield',
                              marginLeft: 0,
                              width: '90%',
                            }}
                          />
                        </div>
                      </td>
                      <td
                        className="cuadre-cell date-column font-lexend"
                        title={
                          (editValues[record.id]?.fechaCliente
                            ? new Date(
                                editValues[record.id]?.fechaCliente ?? ''
                              )
                            : record.fechaCliente
                              ? new Date(record.fechaCliente)
                              : null
                          )?.toLocaleString('es-CO', { hour12: true }) ?? ''
                        }
                      >
                        <input
                          type="datetime-local"
                          value={
                            editValues[record.id]?.fechaCliente
                              ? toColombiaDatetimeLocalString(
                                  new Date(
                                    editValues[record.id]?.fechaCliente ?? ''
                                  )
                                )
                              : record.fechaCliente
                                ? toColombiaDatetimeLocalString(
                                    new Date(record.fechaCliente)
                                  )
                                : ''
                          }
                          onChange={(e) =>
                            handleLocalEdit(
                              record.id,
                              'fechaCliente',
                              e.target.value
                                ? fromDatetimeLocalStringToColombiaDate(
                                    e.target.value
                                  )
                                : null
                            )
                          }
                          className="cuadre-input"
                          style={{ width: '100px' }}
                        />
                      </td>
                      <td className="cuadre-cell border-r-0">
                        <input
                          type="text"
                          value={
                            editValues[record.id]?.referencia ??
                            record.referencia ??
                            ''
                          }
                          onChange={(e) =>
                            handleLocalEdit(
                              record.id,
                              'referencia',
                              e.target.value
                            )
                          }
                          className="cuadre-input font-lexend"
                        />
                      </td>
                      <td
                        className="cuadre-cell font-lexend"
                        style={{
                          width: '3.5rem',
                          minWidth: '3.5rem',
                          maxWidth: '3.5rem',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            editValues[record.id]?.pagado ?? !!record.pagado
                          }
                          onChange={(e) => {
                            const checked = e.target.checked;
                            // Marcar el registro actual como pagado localmente
                            handleLocalEdit(record.id, 'pagado', checked);

                            if (checked) {
                              // Construir targets: los ids del subgrupo que no están pagados
                              const subgroupTargets = asesorFecha.records
                                .filter((r) => r.id !== record.id)
                                .filter(
                                  (r) =>
                                    !(editValues[r.id]?.pagado ?? !!r.pagado)
                                )
                                .map((r) => r.id);

                              // también calcula targets a nivel de generación (todas las filas de este grupo)
                              const generationTargets = grupo.records
                                .filter((r) => r.id !== record.id)
                                .filter(
                                  (r) =>
                                    !(editValues[r.id]?.pagado ?? !!r.pagado)
                                )
                                .map((r) => r.id);

                              // Si hay targets en subgroup o en generation, abrir modal
                              if (
                                subgroupTargets.length > 0 ||
                                generationTargets.length > 0
                              ) {
                                setApplySourceId(record.id);
                                setApplyTargets(subgroupTargets);
                                setApplyAlternateTargets(generationTargets);
                                // default scope: subgroup if there are subgroup targets, otherwise generation
                                setApplyScope(
                                  subgroupTargets.length > 0
                                    ? 'subgroup'
                                    : 'generation'
                                );
                                setApplyModalOpen(true);
                              }
                            }
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                  {/* Subtotal del subgrupo asesor/fecha: solo mostrar el total esperado y el faltante, no restar el monto abonado */}
                  <tr className="bg-yellow-50">
                    {isDeleteMode && <td className="cuadre-cell" />}
                    <td
                      className="cuadre-cell text-right font-bold text-yellow-800"
                      colSpan={5}
                    >
                      Total esperado (día):
                    </td>
                    <td className="cuadre-cell font-bold text-yellow-800">
                      $ {subTotal.toLocaleString('es-CO')}
                    </td>
                    <td
                      className="cuadre-cell font-bold text-yellow-800"
                      colSpan={1}
                    >
                      {faltante === 0 ? (
                        <span className="text-green-700">Saldo OK</span>
                      ) : (
                        <span className="text-red-700">
                          Falta $ {faltante.toLocaleString('es-CO')}
                        </span>
                      )}
                    </td>
                    <td className="cuadre-cell" colSpan={4} />
                  </tr>
                </React.Fragment>
              );
            })}
            {/* Totales por generación */}
            {(() => {
              const totalExpectedGen = grupo.records.reduce(
                (acc, rec) =>
                  acc + ((rec.precioNeto ?? 0) + (rec.tarifaServicio ?? 0)),
                0
              );

              const idsInGen = new Set(grupo.records.map((r) => r.id));
              const allBulkIdsGen = new Set<string>();
              Object.values(bulkGroups).forEach((s) =>
                s.forEach((id) => {
                  if (idsInGen.has(id)) allBulkIdsGen.add(id);
                })
              );

              let totalPaidGen = 0;
              grupo.records.forEach((rec) => {
                if (!allBulkIdsGen.has(rec.id)) {
                  totalPaidGen += Number(
                    editValues[rec.id]?.monto ?? rec.monto ?? 0
                  );
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
                    const rec = grupo.records.find((r) => r.id === firstId);
                    if (rec)
                      repMonto = Number(
                        editValues[firstId]?.monto ?? rec.monto ?? 0
                      );
                  }
                  totalPaidGen += Number(repMonto ?? 0);
                }
              });

              const faltanteGen = Math.max(0, totalExpectedGen - totalPaidGen);

              return (
                <tr className="bg-blue-50">
                  <td colSpan={isDeleteMode ? 12 : 11} className="text-center">
                    <div className="flex justify-end gap-4 py-2">
                      <div className="text-sm text-gray-700">
                        Total esperado (Precio+Tarifa)
                      </div>
                      <div className="text-xl font-bold">
                        $ {totalExpectedGen.toLocaleString('es-CO')}
                      </div>
                      <div className="text-sm text-gray-700">Total abonado</div>
                      <div className="text-xl font-bold">
                        $ {totalPaidGen.toLocaleString('es-CO')}
                      </div>
                      <div className="text-sm text-gray-700">Faltante</div>
                      <div
                        className={`text-xl font-bold ${faltanteGen === 0 ? 'text-green-700' : 'text-red-700'}`}
                      >
                        $ {faltanteGen.toLocaleString('es-CO')}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })()}
            {/* Total general del grupo de generación eliminado: el total general se muestra en el componente padre */}
          </React.Fragment>
        );
      })}

      {/* Modal simple de confirmación para aplicar valores a múltiples filas (renderizado en portal para evitar colocar <div> dentro de <tbody>) */}
      {applyModalOpen && applySourceId && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div
                className="rounded bg-white p-4 shadow-lg"
                style={{ minWidth: 320 }}
              >
                <h3 className="mb-2 font-bold">
                  Aplicar valores a {applyTargets.length} filas
                </h3>
                <p className="mb-2 text-sm text-gray-700">
                  Se aplicarán los valores de Banco, Monto, Fecha Cliente y
                  Referencia del registro seleccionado. Elige el alcance y
                  confirma.
                </p>
                <div className="mb-3">
                  <label className="mr-4 inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="applyScope"
                      value="subgroup"
                      checked={applyScope === 'subgroup'}
                      onChange={() => setApplyScope('subgroup')}
                    />
                    <span className="text-sm">
                      Mismo asesor y fecha (subgrupo)
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      name="applyScope"
                      value="generation"
                      checked={applyScope === 'generation'}
                      onChange={() => setApplyScope('generation')}
                    />
                    <span className="text-sm">
                      Toda la generación (todos los registros de esta fecha de
                      generación)
                    </span>
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className="rounded border px-1 py-1 text-sm"
                    onClick={() => {
                      setApplyModalOpen(false);
                      setApplySourceId(null);
                      setApplyTargets([]);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="rounded bg-green-600 px-1 py-1 text-sm text-white"
                    onClick={() => {
                      // Obtener valores fuente
                      const srcId = applySourceId;
                      if (!srcId) return;
                      const srcRecord = idToRecord.get(srcId);
                      const banco = (getEffectiveValue(srcId, 'banco') ??
                        srcRecord?.banco ??
                        '') as string;
                      const monto = Number(
                        (getEffectiveValue(srcId, 'monto') ??
                          srcRecord?.monto ??
                          0) as number
                      );
                      const fechaCliente = (getEffectiveValue(
                        srcId,
                        'fechaCliente'
                      ) ??
                        srcRecord?.fechaCliente ??
                        null) as Date | null;
                      const referencia = (getEffectiveValue(
                        srcId,
                        'referencia'
                      ) ??
                        srcRecord?.referencia ??
                        '') as string;

                      const finalTargets =
                        applyScope === 'generation'
                          ? applyAlternateTargets
                          : applyTargets;

                      // Aplicar a cada target en un solo batch para evitar POST infinito
                      const batchEdits = { ...editValues };
                      finalTargets.forEach((tid) => {
                        batchEdits[tid] = {
                          ...(batchEdits[tid] ?? {}),
                          banco,
                          monto: Number(monto ?? 0),
                          fechaCliente,
                          referencia,
                          pagado: true,
                        };
                      });
                      // Solo guardar una vez: actualizar todos los editValues y disparar debouncedSave una sola vez
                      if (typeof handleBulkEdit === 'function') {
                        handleBulkEdit(batchEdits, applySourceId ?? undefined);
                      }

                      // Informar al padre sobre la aplicación en bloque para ajustar totales
                      if (onBulkApply && applySourceId) {
                        onBulkApply(applySourceId, finalTargets);
                      }

                      // Cerrar modal
                      setApplyModalOpen(false);
                      setApplySourceId(null);
                      setApplyTargets([]);
                      setApplyAlternateTargets([]);
                    }}
                  >
                    Aplicar y Marcar como Pagado
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};

export default CuadreTableBody;
