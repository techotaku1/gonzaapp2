import { NextRequest, NextResponse } from 'next/server';

import { getTransactionsByIds } from '~/server/actions/tableGeneral';

export async function POST(req: NextRequest) {
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
    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error('Error in getTransactionsByIds:', error);
    return NextResponse.json([], { status: 200 });
  }
}
