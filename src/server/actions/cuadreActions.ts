'use server';

import { revalidateTag, unstable_cache } from 'next/cache';

import { eq, inArray } from 'drizzle-orm';

import { db } from '~/server/db';
import { cuadre, transactions } from '~/server/db/schema';

import type { CuadreData, ExtendedSummaryRecord } from '~/types';

// Función original de lectura
async function _getCuadreRecords(): Promise<ExtendedSummaryRecord[]> {
  try {
    const results = await db
      .select({
        id: transactions.id,
        fecha: transactions.fecha,
        tramite: transactions.tramite,
        pagado: transactions.pagado,
        boleta: transactions.boleta,
        boletasRegistradas: transactions.boletasRegistradas,
        emitidoPor: transactions.emitidoPor,
        placa: transactions.placa,
        tipoDocumento: transactions.tipoDocumento,
        numeroDocumento: transactions.numeroDocumento,
        nombre: transactions.nombre,
        cilindraje: transactions.cilindraje,
        tipoVehiculo: transactions.tipoVehiculo,
        celular: transactions.celular,
        ciudad: transactions.ciudad,
        asesor: transactions.asesor,
        novedad: transactions.novedad,
        precioNeto: transactions.precioNeto,
        comisionExtra: transactions.comisionExtra,
        tarifaServicio: transactions.tarifaServicio,
        impuesto4x1000: transactions.impuesto4x1000,
        gananciaBruta: transactions.gananciaBruta,
        rappi: transactions.rappi,
        observaciones: transactions.observaciones,
        banco: cuadre.banco,
        monto: cuadre.monto,
        pagadoCuadre: cuadre.pagado, // para distinguir de pagado de transacciones
        fechaCliente: cuadre.fechaCliente,
        referencia: cuadre.referencia,
        createdAt: cuadre.createdAt,
        cuadreId: cuadre.id, // <-- Agregado para exponer el id de la tabla cuadre
      })
      .from(transactions)
      .innerJoin(cuadre, eq(cuadre.transactionId, transactions.id));

    return results.map((record) => {
      const { tarifaServicio, ...rest } = record;
      return {
        ...rest,
        fecha: new Date(record.fecha),
        fechaCliente: record.fechaCliente
          ? new Date(record.fechaCliente)
          : null,
        createdAt: new Date(record.createdAt ?? Date.now()),
        boletasRegistradas: Number(record.boletasRegistradas),
        precioNeto: Number(record.precioNeto),
        tarifaServicio: Number(record.tarifaServicio),
        impuesto4x1000: Number(record.impuesto4x1000),
        gananciaBruta: Number(record.gananciaBruta),
        banco: record.banco ?? '',
        monto:
          record.monto !== undefined && record.monto !== null
            ? Number(record.monto)
            : 0,
        pagado: record.pagadoCuadre ?? false,
        referencia: record.referencia ?? '',
        totalCombinado:
          Number(record.precioNeto) + Number(record.tarifaServicio),
        cuadreId: record.cuadreId, // <-- Agregado para exponer el id de la tabla cuadre
      };
    });
  } catch (error) {
    // Log the DB error for diagnostics but DO NOT rethrow during build/prerender.
    // Returning an empty array avoids breaking Next.js prerender when DB is unreachable
    // (e.g. wrong credentials in build environment).
    console.error('Error fetching cuadre records:', error);
    return [];
  }
}

// Versión cacheada usando unstable_cache y tag
export const getCuadreRecords = unstable_cache(
  _getCuadreRecords,
  ['cuadre-list'],
  { tags: ['cuadre'], revalidate: 60 }
);

export async function updateCuadreRecord(
  transactionId: string,
  data: CuadreData
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(cuadre)
      .set({
        ...(data.banco !== undefined && { banco: data.banco }),
        ...(data.monto !== undefined && { monto: data.monto?.toString() }),
        ...(data.pagado !== undefined && { pagado: data.pagado }),
        ...(data.fechaCliente !== undefined && {
          fechaCliente:
            data.fechaCliente == null
              ? null
              : data.fechaCliente instanceof Date
                ? data.fechaCliente
                : new Date(data.fechaCliente),
        }),
        ...(data.referencia !== undefined && { referencia: data.referencia }),
      })
      .where(eq(cuadre.transactionId, transactionId));

    revalidateTag('cuadre', 'max'); // Solo revalida el tag de cuadre
    return { success: true };
  } catch (error) {
    console.error('Error updating cuadre record:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update record',
    };
  }
}

export async function createCuadreRecord(
  transactionId: string,
  data: {
    banco: string;
    monto?: number;
    pagado?: boolean;
    fechaCliente?: Date | null;
    referencia?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.insert(cuadre).values({
      id: crypto.randomUUID(),
      transactionId,
      banco: data.banco ?? '',
      monto: data.monto?.toString() ?? '0',
      pagado: data.pagado ?? false,
      fechaCliente: data.fechaCliente ?? null,
      referencia: data.referencia ?? '',
      createdAt: new Date(),
    });

    revalidateTag('cuadre', 'max'); // Solo revalida el tag de cuadre
    return { success: true };
  } catch (error) {
    console.error('Error creating cuadre record:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create cuadre record',
    };
  }
}

export async function deleteCuadreRecords(
  ids: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(cuadre).where(inArray(cuadre.id, ids));
    revalidateTag('cuadre', 'max'); // Solo revalida el tag de cuadre
    return { success: true };
  } catch (error) {
    console.error('Error deleting cuadre records:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete records',
    };
  }
}

export async function updateCuadreRecordsBatch(
  updates: { transactionId: string; data: CuadreData }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ejecutar todas las updates en una transacción para atomicidad
    await db.transaction(async (tx) => {
      for (const { transactionId, data } of updates) {
        await tx
          .update(cuadre)
          .set({
            ...(data.banco !== undefined && { banco: data.banco }),
            ...(data.monto !== undefined && { monto: data.monto?.toString() }),
            ...(data.pagado !== undefined && { pagado: data.pagado }),
            ...(data.fechaCliente !== undefined && {
              fechaCliente:
                data.fechaCliente == null
                  ? null
                  : data.fechaCliente instanceof Date
                    ? data.fechaCliente
                    : new Date(data.fechaCliente),
            }),
            ...(data.referencia !== undefined && {
              referencia: data.referencia,
            }),
          })
          .where(eq(cuadre.transactionId, transactionId));
      }
    });

    revalidateTag('cuadre', 'max'); // Solo revalida el tag de cuadre
    return { success: true };
  } catch (error) {
    console.error('Error updating cuadre records batch:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update records batch',
    };
  }
}
