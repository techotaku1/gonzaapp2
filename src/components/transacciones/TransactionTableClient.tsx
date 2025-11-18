'use client';

import { useEffect, useRef, useState } from 'react';

import { useUser } from '@clerk/nextjs';
import { Bell } from 'lucide-react'; // Agrega este import para el icono de campana
import useSWR from 'swr';

import { Icons } from '~/components/icons'; // Asegúrate de importar los iconos
import { SWRProvider } from '~/components/swr/SWRProvider';
import TransactionTable from '~/components/transacciones/TransactionTable';
import { useAppData } from '~/hooks/useAppData';
import { getDateKey } from '~/utils/dateUtils';

import type { TransactionRecord } from '~/types';

export default function TransactionTableClient({
  initialData,
  allDates,
  onUpdateRecordAction,
}: {
  initialData: TransactionRecord[];
  allDates: string[]; // <-- nuevo prop
  onUpdateRecordAction: (
    records: TransactionRecord[]
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [showTotals, setShowTotals] = useState(false);
  const [showMonthlyTotals, setShowMonthlyTotals] = useState(false);

  // --- NUEVO: Estado para controlar si la tabla está activa ---
  const [isActive, setIsActive] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFocus = () => setIsActive(true);
    const handleBlur = () => {
      // Don't immediately deactivate on blur
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        if (!userInteracted) {
          setIsActive(false);
        }
      }, 60000); // Wait a minute before disabling if user hasn't interacted
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setIsActive(true);
      } else {
        handleBlur(); // Use the same logic as blur
      }
    };

    const handleUserInteraction = () => {
      setUserInteracted(true);
      setIsActive(true);

      // Reset after a period of inactivity
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        setUserInteracted(false);
      }, 300000); // 5 minutes of inactivity resets interaction state
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);

    // Track user interactions to keep the tab active
    document.addEventListener('mousemove', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('scroll', handleUserInteraction);

    // Opcional: mouseover/mouseleave sobre la tabla
    const node = containerRef.current;
    if (node) {
      node.addEventListener('mouseenter', () => setIsActive(true));
    }

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('mousemove', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('scroll', handleUserInteraction);

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (node) {
        node.removeEventListener('mouseenter', () => setIsActive(true));
      }
    };
  }, [userInteracted]);

  // --- CORREGIDO: Obtener la fecha del ÚLTIMO día (máxima) para la paginación inicial ---
  const currentDate =
    initialData.length > 0
      ? (() => {
          // Buscar la fecha máxima entre las filas
          const dates = initialData
            .map((r) => (r.fecha instanceof Date ? r.fecha : new Date(r.fecha)))
            .filter((d) => !isNaN(d.getTime()));
          if (dates.length === 0) return undefined;
          const max = new Date(Math.max(...dates.map((d) => d.getTime())));
          return max.toISOString().slice(0, 10);
        })()
      : undefined;

  // Usa useAppData para obtener los datos optimizados y actualizados SOLO para la fecha actual
  const { data, mutate, isLoading } = useAppData(
    initialData,
    isActive,
    currentDate
  );

  const handleUpdateRecords = async (records: TransactionRecord[]) => {
    const result = await onUpdateRecordAction(records);
    if (result.success) {
      await mutate();
    }
    return result;
  };

  // --- NUEVO: Detectar filas con boleta!==true o pagado!==true y guardar placas ---
  // Extiende el tipo para incluir tramite y novedad
  const [showNotification, setShowNotification] = useState(false);
  const [notificationList, setNotificationList] = useState<
    {
      id: string; // Agregado para llevar a la fila exacta
      placa: string;
      fecha: Date;
      asesor: string;
      precioNeto: number;
      tarifaServicio: number; // <-- NUEVO
      emitidoPor: string;
      tramite: string;
      novedad: string;
    }[]
  >([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false); // NUEVO

  // SWR para placas ignoradas
  const { data: ignoredPlates = [], mutate: mutateIgnoredPlates } = useSWR<
    string[]
  >('/api/ignored-plates', async (url: string) => {
    const res = await fetch(url);
    const data: unknown = await res.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      'placas' in data &&
      Array.isArray((data as { placas: unknown }).placas)
    ) {
      return (data as { placas: unknown[] }).placas.filter(
        (p): p is string => typeof p === 'string'
      );
    }
    return [];
  });

  useEffect(() => {
    // Fecha mínima: domingo, 10 de agosto de 2025
    const minDate = new Date('2025-08-10T00:00:00-05:00');
    const pendientes = (data ?? initialData)
      .filter((row) => {
        const fecha =
          row.fecha instanceof Date ? row.fecha : new Date(row.fecha);
        const isNotPagado = row.boleta !== true || row.pagado !== true;
        const hasPlaca =
          row.placa && typeof row.placa === 'string' && row.placa.trim() !== '';
        const isSOAT =
          typeof row.tramite === 'string' &&
          row.tramite.trim().toUpperCase() === 'SOAT';

        if (isSOAT) {
          return (
            isNotPagado &&
            hasPlaca &&
            fecha >= minDate &&
            !ignoredPlates.includes(row.placa.toUpperCase())
          );
        } else {
          // Para otros trámites, mostrar aunque placa esté vacía
          return isNotPagado && fecha >= minDate;
        }
      })
      .sort((a, b) => {
        const fechaA = a.fecha instanceof Date ? a.fecha : new Date(a.fecha);
        const fechaB = b.fecha instanceof Date ? b.fecha : new Date(b.fecha);
        return fechaB.getTime() - fechaA.getTime();
      })
      .map((row) => ({
        id: row.id,
        placa: typeof row.placa === 'string' ? row.placa.toUpperCase() : '',
        fecha: row.fecha instanceof Date ? row.fecha : new Date(row.fecha),
        asesor: row.asesor ?? '',
        precioNeto: row.precioNeto ?? 0,
        tarifaServicio: row.tarifaServicio ?? 0, // <-- NUEVO
        emitidoPor: row.emitidoPor ?? '',
        tramite: row.tramite ?? '',
        novedad: row.novedad ?? '',
      }));

    setShowNotification(pendientes.length > 0);
    setNotificationList((prev) => {
      if (
        prev.length === pendientes.length &&
        JSON.stringify(prev) === JSON.stringify(pendientes)
      ) {
        return prev;
      }
      return pendientes;
    });
  }, [data, initialData, ignoredPlates]);

  // --- NUEVO: Cerrar lista al hacer click fuera ---
  useEffect(() => {
    if (!notificationOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const notif = document.getElementById('notification-bell-list');
      if (notif && !notif.contains(e.target as Node)) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen]);

  // --- NUEVO: Handler para abrir/cerrar la lista con loading spinner ---
  const handleNotificationClick = () => {
    if (!notificationOpen) {
      setNotificationLoading(true);
      setNotificationOpen(true);
      setTimeout(() => {
        setNotificationLoading(false);
      }, 400); // Simula carga, puedes ajustar el tiempo si lo deseas
    } else {
      setNotificationOpen(false);
    }
  };

  // Ref para exponer función de scroll/select a la tabla principal (async)
  const tableRef = useRef<{
    scrollToPlaca: (
      placa: string,
      id?: string,
      options?: { retry?: boolean; retries?: number; interval?: number }
    ) => Promise<boolean>;
  } | null>(null);

  // NUEVO: Estado para la fecha actual de la paginación y función para cambiarla
  const [paginaActualFecha, setPaginaActualFecha] = useState(currentDate);

  // NUEVO: Cuando cambia currentDate, actualiza paginaActualFecha
  useEffect(() => {
    setPaginaActualFecha(currentDate);
  }, [currentDate]);

  // NUEVO: Handler para cambiar la página por fecha
  const cambiarPaginaPorFecha = (fecha: string) => {
    setPaginaActualFecha(fecha);
  };

  // Handler para ir a la placa en la tabla principal
  const handleGoToPlaca = async (
    placa: string,
    fechaPlaca?: Date,
    id?: string
  ) => {
    const fechaStr =
      fechaPlaca instanceof Date ? getDateKey(fechaPlaca) : undefined;
    let success = false;

    if (fechaStr && fechaStr !== paginaActualFecha) {
      // Cambia la página a la fecha de la placa
      cambiarPaginaPorFecha(fechaStr);
      // Llama a la función solo si existe y await su promesa
      const fn = tableRef.current?.scrollToPlaca;
      if (fn) {
        try {
          success = await fn(placa, id, {
            retry: true,
            retries: 20,
            interval: 300,
          });
        } catch (_err) {
          success = false;
        }
      } else {
        success = false;
      }
    } else {
      const fn = tableRef.current?.scrollToPlaca;
      if (fn) {
        try {
          success = await fn(placa, id, {
            retry: true,
            retries: 6,
            interval: 150,
          });
        } catch (_err) {
          success = false;
        }
      } else {
        success = false;
      }
    }

    // Si se seleccionó la fila, la tabla abrirá automáticamente el payBox
    // porque el imperative handler marca la fila en selectedRows.
    if (!success) {
      // fallback: intenta seleccionar sin esperar y sin await (fire-and-forget)
      const fn = tableRef.current?.scrollToPlaca;
      if (fn) void fn(placa, id, { retry: false });
    }

    setNotificationOpen(false);
  };

  // Handler para ignorar placa
  const handleIgnorePlaca = async (placa: string) => {
    await fetch('/api/ignored-plates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placa }),
    });
    mutateIgnoredPlates();
  };

  // Detectar el rol usando Clerk en el cliente
  const { user } = useUser();
  const role = user?.publicMetadata?.role === 'admin' ? 'admin' : 'empleado';

  // --- NUEVO: Detectar si es pantalla pequeña (mobile) ---
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- NUEVO: Obtén el nombre del usuario logueado ---
  const userName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName ?? user?.username ?? 'A';

  // Usa allDates para la paginación en TransactionTable
  return (
    <SWRProvider active={isActive}>
      {/* Contenedor para el header y la campana en pantallas grandes */}
      <div
        ref={containerRef}
        className="fixed top-0 left-0 z-50 w-full"
        style={
          isMobile
            ? {
                width: '100vw',
                minWidth: 0,
                maxWidth: '100vw',
                overflowX: 'hidden',
              }
            : {}
        }
      >
        {/* <Header /> */}

        {/* Campanita de notificación (solo visible en pantallas grandes) */}
        {!isMobile && showNotification && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 24,
              zIndex: 100,
              borderRadius: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {renderNotificationBell()}
          </div>
        )}
      </div>

      <main
        className="container mx-auto min-h-screen px-4 pt-32"
        style={{
          height: 'auto',
          minHeight: '100vh',
          // Reemplazo: no usar 'overflow' shorthand junto con overflowX/overflowY
          overflowX: 'visible',
          overflowY: 'visible',
          ...(isMobile
            ? {
                minWidth: 0,
                width: '100vw',
                maxWidth: '100vw',
                // Mantener solo longhand en mobile
                overflowX: 'hidden',
                overflowY: 'visible',
              }
            : {}),
        }}
      >
        {/* Campanita de notificación en móviles (centrada y más grande) */}
        {isMobile && showNotification && (
          <div
            className="mb-4 flex w-full justify-center"
            style={{
              marginTop: -24,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                zIndex: 100,
                borderRadius: 32,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {renderNotificationBell()}
            </div>
          </div>
        )}

        <TransactionTable
          ref={tableRef}
          initialData={data ?? []}
          allDates={allDates} // <-- pasa el prop
          onUpdateRecordAction={handleUpdateRecords}
          onToggleTotalsAction={() => {
            setShowTotals((prev) => !prev);
          }}
          showTotals={showTotals}
          showMonthlyTotals={showMonthlyTotals}
          onToggleMonthlyTotalsAction={() => {
            setShowMonthlyTotals((prev) => !prev);
            if (showTotals) {
              setShowTotals(false);
            }
          }}
          isLoading={isLoading}
          userRole={role}
          // --- CORREGIDO: Pasar la fecha del último día como prop ---
          currentDate={currentDate}
          isMobile={isMobile}
          userName={userName} // <-- pasa el nombre aquí
        />
      </main>
    </SWRProvider>
  );

  // Helper function para evitar duplicación de código
  function renderNotificationBell() {
    return (
      <>
        {/* Botón campanita */}
        <button
          type="button"
          onClick={handleNotificationClick}
          style={{
            position: 'relative',
            background: 'white',
            border: 'none',
            borderRadius: 32,
            padding: isMobile ? 12 : 12,
            minWidth: isMobile ? 48 : 44,
            minHeight: isMobile ? 48 : 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            maxWidth: isMobile ? 56 : undefined,
          }}
          title="Faltan boletas o pagos"
          tabIndex={0}
        >
          {/* Badge de notificaciones */}
          {notificationList.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: isMobile ? 2 : 1,
                right: isMobile ? 4 : 2,
                background: '#f59e42',
                color: 'white',
                borderRadius: '50%',
                fontSize: isMobile ? 14 : 12,
                fontWeight: 700,
                minWidth: isMobile ? 22 : 18,
                minHeight: isMobile ? 22 : 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid #fff',
                zIndex: 2,
              }}
            >
              {notificationList.length}
            </span>
          )}
          <Bell
            className={
              notificationOpen
                ? 'animate-bounce text-yellow-500'
                : 'text-yellow-500'
            }
            size={isMobile ? 28 : 22}
            style={{ transition: 'transform 0.2s' }}
          />
        </button>

        {/* Menú desplegable de notificaciones */}
        {notificationOpen && (
          <div
            id="notification-bell-list"
            style={{
              position: 'absolute',
              top: isMobile ? 56 : 48,
              right: 0,
              minWidth: isMobile ? 280 : 260,
              maxWidth: isMobile ? '95vw' : 340,
              background: 'white',
              border: '1px solid #fbbf24',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              padding: isMobile ? '12px 8px' : '12px 8px',
              zIndex: 9999,
              overflowX: 'hidden',
            }}
          >
            {notificationLoading ? (
              <div className="flex items-center justify-center py-8">
                <Icons.spinner className="h-8 w-8 text-yellow-500" />
              </div>
            ) : (
              <>
                <div className="mb-2 font-bold text-yellow-700">
                  Tramites Por Pagar:
                </div>
                <ul
                  className="max-h-64 overflow-y-auto"
                  style={isMobile ? { maxWidth: '88vw' } : {}}
                >
                  {notificationList.map((item, idx) => (
                    <li
                      key={item.id || (item.placa || item.tramite) + idx}
                      className="flex cursor-pointer flex-col rounded px-2 py-1 font-mono text-gray-800 hover:bg-yellow-50"
                      onClick={() =>
                        handleGoToPlaca(item.placa, item.fecha, item.id)
                      }
                      tabIndex={0}
                      style={{
                        outline: 'none',
                        fontSize: isMobile ? 13 : undefined,
                        maxWidth: isMobile ? '85vw' : undefined,
                      }}
                    >
                      <span className="flex items-center justify-between text-base font-bold text-gray-900">
                        {/* Mostrar tramite si no es SOAT, si no mostrar placa */}
                        {item.tramite && item.tramite.toUpperCase() !== 'SOAT'
                          ? (item.tramite ?? '(Sin trámite)')
                          : item.placa}
                        {/* El botón Ignorar solo es visible para admins */}
                        {role !== 'empleado' && (
                          <button
                            className="ml-2 text-xs text-red-500 underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIgnorePlaca(item.placa);
                            }}
                            title="Ignorar esta placa"
                          >
                            Ignorar
                          </button>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(() => {
                          let fecha: Date | undefined;
                          if (
                            item.fecha instanceof Date &&
                            !isNaN(item.fecha.getTime())
                          ) {
                            fecha = item.fecha;
                          } else if (
                            typeof item.fecha === 'string' ||
                            typeof item.fecha === 'number'
                          ) {
                            const f = new Date(item.fecha);
                            if (!isNaN(f.getTime())) fecha = f;
                          }
                          if (!fecha) return '';
                          // Sumar 5 horas a la fecha para ajustar el horario
                          const fechaAjustada = new Date(
                            fecha.getTime() + 5 * 60 * 60 * 1000
                          );
                          return fechaAjustada.toLocaleString('es-CO', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: 'America/Bogota',
                          });
                        })()}
                      </span>
                      <span className="text-xs text-gray-700">
                        Asesor: <b>{item.asesor}</b>
                      </span>
                      <span className="text-xs text-gray-700">
                        Precio Neto:{' '}
                        <b>${item.precioNeto.toLocaleString('es-CO')}</b>
                      </span>
                      <span className="text-xs text-gray-700">
                        Emitido Por: <b>{item.emitidoPor}</b>
                      </span>
                      <span className="text-xs text-gray-700">
                        Tarifa Servicio:{' '}
                        <b>${item.tarifaServicio.toLocaleString('es-CO')}</b>
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  className="mt-3 w-full rounded bg-yellow-400 py-1 font-semibold text-white hover:bg-yellow-500"
                  onClick={() => setNotificationOpen(false)}
                  style={isMobile ? { fontSize: 14 } : {}}
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        )}
      </>
    );
  }
}
