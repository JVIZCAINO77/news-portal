// app/nosotros/page.js — Página Sobre Nosotros (Imperio Público)
import { SITE_CONFIG } from '@/lib/data';

export const metadata = {
  title: 'Nosotros | Imperio Público',
  description: 'Conoce al equipo editorial de Imperio Público. Información veraz, inmediata y de alta calidad para la comunidad dominicana.',
};

const TEAM = [
  { name: 'Carlos Mendoza', role: 'Director de Noticias', bio: 'Periodista con 15 años de experiencia en medios nacionales. Especialista en política y economía dominicana.' },
  { name: 'Valeria Reyes', role: 'Editora de Entretenimiento', bio: 'Comunicadora social apasionada por la cultura y el entretenimiento. Cobertura de la farándula local e internacional.' },
  { name: 'Marcos Alarcón', role: 'Editor Deportivo', bio: 'Ex deportista y comentarista. Pasión por el béisbol y el fútbol dominicano con análisis profundos.' },
  { name: 'Elena Torres', role: 'Editora Tecnológica', bio: 'Ingeniera en sistemas reconvertida a periodista digital. Cubre innovación, startups y tendencias tech.' },
  { name: 'Roberto Silva', role: 'Editor Económico', bio: 'Economista y analista financiero. Cobertura de mercados, finanzas personales y economía dominicana.' },
];

export default function NosotrosPage() {
  return (
    <div className="bg-white">

      <section className="pt-0 pb-24 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div id="mision" className="border-l-4 border-red-600 pl-8 scroll-mt-24">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4">Nuestra Misión</h2>
              <p className="text-lg font-serif text-slate-800 leading-relaxed">
                Proveer información veraz, oportuna y accesible a todos los dominicanos dentro y fuera del país, 
                con rigor periodístico y responsabilidad ética.
              </p>
            </div>
            <div id="vision" className="border-l-4 border-black pl-8 scroll-mt-24">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-black mb-4">Nuestra Visión</h2>
              <p className="text-lg font-serif text-slate-800 leading-relaxed">
                Ser el portal de noticias de referencia de la República Dominicana, reconocido por su excelencia 
                editorial y su compromiso con la verdad.
              </p>
            </div>
            <div id="valores" className="border-l-4 border-slate-300 pl-8 scroll-mt-24">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800 mb-4">Nuestros Valores</h2>
              <ul className="space-y-3">
                {['Veracidad', 'Objetividad', 'Independencia editorial', 'Responsabilidad social', 'Innovación'].map(v => (
                  <li key={v} className="text-lg font-serif text-slate-800 leading-relaxed">— {v}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Equipo Editorial */}
      <section className="py-24 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-16">
            <h2 className="text-5xl font-black uppercase tracking-tighter italic">Equipo Editorial</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 hidden md:block">5 profesionales</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {TEAM.map((member) => (
              <div key={member.name} className="border border-gray-100 p-10 hover:border-red-600 transition-colors group">
                <div className="w-16 h-16 bg-black group-hover:bg-red-600 transition-colors flex items-center justify-center mb-6">
                  <span className="text-2xl font-black text-white">{member.name.charAt(0)}</span>
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black mb-1">{member.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-4">{member.role}</p>
                <p className="text-sm font-serif text-slate-800 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-black text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">¿Quieres unirte a nuestro equipo?</h2>
          <p className="text-slate-200 font-serif text-lg mb-10">
            Siempre buscamos periodistas apasionados y comprometidos con la verdad.
          </p>
          <a
            href="mailto:redaccion@imperiopublico.com"
            className="inline-block bg-red-600 text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all"
          >
            Escríbenos
          </a>
        </div>
      </section>
    </div>
  );
}
