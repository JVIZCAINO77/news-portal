'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

/* ─── Data ────────────────────────────────────────────────────────────── */
const REPUBLICA = [
  { slug:'opinion',label:'Opinión'},{ slug:'gobierno',label:'Gobierno'},
  { slug:'politica',label:'Política'},{ slug:'justicia',label:'Justicia'},
  { slug:'congreso',label:'Congreso'},{ slug:'educacion',label:'Educación'},
  { slug:'ciudad',label:'Ciudad'},{ slug:'migracion',label:'Migración'},
  { slug:'provincias',label:'Provincias'},
];

const POPULAR = [
  { slug:'deportes',      label:'Deportes',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg> },
  { slug:'entretenimiento',label:'Entretenimiento',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="3"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg> },
  { slug:'tecnologia',    label:'Tecnología',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
  { slug:'salud',         label:'Salud',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
  { slug:'vida',          label:'Vida',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg> },
  { slug:'cultura',       label:'Cultura',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18M9 21V7l3-4 3 4v14M3 21V11l6-4M21 21V11l-6-4"/></svg> },
  { slug:'turismo',       label:'Turismo',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  { slug:'moda',          label:'Moda',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
];

const INTERNACIONAL = [
  { region:'América', items:[
    {slug:'eeuu',label:'EE.UU.'},{slug:'haiti',label:'Haití'},
    {slug:'puerto-rico',label:'Puerto Rico'},{slug:'venezuela',label:'Venezuela'},
    {slug:'el-caribe',label:'El Caribe'},{slug:'america',label:'América Latina'},
  ]},
  { region:'Europa', items:[
    {slug:'espana',label:'España'},{slug:'europa',label:'Europa'},
  ]},
  { region:'Asia y África', items:[
    {slug:'china',label:'China'},{slug:'asia',label:'Asia'},{slug:'africa',label:'África'},
  ]},
];

const MULTIMEDIA = [
  { href:'/categoria/tv', label:'Videos', desc:'Noticias en vídeo',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg> },
  { href:'/categoria/cultura', label:'Galerías', desc:'Imágenes del día',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { href:'/newsletter', label:'Podcasts', desc:'Escucha nuestros programas',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> },
  { href:'/categoria/sucesos', label:'En Vivo', desc:'Transmisiones en directo',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/></svg> },
];

/* ─── Sub-components ──────────────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <span className="block w-1 h-5 rounded-full" style={{background:'#C40010'}}/>
      <span style={{fontFamily:"'Inter','Poppins',sans-serif",fontSize:'11px',fontWeight:900,letterSpacing:'0.18em',textTransform:'uppercase',color:'#C40010'}}>{children}</span>
    </div>
  );
}

function ViewAllBtn({ href, label, onClose }) {
  return (
    <Link href={href} onClick={onClose}
      className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between group transition-colors"
      style={{color:'#C40010'}}
    >
      <span style={{fontSize:'11px',fontWeight:800,letterSpacing:'0.15em',textTransform:'uppercase'}}>{label}</span>
      <span className="group-hover:translate-x-1 transition-transform" style={{fontSize:'16px'}}>›</span>
    </Link>
  );
}

/* ─── Main component ──────────────────────────────────────────────────── */
export default function MegaMenu({ isOpen, onClose }) {
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/articles/latest?limit=4')
      .then(r => r.ok ? r.json() : [])
      .then(d => setTrending(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[105]" style={{background:'rgba(0,0,0,0.45)',backdropFilter:'blur(2px)'}} onClick={onClose}/>

      {/* Panel */}
      <div
        className="absolute left-0 right-0 top-full z-[110]"
        style={{
          background:'#FFFFFF',
          boxShadow:'0 20px 60px rgba(0,0,0,0.15)',
          borderTop:'3px solid #C40010',
          maxHeight:'88vh',
          overflowY:'auto',
          animation:'megaSlideDown 0.22s ease-out',
          fontFamily:"'Inter','Poppins',sans-serif",
        }}
      >
        {/* Top close bar */}
        <div style={{background:'#F7F7F7',borderBottom:'1px solid #EBEBEB',padding:'8px 24px',display:'flex',justifyContent:'flex-end'}}>
          <button onClick={onClose} aria-label="Cerrar" style={{background:'none',border:'none',cursor:'pointer',fontSize:'18px',color:'#999',fontWeight:700,lineHeight:1}} className="hover:text-black transition-colors">✕</button>
        </div>

        {/* 4-column grid */}
        {/* Mobile: horizontal snap scroll | Desktop: 4-col grid */}
        <div className="ip-mega-cols">

          {/* ── Col 1: NOTICIAS PRINCIPALES ── */}
          <div>
            <SectionLabel>Noticias Principales</SectionLabel>

            {/* Quick-access cards */}
            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'24px'}}>
              {[
                { href:'/categoria/nacional',   color:'#C40010', title:'ÚLTIMO MINUTO',  desc:'Las noticias al instante',
                  icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 5h-2v6l5.25 3.15.75-1.23-4-2.42V7z"/></svg> },
                { href:'/categoria/tendencias', color:'#d97706', title:'DESTACADAS',     desc:'Lo más relevante del día',
                  icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg> },
                { href:'/categoria/opinion',    color:'#7c3aed', title:'EXCLUSIVAS',     desc:'Investigaciones y reportajes',
                  icon:<svg viewBox="0 0 24 24" fill="currentColor" style={{width:18,height:18}}><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5z"/></svg> },
              ].map(q => (
                <Link key={q.href} href={q.href} onClick={onClose} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderRadius:'10px',border:'1px solid #F0F0F0',background:'#FAFAFA',textDecoration:'none',transition:'all 0.18s ease'}}
                  className="hover:border-red-200 hover:bg-red-50 hover:shadow-sm group"
                >
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{color:q.color,flexShrink:0}}>{q.icon}</div>
                    <div>
                      <div style={{fontSize:'11px',fontWeight:900,letterSpacing:'0.1em',color:'#111',textTransform:'uppercase'}}>{q.title}</div>
                      <div style={{fontSize:'12px',color:'#999',marginTop:2}}>{q.desc}</div>
                    </div>
                  </div>
                  <span style={{color:'#CCC',fontSize:'20px',lineHeight:1}} className="group-hover:text-red-500 group-hover:translate-x-0.5 transition-all">›</span>
                </Link>
              ))}
            </div>

            {/* República */}
            <div style={{borderTop:'1px solid #F0F0F0',paddingTop:16}}>
              <span style={{fontSize:'10px',fontWeight:900,letterSpacing:'0.25em',color:'#C40010',textTransform:'uppercase',display:'block',marginBottom:10}}>República</span>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px 12px'}}>
                {REPUBLICA.map(i => (
                  <Link key={i.slug} href={`/categoria/${i.slug}`} onClick={onClose}
                    style={{fontSize:'13px',color:'#555',textDecoration:'none',padding:'3px 0',transition:'color 0.15s'}}
                    className="hover:text-red-600"
                  >{i.label}</Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Col 2: CATEGORÍAS POPULARES ── */}
          <div>
            <SectionLabel>Categorías Populares</SectionLabel>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              {POPULAR.map(cat => (
                <Link key={cat.slug} href={`/categoria/${cat.slug}`} onClick={onClose}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'14px 10px',borderRadius:'10px',border:'1px solid #F0F0F0',background:'#FAFAFA',textDecoration:'none',transition:'all 0.18s ease',textAlign:'center'}}
                  className="hover:border-red-200 hover:bg-red-50 hover:shadow-sm group"
                >
                  <div style={{color:'#C40010',width:26,height:26}} className="group-hover:scale-110 transition-transform">{cat.icon}</div>
                  <span style={{fontSize:'11px',fontWeight:700,color:'#333',lineHeight:1.2}} className="group-hover:text-red-600 transition-colors">{cat.label}</span>
                </Link>
              ))}
            </div>
            <ViewAllBtn href="/categoria/entretenimiento" label="Ver todas las categorías" onClose={onClose}/>
          </div>

          {/* ── Col 3: INTERNACIONAL ── */}
          <div>
            <SectionLabel>Internacional</SectionLabel>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              {INTERNACIONAL.map(({ region, items }) => (
                <div key={region}>
                  <span style={{display:'block',fontSize:'11px',fontWeight:800,color:'#111',letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:6,borderBottom:'1px solid #F0F0F0',paddingBottom:4}}>{region}</span>
                  <ul style={{listStyle:'none',padding:0,margin:0,display:'flex',flexDirection:'column',gap:4}}>
                    {items.map(i => (
                      <li key={i.slug} style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{width:5,height:5,borderRadius:'50%',background:'#C40010',flexShrink:0,display:'inline-block'}}/>
                        <Link href={`/categoria/${i.slug}`} onClick={onClose}
                          style={{fontSize:'13px',color:'#555',textDecoration:'none',transition:'color 0.15s'}}
                          className="hover:text-red-600"
                        >{i.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <ViewAllBtn href="/categoria/internacional" label="Ver más del mundo" onClose={onClose}/>
          </div>

          {/* ── Col 4: TENDENCIAS ── */}
          <div>
            <SectionLabel>Tendencias</SectionLabel>
            <div style={{background:'linear-gradient(135deg,#fff5f5 0%,#fff 100%)',borderRadius:'10px',padding:'10px 12px',marginBottom:14,display:'flex',alignItems:'center',gap:8,border:'1px solid #FFDDDD'}}>
              <svg viewBox="0 0 24 24" fill="#f97316" style={{width:16,height:16}}><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg>
              <span style={{fontSize:'11px',fontWeight:900,letterSpacing:'0.15em',color:'#111',textTransform:'uppercase'}}>Lo Más Leído</span>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {trending.length > 0 ? trending.slice(0,4).map((art, i) => (
                <Link key={art.id} href={`/articulo/${art.slug}`} onClick={onClose}
                  style={{display:'flex',alignItems:'flex-start',gap:12,padding:'8px',borderRadius:8,textDecoration:'none',transition:'background 0.15s'}}
                  className="hover:bg-gray-50 group"
                >
                  <span style={{fontSize:'26px',fontWeight:900,color:'#EEE',lineHeight:1,flexShrink:0,width:30,textAlign:'right',fontFamily:'Georgia,serif'}}>{String(i+1).padStart(2,'0')}</span>
                  <p style={{flex:1,fontSize:'12.5px',fontWeight:600,color:'#333',lineHeight:1.4,margin:0}} className="group-hover:text-red-600 transition-colors line-clamp-2">{art.title}</p>
                  {art.image_url && <img src={art.image_url} alt="" style={{width:48,height:40,objectFit:'cover',borderRadius:6,flexShrink:0}}/>}
                </Link>
              )) : Array.from({length:4},(_,i)=>(
                <div key={i} style={{display:'flex',gap:12,padding:8}}>
                  <div style={{width:30,height:16,background:'#F3F4F6',borderRadius:4}}/>
                  <div style={{flex:1,height:32,background:'#F3F4F6',borderRadius:4}}/>
                  <div style={{width:48,height:40,background:'#F3F4F6',borderRadius:6}}/>
                </div>
              ))}
            </div>
            <ViewAllBtn href="/categoria/tendencias" label="Ver todas las tendencias" onClose={onClose}/>
          </div>
        </div>

        {/* ── FOOTER MULTIMEDIA ── */}
        <div style={{borderTop:'1px solid #EBEBEB',background:'#F7F7F7',padding:'16px 28px'}}>
          <div className="ip-mega-footer">

            <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
              <span style={{display:'block',width:4,height:18,background:'#C40010',borderRadius:2}}/>
              <span style={{fontSize:'10px',fontWeight:900,letterSpacing:'0.2em',color:'#C40010',textTransform:'uppercase'}}>Multimedia</span>
            </div>

            {MULTIMEDIA.map(m => (
              <Link key={m.label} href={m.href} onClick={onClose}
                style={{display:'flex',alignItems:'center',gap:12,textDecoration:'none'}}
                className="group"
              >
                <div style={{width:42,height:42,borderRadius:'50%',background:'#FFF',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',display:'flex',alignItems:'center',justifyContent:'center',color:'#C40010',flexShrink:0}} className="group-hover:shadow-md transition-shadow">{m.icon}</div>
                <div>
                  <p style={{fontSize:'13px',fontWeight:800,color:'#111',margin:0}} className="group-hover:text-red-600 transition-colors">{m.label}</p>
                  <p style={{fontSize:'11px',color:'#AAA',margin:0}}>{m.desc}</p>
                </div>
              </Link>
            ))}

            {/* Branding card */}
            <div style={{background:'#111',borderRadius:12,padding:'10px 16px',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
              <div style={{width:38,height:38,background:'#FFF',borderRadius:'50%',overflow:'hidden',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <img src="/icon.png" alt="IP" style={{width:30,height:30,objectFit:'contain'}}/>
              </div>
              <div>
                <p style={{fontSize:'13px',fontWeight:900,color:'#FFF',margin:0}}>Imperio Público</p>
                <p style={{fontSize:'10px',color:'rgba(255,255,255,0.45)',margin:0}}>Siempre contigo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes megaSlideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}

        /* ── Mobile first: single column scroll ── */
        .ip-mega-cols {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 0;
          max-width: 1280px;
          margin: 0 auto;
        }
        .ip-mega-cols > div {
          padding: 20px 16px;
          border-bottom: 1px solid #F0F0F0;
        }
        .ip-mega-cols > div:last-child { border-bottom: none; }

        /* Multimedia footer: stack on mobile */
        .ip-mega-footer {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: flex-start;
        }

        /* ── Desktop: 4-column grid ── */
        @media (min-width: 768px) {
          .ip-mega-cols {
            display: grid;
            grid-template-columns: 1.1fr 1fr 0.9fr 1fr;
            gap: 36px;
            padding: 32px 28px;
          }
          .ip-mega-cols > div {
            padding: 0;
            border-bottom: none;
          }
          .ip-mega-footer {
            display: grid;
            grid-template-columns: auto 1fr 1fr 1fr 1fr auto;
            gap: 24px;
            align-items: center;
          }
        }
      `}</style>
    </>
  );
}
