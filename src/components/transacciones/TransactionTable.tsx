'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AiFillCalculator } from 'react-icons/ai';
import useSWR, { useSWRConfig } from 'swr';

import { createCuadreRecord } from '~/server/actions/cuadreActions';
import { type TransactionRecord } from '~/types';
import { bancoOptions } from '~/utils/constants';
import { suggestColorForTramite } from '~/utils/tramiteColors';

import ExportDateRangeModal from '../ExportDateRangeModal';
import SearchFilters from '../filters/SearchFilters';
import { Icons } from '../icons';
import ColorPickerModal from '../modals/ColorPickerModal';
import EmitidoPorColorModal from '../modals/EmitidoPorColorModal';

import HeaderTitles from './HeaderTitles';
import TransactionBoletaTotals from './TransactionBoletaTotals';
import TransactionMonthlyTotals from './TransactionMonthlyTotals';
import TransactionSearchRemote from './TransactionSearchRemote';
import {
  getEmitidoPorClass,
  getTramiteColorClass,
  useTransactionTableInputs,
} from './TransactionTableInputs';
import { SaveResult, useTransactionTableLogic } from './TransactionTableLogic';
import TransactionTableRow, { InputType } from './TransactionTableRow';
import TransactionTotals from './TransactionTotals';

import '~/styles/buttonLoader.css';
import '~/styles/deleteButton.css';
import '~/styles/exportButton.css';
import '~/styles/buttonSpinner.css';

interface TransactionTableProps {
  initialData: TransactionRecord[];
  allDates: string[]; // <-- nuevo prop
  onUpdateRecordAction: (records: TransactionRecord[]) => Promise<SaveResult>;
  showTotals: boolean;
  onToggleTotalsAction: () => void;
  searchTerm?: string;
  isLoading?: boolean;
  showMonthlyTotals?: boolean;
  onToggleMonthlyTotalsAction?: () => void;
  userRole?: 'admin' | 'empleado';
  // Nuevas props para manejar fecha y visualización móvil
  currentDate?: string;
  isMobile?: boolean;
  userName?: string; // <-- nuevo prop para el nombre de usuario
}

function formatLongDate(date: Date) {
  return date
    .toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Bogota',
    })
    .toUpperCase();
}

