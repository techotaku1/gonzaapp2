import { NextRequest, NextResponse } from 'next/server';

import {
  getTransactionsByIds,
  getTransactionsPaginated,
  getTransactionsSummary,
} from '~/server/actions/tableGeneral';

// Nuevo endpoint: /api/transactions/summary
export async function GET(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.endsWith('/summary')) {
    try {
      const summary = await getTransactionsSummary();

      const response = NextResponse.json(summary, { status: 200 });

      // Check if client wants cached response
      const useCache = req.headers.get('x-use-cache') === '1';
      if (useCache) {
        response.headers.set(
          'Cache-Control',
          's-maxage=5, stale-while-revalidate=30'
        );
      } else {
        response.headers.set('Cache-Control', 'no-cache');
      }

      return response;
    } catch (_error) {
      return NextResponse.json(
        { error: 'Error fetching transactions summary' },
        { status: 500 }
      );
    }
  }

  try {
    const { searchParams } = req.nextUrl;
    const date = searchParams.get('date'); // YYYY-MM-DD
    const limit = Number(searchParams.get('limit') ?? 100);
    const offset = Number(searchParams.get('offset') ?? 0);

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Debe enviar el parámetro date=YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Usa la función cacheada para paginación
    const result = await getTransactionsPaginated(date, limit, offset);

    // Asegura que result tenga data y total
    const response = NextResponse.json(
      { data: result?.data ?? [], total: result?.total ?? 0 },
      { status: 200 }
    );

    // Add short-lived cache for this data
    response.headers.set(
      'Cache-Control',
      's-maxage=10, stale-while-revalidate=30'
    );

    return response;
  } catch (_error) {
    return NextResponse.json(
      { error: 'Error fetching transactions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  if (url.pathname === '/api/transactions/by-ids') {
    try {
      let ids: string[] = [];
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json([], { status: 200 });
      }
      if (
        body &&
        typeof body === 'object' &&
        Array.isArray((body as { ids?: unknown }).ids)
      ) {
        ids = (body as { ids: unknown[] }).ids.filter(
          (id): id is string => typeof id === 'string'
        );
      }
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json([], { status: 200 });
      }
      try {
        const records = await getTransactionsByIds(ids);
        return NextResponse.json(
          records.map((record) => ({
            ...record,
            createdByInitial: record.createdByInitial ?? null,
          })),
          { status: 200 }
        );
      } catch (error) {
        console.error('Error in getTransactionsByIds:', error);
        return NextResponse.json([], { status: 200 });
      }
    } catch (error) {
      console.error('Error in /api/transactions/by-ids:', error);
      return NextResponse.json([], { status: 200 });
    }
  }
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
