// components/BreakingTicker.jsx — Ticker de noticias en tiempo real
'use client';
import { useState } from 'react';

const BREAKING = [
  '🔴 URGENTE: Nuevas medidas económicas anunciadas por el gobierno',
  '⚽ La selección clasificó a semifinales tras victoria histórica por 3-1',
  '🎬 "Memorias del Ayer" arrasa con 7 premios Óscar',
  '💻 Apple anuncia el iPhone 17 con IA integrada de nueva generación',
  '📈 Bolsas de valores latinoamericanas cierran con ganancias del 2.3%',
  '🏥 OMS confirma que nueva vacuna reduce en 80% contagios de gripe',
  '🎵 Bad Bunny rompe récord mundial con 10 millones de streams en 24 horas',
];

export default function BreakingTicker() {
  const [paused, setPaused] = useState(false);
  const repeated = [...BREAKING, ...BREAKING];

  return (
    <div style={{
      background: 'var(--color-dark-2)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      height: 38,
    }}>
      {/* Label */}
      <div style={{
        background: 'var(--color-primary)',
        padding: '0 16px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        flexShrink: 0,
        zIndex: 1,
      }}>
        <span className="live-dot" />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          En Vivo
        </span>
      </div>

      {/* Ticker */}
      <div
        className="ticker-wrapper flex-1"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ cursor: 'default' }}
      >
        <div
          className="ticker-content"
          style={{ animationPlayState: paused ? 'paused' : 'running' }}
        >
          {repeated.map((item, i) => (
            <span key={i} style={{
              fontSize: 12, fontWeight: 500,
              color: 'var(--color-text-muted)',
              padding: '0 32px',
              whiteSpace: 'nowrap',
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
