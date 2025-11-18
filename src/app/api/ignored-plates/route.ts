import { NextRequest, NextResponse } from 'next/server';

import { eq } from 'drizzle-orm';

import { db } from '~/server/db';
import { ignoredPlates } from '~/server/db/schema';

export async function GET() {
  const results = await db.select().from(ignoredPlates);
  return NextResponse.json({
    placas: results.map((r) => r.placa),
  });
}

export async function POST(req: NextRequest) {
  const { placa } = await req.json();
  if (!placa || typeof placa !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Placa requerida' },
      { status: 400 }
    );
  }
  try {
    await db
      .insert(ignoredPlates)
      .values({ placa: placa.trim().toUpperCase() });
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Error al ignorar placa' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { placa } = await req.json();
  if (!placa || typeof placa !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Placa requerida' },
      { status: 400 }
    );
  }
  try {
    await db
      .delete(ignoredPlates)
      .where(eq(ignoredPlates.placa, placa.trim().toUpperCase()));
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Error al quitar placa ignorada' },
      { status: 500 }
    );
  }
}
