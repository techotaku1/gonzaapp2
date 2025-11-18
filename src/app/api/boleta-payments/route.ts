import { NextRequest, NextResponse } from 'next/server';

import { currentUser } from '@clerk/nextjs/server';
import { sql } from 'drizzle-orm';

import { db } from '~/server/db';
import { boletaPayments } from '~/server/db/schema';
import { bancoOptions } from '~/utils/constants';

export async function GET() {
  try {
    const results = await db
      .select()
      .from(boletaPayments)
      .orderBy(boletaPayments.fecha);
    const parsedResults = results.map((r) => ({
      ...r,
      placas: r.placas.split(','),
      tramites: r.tramites ? r.tramites.split(',') : [], // <-- parsea tramites como array
      banco: r.banco ?? bancoOptions[0] ?? '',
    }));
    return NextResponse.json({ boletaPayments: parsedResults });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Error fetching boleta payments' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    boletaReferencia,
    placas,
    totalPrecioNeto,
    tramites, // <-- nuevo campo
    banco,
    // createdByInitial, // <-- ya no se recibe del frontend
  } = body;

  if (
    !boletaReferencia ||
    !Array.isArray(placas) ||
    typeof totalPrecioNeto !== 'number' ||
    !banco ||
    typeof banco !== 'string'
    // tramites es opcional, pero si viene debe ser array
  ) {
    return NextResponse.json(
      { success: false, error: 'Datos requeridos' },
      { status: 400 }
    );
  }

  // Obtiene el usuario actual desde Clerk en el backend
  const clerkUser = await currentUser();
  const createdByInitial =
    clerkUser?.firstName && clerkUser?.lastName
      ? `${clerkUser.firstName} ${clerkUser.lastName}`
      : (clerkUser?.firstName ?? clerkUser?.username ?? 'A');

  try {
    // Usar la hora exacta de Colombia con zona horaria real
    const nowUTC = new Date();
    // Obtener la hora de Colombia usando Intl API
    const fechaColombiaStr = nowUTC.toLocaleString('en-US', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    // Convertir a Date (formato MM/DD/YYYY, HH:mm:ss)
    const [datePart, timePart] = fechaColombiaStr.split(', ');
    const [month, day, year] = datePart.split('/').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);
    const fechaColombia = new Date(
      Date.UTC(year, month - 1, day, hour, minute, second)
    );

    await db.insert(boletaPayments).values({
      fecha: fechaColombia,
      boletaReferencia: String(boletaReferencia),
      placas: placas.join(','),
      totalPrecioNeto: sql`${totalPrecioNeto.toFixed(2)}`,
      createdByInitial: createdByInitial ?? null,
      tramites: Array.isArray(tramites) ? tramites.join(',') : null, // <-- guarda tramites como string
      banco: String(banco),
    });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Error al guardar boleta' },
      { status: 500 }
    );
  }
}
