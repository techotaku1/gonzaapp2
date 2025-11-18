interface ExportDateRangeModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onExport: (startDate: Date, endDate: Date) => void;
}

export default function ExportDateRangeModal({
  isOpen,
  setIsOpen,
  onExport,
}: ExportDateRangeModalProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Obtener las fechas del formulario y ajustarlas a Colombia
    const startInput = formData.get('startDate') as string;
    const endInput = formData.get('endDate') as string;

    // Crear fechas en la zona horaria de Colombia
    const startDate = new Date(`${startInput}T00:00:00`);
    const endDate = new Date(`${endInput}T23:59:59`);

    // Llama a la función de exportación (que ahora sí descarga el archivo)
    onExport(startDate, endDate);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">Exportar a Excel</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2 block font-medium">Fecha Inicial</label>
            <input
              type="date"
              name="startDate"
              required
              className="w-full rounded border p-2"
            />
          </div>
          <div className="mb-4">
            <label className="mb-2 block font-medium">Fecha Final</label>
            <input
              type="date"
              name="endDate"
              required
              className="w-full rounded border p-2"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Exportar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
