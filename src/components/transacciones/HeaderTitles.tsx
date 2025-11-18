import React, { useEffect, useState } from 'react';

import { Calendar } from 'lucide-react';

export default function HeaderTitles({
  isDeleteMode = false,
  _isAsesorSelectionMode = false,
}: {
  isDeleteMode?: boolean;
  _isAsesorSelectionMode?: boolean;
}) {
  const tableHeaders = [
    'Fecha',
    'Trámite',
    'Boleta',
    'Pagado',
    'Boletas Registradas',
    'Emitido Por',
    'Placa',
    'Documento',
    '#',
    'Nombre',
    'Cilindraje',
    'Tipo Vehículo',
    'Celular',
    'Ciudad',
    'Asesor',
    'Novedad',
    'Precio Neto',
    'Tarifa Servicio',
    'N+T',
    'Com Extra',
    '4x1000',
    'Ganancia Bruta',
    'Rappi',
    'Observaciones',
  ];

  // Estado local para forzar re-render cuando cambia el global
  const [fechaExpand, setFechaExpand] = useState(
    typeof window !== 'undefined' ? window.__fechaColExpand : false
  );

  useEffect(() => {
    const update = () => setFechaExpand(window.__fechaColExpand);
    if (typeof window !== 'undefined') {
      window.__fechaColExpandListeners.add(update);
      setFechaExpand(window.__fechaColExpand);
      return () => {
        window.__fechaColExpandListeners.delete(update);
      };
    }
  }, []);

  const handleToggleFecha = () => {
    if (typeof window !== 'undefined') {
      window.__fechaColExpand = !window.__fechaColExpand;
      window.__fechaColExpandListeners.forEach((fn) => fn());
    }
  };

  return (
    <thead className="sticky top-0 z-50 bg-gray-50">
      <tr className="[&>th]:table-header">
        {/* Si hay modo delete o asesor, agregar celdas vacías */}
        {isDeleteMode && (
          <th scope="col" className="w-10 whitespace-nowrap">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="h-4 w-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
          </th>
        )}
        {/* Columna Creador: reemplaza el texto por el SVG */}
        <th className="px-2 py-3 text-center text-xs font-bold tracking-wider whitespace-nowrap text-gray-800 uppercase">
          <svg
            viewBox="0 0 24 24"
            id="Layer_1"
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            fill="#000000"
            width={20}
            height={20}
            style={{ display: 'inline-block', verticalAlign: 'middle' }}
          >
            <g>
              <circle
                className="cls-1"
                cx="12"
                cy="12"
                r="9.58"
                fill="none"
                stroke="#020202"
                strokeMiterlimit="10"
                strokeWidth="1.92"
              />
              <line
                className="cls-1"
                x1="12"
                y1="0.5"
                x2="12"
                y2="5.29"
                fill="none"
                stroke="#020202"
                strokeMiterlimit="10"
                strokeWidth="1.92"
              />
              <line
                className="cls-1"
                x1="12"
                y1="18.71"
                x2="12"
                y2="23.5"
                fill="none"
                stroke="#020202"
                strokeMiterlimit="10"
                strokeWidth="1.92"
              />
              <line
                className="cls-1"
                x1="23.5"
                y1="12"
                x2="18.71"
                y2="12"
                fill="none"
                stroke="#020202"
                strokeMiterlimit="10"
                strokeWidth="1.92"
              />
              <line
                className="cls-1"
                x1="5.29"
                y1="12"
                x2="0.5"
                y2="12"
                fill="none"
                stroke="#020202"
                strokeMiterlimit="10"
                strokeWidth="1.92"
              />
              <circle
                className="cls-1"
                cx="12"
                cy="11.04"
                r="2.87"
                fill="none"
                stroke="#020202"
                strokeMiterlimit="10"
                strokeWidth="1.92"
              />
              <path
                className="cls-1"
                d="M7.21,19.67v-1A4.78,4.78,0,0,1,12,13.92h0a4.78,4.78,0,0,1,4.79,4.79v1"
                fill="none"
                stroke="#020202"
                strokeMiterlimit="10"
                strokeWidth="1.92"
              />
            </g>
          </svg>
        </th>
        {/* Icono de calendario para la columna fecha */}
        <th
          scope="col"
          className="table-header fecha-header sticky-right-divider sticky left-0 z-30 cursor-pointer border-r border-gray-600 bg-gray-50 select-none"
          onClick={handleToggleFecha}
          style={{
            minWidth: fechaExpand ? 120 : 32,
            maxWidth: fechaExpand ? 180 : 32,
            width: fechaExpand ? 140 : 32,
            textAlign: 'center',
          }}
          title={
            fechaExpand ? 'Contraer columna fecha' : 'Expandir columna fecha'
          }
        >
          {fechaExpand ? (
            <span
              className="text-md font-semibold"
              style={{
                color: 'black',
                fontFamily:
                  'var(--font-table-text), var(--font-lexend), sans-serif',
              }}
            >
              Fecha
            </span>
          ) : (
            <div className="flex w-full items-center justify-center">
              <Calendar size={20} className="text-gray-500" />
            </div>
          )}
        </th>
        {tableHeaders.slice(1).map((header) => (
          <th
            key={header}
            scope="col"
            className="table-header whitespace-nowrap"
          >
            {header}
          </th>
        ))}
      </tr>
    </thead>
  );
}
