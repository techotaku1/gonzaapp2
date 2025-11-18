import { NextResponse } from 'next/server';
import { getCuadreRecords } from '~/server/actions/cuadreActions';

export async function GET() {
  try {
    const data = await getCuadreRecords();
    return NextResponse.json({ data }, { status: 200 });
  } catch (_error) {
    return NextResponse.json(
      { data: [], error: 'Error fetching cuadre records' },
      { status: 500 }
    );
  }
}
