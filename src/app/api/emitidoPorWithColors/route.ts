import { NextRequest, NextResponse } from 'next/server';

import { getAllEmitidoPorWithColors } from '~/server/actions/tableGeneral';

export async function GET(_req: NextRequest) {
  try {
    const emitidoPorWithColors = await getAllEmitidoPorWithColors();

    // Elimina el cache prolongado, fuerza datos frescos siempre
    return NextResponse.json(
      { emitidoPorWithColors },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching emitidoPorWithColors:', error);
    return NextResponse.json(
      {
        emitidoPorWithColors: [],
        error: 'Error fetching emitidoPorWithColors',
      },
      { status: 500 }
    );
  }
}
