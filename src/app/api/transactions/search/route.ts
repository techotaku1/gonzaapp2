import { searchTransactions } from '~/server/actions/tableGeneral';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') ?? '';
  try {
    const results = await searchTransactions(query);
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: 'Error searching transactions' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
