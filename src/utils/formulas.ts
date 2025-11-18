import { type TransactionRecord } from '~/types';

export function calculateFormulas(record: TransactionRecord) {
  // Precio Neto Ajustado
  const precioNetoAjustado =
    record.precioNeto + (record.comisionExtra ? 30000 : 0);

  // Tarifa Servicio Ajustada
  const tarifaServicioAjustada =
    record.tarifaServicio - (record.comisionExtra ? 30000 : 0);

  // 4x1000
  const impuesto4x1000 = precioNetoAjustado * -0.004;

  // Ganancia Bruta (incluyendo comisión Rappi del 1% cuando aplica)
  const rappiComision = record.rappi ? record.precioNeto * 0.01 : 0;
  const gananciaBruta = tarifaServicioAjustada + impuesto4x1000 + rappiComision;

  return {
    precioNetoAjustado,
    tarifaServicioAjustada,
    impuesto4x1000,
    gananciaBruta,
  };
}
