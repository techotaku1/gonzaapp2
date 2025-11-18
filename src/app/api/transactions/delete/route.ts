import { NextRequest, NextResponse } from 'next/server';

import { deleteRecords } from '~/server/actions/tableGeneral';

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = (body && typeof body === 'object' && (body as any).id) || null;
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Id requerido' },
        { status: 400 }
      );
    }

    const result = await deleteRecords([id]);
    if (result.success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: result.error ?? 'Error eliminando registro' },
      { status: 500 }
    );
  } catch (err) {
    console.error('Error in DELETE /api/transactions/delete', err);
    return NextResponse.json(
      { success: false, error: 'Error interno' },
      { status: 500 }
    );
  }
}
