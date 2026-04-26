-- ============================================================
-- MIGRACIÓN DEFINITIVA: Columna 'tags' → text[] en Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- PASO 1: Verificar el tipo actual de la columna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'articles' AND column_name = 'tags';

-- PASO 2: Si la columna NO es text[], ejecuta esto para convertirla
-- (Supabase lo hace seguro con USING)
ALTER TABLE articles
  ALTER COLUMN tags TYPE text[]
  USING CASE
    -- Si ya es un array PostgreSQL bien formateado: {a,b,c}
    WHEN tags ~ '^{.*}$' THEN
      string_to_array(
        regexp_replace(trim(BOTH '{}' FROM tags), '"', '', 'g'),
        ','
      )
    -- Si viene como JSON array: ["a","b"]
    WHEN tags ~ '^\[.*\]$' THEN
      ARRAY(SELECT json_array_elements_text(tags::json))
    -- Si viene como texto separado por comas: "a, b, c"
    WHEN tags IS NOT NULL AND tags != '' THEN
      string_to_array(regexp_replace(tags, '\s*#\s*', '', 'g'), ',')
    -- Si está vacío/null
    ELSE NULL
  END;

-- PASO 3: Limpiar todos los tags existentes (eliminar # y espacios)
UPDATE articles
SET tags = ARRAY(
  SELECT trim(regexp_replace(unnest(tags), '^#|\s+', '', 'g'))
  FROM (SELECT tags) t
  WHERE trim(regexp_replace(unnest(tags), '^#|\s+', '', 'g')) != ''
)
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0;

-- PASO 4: Confirmar resultado
SELECT id, title, tags 
FROM articles 
WHERE tags IS NOT NULL 
ORDER BY "publishedAt" DESC 
LIMIT 10;
