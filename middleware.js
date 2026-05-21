// middleware.js — Authentication and Session Refresh para Imperio Público
// Next.js solo ejecuta este archivo si se llama exactamente "middleware.js" en la raíz.
// (antes era proxy.js — renombrado para activar la protección real del admin)
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export default async function middleware(request) {
  // Salvaguarda: solo procesar si es ruta de administración
  if (!request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  // Si faltan variables críticas, pasamos la petición pero logueamos el error
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('[Middleware] ⚠️ NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están configuradas.');
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
          // En Next.js middleware, request.cookies es de solo lectura.
          // Solo seteamos en la respuesta para el cliente.
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 🛡️ Protección de ruta /admin — redirige a login si no hay sesión activa
  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/login')
  ) {
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
      console.error('[Middleware] Error de autenticación:', err);
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return response;
}

export const config = {
  // Solo ejecutar el middleware en rutas /admin — el público no necesita interceptación de auth
  matcher: ['/admin/:path*'],
};
