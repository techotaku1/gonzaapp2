'use client';

import { TransactionRecord } from '~/types';
import { fromDatetimeLocalStringToColombiaDate } from '~/utils/dateUtils';
import { calculateFormulas } from '~/utils/formulas';
import { formatCurrency } from '~/utils/numberFormat';
import { type VehicleType, vehicleTypes } from '~/utils/soatPricing';

import { AsesorSelect } from './AsesorSelect';

import type { InputType, InputValue } from './TransactionTableRow';

export const tipoVehiculoOptions = vehicleTypes;

function getWidth(field: keyof TransactionRecord) {
  switch (field) {
    case 'impuesto4x1000':
      return 'w-[70px]';
    case 'gananciaBruta':
      return 'w-[90px]';
    case 'novedad':
      return 'w-[100px]';
    case 'precioNeto':
    case 'tarifaServicio':
      return 'w-[80px]';
    case 'tipoVehiculo':
      return 'w-[90px]';
    case 'boletasRegistradas':
      return 'w-[100px]';
    case 'placa':
      return 'w-[80px]';
    case 'nombre':
    case 'observaciones':
      return 'w-[100px]';
    case 'tramite':
      return 'w-[70px]';
    case 'emitidoPor':
      return 'w-[70px]';
    case 'ciudad':
      return 'w-[70px]';
    case 'asesor':
      return 'w-[100px]';
    case 'tipoDocumento':
      return 'w-[70px]';
    case 'fecha':
      return 'w-[60px]';
    case 'numeroDocumento':
    case 'celular':
      return 'w-[65px]';
    case 'cilindraje':
      return 'w-[50px]';
    default:
      return 'w-[50px]';
  }
}

export const getEmitidoPorClass = (value: string): string => {
  // Restore the color mapping for static styling
  const emitidoPorClassMap: Record<string, string> = {
    'SOAT EXPRESS': 'bg-pink-300',
    EDUARDO: 'bg-blue-300',
    'MUNDI SEGUROS': 'bg-yellow-300',
    LIBERTY: 'bg-green-300',
    'AXA COLPATRIA': 'bg-purple-300',
    'SEGUROS MUNDIAL': 'bg-orange-300',
    'SEGUROS BOLIVAR': 'bg-red-300',
    'SEGUROS DEL ESTADO': 'bg-indigo-300',
    MAPFRE: 'bg-teal-300',
    SBS: 'bg-cyan-300',
    SURA: 'bg-green-200',
    PREVISORA: 'bg-blue-200',
    EQUIDAD: 'bg-red-200',
    ALLIANZ: 'bg-yellow-200',
    HDI: 'bg-purple-200',
    SOLIDARIA: 'bg-gray-300',
  };

  return emitidoPorClassMap[value] || '';
};

// Nueva función para obtener clase de color por trámite - ACTUALIZADA
export const getTramiteColorClass = (
  tramite: string,
  tramiteOptions: { nombre: string; color?: string }[],
  coloresOptions: { nombre: string; valor: string; intensidad: number }[] = []
): string => {
  // Solo aplicar color si NO es SOAT (SOAT usa emitidoPor solo cuando está pagado)
  if (tramite.toUpperCase() === 'SOAT') {
    return '';
  }

  const tramiteRecord = tramiteOptions.find((t) => t.nombre === tramite);
  if (!tramiteRecord?.color) {
    return '';
  }

  // Buscar el color en la tabla de colores
  const colorRecord = coloresOptions.find(
    (c) => c.nombre === tramiteRecord.color
  );

  if (colorRecord) {
    // Crear estilo dinámico basado en la tabla de colores
    return `tramite-dynamic-color`;
  }

  // Fallback a los colores predefinidos
  const colorMap: Record<string, string> = {
    red: 'tramite-color-red',
    blue: 'tramite-color-blue',
    green: 'tramite-color-green',
    yellow: 'tramite-color-yellow',
    purple: 'tramite-color-purple',
    orange: 'tramite-color-orange',
    pink: 'tramite-color-pink',
    gray: 'tramite-color-gray',
    indigo: 'tramite-color-indigo',
    teal: 'tramite-color-teal',
    cyan: 'tramite-color-cyan',
    lime: 'tramite-color-lime',
  };

  return colorMap[tramiteRecord.color.toLowerCase()] || '';
};

