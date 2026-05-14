/**
 * app/api/og/route.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Genera la miniatura cinematic-editorial de redes sociales para Imperio Público.
 * URL: /api/og?slug=article-slug
 *
 * Formato: 1080×1350 vertical Instagram (portrait).
 * Diseño: Foto full-bleed + gradiente dramático + logo top-left + líneas
 * decorativas blancas + badge categoría + titular serif grande + extracto + botón.
 */

import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const BRAND      = '#3A0009';   // Granate oscuro profundo
const BRAND_MID  = '#5C0015';   // Granate medio
const BRAND_RED  = '#C0001A';   // Rojo vibrante CTA
const GOLD       = '#C9A84C';   // Acento dorado
const WIDTH      = 1080;
const HEIGHT     = 1350;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return new Response('Missing slug', { status: 400 });
    }

    // ── Datos del artículo ──────────────────────────────────────────────────
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

    const title    = String(article.title   || 'Imperio Público');
    const excerpt  = String(article.excerpt || '').slice(0, 145);
    const imageUrl = article.image?.split('?')[0] || null;

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
    }[String(article.category || '').toLowerCase()] || 'TEMA DEL DÍA';

    // ── Fuente Playfair Display (serif elegante) ────────────────────────────
    let playfairFont = null;
    try {
      const fontRes = await fetch(
        'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.woff',
        { signal: AbortSignal.timeout(4000) }
      );
      if (fontRes.ok) playfairFont = await fontRes.arrayBuffer();
    } catch (_) { /* fallback a Georgia */ }

    // ── Dots decorativos (grilla 5×5) ───────────────────────────────────────
    const dots25 = Array.from({ length: 25 });

    // ── Tamaño de fuente adaptativo ─────────────────────────────────────────
    const titleLen    = title.length;
    const titleFontSz = titleLen > 80 ? 52 : titleLen > 55 ? 62 : 72;
    const titleCapped = titleLen > 130 ? title.slice(0, 127) + '…' : title;
    const excerptCapped = excerpt.length > 130 ? excerpt.slice(0, 127) + '…' : excerpt;

    const serifFamily = playfairFont ? 'Playfair, Georgia, serif' : 'Georgia, serif';

    return new ImageResponse(
      (
        /* ── CANVAS ────────────────────────────────────────────────────── */
        <div
          style={{
            width: `${WIDTH}px`,
            height: `${HEIGHT}px`,
            position: 'relative',
            display: 'flex',
            backgroundColor: BRAND,
            overflow: 'hidden',
          }}
        >
          {/* ── CAPA 1: Foto full-bleed ── */}
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center 20%',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex',
                background: `linear-gradient(160deg, ${BRAND_MID} 0%, ${BRAND} 100%)`,
              }}
            />
          )}

          {/* ── CAPA 2: Gradiente overlay — top sutil, fondo dramático ── */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              background:
                'linear-gradient(to bottom,' +
                'rgba(30,0,6,0.10) 0%,' +
                'rgba(30,0,6,0.18) 25%,' +
                'rgba(35,0,8,0.55) 45%,' +
                'rgba(35,0,8,0.82) 62%,' +
                'rgba(30,0,6,0.95) 78%,' +
                'rgba(26,0,5,0.99) 100%)',
            }}
          />

          {/* ── CAPA 3: Vignette lateral (bordes oscuros cinematográficos) ── */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              background:
                'radial-gradient(ellipse at center, transparent 55%, rgba(10,0,2,0.55) 100%)',
            }}
          />

          {/* ── CAPA 4: Líneas curvas blancas (decorativas) ── */}
          <svg
            width={WIDTH}
            height={HEIGHT}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ position: 'absolute', top: 0, left: 0, display: 'flex' }}
          >
            {/* Línea curva principal — diagonal descendente */}
            <path
              d={`M -60 ${HEIGHT * 0.38} Q ${WIDTH * 0.30} ${HEIGHT * 0.52} ${WIDTH * 0.72} ${HEIGHT * 0.44}`}
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="1.5"
              fill="none"
            />
            {/* Segunda curva — más suave */}
            <path
              d={`M ${WIDTH * 0.15} ${HEIGHT * 0.30} Q ${WIDTH * 0.55} ${HEIGHT * 0.50} ${WIDTH + 40} ${HEIGHT * 0.42}`}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
              fill="none"
            />
            {/* Línea tenue inferior */}
            <path
              d={`M 0 ${HEIGHT * 0.60} Q ${WIDTH * 0.4} ${HEIGHT * 0.57} ${WIDTH} ${HEIGHT * 0.63}`}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
              fill="none"
            />
            {/* Acento rojo sutil — diagonal */}
            <path
              d={`M 0 ${HEIGHT * 0.68} Q ${WIDTH * 0.25} ${HEIGHT * 0.65} ${WIDTH * 0.50} ${HEIGHT * 0.67}`}
              stroke={`rgba(192,0,26,0.30)`}
              strokeWidth="2"
              fill="none"
            />
          </svg>

          {/* ── CAPA 5: Patrón de puntos decorativos — esquina derecha ── */}
          <div
            style={{
              position: 'absolute',
              top: 68,
              right: 52,
              display: 'flex',
              flexWrap: 'wrap',
              width: '82px',
              gap: '9px',
              opacity: 0.28,
            }}
          >
            {dots25.map((_, i) => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  display: 'flex',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* ── CAPA 6: Patrón de puntos — izquierda media ── */}
          <div
            style={{
              position: 'absolute',
              top: HEIGHT * 0.40,
              left: 32,
              display: 'flex',
              flexWrap: 'wrap',
              width: '56px',
              gap: '8px',
              opacity: 0.18,
            }}
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  display: 'flex',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* ── CAPA 7: Logo top-left ── */}
          <div
            style={{
              position: 'absolute',
              top: '48px',
              left: '52px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            {/* Corona SVG */}
            <svg
              width="38"
              height="34"
              viewBox="0 0 50 44"
              fill="none"
              style={{ display: 'flex' }}
            >
              <path d="M4 34L11 14L20 28L25 8L30 28L39 14L46 34H4Z" fill="white" />
              <circle cx="4"  cy="13" r="4" fill="white" />
              <circle cx="25" cy="6"  r="4" fill="white" />
              <circle cx="46" cy="13" r="4" fill="white" />
              <rect x="2" y="35" width="46" height="6" rx="2.5" fill="white" />
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  color: 'white',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  lineHeight: '1',
                  display: 'flex',
                  fontFamily: serifFamily,
                }}
              >
                IMPERIO PÚBLICO
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: GOLD,
                  letterSpacing: '3px',
                  display: 'flex',
                  textTransform: 'uppercase',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                TU PERIÓDICO, TU VOZ
              </div>
            </div>
          </div>

          {/* ── CAPA 8: Contenido inferior (badge + titular + extracto + botón) ── */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              padding: '0 56px 64px',
            }}
          >
            {/* Línea separadora dorada */}
            <div
              style={{
                width: '56px',
                height: '3px',
                backgroundColor: GOLD,
                display: 'flex',
                marginBottom: '22px',
                opacity: 0.85,
              }}
            />

            {/* Badge de categoría */}
            <div style={{ display: 'flex', marginBottom: '20px' }}>
              <div
                style={{
                  backgroundColor: BRAND_RED,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  letterSpacing: '2.5px',
                  padding: '7px 20px',
                  display: 'flex',
                  textTransform: 'uppercase',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {categoryLabel}
              </div>
            </div>

            {/* Titular principal — serif dramático */}
            <div
              style={{
                fontSize: `${titleFontSz}px`,
                fontWeight: 'bold',
                color: 'white',
                lineHeight: '1.18',
                display: 'flex',
                flexWrap: 'wrap',
                letterSpacing: '-0.8px',
                marginBottom: '18px',
                fontFamily: serifFamily,
                textShadow: '0 2px 20px rgba(0,0,0,0.6)',
              }}
            >
              {titleCapped}
            </div>

            {/* Extracto / descripción */}
            {excerptCapped && (
              <div
                style={{
                  fontSize: '19px',
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: '1.55',
                  display: 'flex',
                  flexWrap: 'wrap',
                  marginBottom: '30px',
                  fontFamily: 'Arial, sans-serif',
                  letterSpacing: '0.1px',
                }}
              >
                {excerptCapped}
              </div>
            )}

            {/* Botón LEER MÁS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div
                style={{
                  backgroundColor: BRAND_RED,
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  letterSpacing: '3px',
                  padding: '14px 38px',
                  display: 'flex',
                  textTransform: 'uppercase',
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                LEER MÁS
              </div>

              {/* Dominio del sitio */}
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '1.5px',
                  display: 'flex',
                  fontFamily: 'Arial, sans-serif',
                  textTransform: 'uppercase',
                }}
              >
                imperiopublico.com
              </div>
            </div>
          </div>

          {/* ── BORDE INFERIOR ROJO ── */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '5px',
              backgroundColor: BRAND_RED,
              display: 'flex',
            }}
          />
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: playfairFont
          ? [{ name: 'Playfair', data: playfairFont, weight: 700, style: 'normal' }]
          : [],
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      }
    );
  } catch (e) {
    console.error('[OG] Error:', e.message);
    return new Response('Failed to generate image: ' + e.message, { status: 500 });
  }
}
