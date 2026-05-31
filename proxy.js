// middleware.js — Seguridad total para Imperio Público
// Protege: /admin (auth), rutas test (bloqueadas), rate limiting en APIs
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// ── Rate Limiting (in-memory, Edge compatible) ─────────────────────────────
// Cada IP puede hacer máx 60 peticiones por minuto a la API
const rateMap = new Map(); // ip → { count, resetAt }
const RATE_LIMIT = 60;     // peticiones por ventana
const RATE_WINDOW = 60000; // ventana de 1 minuto en ms

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

// Limpieza periódica del mapa (previene memory leak)
let lastCleanup = Date.now();
function maybeClearRateMap() {
  if (Date.now() - lastCleanup > 300000) { // cada 5 minutos
    const now = Date.now();
    for (const [ip, entry] of rateMap.entries()) {
      if (now > entry.resetAt) rateMap.delete(ip);
    }
    lastCleanup = Date.now();
  }
}

// ── Rutas de test bloqueadas en producción ─────────────────────────────────
const BLOCKED_IN_PROD = [
  '/api/test-social',
];

export default async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProd = process.env.NODE_ENV === 'production';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1';

  maybeClearRateMap();

  // ── 1. Bloquear rutas de test en producción ──────────────────────────────
  if (isProd && BLOCKED_IN_PROD.some(route => pathname.startsWith(route))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // ── 2. Rate limiting en rutas de API ─────────────────────────────────────
  // Excluir: cron (ya autenticado por header), og (imágenes), ads.txt
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/cron')) {
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Demasiadas peticiones. Intenta en 1 minuto.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'X-RateLimit-Limit': String(RATE_LIMIT),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT));
    response.headers.set('X-RateLimit-Remaining', String(remaining));

    // Si no es ruta admin, devolver con headers de rate limit
    if (!pathname.startsWith('/admin')) return response;
  }

  // ── 3. Protección /admin con autenticación Supabase ──────────────────────
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('[Middleware] ⚠️ Variables Supabase no configuradas.');
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  if (
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin/login')
  ) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
        response.cookies.getAll().forEach(cookie => {
          redirectResponse.cookies.set(cookie.name, cookie.value);
        });
        return redirectResponse;
      }
    } catch (err) {
      console.error('[Middleware] Error de autenticación:', err);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
};
