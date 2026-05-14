/**
 * app/api/og/route.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Genera la miniatura de redes sociales estilo "Imperio Público" para cada
 * artículo. URL: /api/og?slug=article-slug
 *
 * Diseño: fondo granate oscuro, foto del artículo, banda con título, logo IP.
 * Formato 1080×1080 (cuadrado, óptimo para Instagram + Facebook).
 */

import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'; // Necesita Node.js para Supabase

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL || 'https://imperiopublico.com';
const BRAND     = '#7A0020'; // Granate oscuro Imperio Público
const BRAND_RED = '#C0001A'; // Rojo vibrante (etiqueta + botón)
const WIDTH     = 1080;
const HEIGHT    = 1080;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug', { status: 400 });
    }

    // Obtener datos del artículo desde Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data: article } = await supabase
      .from('articles')
      .select('title, excerpt, category, image, slug')
      .eq('slug', slug)
      .single();

    if (!article) {
      return new Response('Article not found', { status: 404 });
    }

    // Preparar datos
    const title    = article.title   || 'Imperio Público';
    const excerpt  = (article.excerpt || '').slice(0, 120);
    const category = (article.category || 'Noticias').toUpperCase();
    const imageUrl = article.image?.split('?')[0] || null;

    // Mapeo de categoría a etiqueta
    const categoryLabel = {
      politica:       'POLÍTICA',
      deportes:       'DEPORTES',
      economia:       'ECONOMÍA',
      sucesos:        'SUCESOS',
      policia:        'POLICÍA',
      internacional:  'INTERNACIONAL',
      tecnologia:     'TECNOLOGÍA',
      entretenimiento:'ENTRETENIMIENTO',
      salud:          'SALUD',
      cultura:        'CULTURA',
      tendencias:     'TENDENCIAS',
    }[article.category?.toLowerCase()] || 'TEMA DEL DÍA';

    return new ImageResponse(
      (
        <div
          style={{
            width: `${WIDTH}px`,
            height: `${HEIGHT}px`,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: BRAND,
            fontFamily: 'Georgia, serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ── FOTO DEL ARTÍCULO (parte superior ~60%) ── */}
          <div
            style={{
              width: '100%',
              height: '640px',
              display: 'flex',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', backgroundColor: '#3a0010', display: 'flex' }} />
            )}

            {/* Degradado inferior sobre la foto para legibilidad */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '280px',
                background: 'linear-gradient(to bottom, transparent, rgba(90,0,20,0.92))',
                display: 'flex',
              }}
            />

            {/* ── LOGO IP en esquina superior izquierda ── */}
            <div
              style={{
                position: 'absolute',
                top: '24px',
                left: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                background: 'rgba(90,0,20,0.65)',
                padding: '8px 14px 10px',
                borderLeft: '4px solid #C0001A',
              }}
            >
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  display: 'flex',
                  lineHeight: '1',
                }}
              >
                IMPERIO PÚBLICO
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: '#C9A84C',
                  letterSpacing: '2.5px',
                  display: 'flex',
                  marginTop: '3px',
                  textTransform: 'uppercase',
                }}
              >
                TU PERIÓDICO, TU VOZ
              </div>
            </div>

            {/* ── ETIQUETA DE CATEGORÍA ── */}
            <div
              style={{
                position: 'absolute',
                bottom: '80px',
                left: '32px',
                backgroundColor: BRAND_RED,
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                letterSpacing: '1.5px',
                padding: '6px 18px',
                display: 'flex',
              }}
            >
              {categoryLabel}
            </div>
          </div>

          {/* ── PANEL INFERIOR: Título + Extracto + Botón ── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '28px 36px 30px',
              backgroundColor: BRAND,
            }}
          >
            {/* Título del artículo */}
            <div
              style={{
                fontSize: title.length > 60 ? '38px' : '46px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: '1.2',
                display: 'flex',
                flexWrap: 'wrap',
                letterSpacing: '-0.5px',
              }}
            >
              {title.length > 100 ? title.slice(0, 97) + '…' : title}
            </div>

            {/* Extracto */}
            {excerpt && (
              <div
                style={{
                  fontSize: '20px',
                  color: 'rgba(255,255,255,0.80)',
                  lineHeight: '1.45',
                  display: 'flex',
                  flexWrap: 'wrap',
                  marginTop: '12px',
                }}
              >
                {excerpt.length > 110 ? excerpt.slice(0, 107) + '…' : excerpt}
              </div>
            )}

            {/* Fila inferior: botón + URL */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '20px',
              }}
            >
              {/* Botón LEER MÁS */}
              <div
                style={{
                  backgroundColor: BRAND_RED,
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  letterSpacing: '1.5px',
                  padding: '10px 28px',
                  display: 'flex',
                }}
              >
                LEER MÁS
              </div>

              {/* URL del sitio */}
              <div
                style={{
                  fontSize: '18px',
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: '1px',
                  display: 'flex',
                }}
              >
                imperiopublico.com
              </div>
            </div>
          </div>

          {/* ── BORDE INFERIOR ── */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '4px',
              backgroundColor: BRAND_RED,
              display: 'flex',
            }}
          />
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache 24h
        },
      }
    );
  } catch (e) {
    console.error('[OG] Error:', e.message);
    return new Response('Failed to generate image: ' + e.message, { status: 500 });
  }
}
