import { NextRequest, NextResponse } from 'next/server';

import {
  addEmitidoPor,
  deleteEmitidoPor,
  getAllEmitidoPor,
  updateEmitidoPor,
} from '~/server/actions/tableGeneral';

export async function GET(_req: NextRequest) {
  try {
    const emitidoPor = await getAllEmitidoPor();

    // Elimina el cache prolongado, fuerza datos frescos siempre
    return NextResponse.json(
      { emitidoPor },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (_error) {
    return NextResponse.json(
      { emitidoPor: [], error: 'Error fetching emitidoPor' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { nombre, color } = (await req.json()) as {
      nombre: string;
      color?: string;
    };
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nombre requerido' },
        { status: 400 }
      );
    }
    const colorValue = typeof color === 'string' ? color : undefined;
    const result = await addEmitidoPor(nombre.trim(), colorValue);
    if (result.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Error al agregar emitidoPor' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { nombre } = (await req.json()) as { nombre: string };
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nombre requerido' },
        { status: 400 }
      );
    }
    const result = await deleteEmitidoPor(nombre.trim());
    if (result.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Error al eliminar emitidoPor' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { nombre, color } = (await req.json()) as {
      nombre: string;
      color?: string;
    };
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      return NextResponse.json(
        { success: false, error: 'Nombre requerido' },
        { status: 400 }
      );
    }
    const colorValue = typeof color === 'string' ? color : undefined;
    const result = await updateEmitidoPor(nombre.trim(), colorValue);
    if (result.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Error al actualizar emitidoPor' },
      { status: 500 }
    );
  }
}
