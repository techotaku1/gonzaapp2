import { NextRequest, NextResponse } from 'next/server';

import {
  addAsesor,
  deleteAsesor,
  getAllAsesores,
} from '~/server/actions/tableGeneral';

export async function GET(_req: NextRequest) {
  try {
    const asesores = await getAllAsesores();

    // Elimina el cache prolongado, fuerza datos frescos siempre
    return NextResponse.json(
      { asesores },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (_error) {
    return NextResponse.json(
      { asesores: [], error: 'Error fetching asesores' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { nombre } = await req.json();
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nombre requerido' },
        { status: 400 }
      );
    }
    const result = await addAsesor(nombre);
    if (result.success) {
      return NextResponse.json({ success: true });
    }
    // Si el error es por duplicado, retorna 409
    if (result.error === 'El asesor ya existe.') {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Error al agregar asesor' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { nombre } = await req.json();
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nombre requerido' },
        { status: 400 }
      );
    }
    // Elimina el asesor por nombre usando la función de actions
    const result = await deleteAsesor(nombre);
    if (result.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Error al eliminar asesor' },
      { status: 500 }
    );
  }
}
