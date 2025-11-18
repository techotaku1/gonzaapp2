export interface BaseTransactionRecord {
  id: string;
  fecha: Date;
  tramite: string;
  pagado: boolean;
  boleta: boolean;
  boletasRegistradas: number;
  emitidoPor: string;
  placa: string;
  tipoDocumento: string;
  numeroDocumento: string;
  nombre: string;
  cilindraje: number | null;
  tipoVehiculo: string | null;
  celular: string | null;
  ciudad: string;
  asesor: string;
  novedad: string | null;
  precioNeto: number;
  comisionExtra: boolean;
  tarifaServicio: number;
  impuesto4x1000: number;
  gananciaBruta: number;
  rappi: boolean;
  observaciones: string | null;
  createdByInitial?: string | null; // <-- debe ser opcional y permitir null
}

export interface CuadreData {
  banco: string;
  monto?: number;
  pagado?: boolean;
  fechaCliente: Date | null;
  referencia: string;
}

export type TransactionRecord = BaseTransactionRecord;

export interface CuadreRecord extends CuadreData {
  id: string;
  transactionId: string;
  createdAt: Date;
}

export interface ExtendedSummaryRecord extends BaseTransactionRecord {
  totalCombinado: number;
  banco: string;
  monto: number;
  pagado: boolean;
  fechaCliente: Date | null;
  referencia: string;
  groupId?: string;
  createdAt?: Date;
  cuadreId: string; // <-- Agregado para exponer el id de la tabla cuadre
}

export interface AsesorRecord {
  id: string;
  nombre: string;
  createdAt: Date;
}

export interface TramiteRecord {
  id: string;
  nombre: string;
  color?: string; // Color en formato hex (#RRGGBB) o nombre de color CSS
}

export interface NovedadRecord {
  id: string;
  nombre: string;
}

export interface EmitidoPorRecord {
  id: string;
  nombre: string;
  color?: string; // Agregar campo color opcional
}

export interface ColorRecord {
  id: string;
  nombre: string;
  valor: string; // hex color o nombre CSS
  intensidad: number; // 100, 200, 300, 400, 500, etc.
}

// Estadísticas de egress de la base de datos
export interface EgressStat {
  id: string;
  endpoint: string;
  method: string;
  responseSize: number;
  timestamp: Date;
  date: string; // YYYY-MM-DD
  queryParams?: string;
}

export interface EgressStatSummary {
  date: string;
  totalSizeBytes: number;
  totalSizeKB: string;
  totalSizeMB: string;
  requestCount: number;
  uniqueEndpoints: number;
}

export interface IgnoredPlateRecord {
  id: string;
  placa: string;
  createdAt: Date;
}

export interface BoletaPaymentRecord {
  id: number;
  fecha: Date | string;
  boletaReferencia: string;
  placas: string[] | string;
  totalPrecioNeto: number;
  createdByInitial?: string;
  tramites?: string[]; // <-- nuevo campo
  banco?: string; // <-- nuevo campo
}
