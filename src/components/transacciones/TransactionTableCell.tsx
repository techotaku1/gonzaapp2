import React, { useEffect, useState } from 'react';

import { Calendar } from 'lucide-react';

import type { InputType } from './TransactionTableRow';
import type { TransactionRecord } from '~/types';

interface TransactionTableCellProps {
  row: TransactionRecord;
  field: keyof TransactionRecord;
  type?: InputType;
  renderInput: (
    row: TransactionRecord,
    field: keyof TransactionRecord,
    type?: InputType,
    extraProps?: { disabled?: boolean; style?: React.CSSProperties }
  ) => React.ReactNode;
  index?: number;
  className?: string;
  style?: React.CSSProperties;
  isRowLocked?: boolean; // NUEVO
}

// Estado global para expandir/retraer todas las celdas de fecha
declare global {
  interface Window {
    __fechaColExpand: boolean;
    __fechaColExpandListeners: Set<() => void>;
  }
}
if (typeof window !== 'undefined') {
  window.__fechaColExpand = window.__fechaColExpand ?? false;
  window.__fechaColExpandListeners =
    window.__fechaColExpandListeners ?? new Set();
}

const TransactionTableCell: React.FC<TransactionTableCellProps> = React.memo(
  ({
    row,
    field,
    type = 'text',
    renderInput,
    className,
    style,
    isRowLocked,
  }) => {
    const isFecha = field === 'fecha';
    // Solo lee el estado global, no lo cambia aquí
    const [expanded, setExpanded] = useState(
      typeof window !== 'undefined' ? window.__fechaColExpand : false
    );

    useEffect(() => {
      if (!isFecha) return;
      const update = () => setExpanded(window.__fechaColExpand);
      window.__fechaColExpandListeners.add(update);
      setExpanded(window.__fechaColExpand);
      return () => {
        window.__fechaColExpandListeners.delete(update);
      };
    }, [isFecha]);

    const fechaCellClasses = isFecha
      ? expanded
        ? 'table-cell whitespace-nowrap pl-2 transition-all duration-200 min-w-[120px] max-w-[180px] w-[140px] overflow-visible'
        : 'table-cell whitespace-nowrap pl-2 transition-all duration-200 min-w-[32px] max-w-[32px] w-[32px] overflow-hidden text-center'
      : (className ?? 'table-cell whitespace-nowrap');

    // Si es la columna creador, solo mostrar el valor
    if (field === 'createdByInitial') {
      return (
        <td
          className={className ?? 'table-cell whitespace-nowrap'}
          style={style}
        >
          <span className="font-bold text-purple-700">
            {row.createdByInitial ?? ''}
          </span>
        </td>
      );
    }

    // NUEVO: Si la fila está bloqueada, aplica cursor not-allowed y deshabilita el input
    const cellStyle: React.CSSProperties = {
      ...(style ?? {}),
      ...(isRowLocked ? { cursor: 'not-allowed', pointerEvents: 'auto' } : {}),
    };

    return (
      <td className={fechaCellClasses} style={cellStyle}>
        {isFecha ? (
          expanded ? (
            <div className="flex w-full items-center gap-2">
              <div className="flex-1">
                {renderInput(
                  row,
                  field,
                  type,
                  isRowLocked
                    ? { disabled: true, style: { cursor: 'not-allowed' } }
                    : undefined
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Calendar size={20} className="text-gray-500" />
            </div>
          )
        ) : (
          <div className="w-full truncate overflow-hidden">
            {renderInput(
              row,
              field,
              type,
              isRowLocked
                ? { disabled: true, style: { cursor: 'not-allowed' } }
                : undefined
            )}
          </div>
        )}
      </td>
    );
  }
);

export default TransactionTableCell;