// Nueva función para generar estilos dinámicos - ACTUALIZADA
export const generateDynamicColorStyle = (
  tramite: string,
  tramiteOptions: { nombre: string; color?: string }[],
  coloresOptions: { nombre: string; valor: string; intensidad: number }[] = []
): React.CSSProperties => {
  // Solo aplicar color si NO es SOAT (SOAT usa emitidoPor solo cuando está pagado)
  if (tramite.toUpperCase() === 'SOAT') {
    return {};
  }

  const tramiteRecord = tramiteOptions.find((t) => t.nombre === tramite);
  if (!tramiteRecord?.color) {
    return {};
  }

  const colorRecord = coloresOptions.find(
    (c) => c.nombre === tramiteRecord.color
  );
  if (!colorRecord) {
    return {};
  }

  // Crear el estilo CSS dinámico SOLO para el background
  const opacity = Math.min(colorRecord.intensidad / 1000, 0.8); // Convertir intensidad a opacidad

  return {
    backgroundColor: `color-mix(in oklch, ${colorRecord.valor} ${opacity * 100}%, transparent)`,
    // ELIMINADO: No cambiar el color del texto ni otros estilos
    // Solo aplicar el background color, manteniendo todos los demás estilos originales
  };
};

// Nueva función para generar estilos dinámicos de emitidoPor
export const generateEmitidoPorDynamicColorStyle = (
  emitidoPor: string,
  pagado: boolean,
  emitidoPorWithColors: { nombre: string; color?: string }[],
  coloresOptions: { nombre: string; valor: string; intensidad: number }[] = []
): React.CSSProperties => {
  const emitidoPorRecord = emitidoPorWithColors.find(
    (e) => e.nombre === emitidoPor
  );
  if (!emitidoPorRecord?.color) return {};

  // Aceptar cualquier coincidencia de color, sin filtrar por intensidad exacta
  const colorRecord =
    coloresOptions.find((c) => c.nombre === emitidoPorRecord.color) ?? null;
  if (!colorRecord) return {};

  if (pagado) {
    // Pintar toda la fila cuando está pagado
    const opacity = 0.3; // Opacidad base
    return {
      backgroundColor: `color-mix(in oklch, ${colorRecord.valor} ${opacity * 100}%, transparent)`,
    };
  }
  return {};
};

// Nueva función para generar estilos del SELECT interno de emitidoPor
export const generateEmitidoPorSelectStyle = (
  emitidoPor: string,
  pagado: boolean,
  emitidoPorWithColors: { nombre: string; color?: string }[],
  coloresOptions: { nombre: string; valor: string; intensidad: number }[] = []
): React.CSSProperties => {
  if (pagado) return {};
  const emitidoPorRecord = emitidoPorWithColors.find(
    (e) => e.nombre === emitidoPor
  );
  if (!emitidoPorRecord?.color) return {};

  const colorRecord =
    coloresOptions.find((c) => c.nombre === emitidoPorRecord.color) ?? null;
  if (!colorRecord) return {};

  const opacity = 0.3;
  return {
    backgroundColor: `color-mix(in oklch, ${colorRecord.valor} ${opacity * 100}%, transparent)`,
  };
};

// Actualizar la función para determinar si usar estilo estático o dinámico
export const getEmitidoPorStyleAndClass = (
  emitidoPor: string,
  pagado: boolean,
  emitidoPorWithColors: { nombre: string; color?: string }[],
  coloresOptions: { nombre: string; valor: string; intensidad: number }[] = []
): { className: string; style: React.CSSProperties } => {
  const hasDynamicColor = emitidoPorWithColors.some(
    (e) => e.nombre === emitidoPor && !!e.color
  );

  if (hasDynamicColor) {
    return {
      className: '',
      style: generateEmitidoPorDynamicColorStyle(
        emitidoPor,
        pagado,
        emitidoPorWithColors,
        coloresOptions
      ),
    };
  }
  return {
    className: pagado ? getEmitidoPorClass(emitidoPor) : '',
    style: {},
  };
};

