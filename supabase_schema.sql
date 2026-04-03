-- ============================================================
-- PulsoNoticias — Schema SQL para Supabase
-- Ejecuta este script en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ─── 1. TABLA PRINCIPAL DE ARTÍCULOS ────────────────────────
CREATE TABLE IF NOT EXISTS public.articles (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  excerpt       TEXT,
  content       TEXT,
  category      TEXT NOT NULL DEFAULT 'noticias',
  author        TEXT,
  owner         TEXT,
  "authorBio"   TEXT,
  image         TEXT,
  "imageAlt"    TEXT,
  "publishedAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ DEFAULT NOW(),
  featured      BOOLEAN DEFAULT FALSE,
  trending      BOOLEAN DEFAULT FALSE,
  tags          TEXT[] DEFAULT '{}',
  "readTime"    INTEGER DEFAULT 3,
  views         INTEGER DEFAULT 0
);

-- ─── 2. ÍNDICES PARA RENDIMIENTO ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_articles_category  ON public.articles (category);
CREATE INDEX IF NOT EXISTS idx_articles_featured  ON public.articles (featured);
CREATE INDEX IF NOT EXISTS idx_articles_trending  ON public.articles (trending);
CREATE INDEX IF NOT EXISTS idx_articles_published ON public.articles ("publishedAt" DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug      ON public.articles (slug);

-- ─── 3. ROW LEVEL SECURITY (RLS) ────────────────────────────
-- Permite lectura pública a todos los artículos
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Política: LECTURA pública (cualquiera puede leer)
CREATE POLICY "articles_public_read"
  ON public.articles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política: ESCRITURA solo para usuarios autenticados (admin panel)
CREATE POLICY "articles_authenticated_write"
  ON public.articles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── 4. FUNCIÓN: actualizar updatedAt automáticamente ────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── 5. DATOS DE MUESTRA (seed) ─────────────────────────────
INSERT INTO public.articles 
  (id, slug, title, excerpt, content, category, author, "authorBio", image, "imageAlt", "publishedAt", "updatedAt", featured, trending, tags, "readTime", views)
VALUES
(
  '1',
  'nueva-era-inteligencia-artificial-2025',
  'La Inteligencia Artificial redefine el futuro del trabajo en 2025',
  'Expertos analizan cómo los modelos de IA generativa están transformando industrias enteras y creando nuevas oportunidades laborales.',
  E'La transformación digital que estamos viviendo en 2025 es sin precedentes. Los modelos de inteligencia artificial generativa han dejado de ser una curiosidad tecnológica para convertirse en herramientas fundamentales en empresas de todos los sectores.\n\n**El impacto en el mercado laboral**\n\nSegún el último informe del Foro Económico Mundial, se estima que la IA creará 97 millones de nuevos empleos para 2025, mientras que automatizará aproximadamente 85 millones de puestos de trabajo actuales.\n\n**¿Qué sectores lideran la adopción?**\n\nEl sector financiero ha sido uno de los primeros en adoptar masivamente estas tecnologías, seguido por la salud, la educación y el entretenimiento.',
  'tecnologia',
  'María González',
  'Periodista especializada en tecnología e innovación',
  'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
  'Inteligencia artificial y robótica futurista',
  '2025-04-01T10:00:00Z',
  '2025-04-01T10:00:00Z',
  true,
  true,
  ARRAY['inteligencia artificial', 'tecnología', 'trabajo', 'innovación'],
  5,
  12450
),
(
  '2',
  'copa-america-2025-resultados',
  'Copa América 2025: Los resultados que nadie esperaba en la fase de grupos',
  'La primera jornada de la Copa América 2025 dejó sorpresas mayúsculas. Analizamos los partidos más impactantes.',
  E'La Copa América 2025 arrancó con todo. La primera jornada dejó resultados que pocos analistas anticipaban.\n\n**Las grandes sorpresas**\n\nEl combinado de Bolivia logró un empate histórico ante Brasil en el Maracaná. Venezuela derrotó por primera vez a Colombia en un encuentro de grupo.\n\n**Los favoritos**\n\nArgentina arrancó con victoria 3-0 ante Ecuador, con Julián Álvarez como protagonista.',
  'deportes',
  'Carlos Herrera',
  'Analista deportivo con 15 años de experiencia',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  'Copa América fútbol estadio',
  '2025-04-01T08:30:00Z',
  '2025-04-01T09:00:00Z',
  false,
  true,
  ARRAY['copa america', 'fútbol', 'deportes', 'latinoamérica'],
  4,
  9870
),
(
  '3',
  'pelicula-oscars-2025-ganadora',
  '"Memorias del Ayer" arrasa en los Óscar 2025 con 7 estatuillas',
  'La película latinoamericana se convierte en la gran protagonista de la noche de Hollywood, haciendo historia.',
  E'La 97ª ceremonia de los Premios de la Academia quedará grabada en la historia del cine latinoamericano. "Memorias del Ayer" se convirtió en la gran triunfadora con siete estatuillas.\n\n**Una noche histórica**\n\nPor primera vez en la historia, una película hablada íntegramente en español gana el premio a la Mejor Película.\n\n**El discurso que emocionó al mundo**\n\nAndrea Restrepo dedicó el premio a todos los cineastas latinoamericanos.',
  'entretenimiento',
  'Sofía Ramírez',
  'Crítica de cine y cultura pop',
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
  'Ceremonia de los premios Óscar Hollywood',
  '2025-04-01T07:00:00Z',
  '2025-04-01T07:30:00Z',
  true,
  false,
  ARRAY['Óscar', 'cine', 'entretenimiento', 'latinoamérica'],
  3,
  15320
),
(
  '4',
  'economia-latinoamerica-crecimiento',
  'Economía latinoamericana: proyecciones optimistas para el segundo semestre',
  'El FMI revisa al alza sus previsiones para América Latina, impulsadas por el auge del sector tecnológico.',
  E'El FMI revisó al alza sus proyecciones de crecimiento para América Latina, elevando la estimación al 3.2% para el año en curso.\n\n**Los motores del crecimiento**\n\nTres factores son clave: el auge tecnológico en Colombia, Chile y México; el incremento de inversión extranjera; y la estabilización cambiaria.\n\n**El desafío de la inflación**\n\nVarios países mantienen tasas por encima del 5%, obligando a políticas monetarias restrictivas.',
  'economia',
  'Roberto Silva',
  'Economista y analista financiero',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
  'Gráficas de economía y finanzas',
  '2025-04-01T06:00:00Z',
  '2025-04-01T06:30:00Z',
  false,
  false,
  ARRAY['economía', 'FMI', 'latinoamérica', 'crecimiento'],
  4,
  4230
),
(
  '5',
  'salud-dieta-mediterranea-beneficios',
  'Ciencia confirma: la dieta mediterránea reduce un 30% el riesgo cardíaco',
  'Un nuevo estudio con más de 500.000 participantes reafirma los beneficios cardiovasculares de la dieta mediterránea.',
  E'Un estudio mundial publicado en el New England Journal of Medicine confirma los beneficios de la dieta mediterránea.\n\n**Los hallazgos**\n\nLa investigación, que siguió a más de 500.000 personas en 22 países durante 7 años, encontró un 30% menos de probabilidades de sufrir un infarto.\n\n**¿En qué consiste?**\n\nSe basa en frutas, verduras, legumbres, aceite de oliva virgen extra y pescado.',
  'salud',
  'Dra. Carmen López',
  'Médica especialista en nutrición y dietética',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80',
  'Alimentos saludables dieta mediterránea',
  '2025-03-31T15:00:00Z',
  '2025-03-31T15:00:00Z',
  false,
  false,
  ARRAY['salud', 'nutrición', 'dieta', 'corazón'],
  3,
  7890
),
(
  '6',
  'festival-musica-lollapalooza-2025',
  'Lollapalooza 2025: todo lo que necesitas saber antes de ir',
  'Chile vuelve a ser epicentro del rock y la música alternativa. Cartel completo, horarios y consejos.',
  E'El Lollapalooza Chile 2025 se celebra en el Parque Bicentenario de Cerrillos, con más de 70 artistas en 8 escenarios.\n\n**Los actos principales**\n\nBillie Eilish, Arctic Monkeys, Bad Bunny y The Weeknd encabezan el cartel. Feid, Bizarrap y Tini también estarán presentes.\n\n**Consejos prácticos**\n\nLlega temprano, lleva protector solar, hidratación suficiente y calzado cómodo.',
  'entretenimiento',
  'Diego Morales',
  'Periodista musical y de cultura',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  'Festival de música multitudinario',
  '2025-03-31T12:00:00Z',
  '2025-03-31T12:00:00Z',
  false,
  true,
  ARRAY['Lollapalooza', 'música', 'festival', 'Chile'],
  3,
  11200
),
(
  '7',
  'elecciones-opinion-democracia',
  'La democracia en tiempos de desinformación: un desafío urgente',
  'La proliferación de fake news y la polarización política amenazan los pilares de la democracia moderna.',
  E'En un mundo donde cualquier persona puede publicar contenido que llega a millones de personas, la democracia enfrenta uno de sus mayores retos: la desinformación masiva.\n\n**El problema en cifras**\n\nEl 58% de los ciudadanos latinoamericanos afirma haber encontrado noticias falsas al menos una vez por semana.\n\n**Soluciones desde la sociedad civil**\n\nOrganizaciones como Chequeado, Lupa y AFP Factual trabajan incansablemente para verificar la información.',
  'opinion',
  'Prof. Ana Martínez',
  'Politóloga y docente universitaria',
  'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80',
  'Votación democrática urnas',
  '2025-03-31T09:00:00Z',
  '2025-03-31T09:00:00Z',
  false,
  false,
  ARRAY['democracia', 'desinformación', 'política', 'opinión'],
  5,
  5670
),
(
  '8',
  'arte-urbano-latinoamerica',
  'El arte urbano latinoamericano conquista los museos de Nueva York',
  'Grafiteros y muralistas de México, Colombia y Argentina llevan su obra a las galerías más prestigiosas del mundo.',
  E'El arte urbano latinoamericano ha dado un salto cualitativo impresionante. Lo que nació en las calles de Bogotá, Ciudad de México y Buenos Aires ahora cuelga en el MoMA y el Whitney Museum de Nueva York.\n\n**La exposición que lo cambió todo**\n\n"Muros que hablan" exhibe obras de más de 40 artistas de 12 países. Las críticas han sido entusiastas.\n\n**El mercado del arte urbano**\n\nLas piezas alcanzan tens de miles de dólares en subastas.',
  'cultura',
  'Valentina Cruz',
  'Crítica de arte y curadora independiente',
  'https://images.unsplash.com/photo-1551913902-c92207136625?w=800&q=80',
  'Mural de arte urbano colorido',
  '2025-03-30T14:00:00Z',
  '2025-03-30T14:00:00Z',
  false,
  false,
  ARRAY['arte urbano', 'cultura', 'latinoamérica', 'museos'],
  4,
  3450
)
ON CONFLICT (id) DO NOTHING;

-- ─── 6. VERIFICACIÓN ────────────────────────────────────────
SELECT COUNT(*) AS total_articles FROM public.articles;
SELECT id, slug, category, featured, trending FROM public.articles ORDER BY "publishedAt" DESC;
