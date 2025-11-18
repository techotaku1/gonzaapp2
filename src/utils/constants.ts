export const bancoOptions = [
  'Nequi Sebas',
  'Nequi Yuli',
  'Bancolombia Sebas',
  'Bancolombia Yuli',
  'Daviplata Sebas',
  'Daviplata Yuli',
  'Banco Bogota Sebas',
  'Efectivo',
  'Davivienda Sebas',
  'Davivienda Yuli',
  'Rappicuenta Sebas',
  'Rappicuenta Yuli',
] as const;

export type BancoOption = (typeof bancoOptions)[number];