export function useTransactionTableInputs({
  editValues,
  handleInputChangeAction,
  formatCurrencyAction: _formatCurrencyAction,
  parseNumberAction,
  asesores,
  onAddAsesorAction,
  onAddTramiteAction: _onAddTramiteAction,
  onAddNovedadAction,
  onAddEmitidoPorAction,
  tramiteOptions,
  novedadOptions,
  emitidoPorOptions,
  coloresOptions = [],
  onOpenColorPickerAction,
  onOpenEmitidoPorColorPickerAction,
  emitidoPorWithColors = [],
  onDeleteAsesorAction, // NUEVO
  userRole, // NUEVO
}: {
  editValues: Record<string, Partial<TransactionRecord>>;
  handleInputChangeAction: (
    id: string,
    field: keyof TransactionRecord,
    value: InputValue
  ) => void;
  formatCurrencyAction: (v: number) => string;
  parseNumberAction: (v: string) => number;
  asesores: string[];
  onAddAsesorAction: (nombre: string) => Promise<void>;
  onAddTramiteAction?: (nombre: string, color?: string) => Promise<void>;
  onAddNovedadAction?: (nombre: string) => Promise<void>;
  onAddEmitidoPorAction?: (nombre: string) => Promise<void>;
  tramiteOptions: { nombre: string; color?: string }[];
  novedadOptions: string[];
  emitidoPorOptions: string[];
  coloresOptions?: { nombre: string; valor: string; intensidad: number }[];
  onOpenColorPickerAction?: (rowId: string) => void;
  onOpenEmitidoPorColorPickerAction?: (rowId: string) => void;
  emitidoPorWithColors?: { nombre: string; color?: string }[];
  onDeleteAsesorAction?: (nombre: string) => void;
  userRole?: 'admin' | 'empleado'; // NUEVO
}) {
  // Helper: obtiene SIEMPRE el valor local editado si existe, si no el remoto
  const getCellValue = (
    row: TransactionRecord,
    field: keyof TransactionRecord
  ) => {
    if (
      editValues[row.id] &&
      Object.prototype.hasOwnProperty.call(editValues[row.id], field)
    ) {
      return editValues[row.id][field];
    }
    return row[field];
  };

  const renderInput = (
    row: TransactionRecord,
    field: keyof TransactionRecord,
    type: InputType = 'text',
    extraProps?: { disabled?: boolean; style?: React.CSSProperties }
  ) => {
    // SIEMPRE usa el valor local editado si existe
    const value = getCellValue(row, field);
    const isMoneyField = [
      'precioNeto',
      'tarifaServicio',
      'impuesto4x1000',
      'gananciaBruta',
      'boletasRegistradas',
    ].includes(field as string);

    // Para mostrar valores ajustados en tiempo real
    let adjustedValue = value;
    if (
      field === 'precioNeto' ||
      field === 'tarifaServicio' ||
      field === 'impuesto4x1000' ||
      field === 'gananciaBruta'
    ) {
      const editedRow = { ...row, ...(editValues[row.id] || {}) };
      const formulas = calculateFormulas(editedRow);
      if (field === 'precioNeto') adjustedValue = formulas.precioNetoAjustado;
      if (field === 'tarifaServicio')
        adjustedValue = formulas.tarifaServicioAjustada;
      if (field === 'impuesto4x1000') adjustedValue = formulas.impuesto4x1000;
      if (field === 'gananciaBruta') adjustedValue = formulas.gananciaBruta;
    }

    // formatValue ahora es función local y tiene acceso a field/isMoneyField
    const formatValue = (val: unknown): string => {
      if (val === null || val === undefined) {
        return '';
      }
      if (field === 'fecha' && val instanceof Date) {
        try {
          const date = val;
          return date.toISOString().slice(0, 16);
        } catch (error) {
          console.error('Error formatting date:', error);
          return '';
        }
      }
      // Cilindraje: solo número, sin formato de moneda
      if (field === 'cilindraje' && typeof val === 'number') {
        return String(val);
      }
      // Formatea campos monetarios correctamente
      if (isMoneyField && typeof val === 'number') {
        // Asegura que no tenga decimales extra
        return `$ ${formatCurrency(Math.round(val))}`;
      }
      switch (typeof val) {
        case 'string':
          return val;
        case 'number':
          return String(val);
        case 'boolean':
          return String(val);
        default:
          return '';
      }
    };

    // En la sección donde se renderiza el select de emitidoPor:
    if (field === 'emitidoPor') {
      // Verificar si el trámite es SOAT
      const isSoat = row.tramite?.toUpperCase() === 'SOAT';

      // Generar estilo dinámico para el select interno
      const selectStyle = isSoat
        ? generateEmitidoPorSelectStyle(
            row.emitidoPor,
            row.pagado,
            emitidoPorWithColors,
            coloresOptions
          )
        : { backgroundColor: '#6B7280', color: 'white' }; // Gris para NO APLICA

      // Fix: Only one getOptionStyle function with explicit white background for items without color
      const getOptionStyle = (emitidoPorName: string) => {
        // Si no es SOAT y es la opción NO APLICA, aplicar estilo gris
        if (!isSoat && emitidoPorName === 'NO APLICA') {
          return { backgroundColor: '#6B7280', color: 'white' };
        }

        // Find the specific emitidoPor item by name
        const emitidoPorItem = emitidoPorWithColors.find(
          (item) => item.nombre === emitidoPorName
        );

        // If item doesn't exist or doesn't have a color, explicitly set white background
        if (!emitidoPorItem?.color) {
          return { backgroundColor: 'white' };
        }

        // Find the color record for this specific item
        const colorRecord = coloresOptions.find(
          (c) => c.nombre === emitidoPorItem.color && c.intensidad === 300
        );

        if (!colorRecord) return { backgroundColor: 'white' };

        const opacity = 0.3;
        return {
          backgroundColor: `color-mix(in oklch, ${colorRecord.valor} ${opacity * 100}%, transparent)`,
        };
      };

      // Si el trámite no es SOAT, forzar el valor a "NO APLICA"
      if (!isSoat && value !== 'NO APLICA') {
        // Esto actualiza automáticamente el valor en el backend
        setTimeout(() => {
          handleInputChangeAction(row.id, field, 'NO APLICA');
        }, 0);
      }

      return (
        <select
          value={!isSoat ? 'NO APLICA' : (value as string)}
          onChange={(e) => {
            if (extraProps?.disabled) return;
            if (e.target.value === '__add_new__') {
              if (onOpenEmitidoPorColorPickerAction) {
                onOpenEmitidoPorColorPickerAction(row.id);
              } else if (onAddEmitidoPorAction) {
                const nombre = prompt(
                  'Ingrese el nuevo valor para "Emitido Por":'
                );
                if (nombre && nombre.trim().length > 0) {
                  onAddEmitidoPorAction(nombre.trim()).then(() => {
                    handleInputChangeAction(row.id, field, nombre.trim());
                  });
                }
              }
            } else {
              handleInputChangeAction(row.id, field, e.target.value);
            }
          }}
          className={`table-select-base w-[105px] rounded border`}
          style={{ ...selectStyle, ...(extraProps?.style ?? {}) }}
          title={isSoat ? (value as string) : 'NO APLICA'}
          disabled={extraProps?.disabled ?? !isSoat}
        >
          <option value="">Seleccionar...</option>
          {emitidoPorOptions.map((option) => (
            <option
              key={option}
              value={option}
              className="text-center"
              style={getOptionStyle(option)}
            >
              {option}
            </option>
          ))}
          {isSoat && (
            <option value="__add_new__" className="font-bold text-green-700">
              Agregar nuevo emitido por... ➕
            </option>
          )}
        </select>
      );
    }

    // Modificar la sección del renderInput donde se maneja el campo fecha
    if (field === 'fecha') {
      // Asegura el formato correcto para datetime-local: 'YYYY-MM-DDTHH:mm'
      let dateValue = '';
      if (value instanceof Date && !isNaN(value.getTime())) {
        // --- CORREGIDO: Usa los componentes UTC para mostrar la hora que el usuario editó ---
        const pad = (n: number) => n.toString().padStart(2, '0');
        dateValue = `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}T${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`;
      } else if (typeof value === 'string' && value) {
        // Si ya es string, intenta usar los primeros 16 caracteres
        dateValue = value.slice(0, 16);
      }
      return (
        <div className="relative flex w-full items-center justify-center">
          <input
            type="datetime-local"
            value={dateValue}
            onChange={(e) => {
              if (extraProps?.disabled) return;
              try {
                // El valor del input es 'YYYY-MM-DDTHH:mm'
                // --- CORREGIDO: convierte a fecha en zona horaria de Colombia ---
                const inputDate = fromDatetimeLocalStringToColombiaDate(
                  e.target.value
                );
                handleInputChangeAction(row.id, field, inputDate);
              } catch (error) {
                console.error('Error converting date:', error);
              }
            }}
            className="table-date-field flex w-[140px] cursor-pointer items-center justify-center rounded border px-0 py-0.5 text-center text-[10px]"
            disabled={extraProps?.disabled}
            style={extraProps?.style}
          />
        </div>
      );
    }

    // Corregir renderPlacaInput para evitar errores TS y duplicidad
    const renderPlacaInput = () => (
      <div className="relative flex items-center">
        <input
          type="text"
          value={formatValue(value)}
          title={formatValue(value)}
          onChange={(e) =>
            !extraProps?.disabled &&
            handleInputChangeAction(row.id, field, e.target.value.toUpperCase())
          }
          className="placa-field w-[80px] cursor-pointer overflow-hidden rounded border bg-yellow-500 hover:overflow-visible hover:text-clip"
          disabled={extraProps?.disabled}
          style={extraProps?.style}
        />
      </div>
    );
    if (field === ('placa' as keyof TransactionRecord)) {
      return renderPlacaInput();
    }

    // Update all select elements to use the new base class
    if (field === 'tipoDocumento') {
      return (
        <select
          value={value as string}
          onChange={(e) =>
            !extraProps?.disabled &&
            handleInputChangeAction(row.id, field, e.target.value)
          }
          className="table-select-base w-[70px] rounded border border-gray-600"
          title={value as string}
          disabled={extraProps?.disabled}
          style={extraProps?.style}
        >
          <option value="">-</option>
          {['CC', 'NIT', 'TI', 'CE', 'PAS'].map((option) => (
            <option key={option} value={option} className="text-center">
              {option}
            </option>
          ))}
        </select>
      );
    }

    // Add this before the return statement:
    if (field === 'tramite') {
      // Función para obtener estilo de una opción específica de trámite
      const getTramiteOptionStyle = (tramiteName: string) => {
        // Solo aplicar si NO es SOAT
        if (tramiteName.toUpperCase() === 'SOAT') return {};

        const tramiteRecord = tramiteOptions.find(
          (t) => t.nombre === tramiteName
        );
        if (!tramiteRecord?.color) return {};

        const colorRecord = coloresOptions.find(
          (c) => c.nombre === tramiteRecord.color && c.intensidad === 500
        );
        if (!colorRecord) return {};

        const opacity = Math.min(colorRecord.intensidad / 1000, 0.8);
        return {
          backgroundColor: `color-mix(in oklch, ${colorRecord.valor} ${opacity * 100}%, transparent)`,
        };
      };

      return (
        <select
          value={value as string}
          onChange={(e) => {
            if (extraProps?.disabled) return;
            if (e.target.value === '__add_new__') {
              if (onOpenColorPickerAction) {
                onOpenColorPickerAction(row.id);
              }
            } else {
              handleInputChangeAction(row.id, field, e.target.value);
            }
          }}
          className="table-select-base w-[70px] rounded border border-gray-600"
          title={value as string}
          disabled={extraProps?.disabled}
          style={extraProps?.style}
        >
          {tramiteOptions.map((option) => (
            <option
              key={typeof option === 'string' ? option : option.nombre}
              value={typeof option === 'string' ? option : option.nombre}
              className="text-center"
              style={getTramiteOptionStyle(
                typeof option === 'string' ? option : option.nombre
              )}
            >
              {typeof option === 'string' ? option : option.nombre}
            </option>
          ))}
          <option value="__add_new__" className="font-bold text-blue-700">
            Agregar nuevo trámite... ➕
          </option>
        </select>
      );
    }

    // Inside renderInput function, add these conditions before the final return:
    if (field === 'tipoVehiculo') {
      // Si el valor guardado no está en las opciones, lo agrega temporalmente para mostrarlo seleccionado
      const valueStr = value ? String(value) : '';
      const options: readonly string[] = tipoVehiculoOptions.includes(
        valueStr as VehicleType
      )
        ? tipoVehiculoOptions
        : valueStr && valueStr !== ''
          ? [...tipoVehiculoOptions, valueStr]
          : tipoVehiculoOptions;
      return (
        <select
          value={valueStr}
          onChange={(e) =>
            !extraProps?.disabled &&
            handleInputChangeAction(row.id, field, e.target.value || null)
          }
          className="table-select-base w-[150px] rounded border border-gray-600"
          title={valueStr}
          disabled={extraProps?.disabled}
          style={extraProps?.style}
        >
          <option value="">Seleccionar...</option>
          {options.map((option) => (
            <option
              key={option}
              value={option}
              className="text-center"
              title={option}
            >
              {option}
            </option>
          ))}
        </select>
      );
    }
    if (field === 'novedad') {
      return (
        <select
          value={(value as string) || ''}
          onChange={async (e) => {
            if (extraProps?.disabled) return;
            if (e.target.value === '__add_new__') {
              if (onAddNovedadAction) {
                const nombre = prompt('Ingrese la nueva novedad:');
                if (nombre && nombre.trim().length > 0) {
                  await onAddNovedadAction(nombre.trim());
                  handleInputChangeAction(row.id, field, nombre.trim());
                }
              }
            } else {
              handleInputChangeAction(row.id, field, e.target.value);
            }
          }}
          className="table-select-base w-[120px] rounded border border-gray-600"
          title={value as string}
          disabled={extraProps?.disabled}
          style={extraProps?.style}
        >
          <option value="">Seleccionar...</option>
          {novedadOptions.map((option) => (
            <option
              key={option}
              value={option}
              className="text-center"
              title={option} // Añadir título también a las opciones
            >
              {option}
            </option>
          ))}
          <option value="__add_new__" className="font-bold text-blue-700">
            Agregar nueva novedad... ➕
          </option>
        </select>
      );
    }

    // Usar adjustedValue en vez de value en los inputs de dinero
    if (
      field === 'precioNeto' ||
      field === 'tarifaServicio' ||
      field === 'impuesto4x1000' ||
      field === 'gananciaBruta' ||
      field === 'boletasRegistradas'
    ) {
      return (
        <div className={`relative flex items-center`}>
          <input
            type="text"
            value={formatValue(adjustedValue)}
            title={formatValue(adjustedValue)}
            onChange={(e) => {
              if (extraProps?.disabled) return;
              const newValue: InputValue = parseNumberAction(e.target.value);
              handleInputChangeAction(row.id, field, newValue);
            }}
            className={`flex items-center justify-center overflow-hidden rounded border px-0.5 py-0.5 text-center text-[10px] text-ellipsis ${getWidth(field)} table-numeric-field hover:overflow-visible hover:text-clip`}
            disabled={extraProps?.disabled}
            style={extraProps?.style}
          />
        </div>
      );
    }

    // Usa AsesorSelect como input para el campo asesor
    if (field === 'asesor') {
      // Solo para empleados y cuando boleta y pagado están en true, NO permitir modificar el select (pero sin cambiar el estilo)
      const isEmpleadoLocked =
        userRole === 'empleado' && row.boleta === true && row.pagado === true;

      if (isEmpleadoLocked) {
        // Bloquea cambios y fuerza el cursor prohibido en todo el select
        return (
          <div
            style={{
              cursor: 'not-allowed',
              pointerEvents: 'auto',
              width: '100%',
              display: 'flex',
            }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => e.preventDefault()}
          >
            <div style={{ width: '100%', pointerEvents: 'none' }}>
              <AsesorSelect
                value={String(value ?? '')}
                onChange={() => {
                  // No permitir cambios
                }}
                asesores={asesores}
                onAddAsesorAction={async () => Promise.resolve()}
                className="border-purple-400 bg-purple-200 text-purple-700"
              />
            </div>
          </div>
        );
      }
      // Para admin o fila editable, muestra el AsesorSelect normal
      return (
        <AsesorSelect
          value={String(value ?? '')}
          onChange={(newValue: string) => {
            if (extraProps?.disabled) return;
            if (newValue === '__add_new__') {
              const nombre = prompt('Ingrese el nuevo asesor:');
              if (nombre && nombre.trim().length > 0) {
                onAddAsesorAction(nombre.trim()).then(() => {
                  handleInputChangeAction(row.id, 'asesor', nombre.trim());
                });
              }
            } else {
              handleInputChangeAction(row.id, 'asesor', newValue);
            }
          }}
          asesores={asesores}
          onAddAsesorAction={onAddAsesorAction}
          {...(onDeleteAsesorAction && {
            onDeleteAsesorAction: (nombre: string) => {
              const result = onDeleteAsesorAction(nombre);
              return typeof result === 'object' &&
                result !== null &&
                typeof (result as Promise<void>).then === 'function'
                ? (result as Promise<void>)
                : Promise.resolve();
            },
          })}
          className="border-purple-400 bg-purple-200 text-purple-700"
        />
      );
    }

    return (
      <div className={`relative ${isMoneyField ? 'flex items-center' : ''}`}>
        <input
          // ...existing code...
          value={(() => {
            const v = getCellValue(row, field);
            if (isMoneyField && typeof v === 'number') return v;
            if (typeof v === 'boolean') return v ? '1' : '';
            // --- Permite mostrar string vacío si el valor es null/undefined ---
            if (v === null || typeof v === 'undefined') return '';
            return v as string | number;
          })()}
          title={formatValue(value)}
          onChange={(e) => {
            if (extraProps?.disabled) return;
            let newValue: InputValue;
            if (field === 'cilindraje') {
              newValue =
                e.target.value === ''
                  ? null
                  : parseNumberAction(e.target.value);
            } else if (field === 'numeroDocumento' || field === 'celular') {
              const onlyNumbers = e.target.value.replace(/[^\d]/g, '');
              newValue = onlyNumbers === '' ? null : onlyNumbers;
            } else if (isMoneyField) {
              newValue =
                e.target.value === '' ? 0 : parseNumberAction(e.target.value);
            } else if (type === 'checkbox') {
              newValue = e.target.checked;
            } else if (type === 'number') {
              newValue = e.target.value ? Number(e.target.value) : null;
            } else {
              newValue = e.target.value === '' ? null : e.target.value;
            }
            handleInputChangeAction(row.id, field, newValue);
          }}
          className={`$${
            type === 'checkbox'
              ? 'h-3 w-3 rounded border-gray-600'
              : `flex items-center justify-center overflow-hidden rounded border px-0.5 py-0.5 text-center text-[10px] text-ellipsis ${getWidth(field)} ${
                  field === 'cilindraje'
                    ? '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                    : ''
                } ${
                  field === 'placa'
                    ? 'table-text-field h-[1.5rem] leading-[1.5rem] uppercase'
                    : type === 'number' || isMoneyField
                      ? 'table-numeric-field'
                      : 'table-text-field'
                } hover:overflow-visible hover:text-clip`
          }`}
          inputMode={
            field === 'numeroDocumento' || field === 'celular'
              ? 'numeric'
              : undefined
          }
          pattern={
            field === 'numeroDocumento' || field === 'celular'
              ? '\\d*'
              : undefined
          }
          disabled={extraProps?.disabled}
          style={extraProps?.style}
        />
      </div>
    );
  };

  return {
    renderInput,
  };
}
