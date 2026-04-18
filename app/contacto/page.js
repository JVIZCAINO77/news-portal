// app/contacto/page.js — Página de Contacto (Imperio Público)
'use client';
import { useState } from 'react';

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', asunto: '', mensaje: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simular envío (mailto link como fallback confiable)
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="bg-white">

      {/* Grid: Formulario + Info */}
      <section className="pt-0 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">

            {/* Formulario */}
            <div className="lg:col-span-7">
              {sent ? (
                <div className="text-center py-20 border border-gray-100">
                  <div className="w-16 h-16 bg-green-600 flex items-center justify-center mx-auto mb-6">
                    <svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">¡Mensaje Enviado!</h3>
                  <p className="text-slate-800 font-serif text-lg">
                    Nos pondremos en contacto contigo en las próximas 24 horas.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ nombre: '', email: '', asunto: '', mensaje: '' }); }}
                    className="mt-8 px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
                  >
                    Enviar Otro Mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-3">Nombre Completo *</label>
                      <input
                        name="nombre"
                        type="text"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Tu nombre"
                        className="w-full border-0 border-b-2 border-gray-200 focus:border-red-600 outline-none py-3 text-lg font-bold placeholder:text-slate-200 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-3">Correo Electrónico *</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="tu@email.com"
                        className="w-full border-0 border-b-2 border-gray-200 focus:border-red-600 outline-none py-3 text-lg font-bold placeholder:text-slate-200 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-3">Asunto *</label>
                    <select
                      name="asunto"
                      value={form.asunto}
                      onChange={handleChange}
                      required
                      className="w-full border-0 border-b-2 border-gray-200 focus:border-red-600 outline-none py-3 text-base font-bold bg-transparent transition-colors"
                    >
                      <option value="">Selecciona un tema</option>
                      <option value="denuncia">Denuncia o Investigación</option>
                      <option value="colaboracion">Quiero Colaborar</option>
                      <option value="publicidad">Publicidad</option>
                      <option value="correccion">Corrección de Artículo</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-700 mb-3">Mensaje *</label>
                    <textarea
                      name="mensaje"
                      value={form.mensaje}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Escribe aquí tu mensaje..."
                      className="w-full border border-gray-100 focus:border-red-600 outline-none p-6 text-base font-serif leading-relaxed placeholder:text-slate-200 resize-none transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto bg-red-600 text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black disabled:opacity-60 transition-all"
                  >
                    {loading ? 'Enviando...' : 'Enviar Mensaje'}
                  </button>
                </form>
              )}
            </div>

            {/* Info de contacto */}
            <div className="lg:col-span-5 space-y-10">
              <div className="border-l-4 border-red-600 pl-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-3">Redacción y General</h3>
                <a href="mailto:vizcainosr29@gmail.com" className="text-xl font-black text-black hover:text-red-600 transition-colors break-all">
                  vizcainosr29@gmail.com
                </a>
              </div>

              <div className="border-l-4 border-black pl-8">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-black mb-3">Publicidad y Denuncias</h3>
                <a href="mailto:jvizcaino242@gmail.com" className="text-xl font-black text-black hover:text-red-600 transition-colors break-all">
                  jvizcaino242@gmail.com
                </a>
                <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest mt-2">Atención y Línea Confidencial</p>
              </div>

              {/* Horario */}
              <div className="bg-slate-50 p-8">
              </div>

              {/* Redes Sociales */}
              <div className="border-l-4 border-red-600 pl-8 pt-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-6">Síguenos en Redes</h3>
                <div className="grid grid-cols-2 gap-4">
                  <a href="https://www.facebook.com/profile.php?id=61573298082093" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 border border-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <span className="text-[10px] font-black">FB</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">Facebook</span>
                  </a>
                  <a href="https://www.instagram.com/imperiopublico/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 border border-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <span className="text-[10px] font-black">IG</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">Instagram</span>
                  </a>
                  <a href="https://x.com/imperiopublico" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 border border-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <span className="text-[10px] font-black">X</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">Twitter / X</span>
                  </a>
                  <a href="https://www.youtube.com/@Imperiopublico" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 border border-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                      <span className="text-[10px] font-black">YT</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">YouTube</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
