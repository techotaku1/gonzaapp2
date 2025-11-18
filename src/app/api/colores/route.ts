import { NextRequest, NextResponse } from 'next/server';

import { addColor, getAllColores } from '~/server/actions/tableGeneral';

export async function GET(_req: NextRequest) {
  try {
    const colores = await getAllColores();

    // Fuerza datos frescos siempre, sin cache prolongado
    return NextResponse.json(
      { colores },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (_error) {
    return NextResponse.json(
      { colores: [], error: 'Error fetching colores' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { nombre, valor, intensidad } = await req.json();
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nombre requerido' },
        { status: 400 }
      );
    }
    if (!valor || typeof valor !== 'string' || !valor.trim()) {
      return NextResponse.json(
        { success: false, error: 'Valor de color requerido' },
        { status: 400 }
      );
    }
    const intensidadValue = typeof intensidad === 'number' ? intensidad : 400;
    const result = await addColor(nombre.trim(), valor.trim(), intensidadValue);
    if (result.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Error al agregar color' },
      { status: 500 }
    );
  }
}
