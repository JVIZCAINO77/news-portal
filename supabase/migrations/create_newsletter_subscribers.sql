-- Migration: crear tabla de suscriptores del newsletter
-- Ejecutar en: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text NOT NULL UNIQUE,
  active      boolean DEFAULT true,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz
);

-- Índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter_subscribers(email);

-- RLS: Solo el service role puede leer/escribir
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Solo el backend (service role) puede operar sobre esta tabla
CREATE POLICY "service_role_only" ON public.newsletter_subscribers
  USING (false)  -- Ningún usuario autenticado puede leer
  WITH CHECK (false);  -- Ningún usuario autenticado puede escribir

COMMENT ON TABLE public.newsletter_subscribers IS 'Suscriptores del newsletter de Imperio Público';
