-- ============================================================
-- PULSONOTICIAS — FIX RECURSIÓN RLS (ERROR 500)
-- Ejecuta este archivo en: Supabase → SQL Editor
-- ============================================================

-- 1. Crear función para verificar rol sin recursión
-- Las funciones SECURITY DEFINER se ejecutan con privilegios de creador (bypass RLS)
CREATE OR REPLACE FUNCTION public.check_user_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = required_role)
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función extra para chequear múltiples roles (ej: editor o admin)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role IN ('admin', 'editor'))
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Limpiar políticas conflictivas (todas las variantes conocidas)
DROP POLICY IF EXISTS "Admin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public select profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Nueva política para profiles (Admin gestiona, todos ven)
CREATE POLICY "Admin manage profiles" ON public.profiles FOR ALL TO authenticated USING (check_user_role('admin'));
CREATE POLICY "Public select profiles" ON public.profiles FOR SELECT USING (true);

-- 3. Limpiar y recrear políticas de articles (todas las variantes conocidas)
DROP POLICY IF EXISTS "Admin full access articles" ON public.articles;
DROP POLICY IF EXISTS "Admin can delete articles" ON public.articles;
DROP POLICY IF EXISTS "Admin can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Admin can update articles" ON public.articles;
DROP POLICY IF EXISTS "Editor can insert own articles" ON public.articles;
DROP POLICY IF EXISTS "Editor can update own articles" ON public.articles;
DROP POLICY IF EXISTS "Editor insert own articles" ON public.articles;
DROP POLICY IF EXISTS "Editor update own articles" ON public.articles;

CREATE POLICY "Admin full access articles"
  ON public.articles FOR ALL
  TO authenticated
  USING (check_user_role('admin'))
  WITH CHECK (check_user_role('admin'));

CREATE POLICY "Editor insert own articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id AND is_staff());

CREATE POLICY "Editor update own articles"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id AND is_staff());

-- 4. Actualizar políticas de settings
DROP POLICY IF EXISTS "Admin manage settings" ON public.settings;
DROP POLICY IF EXISTS "Allow admin all access" ON public.settings;
DROP POLICY IF EXISTS "Allow public select" ON public.settings;

CREATE POLICY "Admin manage settings"
  ON public.settings FOR ALL
  TO authenticated
  USING (check_user_role('admin'))
  WITH CHECK (check_user_role('admin'));

CREATE POLICY "Public select settings"
  ON public.settings FOR SELECT
  USING (true);

-- ✅ LISTO. Esto detiene la recursión infinita.

-- ✅ LISTO. Esto detiene la recursión infinita que causaba los errores 500.
