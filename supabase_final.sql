-- ============================================================
-- PULSONOTICIAS — SQL DEFINITIVO PARA PRODUCCIÓN
-- Ejecuta este archivo COMPLETO en el SQL Editor de Supabase
-- Orden: Tablas → Columnas → RLS → Políticas → Trigger → Seed
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. TABLAS BASE
-- ─────────────────────────────────────────────

-- Tabla de perfiles de usuario (ligada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de artículos
CREATE TABLE IF NOT EXISTS public.articles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT,
  author TEXT,
  author_id UUID REFERENCES public.profiles(id),
  image TEXT,
  "imageAlt" TEXT,
  tags TEXT[],
  featured BOOLEAN DEFAULT false,
  "publishedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Tabla de configuración global (bot, etc.)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────
-- 2. COLUMNAS FALTANTES (idempotente, IF NOT EXISTS)
-- ─────────────────────────────────────────────
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id);

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- ─────────────────────────────────────────────
-- 3. HABILITAR ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
ALTER TABLE public.articles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings  ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 4. POLÍTICAS PARA articles
-- ─────────────────────────────────────────────

-- Limpiar políticas anteriores
DROP POLICY IF EXISTS "Public articles are viewable by everyone"  ON public.articles;
DROP POLICY IF EXISTS "Admins can do everything on articles"      ON public.articles;
DROP POLICY IF EXISTS "Editors can create and edit their own articles" ON public.articles;
DROP POLICY IF EXISTS "Admin can delete articles"                 ON public.articles;
DROP POLICY IF EXISTS "Admin can insert articles"                 ON public.articles;
DROP POLICY IF EXISTS "Admin can update articles"                 ON public.articles;
DROP POLICY IF EXISTS "Editor can insert own articles"            ON public.articles;
DROP POLICY IF EXISTS "Editor can update own articles"            ON public.articles;

-- Lectura pública
CREATE POLICY "Public articles are viewable by everyone"
  ON public.articles FOR SELECT
  USING (true);

-- Admin: DELETE explícito (esto resuelve el bug de borrado)
CREATE POLICY "Admin can delete articles"
  ON public.articles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin: INSERT
CREATE POLICY "Admin can insert articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Admin: UPDATE
CREATE POLICY "Admin can update articles"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Editor: INSERT (solo sus propios artículos)
CREATE POLICY "Editor can insert own articles"
  ON public.articles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'editor'
    )
  );

-- Editor: UPDATE (solo sus propios artículos)
CREATE POLICY "Editor can update own articles"
  ON public.articles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'editor'
    )
  );

-- ─────────────────────────────────────────────
-- 5. POLÍTICAS PARA profiles
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Public profiles are viewable by everyone"  ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"        ON public.profiles;
DROP POLICY IF EXISTS "Admin full access on profiles"             ON public.profiles;

-- Lectura pública de perfiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Cada usuario actualiza solo su propio perfil
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Admin puede insertar y modificar cualquier perfil (para crear editores)
CREATE POLICY "Admin full access on profiles"
  ON public.profiles FOR ALL
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

-- ─────────────────────────────────────────────
-- 6. POLÍTICAS PARA settings
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow public select"       ON public.settings;
DROP POLICY IF EXISTS "Allow admin all access"    ON public.settings;
DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings"               ON public.settings;
DROP POLICY IF EXISTS "Admin full access"                        ON public.settings;

-- Lectura pública
CREATE POLICY "Allow public select"
  ON public.settings FOR SELECT
  USING (true);

-- Admin: control total
CREATE POLICY "Allow admin all access"
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

-- ─────────────────────────────────────────────
-- 7. TRIGGER: Crear perfil automáticamente al registrarse
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'editor')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─────────────────────────────────────────────
-- 8. DATOS INICIALES (settings del bot)
-- ─────────────────────────────────────────────

INSERT INTO public.settings (key, value)
VALUES ('automation_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ✅ LISTO. Verifica en Supabase → Table Editor que:
--   • Existen las tablas: articles, profiles, settings
--   • En authentication → Policies están todas las políticas
--   • Tu usuario tiene role='admin' en la tabla profiles
-- ============================================================
