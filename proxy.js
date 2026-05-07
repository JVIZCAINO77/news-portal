// proxy.js — Authentication and Session Refresh for Imperio Público 2.0 (Next.js 16 Proxy)
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export default async function proxy(request) {
  let response = NextResponse.next({
    request,
  });

  // Si faltan variables críticas, pasamos la petición pero logueamos el error
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('[Proxy] ⚠️ NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas.');
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 🛡️ Route Protection for /admin
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
        // Transferir cookies de la respuesta actual (posible refresh) a la redirección
        response.cookies.getAll().forEach(cookie => {
          redirectResponse.cookies.set(cookie.name, cookie.value);
        });
        return redirectResponse;
      }
    } catch (err) {
      console.error('[Proxy] Error de autenticación:', err);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

export const config = {
  // Solo ejecutar el proxy en rutas /admin — el público no necesita interceptación de auth
  matcher: ['/admin/:path*'],
};

