// app/api/exchange-rates/route.js
// Proxy server-side para la API de Frankfurter — evita CORS en el cliente.
// Cachea 3 horas en el edge para no consumir cuota innecesariamente.
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const revalidate = 10800; // 3 horas

export async function GET() {
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=DOP,EUR', {
      next: { revalidate: 10800 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'upstream_error' }, { status: res.status });
    }

    const data = await res.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=10800, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 500 });
  }
}
