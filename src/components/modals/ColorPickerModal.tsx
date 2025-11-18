'use client';

import React, { useState } from 'react';

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tramiteName: string, selectedColor?: string) => void;
  onDelete?: (tramiteName: string) => void;
  onUpdate?: (tramiteName: string, newColor?: string) => void; // Nueva prop para actualizar
  coloresOptions: { nombre: string; valor: string; intensidad: number }[];
  existingTramites?: { nombre: string; color?: string }[];
  mutateTramites?: () => void; // NUEVO
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onDelete,
  onUpdate, // Nueva prop
  coloresOptions,
  existingTramites = [],
  mutateTramites,
}) => {
  const [tramiteName, setTramiteName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showExisting, setShowExisting] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null); // Estado de edición
  const [editingColor, setEditingColor] = useState<string>(''); // Color en edición

  const handleConfirm = () => {
    if (tramiteName.trim()) {
      onConfirm(tramiteName.trim(), selectedColor || undefined);
      setJustCreated(tramiteName.trim());
      setShowExisting(true);
      setTramiteName('');
      setSelectedColor('');
      if (mutateTramites) mutateTramites();
    }
  };

  const handleDelete = (nombreTramite: string) => {
    if (
      onDelete &&
      confirm(`¿Está seguro de eliminar el trámite "${nombreTramite}"?`)
    ) {
      onDelete(nombreTramite);
      setJustCreated(null);
      if (mutateTramites) mutateTramites();
    }
  };

  const handleCancel = () => {
    setTramiteName('');
    setSelectedColor('');
    setJustCreated(null);
    setEditingItem(null);
    setEditingColor('');
    onClose();
  };

  // Iniciar edición
  const startEditing = (itemName: string, currentColor?: string) => {
    setEditingItem(itemName);
    setEditingColor(currentColor ?? '');
  };

  // Cancelar edición
  const cancelEditing = () => {
    setEditingItem(null);
    setEditingColor('');
  };

  // Guardar cambios de edición
  const saveEdit = (itemName: string) => {
    if (onUpdate) {
      onUpdate(itemName, editingColor || undefined);
      setEditingItem(null);
      setEditingColor('');
      if (mutateTramites) mutateTramites();
    }
  };

  if (!isOpen) return null;

  // Filtrar solo colores con intensidad 500 para trámites
  const coloresFiltrados = coloresOptions.filter(
    (color) => color.intensidad === 500
  );

  // Generar estilo de preview dinámico
  const getPreviewStyle = (color: string) => {
    const colorRecord = coloresFiltrados.find((c) => c.nombre === color);
    if (!colorRecord) return {};

    const opacity = Math.min(colorRecord.intensidad / 1000, 0.8);
    return {
      backgroundColor: `color-mix(in oklch, ${colorRecord.valor} ${opacity * 100}%, transparent)`,
    };
  };

  // Selector de colores reutilizable
  const ColorSelector = ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (color: string) => void;
    label: string;
  }) => (
    <div>
      <label className="mb-3 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="grid grid-cols-3 gap-4 xl:grid-cols-4">
        {/* Opción sin color */}
        <button
          onClick={() => onChange('')}
          className={`flex items-center justify-center rounded-md border-2 p-4 text-sm font-medium transition-all ${
            value === ''
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
          }`}
        >
          Automático
        </button>

        {/* Opciones de colores disponibles */}
        {coloresFiltrados.map((color) => (
          <button
            key={color.nombre}
            onClick={() => onChange(color.nombre)}
            className={`flex flex-col items-center justify-center rounded-md border-2 p-4 text-xs font-medium transition-all ${
              value === color.nombre
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            style={getPreviewStyle(color.nombre)}
          >
            <div className="mb-2 text-center font-semibold">{color.nombre}</div>
            <div className="text-center text-xs opacity-80">{color.valor}</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="max-h-[90vh] overflow-y-auto p-6">
          <h3 className="mb-6 text-xl font-semibold text-gray-900">
            Gestionar Trámites
          </h3>

          {/* Pestañas */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setShowExisting(false)}
              className={`rounded-md px-6 py-3 font-medium transition-colors ${
                !showExisting
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Agregar Nuevo
            </button>
            <button
              onClick={() => setShowExisting(true)}
              className={`rounded-md px-6 py-3 font-medium transition-colors ${
                showExisting
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Trámites Existentes ({existingTramites.length})
            </button>
          </div>

          {!showExisting ? (
            /* Vista de agregar nuevo */
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Columna izquierda: Input */}
              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Nombre del trámite:
                  </label>
                  <input
                    type="text"
                    value={tramiteName}
                    onChange={(e) => setTramiteName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    placeholder="Ej: LICENCIA DE CONDUCIR"
                    autoFocus
                  />
                </div>

                {/* Preview del trámite */}
                {tramiteName && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-gray-700">
                      Vista previa:
                    </label>
                    <div
                      className="rounded-md border p-6 text-center text-lg font-medium"
                      style={
                        selectedColor ? getPreviewStyle(selectedColor) : {}
                      }
                    >
                      {tramiteName.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>

              {/* Columna derecha: Selector de colores */}
              <div className="lg:col-span-2">
                <ColorSelector
                  value={selectedColor}
                  onChange={setSelectedColor}
                  label="Color (opcional):"
                />
              </div>
            </div>
          ) : (
            /* Vista de existentes en columnas de 3 */
            <div className="max-h-96 overflow-y-auto">
              {editingItem ? (
                /* Modo edición */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold">
                      Editando: {editingItem}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(editingItem)}
                        className="rounded-md bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="rounded-md bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>

                  <ColorSelector
                    value={editingColor}
                    onChange={setEditingColor}
                    label="Seleccionar nuevo color:"
                  />

                  {/* Vista previa del cambio */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Vista previa:
                    </label>
                    <div
                      className="rounded-md border p-4 text-center font-medium"
                      style={editingColor ? getPreviewStyle(editingColor) : {}}
                    >
                      {editingItem}
                    </div>
                  </div>
                </div>
              ) : (
                /* Vista normal en grid de 3 columnas */
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {existingTramites.map((tramite) => (
                    <div
                      key={tramite.nombre}
                      className={`flex flex-col rounded-lg border p-4 ${
                        justCreated === tramite.nombre
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : ''
                      }`}
                      style={
                        tramite.color ? getPreviewStyle(tramite.color) : {}
                      }
                    >
                      <div className="mb-3 min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {tramite.nombre}
                          {justCreated === tramite.nombre && (
                            <span className="ml-2 text-sm font-bold text-blue-600">
                              ✨ Recién creado
                            </span>
                          )}
                        </div>
                        <div className="truncate text-sm opacity-75">
                          Color: {tramite.color ?? 'Sin color'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            startEditing(tramite.nombre, tramite.color)
                          }
                          className="flex-1 rounded-md bg-blue-500 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-600"
                        >
                          Editar Color
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(tramite.nombre)}
                            className="flex-1 rounded-md bg-red-500 px-3 py-2 text-sm text-white transition-colors hover:bg-red-600"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {existingTramites.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                      No hay trámites registrados
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="mt-8 flex justify-end gap-4 border-t pt-6">
            <button
              onClick={handleCancel}
              className="rounded-md border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {showExisting && justCreated ? 'Cerrar' : 'Cancelar'}
            </button>
            {!showExisting && (
              <button
                onClick={handleConfirm}
                disabled={!tramiteName.trim()}
                className="rounded-md bg-blue-500 px-6 py-3 text-sm font-medium text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Agregar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerModal;
