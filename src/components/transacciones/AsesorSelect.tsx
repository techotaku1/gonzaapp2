import React, { useState } from 'react';

interface AsesorDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  asesores: string[];
  onDelete: (nombre: string) => Promise<void>;
}

const AsesorDeleteModal: React.FC<AsesorDeleteModalProps> = ({
  isOpen,
  onClose,
  asesores,
  onDelete,
}) => {
  const handleDelete = async (asesor: string) => {
    if (confirm(`¿Está seguro de eliminar el asesor "${asesor}"?`)) {
      try {
        await onDelete(asesor); // Espera a que el backend elimine
        // No elimines localmente, espera que el padre actualice la lista
      } catch {
        alert('Error al eliminar asesor');
      }
    }
  };

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end bg-black/40"
      style={{
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        paddingTop: '60px',
        paddingRight: '60px',
      }}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        style={{
          marginRight: 0,
          marginTop: 0,
          minWidth: 320,
          maxWidth: 340,
        }}
      >
        <h3 className="mb-4 text-lg font-bold text-gray-800">
          Eliminar Asesor
        </h3>
        <ul className="mb-6 max-h-60 overflow-y-auto">
          {asesores.length === 0 && (
            <li className="text-gray-500">No hay asesores registrados.</li>
          )}
          {asesores.map((asesor) => (
            <li
              key={asesor}
              className="mb-2 flex items-center justify-between rounded px-2 py-1 hover:bg-gray-100"
            >
              <span className="truncate">{asesor}</span>
              <button
                className="ml-2 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                onClick={() => handleDelete(asesor)}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-end">
          <button
            className="rounded border border-gray-400 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export interface AsesorSelectProps {
  value: string;
  onChange: (newValue: string) => void;
  asesores: string[];
  onAddAsesorAction: (nombre: string) => Promise<void>;
  onDeleteAsesorAction?: (nombre: string) => Promise<void>;
  className?: string;
}

export const AsesorSelect: React.FC<AsesorSelectProps> = ({
  value,
  onChange,
  asesores,
  onAddAsesorAction,
  onDeleteAsesorAction,
  className = '',
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Solo delega la eliminación al handler recibido por props
  const handleDeleteAsesor = async (nombre: string): Promise<void> => {
    if (!onDeleteAsesorAction) return;
    await onDeleteAsesorAction(nombre); // Esto sí elimina en el backend
    // No actualices localmente, espera que el padre (SWR) refresque la lista
  };

  return (
    <>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value === '__add_new__') {
            const nombre = prompt('Ingrese el nombre del nuevo asesor:');
            if (nombre && nombre.trim().length > 0) {
              void onAddAsesorAction(nombre.trim()).then(() => {
                onChange(nombre.trim());
              });
            }
          } else if (e.target.value === '__manage__') {
            setShowDeleteModal(true);
          } else {
            onChange(e.target.value);
          }
        }}
        className={`table-select-base w-[120px] rounded border ${className}`}
        title={value}
      >
        <option value="">Seleccionar...</option>
        {asesores.map((option) => (
          <option key={option} value={option} className="text-center">
            {option}
          </option>
        ))}
        <option value="__add_new__" className="font-bold text-green-700">
          Agregar nuevo asesor... ➕
        </option>
        <option value="__manage__" className="font-bold text-red-700">
          Gestionar asesores...
        </option>
      </select>
      <AsesorDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        asesores={asesores}
        onDelete={handleDeleteAsesor}
      />
    </>
  );
};
