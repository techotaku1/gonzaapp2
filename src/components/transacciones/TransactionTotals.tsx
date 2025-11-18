'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { es } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import { PiKeyReturnFill } from 'react-icons/pi';

import { getColombiaDate } from '~/utils/dateUtils'; // Add this import
import { calculateFormulas } from '~/utils/formulas';

import type { TransactionRecord } from '~/types';

import 'react-datepicker/dist/react-datepicker.css';

interface TotalsByDate {
  date: string;
  precioNetoTotal: number;
  tarifaServicioTotal: number;
  impuesto4x1000Total: number;
  gananciaBrutaTotal: number;
  transactionCount: number;
}

export default function TransactionTotals({
  transactions,
  showTotals,
  onToggleTotalsAction,
  showMonthlyTotals,
  onToggleMonthlyTotalsAction,
  showBoletaTotals,
  onToggleBoletaTotalsAction,
  onBackToTableAction,
}: {
  transactions: TransactionRecord[];
  showTotals?: boolean;
  onToggleTotalsAction?: () => void;
  showMonthlyTotals?: boolean;
  onToggleMonthlyTotalsAction?: () => void;
  showBoletaTotals?: boolean;
  onToggleBoletaTotalsAction?: () => void;
  onBackToTableAction?: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estado para filtro de búsqueda y fechas en la vista de totales
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Declarar formatDate antes de los useMemo y envolver en useCallback
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      // Create date in Colombia timezone maintaining the day
      const colombiaDate = new Date(
        date.toLocaleString('en-US', { timeZone: 'America/Bogota' })
      );
      colombiaDate.setMinutes(
        colombiaDate.getMinutes() + colombiaDate.getTimezoneOffset()
      );

      const formatted = new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'America/Bogota',
      }).format(colombiaDate);

      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }, []);

  // Declarar formatCurrency antes de los useMemo y envolver en useCallback
  const formatCurrency = useCallback((amount: number) => {
    // Redondear al entero más cercano
    const roundedAmount = Math.round(amount);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(roundedAmount);
  }, []);

  // Función para normalizar texto: quita tildes, signos, puntos, comas, espacios y pasa a minúsculas (ahora con useCallback)
  const normalizeText = useCallback(
    (text: string) =>
      text
        .normalize('NFD')
        .replace(/[$.,\-\s]/g, '') // quita $, puntos, comas, guiones, espacios
        .replace(/[\u0300-\u036f]/g, '') // quita tildes
        .toLowerCase(),
    []
  );

  // --- CORREGIDO: Calcula los totales por fecha usando TODOS los registros recibidos ---
  const totals = useMemo(() => {
    const totalsByDate = new Map<string, TotalsByDate>();
    const COMISION_EXTRA = 30000;

    transactions.forEach((transaction) => {
      // Asegura que la fecha sea válida
      const fecha =
        transaction.fecha instanceof Date
          ? transaction.fecha
          : new Date(transaction.fecha);
      if (isNaN(fecha.getTime())) return;

      // CORREGIDO: Usar la función de utilidad para obtener la fecha en Colombia
      const colombiaDate = getColombiaDate(fecha);
      const dateStr = colombiaDate.toISOString().split('T')[0];
      if (!dateStr) return;

      const current = totalsByDate.get(dateStr) ?? {
        date: dateStr,
        precioNetoTotal: 0,
        tarifaServicioTotal: 0,
        impuesto4x1000Total: 0,
        gananciaBrutaTotal: 0,
        transactionCount: 0,
      };

      // Calcular las fórmulas para cada transacción y usar tarifaServicioAjustada
      const { tarifaServicioAjustada, impuesto4x1000, gananciaBruta } =
        calculateFormulas(transaction);

      // Añadir comisión extra si está marcada
      const precioNetoConComision = transaction.comisionExtra
        ? (transaction.precioNeto ?? 0) + COMISION_EXTRA
        : (transaction.precioNeto ?? 0);

      const updatedTotal = {
        ...current,
        precioNetoTotal: current.precioNetoTotal + precioNetoConComision,
        tarifaServicioTotal:
          current.tarifaServicioTotal + (tarifaServicioAjustada ?? 0),
        impuesto4x1000Total:
          current.impuesto4x1000Total + (impuesto4x1000 ?? 0),
        gananciaBrutaTotal: current.gananciaBrutaTotal + (gananciaBruta ?? 0),
        transactionCount: current.transactionCount + 1,
      };

      totalsByDate.set(dateStr, updatedTotal);
    });

    // Ordena por fecha descendente (más reciente primero)
    return Array.from(totalsByDate.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [transactions]);

  // CORREGIDO: Filtrar totales por búsqueda y rango de fechas de forma optimizada
  const filteredTotals = useMemo(() => {
    let filtered = totals;
    // CORREGIDO: Filtrado por rango de fechas con mejor manejo de timezone
    if (startDate && endDate) {
      // Crear fechas en timezone de Colombia para comparación correcta
      const startDateColombia = getColombiaDate(startDate);
      const endDateColombia = getColombiaDate(endDate);

      // Establecer horas para el rango completo del día
      startDateColombia.setHours(0, 0, 0, 0);
      endDateColombia.setHours(23, 59, 59, 999);

      // Convertir a strings para comparación
      const startStr = startDateColombia.toISOString().split('T')[0];
      const endStr = endDateColombia.toISOString().split('T')[0];

      filtered = filtered.filter((t) => {
        // Comparar strings de fechas directamente (YYYY-MM-DD)
        return t.date >= startStr && t.date <= endStr;
      });
    }
    // Filtrado global por texto (en todas las columnas relevantes)
    if (searchTerm.trim()) {
      const search = normalizeText(searchTerm.trim());
      filtered = filtered.filter((t) => {
        // Formatear todos los valores como string para búsqueda flexible
        const valuesToSearch = [
          formatDate(t.date),
          String(t.transactionCount),
          formatCurrency(t.precioNetoTotal),
          formatCurrency(t.tarifaServicioTotal),
          formatCurrency(t.impuesto4x1000Total),
          formatCurrency(t.gananciaBrutaTotal),
        ].map((v) => normalizeText(String(v)));
        // Coincidencia exacta o parcial en cualquier columna
        return valuesToSearch.some(
          (val) => val.includes(search) || search.includes(val)
        );
      });
    }
    return filtered;
  }, [
    totals,
    searchTerm,
    startDate,
    endDate,
    formatDate,
    formatCurrency,
    normalizeText,
  ]);

  // --- CORREGIDO: Paginación local sobre los totales por fecha ---
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTotals.length / itemsPerPage)
  );
  const paginatedTotals = filteredTotals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calcular totales generales SOLO del rango filtrado
  const grandTotals = useMemo(() => {
    return filteredTotals.reduce(
      (acc, curr) => ({
        precioNetoTotal: acc.precioNetoTotal + curr.precioNetoTotal,
        tarifaServicioTotal: acc.tarifaServicioTotal + curr.tarifaServicioTotal,
        impuesto4x1000Total: acc.impuesto4x1000Total + curr.impuesto4x1000Total,
        gananciaBrutaTotal: acc.gananciaBrutaTotal + curr.gananciaBrutaTotal,
        transactionCount: acc.transactionCount + curr.transactionCount,
      }),
      {
        precioNetoTotal: 0,
        tarifaServicioTotal: 0,
        impuesto4x1000Total: 0,
        gananciaBrutaTotal: 0,
        transactionCount: 0,
      }
    );
  }, [filteredTotals]);

  // --- NUEVO: Detectar si es pantalla pequeña (mobile) ---
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handler consistente para volver a la tabla principal
  const handleBack = () => {
    if (onBackToTableAction) {
      onBackToTableAction();
      return;
    }
    if (showTotals && onToggleTotalsAction) onToggleTotalsAction();
    if (showMonthlyTotals && onToggleMonthlyTotalsAction)
      onToggleMonthlyTotalsAction();
    if (showBoletaTotals && onToggleBoletaTotalsAction)
      onToggleBoletaTotalsAction();
  };

  return (
    <div className="font-display container mx-auto px-6">
      {/* Botones de navegación entre totales (proteger contra doble click).
          Totales Diarios/Mensuales/Boletas ignoran multi-click; solo "Volver" navega atrás */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={(e) => {
            if ((e as React.MouseEvent).detail > 1) return;
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
            if ((e as React.MouseEvent).detail > 1) return;
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
            if ((e as React.MouseEvent).detail > 1) return;
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
            if ((e as React.MouseEvent).detail > 1) {
              // Asegura que doble click no produce navegación múltiple; igualmente Volver solo responde a un click normal.
              return;
            }
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
      <h3 className="mb-2 text-4xl font-semibold">Totales Diarios</h3>
      {/* Totales generales con colores e iconos */}
      <div className="mb-6 rounded-lg bg-gray-100 p-6">
        {/* Layout responsive: grid en desktop, columna en mobile */}
        <div
          className={
            isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-4 lg:grid-cols-5'
          }
        >
          <div className="rounded-lg border-l-4 border-blue-500 bg-white p-4 shadow">
            <div className="text-sm text-gray-800">Total Transacciones</div>
            <div className="text-xl font-bold text-blue-600">
              {grandTotals.transactionCount}
            </div>
          </div>
          <div className="rounded-lg border-l-4 border-green-500 bg-white p-4 shadow">
            <div className="text-sm text-gray-800">Precio Neto Total</div>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(grandTotals.precioNetoTotal)}
            </div>
          </div>
          <div className="rounded-lg border-l-4 border-purple-500 bg-white p-4 shadow">
            <div className="text-sm text-gray-800">Tarifa Servicio Total</div>
            <div className="text-xl font-bold text-purple-600">
              {formatCurrency(grandTotals.tarifaServicioTotal)}
            </div>
          </div>
          <div className="rounded-lg border-l-4 border-red-500 bg-white p-4 shadow">
            <div className="text-sm text-gray-800">4x1000 Total</div>
            <div className="text-xl font-bold text-red-600">
              {formatCurrency(grandTotals.impuesto4x1000Total)}
            </div>
          </div>
          <div className="rounded-lg border-l-4 border-yellow-500 bg-white p-4 shadow">
            <div className="text-sm text-gray-800">Ganancia Bruta Total</div>
            <div className="text-xl font-bold text-yellow-600">
              {formatCurrency(grandTotals.gananciaBrutaTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtro por rango para totales, ahora debajo de Totales Generales */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg bg-white p-4 shadow-md">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 rounded-md border border-gray-300 px-3 py-2"
        />
        {/* Fecha inicial */}
        <div className="relative">
          <DatePicker
            selected={startDate}
            onChange={(date: Date | null) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Fecha inicial"
            className="w-40 rounded-md border border-gray-300 px-3 py-2 pr-10"
            dateFormat="dd/MM/yyyy"
            locale={es}
            popperPlacement="bottom"
            // Quitar el icono de limpiar (clearable)
            isClearable={false}
            autoComplete="off"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>
        </div>
        {/* Fecha final */}
        <div className="relative">
          <DatePicker
            selected={endDate}
            onChange={(date: Date | null) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate ?? undefined}
            placeholderText="Fecha final"
            className="w-40 rounded-md border border-gray-300 px-3 py-2 pr-10"
            dateFormat="dd/MM/yyyy"
            locale={es}
            popperPlacement="bottom"
            // Quitar el icono de limpiar (clearable)
            isClearable={false}
            autoComplete="off"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>
        </div>
        {(startDate ?? endDate) && (
          <button
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
            }}
            className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Limpiar Fechas
          </button>
        )}
      </div>

      {/* Tabla mejorada con colores para los valores */}
      <div className="totals-responsive-wrapper">
        <div
          className="mt-8 overflow-x-auto"
          style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <table className="w-full min-w-[700px] rounded-lg bg-white text-left text-sm text-gray-700 shadow">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold tracking-wider text-gray-800 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold tracking-wider text-gray-800 uppercase">
                  Transacciones
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold tracking-wider text-gray-800 uppercase">
                  Precio Neto
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold tracking-wider text-gray-800 uppercase">
                  Tarifa Servicio
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold tracking-wider text-gray-800 uppercase">
                  4x1000
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold tracking-wider text-gray-800 uppercase">
                  Ganancia Bruta
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTotals.map((total) => (
                <tr
                  key={total.date}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(total.date)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium whitespace-nowrap text-blue-600">
                    {total.transactionCount}
                  </td>
                  <td className="px-6 py-4 text-right font-medium whitespace-nowrap text-green-600">
                    {formatCurrency(total.precioNetoTotal)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium whitespace-nowrap text-orange-600">
                    {formatCurrency(total.tarifaServicioTotal)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium whitespace-nowrap text-red-600">
                    {formatCurrency(total.impuesto4x1000Total)}
                  </td>
                  <td className="px-6 py-4 text-right font-medium whitespace-nowrap text-purple-600">
                    {formatCurrency(total.gananciaBrutaTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <style>{`
        @media (max-width: 767px) {
          .totals-responsive-wrapper table {
            table-layout: auto !important;
            width: 100%;
            min-width: 600px;
          }
          .totals-responsive-wrapper th,
          .totals-responsive-wrapper td {
            min-width: 120px;
            padding-left: 10px;
            padding-right: 10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      `}</style>
      </div>

      {/* Paginación */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-sm font-medium text-gray-700">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
          className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
