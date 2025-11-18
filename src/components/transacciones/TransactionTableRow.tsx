import React from 'react';

import { formatCurrency } from '~/utils/numberFormat';

import TransactionTableCell from './TransactionTableCell';
import {
  generateDynamicColorStyle,
  getEmitidoPorStyleAndClass,
} from './TransactionTableInputs';

import type { TransactionRecord } from '~/types';

export type InputValue = string | number | boolean | Date | null;
export type InputType = 'text' | 'number' | 'date' | 'checkbox';

interface TransactionTableRowProps {
  row: TransactionRecord;
  _editValues?: Partial<TransactionRecord>;
  isDeleteMode: boolean;
  isAsesorSelectionMode: boolean;
  _selectedRows: Set<string>;
  rowsToDelete: Set<string>;
  _selectedAsesores?: Set<string>;
  handleInputChange: (
    id: string,
    field: keyof TransactionRecord,
    value: InputValue
  ) => void;
  _handleRowSelect: (id: string, precioNeto: number) => void;
  handleDeleteSelect: (id: string) => void;
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
  _getEmitidoPorClass: (emitidoPor: string) => string;
  getTramiteColorClass?: (tramite: string) => string;
  coloresOptions?: { nombre: string; valor: string; intensidad: number }[];
  tramiteOptions?: { nombre: string; color?: string }[];
  emitidoPorWithColors?: { nombre: string; color?: string }[];
  onDeleteAsesorAction?: (nombre: string) => void;
  userRole?: 'admin' | 'empleado'; // NUEVO
  // onDeleteRow?: (id: string) => Promise<void>; // NUEVO
}

