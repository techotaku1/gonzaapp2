'use client';

import React, { useState } from 'react';

interface EmitidoPorColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (nombre: string, selectedColor?: string) => void;
  onDelete?: (nombre: string) => void;
  onUpdate?: (nombre: string, newColor?: string) => void;
  coloresOptions: { nombre: string; valor: string; intensidad: number }[];
  existingEmitidoPor?: { nombre: string; color?: string }[];
  mutateEmitidoPor?: () => void;
}

const EmitidoPorColorModal: React.FC<EmitidoPorColorModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onDelete,
  onUpdate,
  coloresOptions,
  existingEmitidoPor = [],
  mutateEmitidoPor,
}) => {
  const [nombre, setNombre] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showExisting, setShowExisting] = useState(false);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingColor, setEditingColor] = useState<string>('');

  const handleConfirm = () => {
    if (nombre.trim()) {
      onConfirm(nombre.trim(), selectedColor || undefined);
      setJustCreated(nombre.trim());
      setShowExisting(true);
      setNombre('');
      setSelectedColor('');
      if (mutateEmitidoPor) mutateEmitidoPor();
    }
  };

  const handleDelete = (nombreItem: string) => {
    if (onDelete && confirm(`¿Está seguro de eliminar "${nombreItem}"?`)) {
      onDelete(nombreItem);
      setJustCreated(null);
      if (mutateEmitidoPor) mutateEmitidoPor();
    }
  };

  const handleCancel = () => {
    setNombre('');
    setSelectedColor('');
    setJustCreated(null);
    setEditingItem(null);
    setEditingColor('');
    onClose();
  };

  const startEditing = (itemName: string, currentColor?: string) => {
    setEditingItem(itemName);
    setEditingColor(currentColor ?? '');
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditingColor('');
  };

  const saveEdit = (itemName: string) => {
    if (onUpdate) {
      onUpdate(itemName, editingColor || undefined);
      setEditingItem(null);
      setEditingColor('');
      if (mutateEmitidoPor) mutateEmitidoPor();
    }
  };

  if (!isOpen) return null;

  const coloresFiltrados = coloresOptions.filter(
    (color) => color.intensidad === 300
  );

  const getPreviewStyle = (color: string) => {
    const colorRecord = coloresFiltrados.find((c) => c.nombre === color);
    if (!colorRecord) return {};
    const opacity = 0.3;
    return {
      backgroundColor: `color-mix(in oklch, ${colorRecord.valor} ${opacity * 100}%, transparent)`,
      color: colorRecord.valor.includes('#')
        ? '#1a1a1a'
        : `var(--color-${colorRecord.valor}-900)`,
    };
  };

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
        <button
          onClick={() => onChange('')}
          className={`flex items-center justify-center rounded-md border-2 p-4 text-sm font-medium transition-all ${
            value === ''
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
          }`}
        >
          Sin color
        </button>
        {coloresFiltrados.map((color) => (
          <button
            key={color.nombre}
            onClick={() => onChange(color.nombre)}
            className={`flex flex-col items-center justify-center rounded-md border-2 p-4 text-xs font-medium transition-all ${
              value === color.nombre
                ? 'border-green-500 ring-2 ring-green-200'
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
            Gestionar Emitido Por
          </h3>
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setShowExisting(false)}
              className={`rounded-md px-6 py-3 font-medium transition-colors ${
                !showExisting
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Agregar Nuevo
            </button>
            <button
              onClick={() => setShowExisting(true)}
              className={`rounded-md px-6 py-3 font-medium transition-colors ${
                showExisting
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Existentes ({existingEmitidoPor.length})
            </button>
          </div>
          {!showExisting ? (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6">
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Nombre del emisor:
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                    placeholder="Ej: Panel Juan"
                    autoFocus
                  />
                </div>
                {nombre && (
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
                      {nombre.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
              <div className="lg:col-span-2">
                <ColorSelector
                  value={selectedColor}
                  onChange={setSelectedColor}
                  label="Color (opcional):"
                />
              </div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {editingItem ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold">
                      Editando: {editingItem}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(editingItem)}
                        className="rounded-md bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {existingEmitidoPor.map((item) => (
                    <div
                      key={item.nombre}
                      className={`flex flex-col rounded-lg border p-4 ${
                        justCreated === item.nombre
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                          : ''
                      }`}
                      style={item.color ? getPreviewStyle(item.color) : {}}
                    >
                      <div className="mb-3 min-w-0 flex-1">
                        <div className="truncate font-medium">
                          {item.nombre}
                          {justCreated === item.nombre && (
                            <span className="ml-2 text-sm font-bold text-green-600">
                              ✨ Recién creado
                            </span>
                          )}
                        </div>
                        <div className="truncate text-sm opacity-75">
                          Color: {item.color ?? 'Sin color'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(item.nombre, item.color)}
                          className="flex-1 rounded-md bg-blue-500 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-600"
                        >
                          Editar Color
                        </button>
                        {onDelete && (
                          <button
                            onClick={() => handleDelete(item.nombre)}
                            className="flex-1 rounded-md bg-red-500 px-3 py-2 text-sm text-white transition-colors hover:bg-red-600"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {existingEmitidoPor.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                      No hay emisores registrados
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
                disabled={!nombre.trim()}
                className="rounded-md bg-green-500 px-6 py-3 text-sm font-medium text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
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

export default EmitidoPorColorModal;
