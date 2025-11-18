import React from 'react';

import { useQuery } from '@tanstack/react-query';

import HeaderTitles from './HeaderTitles';
import TransactionTableRow, { InputType } from './TransactionTableRow';

import type { TransactionRecord } from '~/types';

interface Props {
  onRowSelect: (id: string, precioNeto: number) => void;
  renderCheckbox: (
    id: string,
    field: keyof TransactionRecord,
    value: boolean,
    disabled?: boolean
  ) => React.ReactNode;
  renderAsesorSelect: (row: TransactionRecord) => React.ReactNode;
  renderInput: (
    row: TransactionRecord,
    field: keyof TransactionRecord,
    type?: InputType
  ) => React.ReactNode;
  getEmitidoPorClass: (emitidoPor: string) => string;
  isDeleteMode: boolean;
  isAsesorSelectionMode: boolean;
  selectedRows: Set<string>;
  rowsToDelete: Set<string>;
  handleDeleteSelect: (id: string) => void;
  searchTerm: string;
  searchTrigger: number;
}

const TransactionSearchRemote: React.FC<Props> = ({
  onRowSelect,
  renderCheckbox,
  renderAsesorSelect,
  renderInput,
  getEmitidoPorClass,
  isDeleteMode,
  isAsesorSelectionMode,
  selectedRows,
  rowsToDelete,
  handleDeleteSelect,
  searchTerm,
  searchTrigger,
}) => {
  const {
    data: results = [],
    error,
    isFetching,
  } = useQuery<TransactionRecord[]>({
    queryKey: ['transactions-search', searchTerm, searchTrigger],
    queryFn: async (): Promise<TransactionRecord[]> => {
      if (!searchTerm) return [];
      const res = await fetch(
        `/api/transactions/search?query=${encodeURIComponent(searchTerm)}`
      );
      if (!res.ok) throw new Error('Error buscando transacciones');
      return res.json() as Promise<TransactionRecord[]>;
    },
    enabled: !!searchTerm, // Solo buscar si hay término
    retry: 1,
    staleTime: 1000 * 60, // 1 minuto
  });

  return (
    <div className="mb-6">
      {/* El input de búsqueda se elimina, solo se muestra la tabla si hay resultados */}
      {error && (
        <div className="mb-2 text-red-600">{(error as Error).message}</div>
      )}
      <div
        className="table-container"
        style={{
          borderRadius: '8px',
          padding: '1rem',
          height: 'auto',
          minHeight: '100vh',
          overflow: 'visible',
        }}
      >
        <div
          className="table-scroll-container"
          style={{ overflow: 'visible', height: 'auto' }}
        >
          <table className="w-full text-left text-sm text-white">
            <HeaderTitles
              isDeleteMode={isDeleteMode}
              _isAsesorSelectionMode={isAsesorSelectionMode}
            />
            <tbody>
              {/* Mostrar spinner mientras loading y searchTerm no está vacío */}
              {searchTerm && !error && isFetching && (
                <tr>
                  <td colSpan={24} className="py-8 text-center">
                    <div className="flex flex-col items-start justify-center gap-2">
                      <svg
                        className="size-10 animate-spin text-blue-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="purple"
                          strokeWidth="4"
                        />
                        <path fill="blue" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span className="text-purple-600">Buscando...</span>
                    </div>
                  </td>
                </tr>
              )}
              {/* Mostrar mensaje si no hay resultados después de buscar */}
              {searchTerm && !error && !isFetching && results.length === 0 && (
                <tr>
                  <td
                    colSpan={24}
                    className="py-8 pl-4 text-left text-purple-600"
                  >
                    No se encontró nada.
                  </td>
                </tr>
              )}
              {/* Mostrar resultados si existen */}
              {results.length > 0
                ? (results as TransactionRecord[]).map(
                    (row: TransactionRecord) => (
                      <TransactionTableRow
                        key={row.id}
                        row={row}
                        isDeleteMode={isDeleteMode}
                        isAsesorSelectionMode={isAsesorSelectionMode}
                        _selectedRows={selectedRows}
                        rowsToDelete={rowsToDelete}
                        handleInputChange={() => {
                          /* Solo lectura en búsqueda remota */
                        }}
                        _handleRowSelect={onRowSelect}
                        handleDeleteSelect={handleDeleteSelect}
                        renderCheckbox={renderCheckbox}
                        renderAsesorSelect={renderAsesorSelect}
                        renderInput={renderInput}
                        _getEmitidoPorClass={getEmitidoPorClass}
                      />
                    )
                  )
                : !searchTerm && (
                    <tr>
                      <td
                        colSpan={24}
                        className="py-8 text-center text-gray-400"
                      >
                        No hay resultados para la búsqueda.
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionSearchRemote;
