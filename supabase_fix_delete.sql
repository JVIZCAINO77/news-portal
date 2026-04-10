-- ============================================================
-- PULSONOTICIAS — FIX RÁPIDO: POLÍTICAS DE DELETE + BOT
-- Ejecuta este archivo en: Supabase → SQL Editor
-- ============================================================

-- 1. Limpiar políticas conflictivas de articles
DROP POLICY IF EXISTS "Admin can delete articles"    ON public.articles;
DROP POLICY IF EXISTS "Admin can insert articles"    ON public.articles;
DROP POLICY IF EXISTS "Admin can update articles"    ON public.articles;
DROP POLICY IF EXISTS "Editor can insert own articles" ON public.articles;
DROP POLICY IF EXISTS "Editor can update own articles" ON public.articles;
DROP POLICY IF EXISTS "Public articles are viewable by everyone" ON public.articles;

-- 2. Política de lectura pública (sin autenticación)
CREATE POLICY "Public read articles"
  ON public.articles FOR SELECT
  USING (true);

-- 3. Administradores pueden hacer todo
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

-- 4. Editores pueden insertar/actualizar sus propios artículos
CREATE POLICY "Editor insert own articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'editor'
    )
  );

CREATE POLICY "Editor update own articles"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'editor'
    )
  );

-- 5. Asegurarse de que RLS está activo
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- 6. Columna updated_at si no existe
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- ✅ LISTO. El borrado y bot de noticias ahora funcionarán correctamente.
-- Verifica en: Supabase → Authentication → Policies → articles
