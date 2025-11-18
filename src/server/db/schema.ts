import {
  boolean,
  decimal,
  integer,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const transactions = pgTable('transactions', {
  id: varchar('id').primaryKey(),
  fecha: timestamp('fecha').notNull(),
  tramite: varchar('tramite').notNull(),
  pagado: boolean('pagado').notNull().default(false),
  boleta: boolean('boleta').notNull().default(false),
  boletasRegistradas: decimal('boletas_registradas', {
    precision: 12,
    scale: 2,
  }).notNull(),
  emitidoPor: varchar('emitido_por').notNull(),
  placa: varchar('placa').notNull(),
  tipoDocumento: varchar('tipo_documento').notNull(),
  numeroDocumento: varchar('numero_documento').notNull(),
  nombre: varchar('nombre').notNull(),
  cilindraje: integer('cilindraje'),
  tipoVehiculo: varchar('tipo_vehiculo'),
  celular: varchar('celular'),
  ciudad: varchar('ciudad').notNull(),
  asesor: varchar('asesor').notNull(),
  novedad: varchar('novedad'),
  precioNeto: decimal('precio_neto', { precision: 12, scale: 2 }).notNull(),
  comisionExtra: boolean('comision_extra').notNull().default(false),
  tarifaServicio: decimal('tarifa_servicio', {
    precision: 12,
    scale: 2,
  }).notNull(),
  impuesto4x1000: decimal('impuesto_4x1000', {
    precision: 12,
    scale: 2,
  }).notNull(),
  gananciaBruta: decimal('ganancia_bruta', {
    precision: 12,
    scale: 2,
  }).notNull(),
  rappi: boolean('rappi').notNull().default(false),
  observaciones: varchar('observaciones'),
  createdByInitial: varchar('created_by_initial'),
});

export const cuadre = pgTable('cuadre', {
  id: varchar('id').primaryKey(),
  transactionId: varchar('transaction_id')
    .notNull()
    .references(() => transactions.id),
  banco: varchar('banco').notNull().default(''),
  monto: decimal('monto', {
    precision: 12,
    scale: 2,
  }),
  pagado: boolean('pagado').default(false),
  fechaCliente: timestamp('fecha_cliente'),
  referencia: varchar('referencia').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const asesores = pgTable('asesores', {
  id: varchar('id').primaryKey(),
  nombre: varchar('nombre').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const tramites = pgTable('tramites', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 32 }),
});

export const novedades = pgTable('novedades', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull().unique(),
});

export const emitidoPor = pgTable('emitido_por', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 32 }), // Agregar campo color
});

export const colores = pgTable('colores', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: varchar('nombre', { length: 50 }).notNull().unique(),
  valor: varchar('valor', { length: 32 }).notNull(), // hex color o nombre CSS
  intensidad: integer('intensidad').notNull().default(500), // Cambiar de 400 a 500
});

export const egressStats = pgTable('egress_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  responseSize: integer('response_size').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  queryParams: varchar('query_params', { length: 1000 }),
});

export const ignoredPlates = pgTable('ignored_plates', {
  id: uuid('id').primaryKey().defaultRandom(),
  placa: varchar('placa', { length: 20 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const boletaPayments = pgTable('boleta_payments', {
  id: serial('id').primaryKey(),
  fecha: timestamp('fecha', { withTimezone: true }).notNull().defaultNow(),
  boletaReferencia: varchar('boleta_referencia', { length: 128 }).notNull(),
  placas: varchar('placas', { length: 512 }).notNull(),
  totalPrecioNeto: decimal('total_precio_neto', {
    precision: 16,
    scale: 2,
  }).notNull(),
  createdByInitial: varchar('created_by_initial', { length: 64 }),
  tramites: varchar('tramites', { length: 512 }), // <-- nuevo campo
  banco: varchar('banco', { length: 64 }).notNull().default('BANCOLOMBIA'),
});