function DatePagination({
  selectedDateObj,
  hasPreviousDay,
  hasNextDay,
  totalDays,
  currentDayNumber,
  isLoadingPage,
  onPaginate,
}: {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
  selectedDate: string;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  selectedDateObj: Date;
  hasPreviousDay: boolean;
  hasNextDay: boolean;
  totalDays: number;
  currentDayNumber: number; // 1-based, where 1 = most recent day
  isLoadingPage: boolean;
  onPaginate: (direction: 'prev' | 'next') => void;
}) {
  const formattedLong = formatLongDate(selectedDateObj);

  return (
    <div className="mt-4 flex flex-col items-center gap-2 pb-8">
      <span className="font-display text-lg font-bold text-black">
        {formattedLong}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPaginate('prev')}
          disabled={!hasPreviousDay || isLoadingPage}
          className={`flex items-center gap-2 rounded-lg border border-gray-400 bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-2 text-sm font-semibold text-gray-800 shadow transition hover:bg-gray-300 hover:from-gray-200 hover:to-gray-300 active:scale-95 ${
            !hasPreviousDay || isLoadingPage
              ? 'cursor-not-allowed opacity-50'
              : ''
          }`}
        >
          {isLoadingPage ? <Icons.spinner className="h-4 w-4" /> : null}
          <span className="font-bold">&larr;</span> Día anterior
        </button>
        <span className="font-display flex items-center px-4 text-sm text-black">
          Día {currentDayNumber} de {totalDays}
        </span>
        <button
          onClick={() => onPaginate('next')}
          disabled={!hasNextDay || isLoadingPage}
          className={`flex items-center gap-2 rounded-lg border border-gray-400 bg-gradient-to-r from-gray-100 to-gray-200 px-6 py-2 text-sm font-semibold text-gray-800 shadow transition hover:bg-gray-300 hover:from-gray-200 hover:to-gray-300 active:scale-95 ${
            !hasNextDay || isLoadingPage ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          Día siguiente <span className="font-bold">&rarr;</span>
          {isLoadingPage ? <Icons.spinner className="h-4 w-4" /> : null}
        </button>
      </div>
    </div>
  );
}

const TransactionTable = forwardRef(function TransactionTable(
  props: TransactionTableProps,
  ref: React.Ref<{
    scrollToPlaca: (
      placa: string,
      id?: string,
      options?: { retry?: boolean; retries?: number; interval?: number }
    ) => Promise<boolean>;
  }>
) {
  const logic = useTransactionTableLogic(props);
  // Restore/persist zoom so changing tabs doesn't reset it
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const key = 'transactionTableZoom';
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const val = Number(raw);
        if (!Number.isNaN(val) && val > 0) {
          // Only set if different to avoid unnecessary state changes
          if (logic.zoom !== val && typeof logic.setZoom === 'function') {
            logic.setZoom(val);
          }
        }
      }
    } catch (_e) {
      // no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const key = 'transactionTableZoom';
      const val = Number(logic.zoom ?? 1);
      if (!Number.isNaN(val)) {
        window.localStorage.setItem(key, String(val));
      }
    } catch (_e) {
      // no-op
    }
  }, [logic.zoom]);

  // Ensure zoom is restored when returning to the tab (visibilitychange)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = 'transactionTableZoom';
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        try {
          const raw = window.localStorage.getItem(key);
          if (raw) {
            const val = Number(raw);
            if (!Number.isNaN(val) && val > 0) {
              if (typeof logic.setZoom === 'function') logic.setZoom(val);
            }
          }
        } catch (_e) {
          // no-op
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // logic.setZoom is stable from hook; intentionally omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Crear una referencia para el contenedor de scroll de la tabla
  const tableScrollContainerRef = useRef<HTMLDivElement>(null);
  const topScrollBarRef = useRef<HTMLDivElement>(null);

  // --- NUEVO: Estado para el scroll de la tabla ---
  const [tableScrollWidth, setTableScrollWidth] = useState<number>(0);

  // --- NUEVO: Actualiza el ancho del scroll cada vez que cambian los datos, zoom o paginación ---
  useEffect(() => {
    const updateScrollWidth = () => {
      if (tableScrollContainerRef.current) {
        setTableScrollWidth(tableScrollContainerRef.current.scrollWidth);
      }
    };
    // Actualiza al montar y cuando cambian los datos relevantes
    updateScrollWidth();
    // También actualiza cuando la ventana cambia de tamaño
    window.addEventListener('resize', updateScrollWidth);
    return () => {
      window.removeEventListener('resize', updateScrollWidth);
    };
  }, [logic.paginatedData, logic.zoom, logic.selectedDate, props.showTotals]);

  // Estados para los modales
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [pendingRowId, setPendingRowId] = useState<string | null>(null);
  const [isEmitidoPorColorPickerOpen, setIsEmitidoPorColorPickerOpen] =
    useState(false);
  const [pendingEmitidoPorRowId, setPendingEmitidoPorRowId] = useState<
    string | null
  >(null);

  // --- NUEVO: Estado para vista de boletas ---
  const [showBoletaTotals, setShowBoletaTotals] = useState(false);
  // Estado para mostrar el panel de Totales (Diarios / Mensuales / Boletas)
  const [_totalsModeVisible, setTotalsModeVisible] = useState(false);

  // --- NUEVO: Estado para referencia de boleta en el modal ---
  const [boletaReferencia, setBoletaReferencia] = useState('');
  // --- NUEVO: Estado para banco seleccionado en el modal de pago ---
  const [selectedBanco, setSelectedBanco] = useState<string>('');

  // Usa SWR para asesores con pooling cada 60 segundos (antes 2 segundos)
  const { data: asesores = [], mutate: mutateAsesores } = useSWR<string[]>(
    '/api/asesores',
    async (url: string): Promise<string[]> => {
      const res = await fetch(url, { cache: 'no-store' }); // <-- fuerza no-cache en fetch
      // Tipar la respuesta para evitar acceso inseguro
      const data: unknown = await res.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'asesores' in data &&
        Array.isArray((data as { asesores: unknown }).asesores)
      ) {
        return (data as { asesores: unknown[] }).asesores.filter(
          (a): a is string => typeof a === 'string'
        );
      }
      return [];
    },
    { refreshInterval: 60000, revalidateOnFocus: true } // 60s
  );

  const fetchTramites = async (
    url: string
  ): Promise<{ nombre: string; color?: string }[]> => {
    const res = await fetch(url);
    const data: unknown = await res.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'tramites' in data &&
      Array.isArray((data as { tramites: unknown }).tramites)
    ) {
      return (data as { tramites: { nombre: string; color?: string }[] })
        .tramites;
    }
    return [];
  };

  const fetchNovedades = async (url: string): Promise<string[]> => {
    const res = await fetch(url);
    const data: unknown = await res.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'novedades' in data &&
      Array.isArray((data as { novedades: unknown }).novedades)
    ) {
      return (data as { novedades: unknown[] }).novedades.filter(
        (n): n is string => typeof n === 'string'
      );
    }
    return [];
  };

  const fetchEmitidoPor = async (url: string): Promise<string[]> => {
    const res = await fetch(url);
    const data: unknown = await res.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'emitidoPor' in data &&
      Array.isArray((data as { emitidoPor: unknown }).emitidoPor)
    ) {
      return (data as { emitidoPor: unknown[] }).emitidoPor.filter(
        (e): e is string => typeof e === 'string'
      );
    }
    return [];
  };

  const { data: tramiteOptions = [], mutate: mutateTramites } = useSWR<
    { nombre: string; color?: string }[]
  >('/api/tramites', fetchTramites, {
    refreshInterval: 60000, // 60s
    revalidateOnFocus: true,
  });

  const { data: novedadOptions = [], mutate: _mutateNovedades } = useSWR<
    string[]
  >('/api/novedades', fetchNovedades, {
    refreshInterval: 60000, // 60s
    revalidateOnFocus: true,
  });

  const { data: emitidoPorOptions = [], mutate: mutateEmitidoPor } = useSWR<
    string[]
  >('/api/emitidoPor', fetchEmitidoPor, {
    refreshInterval: 60000, // 60s
    revalidateOnFocus: true,
  });

  const {
    data: emitidoPorWithColors = [],
    mutate: mutateEmitidoPorWithColors,
  } = useSWR<{ nombre: string; color?: string }[]>(
    '/api/emitidoPorWithColors',
    async (url: string) => {
      const res = await fetch(url, { cache: 'no-store' });
      const data: unknown = await res.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'emitidoPorWithColors' in data &&
        Array.isArray(
          (data as { emitidoPorWithColors: unknown }).emitidoPorWithColors
        )
      ) {
        return (
          data as { emitidoPorWithColors: { nombre: string; color?: string }[] }
        ).emitidoPorWithColors;
      }
      return [];
    },
    {
      refreshInterval: 60000, // 60s
      revalidateOnFocus: true,
    }
  );

  // SWR para colores (debe estar antes de su uso)
  const { data: coloresOptions = [], mutate: _mutateColores } = useSWR<
    { nombre: string; valor: string; intensidad: number }[]
  >(
    '/api/colores',
    async (
      url: string
    ): Promise<{ nombre: string; valor: string; intensidad: number }[]> => {
      const res = await fetch(url);
      const data: unknown = await res.json();
      if (
        typeof data === 'object' &&
        data !== null &&
        'colores' in data &&
        Array.isArray((data as { colores: unknown }).colores)
      ) {
        return (
          data as {
            colores: { nombre: string; valor: string; intensidad: number }[];
          }
        ).colores;
      }
      return [];
    },
    {
      refreshInterval: 60000, // 60s
      revalidateOnFocus: true,
    }
  );

  const { mutate: globalMutate } = useSWRConfig(); // <-- para mutate global

  // Handler para agregar asesor y actualizar la lista local y global
  const handleAddAsesorAction = async (nombre: string) => {
    const res = await fetch('/api/asesores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    });
    if (res.ok) {
      await globalMutate('/api/asesores', undefined, { revalidate: true }); // <-- fuerza refresco inmediato y deshabilita cache temporalmente
    } else {
      // Si el error es por duplicado (409), muestra mensaje específico
      if (res.status === 409) {
        alert('El asesor ya existe.');
      } else {
        alert('Error al agregar asesor.');
      }
    }
  };

  const handleAddTramiteAction = async (nombre: string, color?: string) => {
    // Si no se proporciona color, sugerir uno automáticamente usando la tabla de colores
    const finalColor = color ?? suggestColorForTramite(nombre);

    // Verificar si el color sugerido existe en la tabla de colores
    const colorExists = coloresOptions.find(
      (c: { nombre: string }) => c.nombre === finalColor
    );

    // Si el color no existe en la tabla, crear el color automáticamente
    if (!colorExists && finalColor !== 'gris') {
      // Mapear colores básicos a sus valores CSS
      const colorMap: Record<string, string> = {
        azul: 'blue',
        'verde-lima': 'lime',
        purpura: 'purple',
        naranja: 'orange',
        'verde-azulado': 'teal',
        rojo: 'red',
        verde: 'green',
        amarillo: 'yellow',
        rosa: 'pink',
        indigo: 'indigo',
        cian: 'cyan',
        gris: 'gray',
      };

      const colorValue = colorMap[finalColor] || finalColor;

      // Crear el color en la base de datos con intensidad 500
      try {
        await fetch('/api/colores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: finalColor,
            valor: colorValue,
            intensidad: 500, // Cambiar de 400 a 500
          }),
        });
        // Actualizar el cache de colores
        await _mutateColores();
      } catch (error) {
        console.warn(
          `No se pudo crear el color automáticamente: ${finalColor}`,
          error
        );
      }
    }

    await fetch('/api/tramites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, color: finalColor }),
    });
    await globalMutate('/api/tramites', undefined, { revalidate: true }); // <-- refresca y deshabilita cache temporalmente
  };

  // Nueva función para actualizar el color de un trámite existente
  const handleUpdateTramiteAction = async (nombre: string, color?: string) => {
    try {
      await fetch('/api/tramites', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, color }),
      });
      await mutateTramites();
    } catch (error) {
      console.error('Error updating tramite:', error);
      alert('Error al actualizar el trámite.');
    }
  };

  const handleAddNovedadAction = async (nombre: string) => {
    await fetch('/api/novedades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    });
    await globalMutate('/api/novedades', undefined, { revalidate: true }); // <-- refresca y deshabilita cache temporalmente
  };

  const handleAddEmitidoPorAction = async (nombre: string, color?: string) => {
    await fetch('/api/emitidoPor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, color }),
    });
    await globalMutate('/api/emitidoPor', undefined, { revalidate: true }); // <-- refresca y deshabilita cache temporalmente
    await globalMutate('/api/emitidoPorWithColors', undefined, {
      revalidate: true,
    });
  };

  // Nueva función para actualizar el color de un emitidoPor existente
  const handleUpdateEmitidoPorAction = async (
    nombre: string,
    color?: string
  ) => {
    try {
      await fetch('/api/emitidoPor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, color }),
      });
      await mutateEmitidoPor();
      await mutateEmitidoPorWithColors();
    } catch (error) {
      console.error('Error updating emitidoPor:', error);
      alert('Error al actualizar el emisor.');
    }
  };

  const handleDeleteEmitidoPorAction = async (nombre: string) => {
    try {
      await fetch('/api/emitidoPor', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      });
      await mutateEmitidoPor();
      await mutateEmitidoPorWithColors();
    } catch (error) {
      console.error('Error deleting emitidoPor:', error);
      alert('Error al eliminar el emisor.');
    }
  };

  // Handler para eliminar asesor
  const handleDeleteAsesorAction = async (nombre: string) => {
    try {
      const res = await fetch('/api/asesores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      });
      if (!res.ok) {
        let msg = 'Error al eliminar asesor';
        try {
          // Tipar la respuesta para evitar acceso inseguro
          interface ErrorResponse {
            error?: string;
          }
          const data: ErrorResponse = await res.json();
          msg = data.error ?? msg;
        } catch (_err) {
          // Si ocurre un error al parsear, deja el mensaje por defecto
        }
        alert(msg);
        throw new Error(msg);
      }
      await globalMutate('/api/asesores', undefined, { revalidate: true });
    } catch (_error) {
      alert('Error al eliminar asesor');
      throw _error;
    }
  };

  const handleOpenColorPicker = (rowId?: string) => {
    if (rowId) {
      setPendingRowId(rowId);
    }
    setIsColorPickerOpen(true);
  };

  const handleOpenEmitidoPorColorPicker = (rowId?: string) => {
    if (rowId) {
      setPendingEmitidoPorRowId(rowId);
    }
    setIsEmitidoPorColorPickerOpen(true);
  };

  const { renderInput } = useTransactionTableInputs({
    editValues: logic.editValues,
    handleInputChangeAction: logic.handleInputChange,
    formatCurrencyAction: logic.formatCurrency,
    parseNumberAction: logic.parseNumber,
    asesores,
    onAddAsesorAction: handleAddAsesorAction,
    onAddTramiteAction: handleAddTramiteAction,
    onAddNovedadAction: handleAddNovedadAction,
    onAddEmitidoPorAction: handleAddEmitidoPorAction,
    tramiteOptions,
    novedadOptions,
    emitidoPorOptions,
    coloresOptions, // <-- asegúrate de pasar coloresOptions aquí
    onOpenColorPickerAction: handleOpenColorPicker,
    onOpenEmitidoPorColorPickerAction: handleOpenEmitidoPorColorPicker,
    emitidoPorWithColors, // Pasar los datos de emitidoPor con colores
    onDeleteAsesorAction: (nombre: string) => {
      void handleDeleteAsesorAction(nombre);
    },
    userRole: props.userRole, // NUEVO: pasa el rol
  });
  // const router = useRouter();

  // Calcula el total de páginas para la paginación del día actual
  const totalPages = Math.max(1, Math.ceil((logic.totalRecords ?? 1) / 50));
  const selectedDateObj = (() => {
    const [y, m, d] = logic.selectedDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  })();

  // --- CORREGIDO: Usa el prop allDates para la paginación ---
  const allDates = React.useMemo(() => props.allDates, [props.allDates]);

  // Determina si hay días anteriores o siguientes disponibles
  // --- CORREGIDO: Permitir navegar a días anteriores aunque la fecha seleccionada sea un día futuro ---
  const selectedIndex = allDates.findIndex((d) => d === logic.selectedDate);
  const hasPreviousDay =
    allDates.length > 0 &&
    (selectedIndex > 0 ||
      (selectedIndex === -1 && logic.selectedDate > allDates[0]));
  const hasNextDay =
    allDates.length > 0 &&
    (selectedIndex >= 0
      ? selectedIndex < allDates.length - 1
      : logic.selectedDate < allDates[allDates.length - 1]);

  // --- NUEVO: Calcula el índice del día actual y el total de días únicos ---
  const currentDayIndex = (() => {
    if (allDates.length === 0) return 0;
    const idx = allDates.findIndex((d) => d === logic.selectedDate);
    if (idx !== -1) return idx;
    // Si la fecha seleccionada está después del último día, mostrar el último índice
    if (logic.selectedDate > allDates[allDates.length - 1])
      return allDates.length - 1;
    // Si está antes del primer día, mostrar el primero
    if (logic.selectedDate < allDates[0]) return 0;
    // Si está entre medias pero no coincide, usa el último día menor a la seleccionada
    let nearest = 0;
    for (let i = 0; i < allDates.length; i++) {
      if (allDates[i] <= logic.selectedDate) nearest = i;
      else break;
    }
    return nearest;
  })();
  const totalDays = allDates.length;

  // --- SIEMPRE muestra la fecha arriba del botón agregar en formato largo ---
  // --- SOLO muestra la paginación de días abajo de la tabla (NO la muestres dos veces) ---

  // Saber si está cargando la página de registros
  // ARREGLO: Solo muestra "Cargando registros..." si realmente está esperando datos de un día que sí existe en initialData
  const isLoadingPage =
    logic.isTrulyLoadingPage ||
    (logic.paginatedData.length === 0 &&
      !props.isLoading &&
      !!logic.dateFilter.startDate &&
      props.initialData.some((r) => {
        const d =
          r.fecha instanceof Date
            ? r.fecha.toISOString().slice(0, 10)
            : new Date(r.fecha).toISOString().slice(0, 10);
        return d === logic.selectedDate;
      }));

  // Handler para paginación con loading
  const [isPaginating, setIsPaginating] = React.useState(false);
  const paginatingRef = React.useRef(false);

  // Refactor: solo cambia el estado en el handler, nunca en render
  const handlePaginate = (direction: 'prev' | 'next') => {
    if (paginatingRef.current) return;
    paginatingRef.current = true;
    setIsPaginating(true);
    if (direction === 'prev') {
      logic.goToPreviousDay();
    } else {
      logic.goToNextDay();
    }
  };

  // Cuando cambie selectedDate, termina el loading de paginación
  React.useEffect(() => {
    if (isPaginating) {
      // Da tiempo a que la tabla recargue, luego quita el loading
      const timeout = setTimeout(() => {
        setIsPaginating(false);
        paginatingRef.current = false;
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [logic.selectedDate, isPaginating]);

  // --- NUEVO: Estado de loading para el botón de pagar boletas ---
  const [isPaying, setIsPaying] = useState(false);

  // --- NUEVO: Limpia la selección de boletas pagadas automáticamente ---
  React.useEffect(() => {
    // Si algún registro seleccionado ya está pagado, quítalo de la selección
    const pagados = Array.from(logic.selectedRows).filter((id) => {
      const row = logic.paginatedData.find((r) => r.id === id);
      return row?.pagado === true;
    });
    if (pagados.length > 0) {
      const newSelected = new Set(logic.selectedRows);
      pagados.forEach((id) => newSelected.delete(id));
      if (newSelected.size !== logic.selectedRows.size) {
        logic.setSelectedRows(newSelected);
      }
    }
    // Agrega 'logic' como dependencia para cumplir con react-hooks/exhaustive-deps
  }, [logic.selectedRows, logic.paginatedData, logic.setSelectedRows, logic]);

  // --- ELIMINADO: Handler para pagar boletas seleccionadas y efecto relacionado ---
  // const handlePayWithSpinner = async () => {
  //   setIsPaying(true);
  //   setPendingPaidIds(Array.from(logic.selectedRows));
  //   await logic.handlePay();
  //   // El efecto de abajo se encargará de limpiar la selección cuando todos estén pagados
  // };
  // React.useEffect(() => {
  //   if (isPaying && pendingPaidIds.length > 0) {
  //     const allPaid = pendingPaidIds.every((id) => {
  //       const row = logic.paginatedData.find((r) => r.id === id);
  //       return row && row.pagado === true;
  //     });
  //     if (allPaid) {
  //       logic.setSelectedRows(new Set());
  //       setPendingPaidIds([]);
  //       setIsPaying(false);
  //     }
  //   }
  // }, [logic.paginatedData, isPaying, pendingPaidIds, logic]);

  // --- NUEVO: Estado local para pagos pendientes ---
  // const [localPaid, setLocalPaid] = useState<Record<string, boolean>>({});

  // Memoiza las filas seleccionadas y el total
  const selectedRowsArray = useMemo(
    () =>
      Array.from(logic.selectedRows)
        .map((id) =>
          // Busca en todos los registros iniciales (de todos los días)
          props.initialData.find((r) => r.id === id)
        )
        .filter(Boolean) as TransactionRecord[],
    [logic.selectedRows, props.initialData]
  );

  const totalSelected = useMemo(
    () =>
      selectedRowsArray
        .filter((row) => !row.pagado)
        .reduce((sum, row) => sum + row.precioNeto, 0),
    [selectedRowsArray]
  );

  const placasSeleccionadas = useMemo(
    () =>
      selectedRowsArray
        .filter((row) => !row.pagado)
        .map((row) => row.placa?.toUpperCase())
        .join(', '),
    [selectedRowsArray]
  );

  // Pagar boletas seleccionadas: ejecuta el pago directamente, muestra spinner y activa "Guardando cambios..."
  const handlePayLocal = async () => {
    setIsPaying(true);
    logic.setIsActuallySaving(true);

    const allSelectedRecords = Array.from(logic.selectedRows)
      .map((id) => props.initialData.find((r) => r.id === id))
      .filter(
        (record): record is TransactionRecord =>
          record !== undefined && !record.pagado
      );

    const toUpdate = allSelectedRecords.map((row) => ({
      ...row,
      pagado: true,
      boleta: true,
      boletasRegistradas: totalSelected,
    }));

    if (toUpdate.length > 0) {
      await logic.onUpdateRecordAction(toUpdate);

      // --- MODIFICADO: Enviar el campo tramites con los trámites seleccionados ---
      const placas = allSelectedRecords.map((r) => r.placa.toUpperCase());
      const tramites = allSelectedRecords.map((r) => r.tramite);
      await fetch('/api/boleta-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boletaReferencia,
          placas,
          totalPrecioNeto: totalSelected,
          tramites,
          banco: selectedBanco,
        }),
      });

      logic.setSelectedRows(new Set());
      setBoletaReferencia(''); // Limpiar el input
      setSelectedBanco('');
    }
    logic.setIsActuallySaving(false);
    setIsPaying(false);
  };

  // Checkbox personalizado para pagado: primero cambia UI, luego guarda, y activa "Guardando cambios..."
  const renderCheckbox = (
    id: string,
    field: keyof TransactionRecord,
    value: boolean,
    disabled?: boolean
  ) => {
    if (field === 'boleta') {
      const row = logic.paginatedData.find((r) => r.id === id);
      // El checkbox de boleta está marcado si la fila está seleccionada O si pagado es true
      // Está deshabilitado si pagado es true
      const isChecked = (row?.pagado ?? false) || logic.selectedRows.has(id);
      const isDisabled = row?.pagado ?? false;
      return (
        <label className="check-label">
          <input
            type="checkbox"
            checked={isChecked}
            disabled={isDisabled}
            onChange={(e) => {
              if (row && !row.pagado)
                handleBoletaCheckbox(id, e.target.checked, row);
            }}
            className="sr-only"
          />
          <div className="checkmark" />
        </label>
      );
    }
    if (field === 'pagado') {
      return (
        <label className="check-label" data-field="pagado">
          <input
            type="checkbox"
            checked={!!value}
            disabled={disabled}
            onChange={async (e) => {
              // Solo permitir desmarcar (cambiar de true a false)
              // No permitir marcar manualmente (cambiar de false a true)
              if (!e.target.checked) {
                logic.setIsActuallySaving(true);
                const row = logic.paginatedData.find((r) => r.id === id);
                if (row) {
                  await logic.onUpdateRecordAction([
                    {
                      ...row,
                      pagado: false,
                      boletasRegistradas: 0,
                    },
                  ]);
                }
                logic.setIsActuallySaving(false);
              } else {
                // Si intenta marcar como pagado, revertir el cambio
                e.target.checked = false;
              }
            }}
            className="sr-only"
          />
          <div className="checkmark" />
        </label>
      );
    }
    // Para otros checks usa el render original
    return logic.renderCheckbox(id, field, value, disabled);
  };

  // --- NUEVO: Handler para seleccionar/deseleccionar filas por el checkbox de boleta ---
  const handleBoletaCheckbox = (
    id: string,
    value: boolean,
    row: TransactionRecord
  ) => {
    // Si se selecciona, agrega a selectedRows; si se deselecciona, quita
    const newSelected = new Set(logic.selectedRows);
    if (value) {
      if (!row.pagado) newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    logic.setSelectedRows(newSelected);
  };

  // Crear función para obtener clase de color de trámite
  const getTramiteColorClassForRow = (tramite: string) => {
    return getTramiteColorClass(tramite, tramiteOptions, coloresOptions);
  };

  // --- NUEVO: Estado para posición del cuadro de pago (draggable) ---
  const [payBoxPos, setPayBoxPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const payBoxRef = useRef<HTMLDivElement>(null);

  // Solo lee window/localStorage en el cliente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('payBoxPos');
      if (saved) {
        try {
          const { x, y } = JSON.parse(saved);
          setPayBoxPos({ x, y });
        } catch {
          // ignore
        }
      } else {
        setPayBoxPos({
          x: window.innerWidth - 420,
          y: window.innerHeight - 200,
        });
      }
    }
  }, []);

  // Guardar posición en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('payBoxPos', JSON.stringify(payBoxPos));
    }
  }, [payBoxPos]);

  // Eventos de drag
  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPayBoxPos((_prev) => ({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      }));
    };
    const handleMouseUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  // --- NUEVO: Scroll y selección por placa o por id (para notificaciones sin placa) ---
  useImperativeHandle(ref, () => ({
    // async, retrying scrollToPlaca: intenta hasta `retries` veces esperar a que la fila
    // esté disponible en logic.paginatedData (útil cuando se cambia la fecha/página)
    scrollToPlaca: async (
      placa: string,
      id?: string,
      options: { retry?: boolean; retries?: number; interval?: number } = {
        retry: true,
        retries: 20,
        interval: 250,
      }
    ): Promise<boolean> => {
      const { retry = true, retries = 20, interval = 250 } = options;

      const findRow = () => {
        if (id) {
          return logic.paginatedData.find((r) => r.id === id);
        }
        return logic.paginatedData.find(
          (r) => r.placa && r.placa.toUpperCase() === placa.toUpperCase()
        );
      };

      // Try immediately and then retry if needed
      for (let attempt = 0; attempt <= (retry ? retries : 0); attempt++) {
        const row = findRow();
        if (row) {
          // Selecciona la fila para que aparezca el payBox (la UI de pago depende de selectedRows)
          logic.setSelectedRows(new Set([row.id]));
          // Intenta scrollear al elemento cuando exista en el DOM
          setTimeout(() => {
            const el = document.querySelector(
              `tr[data-placa="${row.placa ? row.placa.toUpperCase() : ''}"]`
            ) as HTMLTableRowElement | null;
            if (el) {
              try {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-yellow-400');
                setTimeout(() => {
                  el.classList.remove('ring-4', 'ring-yellow-400');
                }, 1600);
              } catch {
                // ignore DOM errors
              }
            }
          }, 80);

          return true;
        }
        if (!retry) break;
        // Espera antes del siguiente intento

        await new Promise((res) => setTimeout(res, interval));
      }
      return false;
    },
  }));

  // --- NUEVO: Forzar recarga de asesores cuando se activa el modo selección por asesor ---
  useEffect(() => {
    if (logic.isAsesorSelectionMode) {
      mutateAsesores();
    }
  }, [logic.isAsesorSelectionMode, mutateAsesores]);

  // Determina si el usuario es admin (usa la prop para permisos)
  const isAdmin = props.userRole === 'admin';

  // --- NUEVO: Detectar si es pantalla pequeña (mobile) ---
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sincronizar la fecha externa (YYYY-MM-DD) con la lógica interna
  const { setDateFilter, setCurrentPage } = logic;

  // --- CORREGIDO: Solo inicializa la fecha seleccionada al último día disponible UNA VEZ al montar ---
  useEffect(() => {
    // Solo ejecuta al montar
    if (allDates.length > 0) {
      // Si hay prop currentDate, úsala
      if (props.currentDate) {
        const parts = props.currentDate.split('-').map(Number);
        if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
          const [y, m, d] = parts;
          const targetDate = new Date(y, m - 1, d);
          if (!isNaN(targetDate.getTime())) {
            setDateFilter({ startDate: targetDate, endDate: null });
            setCurrentPage(1);
          }
        }
      } else {
        // Si no hay prop, inicializa al último día
        const lastDate = allDates[allDates.length - 1];
        const [y, m, d] = lastDate.split('-').map(Number);
        setDateFilter({ startDate: new Date(y, m - 1, d), endDate: null });
        setCurrentPage(1);
      }
    }
    // Solo ejecuta al montar y cuando cambian los datos iniciales
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDates.length]);

  // Memoiza currentDate para evitar cambios innecesarios
  const _currentDate = useMemo(() => {
    if (props.currentDate) return props.currentDate;
    if (props.initialData.length > 0) {
      const fecha = props.initialData[0].fecha;
      return fecha instanceof Date
        ? fecha.toISOString().slice(0, 10)
        : new Date(fecha).toISOString().slice(0, 10);
    }
    return undefined;
  }, [props.currentDate, props.initialData]);

  // Envuelve callbacks en useCallback para estabilidad
  const handleFilterData = useCallback(
    (filteredData: TransactionRecord[]) => {
      logic.handleFilterData(filteredData);
    },
    [logic]
  );

  const handleDateFilterChange = useCallback(
    (startDate: Date | null, endDate: Date | null) => {
      logic.handleDateFilterChange(startDate, endDate);
    },
    [logic]
  );

  const handleToggleAsesorMode = useCallback(async (): Promise<void> => {
    await logic.handleToggleAsesorMode();
  }, [logic]);

  const generateCuadre = useCallback(
    async (_records: TransactionRecord[]) => {
      // CORREGIDO: Usar SOLO los seleccionados en modo asesor
      const selectedIds = logic.selectedAsesores;
      const selectedRecords = props.initialData.filter((r) =>
        selectedIds.has(r.id)
      );
      if (selectedRecords.length > 0) {
        await Promise.all(
          selectedRecords.map((record) =>
            createCuadreRecord(record.id, {
              banco: '',
              monto: 0,
              pagado: false,
              fechaCliente: null,
              referencia: '',
            })
          )
        );
        localStorage.setItem('cuadreRecords', JSON.stringify(selectedRecords));
        // Abre /cuadre en una nueva pestaña
        if (typeof window !== 'undefined') {
          window.open('/cuadre', '_blank');
        }
        return true;
      }
      return false;
    },
    [logic, props.initialData]
  );

  const setSearchTermAction = useCallback(
    (term: string) => {
      logic.setSearchTermAction(term);
    },
    [logic]
  );

  return (
    <div className="relative">
      {/* Mostrar la fecha en formato largo arriba del botón agregar (OCULTA en mobile y en Totales Boletas) */}
      {!props.showTotals && !props.showMonthlyTotals && !showBoletaTotals && (
        <div
          className={`mb-3 flex items-center justify-between ${isMobile ? 'hidden' : ''}`}
        >
          <time
            id="current-date-display"
            className="font-display text-3xl font-bold tracking-tight text-black"
          >
            {formatLongDate(selectedDateObj)}
          </time>
        </div>
      )}

      {/* --- Responsive wrapper para controles principales --- */}
      <div className={`mb-4 ${isMobile ? 'flex flex-col gap-2' : ''}`}>
        {/* Fecha actual de la página, arriba del grupo de botones */}
        <div
          className={`mb-4 w-full items-center justify-between gap-4 ${
            isMobile ? 'flex flex-col gap-2' : 'flex'
          }`}
        >
          {/* --- Responsive: Agrupa los botones principales en columna en mobile --- */}
          <div
            className={`items-center gap-4 ${
              isMobile ? 'flex w-full flex-col' : 'flex'
            }`}
          >
            {/* --- Mostrar SIEMPRE los botones de Agregar y Eliminar para todos los roles --- */}
            {!props.showTotals &&
              !props.showMonthlyTotals &&
              !showBoletaTotals && (
                <>
                  {/* Botón Agregar */}
                  <button
                    onClick={logic.addNewRow}
                    disabled={logic.isAddingRow}
                    className="group relative flex h-10 w-36 cursor-pointer items-center overflow-hidden rounded-lg border border-green-500 bg-green-500 hover:bg-green-500 active:border-green-500 active:bg-green-500 disabled:opacity-50"
                  >
                    <span
                      className={`ml-8 transform font-semibold text-white transition-all duration-300 ${
                        logic.isAddingRow
                          ? 'opacity-0'
                          : 'group-hover:translate-x-20'
                      }`}
                    >
                      Agregar
                    </span>
                    <span
                      className={`absolute right-0 flex h-full items-center justify-center rounded-lg bg-green-500 transition-all duration-300 ${
                        logic.isAddingRow
                          ? 'w-full translate-x-0'
                          : 'w-10 group-hover:w-full group-hover:translate-x-0'
                      }`}
                    >
                      {logic.isAddingRow ? (
                        <div className="button-spinner">
                          {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="spinner-blade" />
                          ))}
                        </div>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-8 text-white group-active:scale-[0.8]"
                          fill="none"
                          height="24"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          width="24"
                        >
                          <line x1="12" x2="12" y1="5" y2="19" />
                          <line x1="5" x2="19" y1="12" y2="12" />
                        </svg>
                      )}
                    </span>
                  </button>

                  {/* Botón Eliminar */}
                  <div className="flex items-center">
                    <button
                      onClick={logic.handleDeleteModeToggle}
                      className="delete-button"
                      type="button"
                    >
                      <span className="text">
                        {logic.isDeleteMode ? 'Cancelar' : 'Eliminar'}
                      </span>
                      <span className="icon">
                        {logic.isDeleteMode ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z" />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <path d="M3 6v18h18v-18h-18zm5 14c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4-18v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.315c0 .901.73 2 1.631 2h5.712z" />
                          </svg>
                        )}
                      </span>
                    </button>
                  </div>
                </>
              )}

            {/* --- ADMIN: botón único "TOTALES" que abre panel con Totales Diarios / Mensuales / Boletas --- */}
            {isAdmin &&
              !props.showTotals &&
              !props.showMonthlyTotals &&
              !showBoletaTotals && (
                <div
                  className={`flex items-center gap-4 ${isMobile ? 'flex w-full flex-col' : 'flex'}`}
                >
                  {/* Botón TOTALES: apertura directa de la vista de totales (sin submenú en la tabla principal) */}
                  <div>
                    <button
                      type="button"
                      onClick={(e) => {
                        // Solo permite click simple, ignora doble click
                        if ((e as React.MouseEvent).detail > 1) return;
                        // Abrir Totales Diarios en el padre
                        if (!props.showTotals && props.onToggleTotalsAction)
                          props.onToggleTotalsAction();
                        // Asegura que otras vistas queden apagadas localmente
                        if (
                          props.showMonthlyTotals &&
                          props.onToggleMonthlyTotalsAction
                        )
                          props.onToggleMonthlyTotalsAction();
                        setShowBoletaTotals(false);
                        setTotalsModeVisible(false);
                      }}
                      onDoubleClick={(e) => {
                        // Bloquea el doble click para que no navegue ni haga nada
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      className="relative flex h-10 min-w-[140px] items-center justify-center gap-2 rounded-[8px] bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700"
                    >
                      <AiFillCalculator className="h-6 w-6 text-white" />
                      <span className="mr-1">TOTALES</span>
                    </button>
                  </div>

                  {/* Exportar a Excel (solo admin en vista principal) */}
                  <button
                    onClick={(e) => {
                      if (
                        (e as React.MouseEvent).detail &&
                        (e as React.MouseEvent).detail > 1
                      )
                        return;
                      logic.setIsExportModalOpen(true);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="export-excel-button h-10 px-12"
                    type="button"
                  >
                    <svg
                      fill="#fff"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 50 50"
                    >
                      <path d="M28.8125 .03125L.8125 5.34375C.339844 5.433594 0 5.863281 0 6.34375L0 43.65625C0 44.136719 .339844 44.566406 .8125 44.65625L28.8125 49.96875C28.875 49.980469 28.9375 50 29 50C29.230469 50 29.445313 49.929688 29.625 49.78125C29.855469 49.589844 30 49.296875 30 49L30 1C30 .703125 29.855469 .410156 29.625 .21875C29.394531 .0273438 29.105469 -.0234375 28.8125 .03125ZM32 6L32 13L34 13L34 15L32 15L32 20L34 20L34 22L32 22L32 27L34 27L34 29L32 29L32 35L34 35L34 37L32 37L32 44L47 44C48.101563 44 49 43.101563 49 42L49 8C49 6.898438 48.101563 6 47 6ZM6.6875 15.6875L11.8125 15.6875L14.5 21.28125C14.710938 21.722656 14.898438 22.265625 15.0625 22.875L15.09375 22.875C15.199219 22.511719 15.402344 21.941406 15.6875 21.21875L18.65625 15.6875L23.34375 15.6875L17.75 24.9375L23.5 34.375L18.53125 34.375L15.28125 28.28125C15.160156 28.054688 15.035156 27.636719 14.90625 27.03125L14.875 27.03125C14.8125 27.316406 14.664063 27.761719 14.4375 28.34375L11.1875 34.375L6.1875 34.375L12.15625 25.03125ZM36 20L44 20L44 22L36 22ZM36 27L44 27L44 29L36 29ZM36 35L44 35L44 37L36 37Z" />
                    </svg>
                    Exportar a Excel
                  </button>

                  {/* Ir al Cuadre (solo admin en vista principal) */}
                  <button
                    onClick={(e) => {
                      if (
                        (e as React.MouseEvent).detail &&
                        (e as React.MouseEvent).detail > 1
                      )
                        return;
                      logic.handleNavigateToCuadre();
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    disabled={logic.isNavigatingToCuadre}
                    className="flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-6 py-2 font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                    type="button"
                  >
                    {logic.isNavigatingToCuadre ? (
                      <>
                        <Icons.spinner className="h-5 w-5" />
                        <span>Redirigiendo...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 100 2h4a1 1 0 100-2H8z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Ir al Cuadre</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            {/* --- Mostrar SIEMPRE los botones de Guardar y Zoom --- */}
            {!props.showTotals &&
              !props.showMonthlyTotals &&
              !showBoletaTotals && (
                <div
                  className={`items-center gap-4 ${isMobile ? 'flex w-full flex-col' : 'flex'}`}
                >
                  {/* Indicador de auto-guardado */}
                  <div className="flex h-10 items-center gap-4">
                    {logic.isActuallySaving ? (
                      <span className="flex h-10 items-center gap-2 rounded-md bg-blue-300 px-4 py-2 text-sm font-bold text-blue-800">
                        <Icons.spinner3 className="h-4 w-4" />
                        Guardando cambios...
                      </span>
                    ) : (
                      <span className="flex h-10 items-center rounded-md bg-green-300 px-4 py-2 text-sm font-bold text-green-800">
                        ✓ Todos los cambios guardados
                      </span>
                    )}
                  </div>
                  {/* Controles de zoom */}
                  <div className="flex h-10 items-center gap-1">
                    <button
                      onClick={logic.handleZoomOut}
                      className="flex h-8 w-8 items-center justify-center rounded bg-gray-600 text-white hover:bg-gray-600"
                      title="Reducir zoom"
                    >
                      -
                    </button>
                    <span className="w-16 text-center text-sm font-medium text-black">
                      {Math.round(logic.zoom * 100)}%
                    </span>
                    <button
                      onClick={logic.handleZoomIn}
                      className="flex h-8 w-8 items-center justify-center rounded bg-gray-500 text-white hover:bg-gray-600"
                      title="Aumentar zoom"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
        {/* Moved: Delete confirmation button now appears below all buttons when delete mode is active */}
        {logic.isDeleteMode && logic.rowsToDelete.size > 0 && (
          <div className="mb-4 flex items-center justify-start">
            <button
              onClick={() => {
                void logic.handleDeleteSelected();
              }}
              className="rounded-[8px] bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Eliminar ({logic.rowsToDelete.size})
            </button>
          </div>
        )}

        {/* Mover SearchFilters aquí, justo debajo de los botones principales y arriba de la tabla */}
        {!props.showTotals && !props.showMonthlyTotals && !showBoletaTotals && (
          <SearchFilters
            data={props.initialData}
            onFilterAction={handleFilterData}
            onDateFilterChangeAction={handleDateFilterChange}
            onToggleAsesorSelectionAction={handleToggleAsesorMode}
            onGenerateCuadreAction={generateCuadre}
            hasSearchResults={logic.hasSearchResults}
            isAsesorSelectionMode={logic.isAsesorSelectionMode}
            hasSelectedAsesores={logic.selectedAsesores.size > 0}
            isLoadingAsesorMode={logic.isLoadingAsesorMode}
            searchTerm={props.searchTerm ?? ''}
            setSearchTermAction={setSearchTermAction}
            userRole={props.userRole}
          />
        )}

        {/* --- NUEVO: Fecha responsive justo arriba de la tabla en mobile (ANTES de la tabla) --- */}
        {!props.showTotals &&
          !props.showMonthlyTotals &&
          isMobile &&
          !showBoletaTotals && (
            <div className="mb-3 flex items-center justify-center">
              <time className="font-display text-center text-xl font-bold tracking-tight text-black">
                {formatLongDate(selectedDateObj)}
              </time>
            </div>
          )}

        {/* --- NUEVO: Checkbox "Seleccionar todo" cuando está activo el modo asesor --- */}
        {!props.showTotals &&
          !props.showMonthlyTotals &&
          logic.isAsesorSelectionMode && (
            <div className="mb-2 flex items-center justify-end">
              <label
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium shadow-sm transition select-none ${
                  logic.areAllVisibleAsesoresSelected
                    ? 'border-purple-600 bg-purple-600 text-white'
                    : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                }`}
                title="Seleccionar/Deseleccionar todo"
              >
                <input
                  type="checkbox"
                  checked={logic.areAllVisibleAsesoresSelected}
                  onChange={(e) =>
                    logic.toggleSelectAllAsesorRows(e.target.checked)
                  }
                  className="sr-only"
                />
                <span
                  className={`inline-flex h-4 w-4 items-center justify-center rounded border text-white ${
                    logic.areAllVisibleAsesoresSelected
                      ? 'border-white'
                      : 'border-gray-300'
                  }`}
                >
                  {/* Check icon visible solo cuando está seleccionado */}
                  {logic.areAllVisibleAsesoresSelected ? (
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-3 w-3"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.435a1 1 0 011.414-1.414l3.03 3.03 6.657-6.657a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : null}
                </span>
                <span>Seleccionar todo</span>
              </label>
            </div>
          )}

        {/* Modal de exportación por rango de fechas */}
        <ExportDateRangeModal
          isOpen={logic.isExportModalOpen}
          setIsOpen={logic.setIsExportModalOpen}
          onExport={logic.handleExport}
        />

        {/* Modal de color picker para trámites */}
        <ColorPickerModal
          isOpen={isColorPickerOpen}
          onClose={() => {
            setIsColorPickerOpen(false);
            setPendingRowId(null);
          }}
          onConfirm={async (tramiteName: string, selectedColor?: string) => {
            await handleAddTramiteAction(tramiteName, selectedColor);
            if (pendingRowId) {
              logic.handleInputChange(pendingRowId, 'tramite', tramiteName);
              setPendingRowId(null);
            }
            setIsColorPickerOpen(false);
            await mutateTramites(); // Refresca tramites después de agregar
          }}
          onUpdate={handleUpdateTramiteAction}
          onDelete={async (tramiteName: string) => {
            try {
              await fetch('/api/tramites', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: tramiteName }),
              });
              await mutateTramites();
            } catch {
              console.error('Error deleting tramite:');
              alert('Error al eliminar el trámite.');
            }
          }}
          coloresOptions={coloresOptions}
          existingTramites={tramiteOptions}
          mutateTramites={mutateTramites} // NUEVO
        />

        {/* Modal de color picker para emitidoPor */}
        <EmitidoPorColorModal
          isOpen={isEmitidoPorColorPickerOpen}
          onClose={() => {
            setIsEmitidoPorColorPickerOpen(false);
            setPendingEmitidoPorRowId(null);
          }}
          onConfirm={async (nombre: string, selectedColor?: string) => {
            await handleAddEmitidoPorAction(nombre, selectedColor);
            if (pendingEmitidoPorRowId) {
              logic.handleInputChange(
                pendingEmitidoPorRowId,
                'emitidoPor',
                nombre
              );
              setPendingEmitidoPorRowId(null);
            }
            setIsEmitidoPorColorPickerOpen(false);
            await mutateEmitidoPor(); // Refresca emitidoPor después de agregar
            await mutateEmitidoPorWithColors();
          }}
          onUpdate={handleUpdateEmitidoPorAction}
          onDelete={handleDeleteEmitidoPorAction}
          coloresOptions={coloresOptions}
          existingEmitidoPor={emitidoPorWithColors}
          mutateEmitidoPor={async () => {
            await mutateEmitidoPor();
            await mutateEmitidoPorWithColors();
          }} // NUEVO
        />

        {/* Mostrar tabla de búsqueda remota si hay término de búsqueda */}
        {!props.showTotals && !props.showMonthlyTotals && props.searchTerm ? (
          <div
            className="table-container"
            style={{
              backgroundImage: 'url("/background-table.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              borderRadius: '8px',
            }}
          >
            <TransactionSearchRemote
              onRowSelect={logic.handleRowSelect}
              renderCheckbox={logic.renderCheckbox}
              renderAsesorSelect={logic.renderAsesorSelect}
              renderInput={(row, field, type) =>
                field === 'fecha' ? (
                  <span>
                    {(() => {
                      const value = row.fecha;
                      if (!value) return '';
                      const dateObj =
                        value instanceof Date ? value : new Date(value);
                      // Mostrar fecha completa en búsqueda
                      return dateObj.toLocaleString('es-CO', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                        timeZone: 'America/Bogota',
                      });
                    })()}
                  </span>
                ) : (
                  renderInput(row, field, type)
                )
              }
              getEmitidoPorClass={getEmitidoPorClass}
              isDeleteMode={logic.isDeleteMode}
              isAsesorSelectionMode={logic.isAsesorSelectionMode}
              selectedRows={logic.selectedRows}
              rowsToDelete={logic.rowsToDelete}
              handleDeleteSelect={logic.handleDeleteSelect}
              searchTerm={props.searchTerm ?? ''}
              searchTrigger={logic.searchTrigger}
            />
          </div>
        ) : null}

        {!props.showTotals &&
        !props.showMonthlyTotals &&
        !showBoletaTotals &&
        !props.searchTerm ? (
          <div
            className={`enhanced-table-container ${
              isMobile ? 'overflow-x-auto' : ''
            }`}
            style={{
              backgroundImage: 'url("/background-table.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              borderRadius: '8px',
              padding: '1rem',
              position: 'relative',
              ...(isMobile
                ? {
                    minWidth: 0,
                    width: '100vw',
                    marginLeft: '-16px',
                    marginRight: '-16px',
                    padding: '0.5rem 0',
                  }
                : {}),
            }}
          >
            {/* --- SIEMPRE visible: Barra de scroll horizontal superior sincronizada --- */}
            <div
              ref={topScrollBarRef}
              className="enhanced-table-scroll enhanced-table-scroll-top"
              style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                height: 12,
                marginBottom: 2,
                // background: '#f3f4f6', // opcional: color de fondo
                // --- SIEMPRE visible ---
                visibility: 'visible',
              }}
              onScroll={(e) => {
                const real = tableScrollContainerRef.current;
                if (real && e.currentTarget.scrollLeft !== real.scrollLeft) {
                  real.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
            >
              {/* Dummy para forzar el ancho igual al de la tabla */}
              <div
                style={{
                  width: tableScrollWidth || '100%',
                  height: 1,
                  minHeight: 1,
                  minWidth: '100%',
                  // --- SIEMPRE visible ---
                  visibility: 'visible',
                }}
              />
            </div>
            {/* --- FIN NUEVO --- */}
            {isLoadingPage || isPaginating ? (
              <div className="flex items-center justify-center gap-2 py-8 text-lg font-bold text-blue-700">
                <Icons.spinner className="h-6 w-6" />
                Cargando registros...
              </div>
            ) : logic.paginatedData.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-lg font-semibold text-gray-500">
                Este día no tiene registros
              </div>
            ) : (
              // --- NUEVO: Envuelve la tabla y header en contenedor con scroll horizontal ---
              <div
                ref={tableScrollContainerRef}
                id="enhanced-table-scroll"
                className="enhanced-table-scroll"
                style={{
                  transform: `scale(${logic.zoom})`,

                  transformOrigin: 'left top',
                  width: `${(1 / logic.zoom) * 100}%`,
                  height: `${(1 / logic.zoom) * 100}%`,
                  overflowX: logic.zoom === 1 ? 'auto' : 'scroll',
                  overflowY: 'auto',
                  ...(isMobile
                    ? {
                        minWidth: '600px',
                        maxWidth: '100vw',
                        overflowX: 'auto',
                      }
                    : {}),
                }}
                onScroll={(e) => {
                  const top = topScrollBarRef.current;
                  if (top && e.currentTarget.scrollLeft !== top.scrollLeft) {
                    top.scrollLeft = e.currentTarget.scrollLeft;
                  }
                }}
              >
                <table
                  className={`w-full text-left text-sm text-gray-600 ${
                    isMobile ? 'min-w-[600px]' : ''
                  }`}
                >
                  <HeaderTitles
                    isDeleteMode={logic.isDeleteMode}
                    _isAsesorSelectionMode={logic.isAsesorSelectionMode}
                  />
                  <tbody>
                    {logic.paginatedData.map(
                      (row: TransactionRecord, _index: number) => (
                        <TransactionTableRow
                          key={row.id}
                          row={row}
                          isDeleteMode={logic.isDeleteMode}
                          isAsesorSelectionMode={logic.isAsesorSelectionMode}
                          _selectedRows={
                            logic.isAsesorSelectionMode
                              ? logic.selectedAsesores
                              : logic.selectedRows
                          }
                          rowsToDelete={logic.rowsToDelete}
                          handleInputChange={logic.handleInputChange}
                          _handleRowSelect={logic.handleRowSelect}
                          handleDeleteSelect={logic.handleDeleteSelect}
                          renderCheckbox={renderCheckbox}
                          renderAsesorSelect={logic.renderAsesorSelect}
                          renderInput={
                            renderInput as (
                              row: TransactionRecord,
                              field: keyof TransactionRecord,
                              type?: InputType
                            ) => React.ReactNode
                          }
                          _getEmitidoPorClass={getEmitidoPorClass}
                          getTramiteColorClass={getTramiteColorClassForRow}
                          userRole={props.userRole}
                          // --- NUEVO: pasar datos de colores ---
                          coloresOptions={coloresOptions}
                          tramiteOptions={tramiteOptions}
                          emitidoPorWithColors={emitidoPorWithColors}
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Añadir el componente de scroll horizontal fijo cuando hay datos */}
            {/*
              El StickyHorizontalScroll se ha deshabilitado temporalmente.
              Evitamos insertar referencias/JSX malformado aquí que provocaba
              errores de parsing y de tipo (RefObject usado como ReactNode).
              Si quieres reactivar un componente de scroll fijo, renderízalo
              correctamente así:

              {logic.paginatedData.length > 0 && (
                <StickyHorizontalScroll
                  targetRef={tableScrollContainerRef as React.RefObject<HTMLElement>}
                  height={12}
                  zIndex={50}
                  className="mx-1"
                />
              )}
            */}
            {null}
          </div>
        ) : null}

        {/* Solo mostrar SearchControls si NO estamos en la vista de totales */}
        {props.showTotals ? (
          <TransactionTotals
            transactions={props.initialData}
            showTotals={props.showTotals}
            onToggleTotalsAction={props.onToggleTotalsAction}
            showMonthlyTotals={props.showMonthlyTotals}
            onToggleMonthlyTotalsAction={props.onToggleMonthlyTotalsAction}
            showBoletaTotals={showBoletaTotals}
            onToggleBoletaTotalsAction={() => setShowBoletaTotals((v) => !v)}
            onBackToTableAction={() => {
              // Cierra todas las vistas de totales y el panel local
              if (props.showTotals) props.onToggleTotalsAction();
              if (props.showMonthlyTotals && props.onToggleMonthlyTotalsAction)
                props.onToggleMonthlyTotalsAction();
              setShowBoletaTotals(false);
              setTotalsModeVisible(false);
            }}
          />
        ) : props.showMonthlyTotals ? (
          <TransactionMonthlyTotals
            transactions={props.initialData}
            showTotals={props.showTotals}
            onToggleTotalsAction={props.onToggleTotalsAction}
            showMonthlyTotals={props.showMonthlyTotals}
            onToggleMonthlyTotalsAction={props.onToggleMonthlyTotalsAction}
            showBoletaTotals={showBoletaTotals}
            onToggleBoletaTotalsAction={() => setShowBoletaTotals((v) => !v)}
            onBackToTableAction={() => {
              // Cierra todas las vistas de totales y el panel local
              if (props.showTotals) props.onToggleTotalsAction();
              if (props.showMonthlyTotals && props.onToggleMonthlyTotalsAction)
                props.onToggleMonthlyTotalsAction();
              setShowBoletaTotals(false);
              setTotalsModeVisible(false);
            }}
          />
        ) : showBoletaTotals ? (
          <TransactionBoletaTotals
            showTotals={props.showTotals}
            onToggleTotalsAction={props.onToggleTotalsAction}
            showMonthlyTotals={props.showMonthlyTotals}
            onToggleMonthlyTotalsAction={props.onToggleMonthlyTotalsAction}
            showBoletaTotals={showBoletaTotals}
            onToggleBoletaTotalsAction={() => setShowBoletaTotals((v) => !v)}
            onBackToTableAction={() => {
              // Cierra todas las vistas de totales y el panel local
              if (props.showTotals) props.onToggleTotalsAction();
              if (props.showMonthlyTotals && props.onToggleMonthlyTotalsAction)
                props.onToggleMonthlyTotalsAction();
              setShowBoletaTotals(false);
              setTotalsModeVisible(false);
            }}
          />
        ) : null}

        {/* Add the payment UI */}
        {logic.selectedRows.size > 0 && (
          <div
            ref={payBoxRef}
            className="fixed z-[9999] flex w-[400px] flex-col gap-4 rounded-lg bg-white p-6 shadow-lg select-none"
            style={{
              left: Math.max(0, Math.min(payBoxPos.x, window.innerWidth - 420)),
              top: Math.max(0, Math.min(payBoxPos.y, window.innerHeight - 120)),
              transition: dragging ? 'none' : 'box-shadow 0.2s',
              boxShadow: dragging
                ? '0 0 0 2px #3b82f6'
                : '0 4px 24px 0 rgba(0,0,0,0.15)',
              userSelect: dragging ? 'none' : 'auto',
            }}
            onMouseDown={(e) => {
              // CORREGIDO: Solo inicia drag si hace click en la cabecera específica
              if (
                e.target instanceof HTMLElement &&
                (e.target.classList.contains('paybox-drag-handle') ||
                  e.target.closest('.paybox-drag-handle'))
              ) {
                e.preventDefault();
                setDragging(true);
                const rect = payBoxRef.current!.getBoundingClientRect();
                dragOffset.current = {
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                };
              }
            }}
          >
            <div
              className="paybox-drag-handle mb-2 flex cursor-move items-center justify-between rounded bg-gray-200 px-2 py-1 font-bold text-gray-700"
              style={{ userSelect: 'none' }}
              title="Arrastra para mover"
            >
              <span>Pago de Boletas</span>
              <span className="text-xs text-gray-500">(Arrastra aquí)</span>
            </div>
            <div className="text-center">
              <div className="mb-2 font-semibold">
                Total Seleccionado: ${logic.formatCurrency(totalSelected)}
              </div>
              {/* --- NUEVO: Input para referencia de boleta --- */}
              <input
                type="text"
                placeholder="Referencia de Boleta"
                value={boletaReferencia}
                onChange={(e) => setBoletaReferencia(e.target.value)}
                className="mb-2 w-full rounded border px-2 py-1"
              />
              {/* --- NUEVO: Select para banco --- */}
              <select
                value={selectedBanco}
                onChange={(e) => setSelectedBanco(e.target.value)}
                className="mb-2 w-full rounded border px-2 py-1"
                aria-label="Seleccionar banco"
              >
                <option value="" disabled>
                  Selecciona el banco…
                </option>
                {bancoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="flex flex-col gap-2 text-base">
                <div>
                  Registros a pagar:{' '}
                  {selectedRowsArray.filter((row) => !row.pagado).length}
                </div>
                <div className="font-mono uppercase">
                  Placas: {placasSeleccionadas}
                </div>
              </div>
            </div>
            <button
              onClick={handlePayLocal}
              className="mt-2 flex w-full cursor-pointer items-center justify-center rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
              disabled={
                selectedRowsArray.filter((row) => !row.pagado).length === 0 ||
                isPaying ||
                !boletaReferencia.trim() ||
                !selectedBanco ||
                selectedBanco === ''
              }
              style={{
                pointerEvents: 'auto',
                zIndex: 1000,
                cursor:
                  isPaying ||
                  selectedRowsArray.filter((row) => !row.pagado).length === 0 ||
                  !boletaReferencia.trim() ||
                  !selectedBanco ||
                  selectedBanco === ''
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {isPaying ? (
                <>
                  <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
                  Procesando pago...
                </>
              ) : (
                'Pagar Boletas Seleccionadas'
              )}
            </button>
          </div>
        )}
      </div>
      {/* Muestra SOLO UNA VEZ la paginación de días abajo de la tabla principal, nunca en Totales Boletas */}
      {!props.showTotals && !props.showMonthlyTotals && !showBoletaTotals && (
        <DatePagination
          currentPage={logic.currentPage}
          setCurrentPage={logic.setCurrentPage}
          totalPages={totalPages}
          selectedDate={logic.selectedDate}
          goToPreviousDay={logic.goToPreviousDay}
          goToNextDay={logic.goToNextDay}
          selectedDateObj={selectedDateObj}
          hasPreviousDay={hasPreviousDay}
          hasNextDay={hasNextDay}
          totalDays={totalDays}
          currentDayNumber={currentDayIndex + 1}
          isLoadingPage={isLoadingPage || isPaginating}
          onPaginate={handlePaginate}
        />
      )}
    </div>
  );
});

export default TransactionTable;
