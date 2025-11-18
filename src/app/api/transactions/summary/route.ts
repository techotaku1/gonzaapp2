import { NextRequest, NextResponse } from 'next/server';

import { getTransactionsSummary } from '~/server/actions/tableGeneral';

export async function GET(req: NextRequest) {
  // Check if cache should be used
  const useCache = req.headers.get('x-use-cache') === '1';

  try {
    const summary = await getTransactionsSummary();

    const response = NextResponse.json(summary, { status: 200 });

    // Add caching headers based on usage pattern
    if (useCache) {
      // For normal polling: short cache but can be reused while revalidating
      response.headers.set(
        'Cache-Control',
        's-maxage=5, stale-while-revalidate=30'
      );
    } else {
      // For explicit fetches: minimal caching
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
