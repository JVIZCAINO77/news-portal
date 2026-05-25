-- Migration: social_tokens table
-- Almacena tokens de redes sociales de forma persistente en Supabase.
-- Cuando el token de Facebook expira o es invalidado, se puede renovar desde
-- el panel admin sin necesidad de tocar variables de entorno en Vercel.

CREATE TABLE IF NOT EXISTS social_tokens (
  id          text PRIMARY KEY,           -- 'facebook_page', 'instagram', etc.
  token       text NOT NULL,              -- El access token actual
  token_type  text NOT NULL DEFAULT 'page', -- 'page' | 'user' | 'system'
  expires_at  timestamptz,               -- NULL = permanente / no expira
  user_token  text,                      -- Long-lived user token para renovar el page token
  platform    text NOT NULL DEFAULT 'facebook',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  notes       text
);

-- RLS: solo service_role puede leer/escribir (nunca expuesto al cliente)
ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;

-- Insertar el token actual de Facebook/Instagram
INSERT INTO social_tokens (id, token, token_type, expires_at, platform, notes)
VALUES (
  'facebook_page',
  'EAAXKg5nhBoEBRlj878wgnHBBlVzmj7PiYA3gsZCRXQhyxOUO2lsnQ4PPvmJ6sSDecQClroUiutChnReurZAZA8jbOZCRBIDHZA5QF7j45mIzntcaVFhssJjS3yzWgsrICo0EW49kZBDA8Dphb42JYlvECUcykCiVZBRZA0RPw3y25IZBdLse8ZB7QiCbZAJHGOL6spb23ovGYZBAwJNR62vxBM2z',
  'page',
  now() + interval '59 days',  -- Expira ~24 julio 2026
  'facebook',
  'Renovado manualmente el 2026-05-25. Renovar antes del 2026-07-24.'
)
ON CONFLICT (id) DO UPDATE SET
  token      = EXCLUDED.token,
  expires_at = EXCLUDED.expires_at,
  updated_at = now(),
  notes      = EXCLUDED.notes;
