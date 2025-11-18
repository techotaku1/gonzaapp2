import { NextResponse } from 'next/server';

import { db } from '~/server/db';
import { transactions } from '~/server/db/schema';

export async function GET() {
  try {
    const results = await db
      .select({
        id: transactions.id,
        creador: transactions.createdByInitial,
      })
      .from(transactions);

    // Retorna un array de objetos { id, creador }
    return NextResponse.json({ creadores: results });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Error fetching creadores' },
      { status: 500 }
    );
  }
}
