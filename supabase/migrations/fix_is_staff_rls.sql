-- ============================================================
-- FIX: "permission denied for function is_staff"
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ============================================================
-- El error ocurre porque las políticas RLS de 'articles' llaman
-- a is_staff() pero el rol authenticated/anon no tiene EXECUTE.
-- Solución: recrear la función con SECURITY DEFINER + grants correctos.
-- ============================================================

-- PASO 1: Crear (o reemplazar) la función is_staff con SECURITY DEFINER
-- Esto permite que cualquier rol la invoque, pero se ejecuta con
-- los privilegios del owner (postgres), evitando el permission denied.
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'editor', 'staff')
  );
$$;

-- PASO 2: Asegurarse de que los roles puedan invocar la función
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO anon;
GRANT EXECUTE ON FUNCTION public.is_staff() TO service_role;

-- PASO 3: Verificar las políticas RLS existentes sobre 'articles'
-- (Solo lectura — no modifica nada, útil para diagnóstico)
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'articles';

-- ============================================================
-- FIN DEL SCRIPT
-- Si el error persiste, revisar qué función llaman exactamente
-- las políticas RLS con la query de PASO 3 y ajustar acorde.
-- ============================================================
