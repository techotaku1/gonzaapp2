'use client';

import { useEffect, useMemo, useState } from 'react';

import { es } from 'date-fns/locale';
import { format as formatTz } from 'date-fns-tz';
import { PiKeyReturnFill } from 'react-icons/pi';
import useSWR from 'swr';

import { bancoOptions } from '~/utils/constants';

import type { BoletaPaymentRecord } from '~/types';

function TotalsSummary({
  pagosPorFecha,
  selectedFecha,
  startDate,
  endDate,
}: {
  pagosPorFecha: { map: Map<string, BoletaPaymentRecord[]>; fechas: string[] };
  selectedFecha: string;
  startDate: string | null;
  endDate: string | null;
}) {
  const formatCurrencyLocal = (amount: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const totals = useMemo(() => {
    const payments: BoletaPaymentRecord[] = [];
    if (startDate || endDate) {
      // Flatten all payments and filter by range
      for (const [, arr] of pagosPorFecha.map.entries()) {
        for (const p of arr) {
          const fecha = p.fecha instanceof Date ? p.fecha : new Date(p.fecha);
          const iso = fecha.toISOString().slice(0, 10);
          if (startDate && iso < startDate) continue;
          if (endDate && iso > endDate) continue;
          payments.push(p);
        }
      }
    } else {
      const arr = pagosPorFecha.map.get(selectedFecha) ?? [];
      payments.push(...arr);
    }

    let totalEgresos = 0;
    let total4x1000 = 0;
    for (const p of payments) {
      const total = Number(p.totalPrecioNeto) || 0;
      const impuesto = Math.round(total * 0.004);
      totalEgresos += total;
      total4x1000 += impuesto;
    }
    const neto = totalEgresos - total4x1000;
    return { totalEgresos, total4x1000, neto };
  }, [pagosPorFecha, selectedFecha, startDate, endDate]);

  return (
    <div className="flex items-center gap-4">
      <div className="rounded-md bg-white p-3 shadow">
        <div className="text-xs text-gray-500">TOTAL EGRESOS</div>
        <div className="text-lg font-bold text-green-600">
          {formatCurrencyLocal(totals.totalEgresos)}
        </div>
      </div>
      <div className="rounded-md bg-white p-3 shadow">
        <div className="text-xs text-gray-500">4x1000</div>
        <div className="text-lg font-bold text-red-600">
          {formatCurrencyLocal(totals.total4x1000)}
        </div>
      </div>
      <div className="rounded-md bg-white p-3 shadow">
        <div className="text-xs text-gray-500">TOTAL EGRESOS NETO</div>
        <div className="text-lg font-bold text-blue-600">
          {formatCurrencyLocal(totals.neto)}
        </div>
      </div>
    </div>
  );
}

export default function TransactionBoletaTotals({
  showTotals,
  onToggleTotalsAction,
  showMonthlyTotals,
  onToggleMonthlyTotalsAction,
  showBoletaTotals,
  onToggleBoletaTotalsAction,
  onBackToTableAction,
}: {
  showTotals?: boolean;
  onToggleTotalsAction?: () => void;
  showMonthlyTotals?: boolean;
  onToggleMonthlyTotalsAction?: () => void;
  showBoletaTotals?: boolean;
  onToggleBoletaTotalsAction?: () => void;
  onBackToTableAction?: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Local filter state (moved inside this component so buttons remain above this frontend)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const { data: boletaPayments = [], error } = useSWR<BoletaPaymentRecord[]>(
    '/api/boleta-payments',
    async (url: string) => {
      const res = await fetch(url);
      const data: unknown = await res.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'boletaPayments' in data &&
        Array.isArray((data as { boletaPayments: unknown }).boletaPayments)
      ) {
        return (data as { boletaPayments: BoletaPaymentRecord[] })
          .boletaPayments;
      }
      return [];
    }
  );

  const formatCurrency = useMemo(
    () => (amount: number) => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    },
    []
  );

  // Agrupa los pagos por fecha (YYYY-MM-DD), ordena ascendente para paginación natural
  const pagosPorFecha = useMemo(() => {
    const map = new Map<string, BoletaPaymentRecord[]>();
    for (const p of boletaPayments) {
      const fechaObj = p.fecha instanceof Date ? p.fecha : new Date(p.fecha);
      // Normaliza a fecha Colombia (por si el backend guarda en UTC)
      const fechaColombia = formatTz(fechaObj, 'yyyy-MM-dd', {
        timeZone: 'America/Bogota',
      });
      if (!map.has(fechaColombia)) map.set(fechaColombia, []);
      map.get(fechaColombia)!.push(p);
    }
    // Ordena las fechas ascendente (más antiguo primero, más reciente último)
    const fechas = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    // Ordena cada grupo por fecha/hora descendente (más reciente arriba)
    for (const key of fechas) {
      map.set(
        key,
        map.get(key)!.sort((a, b) => {
          const fa = a.fecha instanceof Date ? a.fecha : new Date(a.fecha);
          const fb = b.fecha instanceof Date ? b.fecha : new Date(b.fecha);
          return fb.getTime() - fa.getTime();
        })
      );
    }
    return { map, fechas };
  }, [boletaPayments]);

  // Paginación por día (un día por página, cada página = una fecha única)
  // Páginas numeradas 1..totalPages (1 = día más antiguo, totalPages = día más reciente)
  const totalPages = pagosPorFecha.fechas.length || 1;
  // Inicializa la página al día más reciente cuando se cargan las fechas (si no hay rango)
  useEffect(() => {
    if (!startDate && !endDate && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, startDate, endDate]);

  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const selectedFecha = pagosPorFecha.fechas[safePage - 1] ?? '';

  // If the user changes the date range, reset to page 1 and keep pagination in-bounds
  useEffect(() => {
    if (startDate || endDate) {
      setCurrentPage(1);
      return;
    }
    // keep within bounds
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, totalPages]);

  // Filtrado local: combina rango de fechas, búsqueda y paginación por día
  const filteredPayments = useMemo(() => {
    const s = (searchTerm ?? '').trim().toLowerCase();
    let candidates: BoletaPaymentRecord[] = [];

    if (startDate || endDate) {
      // Si hay rango de fechas, obtener TODOS los pagos dentro del rango
      for (const [, arr] of pagosPorFecha.map.entries()) {
        for (const p of arr) {
          const fecha = p.fecha instanceof Date ? p.fecha : new Date(p.fecha);
          const iso = formatTz(fecha, 'yyyy-MM-dd', {
            timeZone: 'America/Bogota',
          });
          // Filtrar por rango de fechas
          if (startDate && iso < startDate) continue;
          if (endDate && iso > endDate) continue;
          candidates.push(p);
        }
      }
      // Ordenar por fecha descendente (más reciente primero)
      candidates.sort((a, b) => {
        const fa =
          a.fecha instanceof Date
            ? a.fecha.getTime()
            : new Date(a.fecha).getTime();
        const fb =
          b.fecha instanceof Date
            ? b.fecha.getTime()
            : new Date(b.fecha).getTime();
        return fb - fa;
      });
    } else {
      // Sin rango: solo el día seleccionado en la paginación
      candidates = pagosPorFecha.map.get(selectedFecha) ?? [];
    }

    // Aplicar filtro de búsqueda sobre los candidatos (rango o día actual)
    if (!s) return candidates;

    return candidates.filter((p) => {
      // Buscar en referencia de boleta
      const ref = String(p.boletaReferencia ?? '').toLowerCase();
      if (ref.includes(s)) return true;

      // Buscar en creador
      const creador = String(p.createdByInitial ?? '').toLowerCase();
      if (creador.includes(s)) return true;

      // Buscar en banco
      const banco = String(p.banco ?? '').toLowerCase();
      if (banco.includes(s)) return true;

      // Buscar en placas
      if (Array.isArray(p.placas)) {
        for (const pl of p.placas) {
          if (
            String(pl ?? '')
              .toLowerCase()
              .includes(s)
          )
            return true;
        }
      } else if (
        String(p.placas ?? '')
          .toLowerCase()
          .includes(s)
      ) {
        return true;
      }

      // Buscar en trámites
      if (Array.isArray(p.tramites)) {
        for (const tr of p.tramites) {
          if (
            String(tr ?? '')
              .toLowerCase()
              .includes(s)
          )
            return true;
        }
      } else if (
        String(p.tramites ?? '')
          .toLowerCase()
          .includes(s)
      ) {
        return true;
      }

      return false;
    });
  }, [pagosPorFecha, selectedFecha, searchTerm, startDate, endDate]);

  // Handler unificado para "Volver a la tabla principal"
  const handleBack = () => {
    if (onBackToTableAction) {
      onBackToTableAction();
      return;
    }
    // Fallback: asegurar que todas las vistas de totales queden desactivadas
    if (showTotals && onToggleTotalsAction) onToggleTotalsAction();
    if (showMonthlyTotals && onToggleMonthlyTotalsAction)
      onToggleMonthlyTotalsAction();
    if (showBoletaTotals && onToggleBoletaTotalsAction)
      onToggleBoletaTotalsAction();
  };

  // Handler para cambiar de día
  // "Día anterior" => ir al día anterior en la secuencia (más antiguo) => decrementa page
  // "Día siguiente" => ir al día siguiente en la secuencia (más reciente) => incrementa page
  const handlePrevDay = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextDay = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (error) {
    return <div className="text-red-600">Error cargando datos de boletas.</div>;
  }

  return (
    <div className="font-display container mx-auto px-6">
      {/* Botones de navegación entre totales - SIEMPRE arriba del frontend de búsqueda/rango */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={(e) => {
            if (
              (e as React.MouseEvent).detail &&
              (e as React.MouseEvent).detail > 1
            )
              return;
            if (onToggleTotalsAction) onToggleTotalsAction();
            if (showMonthlyTotals && onToggleMonthlyTotalsAction)
              onToggleMonthlyTotalsAction();
            if (showBoletaTotals && onToggleBoletaTotalsAction)
              onToggleBoletaTotalsAction();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={`h-10 rounded px-4 py-2 font-semibold transition-colors ${
            showTotals ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
          } hover:bg-blue-700 hover:text-white`}
        >
          Totales Diarios
        </button>
        <button
          type="button"
          onClick={(e) => {
            if (
              (e as React.MouseEvent).detail &&
              (e as React.MouseEvent).detail > 1
            )
              return;
            if (showTotals && onToggleTotalsAction) onToggleTotalsAction();
            if (onToggleMonthlyTotalsAction) onToggleMonthlyTotalsAction();
            if (showBoletaTotals && onToggleBoletaTotalsAction)
              onToggleBoletaTotalsAction();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={`h-10 rounded px-4 py-2 font-semibold transition-colors ${
            showMonthlyTotals
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-100 text-indigo-800'
          } hover:bg-indigo-700 hover:text-white`}
        >
          Totales Mensuales
        </button>
        <button
          type="button"
          onClick={(e) => {
            if (
              (e as React.MouseEvent).detail &&
              (e as React.MouseEvent).detail > 1
            )
              return;
            if (showTotals && onToggleTotalsAction) onToggleTotalsAction();
            if (showMonthlyTotals && onToggleMonthlyTotalsAction)
              onToggleMonthlyTotalsAction();
            if (onToggleBoletaTotalsAction) onToggleBoletaTotalsAction();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={`h-10 rounded px-4 py-2 font-semibold transition-colors ${
            showBoletaTotals
              ? 'bg-green-600 text-white'
              : 'bg-green-100 text-green-800'
          } hover:bg-green-700 hover:text-white`}
        >
          Totales Boletas
        </button>
        <button
          type="button"
          onClick={(e) => {
            if (
              (e as React.MouseEvent).detail &&
              (e as React.MouseEvent).detail > 1
            )
              return;
            handleBack();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="flex h-10 items-center gap-2 rounded bg-gray-200 px-4 py-2 font-semibold text-gray-800 transition-colors hover:bg-gray-400 hover:text-white"
        >
          <PiKeyReturnFill className="text-xl" />
          Volver a la tabla principal
        </button>
      </div>

      {/* Frontend de búsqueda y rango de fechas (ahora gestionado aquí, debajo de los botones) */}
      {/* Totals summary: muestra totales según rango o día seleccionado */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-4">
          {/* Totales cards */}
          {/* Calculados según rango (si hay) o según el día seleccionado */}
          <TotalsSummary
            pagosPorFecha={pagosPorFecha}
            selectedFecha={selectedFecha}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-md">
        <input
          type="text"
          placeholder="Buscar por placa, referencia, banco, trámite o creador..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            // No resetear página si hay rango de fechas
            if (!startDate && !endDate) {
              setCurrentPage(1);
            }
          }}
          className="min-w-[250px] flex-1 rounded-md border border-gray-300 px-3 py-2"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Desde:</label>
          <input
            type="date"
            value={startDate ?? ''}
            onChange={(e) => {
              setStartDate(e.target.value ? e.target.value : null);
            }}
            className="rounded-md border border-gray-300 px-2 py-2"
            aria-label="Fecha inicial"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Hasta:</label>
          <input
            type="date"
            value={endDate ?? ''}
            onChange={(e) => {
              setEndDate(e.target.value ? e.target.value : null);
            }}
            className="rounded-md border border-gray-300 px-2 py-2"
            aria-label="Fecha final"
          />
        </div>
        <button
          onClick={() => {
            setSearchTerm('');
            setStartDate(null);
            setEndDate(null);
            setCurrentPage(totalPages); // Volver al día más reciente
          }}
          className="rounded border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium hover:bg-gray-100"
          type="button"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Título (la fecha ya aparece en la columna Fecha) */}
      <div className="flex items-center justify-between">
        <h3 className="text-4xl font-semibold">Totales Boletas Pagadas</h3>
      </div>
      <div className="flex items-center justify-end">
        {!startDate && !endDate ? (
          <span className="text-sm text-gray-500">
            Día {currentPage} de {totalPages}
          </span>
        ) : (
          <span className="text-sm text-gray-500">
            Resultados: {filteredPayments.length} registros
          </span>
        )}
      </div>

      {/* Tabla de boletas pagadas solo del día seleccionado */}
      <div className="overflow-x-auto">
        <table className="w-full rounded-lg bg-white shadow-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold tracking-wider text-gray-800 uppercase">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold tracking-wider text-gray-800 uppercase">
                Trámite
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold tracking-wider text-gray-800 uppercase">
                Referencia Boleta
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold tracking-wider text-gray-800 uppercase">
                Placas
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold tracking-wider text-gray-800 uppercase">
                Banco
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold tracking-wider text-gray-800 uppercase">
                TOTAL EGRESOS
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold tracking-wider text-gray-800 uppercase">
                4x1000
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold tracking-wider text-gray-800 uppercase">
                TOTAL EGRESOS NETO
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold tracking-wider text-gray-800 uppercase">
                Creador
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPayments.map((payment) => {
              const totalEgresos = Number(payment.totalPrecioNeto);
              const impuesto4x1000 = Math.round(totalEgresos * 0.004);
              const egresosNeto = totalEgresos - impuesto4x1000;
              // Mostrar fecha y hora de ingreso en Colombia (sin trucar, ya se guarda en hora Colombia)
              const fecha =
                payment.fecha instanceof Date
                  ? payment.fecha
                  : new Date(payment.fecha);
              return (
                <tr
                  key={payment.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatTz(fecha, 'dd/MM/yyyy - hh:mm:ss a', {
                      locale: es,
                      timeZone: 'America/Bogota',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {Array.isArray(payment.tramites) &&
                    payment.tramites.length > 0
                      ? (() => {
                          // Deduplica SOAT (case-insensitive), deja otros trámites igual
                          const deduped = payment.tramites.reduce<string[]>(
                            (acc, t) => {
                              if (
                                typeof t === 'string' &&
                                t.trim().toUpperCase() === 'SOAT'
                              ) {
                                if (
                                  !acc.some((x) => x.toUpperCase() === 'SOAT')
                                )
                                  acc.push('SOAT');
                              } else if (t) {
                                acc.push(t);
                              }
                              return acc;
                            },
                            []
                          );
                          return deduped.join(', ');
                        })()
                      : 'SOAT'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.boletaReferencia}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {Array.isArray(payment.placas) &&
                    payment.placas.length > 0 &&
                    payment.placas[0]
                      ? payment.placas.join(', ')
                      : 'NO APLICA'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.banco ?? bancoOptions[0] ?? ''}
                  </td>
                  <td className="px-6 py-4 text-right font-medium whitespace-nowrap text-green-600">
                    {formatCurrency(payment.totalPrecioNeto)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium whitespace-nowrap text-red-600">
                    {/* Mostrar el valor con signo menos */}
                    {'$ -' +
                      formatCurrency(impuesto4x1000).replace('$', '').trim()}
                  </td>
                  <td className="px-6 py-4 text-right font-medium whitespace-nowrap text-blue-600">
                    {formatCurrency(egresosNeto)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.createdByInitial ?? ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación por día: solo mostrar cuando NO hay rango de fechas */}
      {!startDate && !endDate && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={handlePrevDay}
            disabled={currentPage === 1}
            className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
          >
            Día anterior
          </button>
          <span className="text-sm font-medium text-gray-700">
            Día {currentPage} de {totalPages}
          </span>
          <button
            onClick={handleNextDay}
            disabled={currentPage === totalPages}
            className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
          >
            Día siguiente
          </button>
        </div>
      )}
    </div>
  );
}
