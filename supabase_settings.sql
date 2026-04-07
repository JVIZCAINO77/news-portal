-- SQL FINAL PARA SETTINGS (CORRECCIÓN DE ERRORES RLS)
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Crear tabla si no existe (ya debería existir)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Asegurar que existe la configuración del bot
INSERT INTO public.settings (key, value)
VALUES ('automation_enabled', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 3. Habilitar RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. Borrar políticas obsoletas
DROP POLICY IF EXISTS "Public settings are viewable by everyone" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Admin full access" ON public.settings;

-- 5. Crear Política de Lectura Pública
CREATE POLICY "Allow public select" ON public.settings FOR SELECT USING (true);

-- 6. Crear Política de Control Total para Admins (INSERT/UPDATE/DELETE)
-- Usamos ALL para cubrir upsert y update, con WITH CHECK para seguridad
CREATE POLICY "Allow admin all access" 
ON public.settings 
FOR ALL
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

-- 7. Corregir Esquema: Añadir columna missing updated_at a articles
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- RE-VINCULACIÓN DE PERFILES (Asegurar que el admin existe)
-- Si no puedes cambiar el bot, verifica que tu role sea 'admin' en la tabla profiles.
