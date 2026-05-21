// lib/supabase/admin.js — Cliente Supabase con SERVICE_ROLE centralizado
// Soluciona C2: el cliente admin estaba triplicado en admin/page.js,
// admin/layout.js y post-social/route.js. Un solo lugar de verdad.
//
// IMPORTANTE: NUNCA importar este módulo desde componentes 'use client'.
// Solo usar en Server Components, Route Handlers y Server Actions.

import { createClient } from '@supabase/supabase-js';

let _adminClient = null;

/**
 * Retorna el cliente Supabase con SERVICE_ROLE_KEY (acceso total, sin RLS).
 * Singleton — se reutiliza entre renders del mismo worker serverless.
 * 
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 * @throws {Error} Si las variables de entorno no están configuradas
 */
export function getAdminClient() {
  if (_adminClient) return _adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      '[supabase/admin] NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas.'
    );
  }

  _adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _adminClient;
}