const TransactionTableRow: React.FC<TransactionTableRowProps> = React.memo(
  ({
    row,
    isDeleteMode,
    isAsesorSelectionMode: _isAsesorSelectionMode,
    _selectedRows,
    rowsToDelete,
    _selectedAsesores,
    handleInputChange: _handleInputChange,
    _handleRowSelect,
    handleDeleteSelect,
    renderCheckbox,
    renderAsesorSelect: _renderAsesorSelect,
    renderInput,
    _getEmitidoPorClass,
    getTramiteColorClass,
    coloresOptions = [],
    tramiteOptions = [],
    emitidoPorWithColors = [],
    onDeleteAsesorAction: _onDeleteAsesorAction,
    userRole,
    // onDeleteRow,
  }) => {
    // Determinar clase/estilo final de fila:
    // - Si está pagado: pintar toda la fila con el color de emitidoPor (dinámico si existe, si no el estático)
    // - Si NO está pagado: usar color de trámite (si aplica y está configurado)
    const getRowClassAndStyle = () => {
      // If the row is pagado, prefer keeping the tramite color when the tramite
      // is NOT SOAT and a tramite color exists. Otherwise fall back to emitidoPor coloring.
      if (row.pagado) {
        const tram = typeof row.tramite === 'string' ? row.tramite : '';
        if (tram.toUpperCase() !== 'SOAT') {
          const dynamicStyle = generateDynamicColorStyle(
            tram,
            tramiteOptions,
            coloresOptions
          );
          const tramiteClass = getTramiteColorClass
            ? getTramiteColorClass(tram)
            : '';
          // If we have a tramite color/class, use it even when pagado
          if (
            (dynamicStyle && Object.keys(dynamicStyle).length > 0) ||
            tramiteClass
          ) {
            return { className: tramiteClass, style: dynamicStyle };
          }
        }

        // Fallback: use emitidoPor coloring when no tramite color is present
        const { className, style } = getEmitidoPorStyleAndClass(
          row.emitidoPor ?? '',
          true,
          emitidoPorWithColors,
          coloresOptions
        );
        return { className, style };
      }

      // No pagado: colores por trámite (no SOAT)
      const tram = typeof row.tramite === 'string' ? row.tramite : '';
      const dynamicStyle = generateDynamicColorStyle(
        tram,
        tramiteOptions,
        coloresOptions
      );
      const className = getTramiteColorClass ? getTramiteColorClass(tram) : '';
      return { className, style: dynamicStyle };
    };

    const { className: rowClass, style: rowStyle } = getRowClassAndStyle();

    const isRowLocked =
      userRole === 'empleado' && row.boleta === true && row.pagado === true;

    return (
      <tr
        className={`group border-b hover:bg-gray-50 ${rowClass}`}
        style={rowStyle}
        data-placa={(row.placa ? String(row.placa) : '').toUpperCase()}
      >
        {/* Eliminar */}
        {isDeleteMode ? (
          <td className="table-cell h-full border-r border-gray-600 px-0.5 py-0.5">
            <div className="flex h-full items-center justify-center">
              <input
                type="checkbox"
                checked={rowsToDelete.has(row.id)}
                onChange={() => handleDeleteSelect(row.id)}
                className="h-4 w-4 rounded border-gray-600"
                disabled={isRowLocked}
                style={isRowLocked ? { cursor: 'not-allowed' } : undefined}
              />
            </div>
          </td>
        ) : null}
        {/* Creador */}
        <td className="table-cell text-center font-bold whitespace-nowrap text-purple-700">
          {row.createdByInitial ?? ''}
        </td>
        <TransactionTableCell
          row={row}
          field="fecha"
          type="date"
          renderInput={renderInput}
          index={0}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="tramite"
          renderInput={renderInput}
          index={1}
          isRowLocked={isRowLocked}
        />
        {/* Boleta */}
        <td className="table-checkbox-cell whitespace-nowrap">
          <div className="table-checkbox-wrapper">
            {renderCheckbox(
              row.id,
              'boleta',
              _selectedRows.has(row.id),
              isRowLocked
            )}
          </div>
        </td>
        {/* Pagado */}
        <td className="table-checkbox-cell whitespace-nowrap">
          <div className="table-checkbox-wrapper">
            {renderCheckbox(row.id, 'pagado', !!row.pagado, isRowLocked)}
          </div>
        </td>
        <TransactionTableCell
          row={row}
          field="boletasRegistradas"
          type="number"
          renderInput={renderInput}
          index={4}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="emitidoPor"
          renderInput={renderInput}
          index={5}
          className="table-cell whitespace-nowrap"
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="placa"
          renderInput={renderInput}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="tipoDocumento"
          renderInput={renderInput}
          index={7}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="numeroDocumento"
          renderInput={renderInput}
          index={8}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="nombre"
          renderInput={renderInput}
          index={9}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="cilindraje"
          type="number"
          renderInput={renderInput}
          index={10}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="tipoVehiculo"
          renderInput={renderInput}
          index={11}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="celular"
          renderInput={renderInput}
          index={12}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="ciudad"
          renderInput={renderInput}
          index={13}
          isRowLocked={isRowLocked}
        />
        {/* Asesor: si está en modo selección por asesor, usa el renderAsesorSelect */}
        {_isAsesorSelectionMode ? (
          <td className="table-cell whitespace-nowrap">
            {_renderAsesorSelect(row)}
          </td>
        ) : (
          <TransactionTableCell
            row={row}
            field="asesor"
            renderInput={(rowArg, fieldArg, typeArg) =>
              renderInput(rowArg, fieldArg, typeArg)
            }
            isRowLocked={isRowLocked}
          />
        )}
        <TransactionTableCell
          row={row}
          field="novedad"
          renderInput={renderInput}
          index={15}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="precioNeto"
          type="number"
          renderInput={renderInput}
          index={16}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="tarifaServicio"
          type="number"
          renderInput={renderInput}
          index={17}
          isRowLocked={isRowLocked}
        />
        {/* Columna N+T (Neto + Tarifa) - Solo lectura, sin edición */}
        <td className="table-cell whitespace-nowrap">
          <div className="relative flex items-center justify-center">
            <span className="table-numeric-field flex w-[80px] items-center justify-center text-center text-[10px] font-medium text-green-800">
              ${' '}
              {formatCurrency(
                Number(row.precioNeto ?? 0) + Number(row.tarifaServicio ?? 0)
              )}
            </span>
          </div>
        </td>
        <td className="table-checkbox-cell whitespace-nowrap">
          <div className="table-checkbox-wrapper">
            {renderCheckbox(
              row.id,
              'comisionExtra',
              row.comisionExtra,
              isRowLocked
            )}
          </div>
        </td>
        <TransactionTableCell
          row={row}
          field="impuesto4x1000"
          type="number"
          renderInput={renderInput}
          index={19}
          isRowLocked={isRowLocked}
        />
        <TransactionTableCell
          row={row}
          field="gananciaBruta"
          type="number"
          renderInput={renderInput}
          index={20}
          isRowLocked={isRowLocked}
        />
        <td className="table-checkbox-cell whitespace-nowrap">
          <div className="table-checkbox-wrapper">
            {renderCheckbox(row.id, 'rappi', row.rappi, isRowLocked)}
          </div>
        </td>
        <TransactionTableCell
          row={row}
          field="observaciones"
          renderInput={renderInput}
          isRowLocked={isRowLocked}
        />
        {/* Botón eliminar fila (discreto, visible al hacer hover) */}
        {/* Eliminado: Botón eliminar fila (basurita) */}
      </tr>
    );
  }
);

export default TransactionTableRow;
