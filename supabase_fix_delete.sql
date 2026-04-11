-- ============================================================
-- PULSONOTICIAS — FIX COMPLETO: DELETE + RLS + BOT
-- Ejecuta TODO este archivo en: Supabase → SQL Editor
-- ============================================================

-- 0. Limpiar políticas de storage que puedan causar conflicto
DROP POLICY IF EXISTS "anon_update_images"   ON storage.objects;
DROP POLICY IF EXISTS "anon_insert_images"   ON storage.objects;
DROP POLICY IF EXISTS "anon_select_images"   ON storage.objects;
DROP POLICY IF EXISTS "anon_delete_images"   ON storage.objects;
DROP POLICY IF EXISTS "admin_upload_images"  ON storage.objects;
DROP POLICY IF EXISTS "public_read_images"   ON storage.objects;

-- 1. Limpiar TODAS las políticas posibles de articles (nombres viejos y nuevos)
DROP POLICY IF EXISTS "Admin can delete articles"              ON public.articles;
DROP POLICY IF EXISTS "Admin can insert articles"              ON public.articles;
DROP POLICY IF EXISTS "Admin can update articles"              ON public.articles;
DROP POLICY IF EXISTS "Admin full access articles"             ON public.articles;
DROP POLICY IF EXISTS "Editor can insert own articles"         ON public.articles;
DROP POLICY IF EXISTS "Editor can update own articles"         ON public.articles;
DROP POLICY IF EXISTS "Editor insert own articles"             ON public.articles;
DROP POLICY IF EXISTS "Editor update own articles"             ON public.articles;
DROP POLICY IF EXISTS "Public articles are viewable by everyone" ON public.articles;
DROP POLICY IF EXISTS "Public read articles"                   ON public.articles;
DROP POLICY IF EXISTS "Service role bypass"                    ON public.articles;
DROP POLICY IF EXISTS "Bot can insert articles"                ON public.articles;

-- 2. Política de lectura pública (sin autenticación)
CREATE POLICY "Public read articles"
  ON public.articles FOR SELECT
  USING (true);

-- 3. Administradores tienen acceso total (INSERT, UPDATE, DELETE, SELECT)
CREATE POLICY "Admin full access articles"
  ON public.articles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 4. Editores pueden insertar sus propios artículos
CREATE POLICY "Editor insert own articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('editor', 'admin')
    )
  );

-- 5. Editores pueden actualizar sus propios artículos
CREATE POLICY "Editor update own articles"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 6. Service Role Key (para el bot) puede insertar sin restricciones
CREATE POLICY "Service role bypass"
  ON public.articles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. Asegurarse de que RLS está activo
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 8. Columna updated_at si no existe
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 9. Tabla settings para el kill-switch del bot (si no existe)
CREATE TABLE IF NOT EXISTS public.settings (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'false'::jsonb
);

-- Activar RLS en settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Solo admins leen/escriben settings
DROP POLICY IF EXISTS "Admin manage settings" ON public.settings;
CREATE POLICY "Admin manage settings"
  ON public.settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Service role puede leer/escribir settings (para el bot)
DROP POLICY IF EXISTS "Service role settings bypass" ON public.settings;
CREATE POLICY "Service role settings bypass"
  ON public.settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insertar el valor inicial del bot (pausado por defecto)
INSERT INTO public.settings (key, value)
VALUES ('automation_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ✅ LISTO. Verifica en: Supabase → Authentication → Policies → articles
