-- Migración: Convertir la columna 'tags' de text a text[]
-- Ejecuta este script en el SQL Editor de Supabase si la columna ya existe como 'text'

-- Paso 1: Agregar columna temporal
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags_new text[];

-- Paso 2: Migrar datos existentes (si estaban guardados como string separado por coma)
UPDATE articles
SET tags_new = string_to_array(
  regexp_replace(tags::text, '\s*#\s*', '', 'g'),
  ','
)
WHERE tags IS NOT NULL AND array_length(tags::text[], 1) IS NULL;

-- Paso 3: Si ya era text[], solo copiar
UPDATE articles
SET tags_new = tags::text[]
WHERE tags IS NOT NULL AND tags_new IS NULL;

-- Paso 4: Drop columna vieja y renombrar (SOLO si la columna actual NO es ya text[])
-- Descomenta las siguientes líneas SOLO si necesitas hacer la migración completa:
-- ALTER TABLE articles DROP COLUMN tags;
-- ALTER TABLE articles RENAME COLUMN tags_new TO tags;

-- ALTERNATIVA MÁS SIMPLE (si la columna no existe o es nueva):
-- ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags text[];

-- NOTA: Si ya es text[], no necesitas hacer nada. 
-- Supabase acepta guardar arrays de JavaScript directamente en columnas text[].
