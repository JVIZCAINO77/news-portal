// app/admin/page.js — Panel de administración (CMS) con Roles
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CATEGORIES, SAMPLE_ARTICLES } from '@/lib/data';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // { username, role }
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // States for Article Editor
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [form, setForm] = useState({
    title: '', excerpt: '', content: '', category: 'noticias',
    author: '', owner: '', authorBio: '', image: '', imageAlt: '',
    featured: false, trending: false, readTime: 3,
    tags: '',
  });
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // States for User Manager
  const [showUserEditor, setShowUserEditor] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '', role: 'writer' });

  useEffect(() => {
    // 1. Restaurar Sesión
    const authUser = sessionStorage.getItem('admin_authUser');
    if (authUser) {
      const parsed = JSON.parse(authUser);
      setTimeout(() => {
        setCurrentUser(parsed);
        setActiveTab(parsed.role === 'admin' ? 'dashboard' : 'articles');
        setAuthenticated(true);
      }, 0);
    }

    // 2. Inicializar Usuarios desde localStorage
    const storedUsers = localStorage.getItem('portal_users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const initialUsers = [{ id: '1', username: 'admin', password: 'admin123', role: 'admin' }];
      setUsers(initialUsers);
      localStorage.setItem('portal_users', JSON.stringify(initialUsers));
    }

    // 3. Cargar artículos desde Supabase (fuente de verdad)
    import('@supabase/supabase-js').then(({ createClient }) => {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      sb.from('articles').select('*').order('publishedAt', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setArticles(data);
            localStorage.setItem('portal_articles', JSON.stringify(data));
          } else {
            const cached = localStorage.getItem('portal_articles');
            setArticles(cached ? JSON.parse(cached) : SAMPLE_ARTICLES);
          }
        });
    });
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      const authObj = { username: user.username, role: user.role };
      sessionStorage.setItem('admin_authUser', JSON.stringify(authObj));
      setCurrentUser(authObj);
      setActiveTab(user.role === 'admin' ? 'dashboard' : 'articles');
      setAuthenticated(true);
      setError('');
    } else {
      setError('Usuario o contraseña incorrectos.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authUser');
    setCurrentUser(null);
    setUsername('');
    setPassword('');
    setAuthenticated(false);
  };

  // ── USER MANAGEMENT ──────────────────────────────────
  const saveUsers = (updated) => {
    setUsers(updated);
    localStorage.setItem('portal_users', JSON.stringify(updated));
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    if (users.find(u => u.username === userForm.username)) {
      alert("El nombre de usuario ya está en uso.");
      return;
    }
    const newUser = { ...userForm, id: Date.now().toString() };
    saveUsers([...users, newUser]);
    setShowUserEditor(false);
    setUserForm({ username: '', password: '', role: 'writer' });
  };

  const handleDeleteUser = (id) => {
    if (id === '1') {
      alert('No puedes eliminar al administrador en jefe inicial.');
      return;
    }
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;
    saveUsers(users.filter((u) => u.id !== id));
  };


  // ── ARTICLE MANAGEMENT ──────────────────────────────────
  const saveArticles = async (updated) => {
    setArticles(updated);
    localStorage.setItem('portal_articles', JSON.stringify(updated));
    try {
      // Sincronizar al servidor para que la página web pública se recargue
      const { syncArticlesToServer } = await import('@/app/actions');
      await syncArticlesToServer(updated);
    } catch (e) { console.error(e); }
  };

  const deleteArticle = (id) => {
    if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return;
    saveArticles(articles.filter((a) => a.id !== id));
  };

  const toggleFeatured = (id) => {
    saveArticles(articles.map((a) => a.id === id ? { ...a, featured: !a.featured } : a));
  };

  const toggleTrending = (id) => {
    saveArticles(articles.map((a) => a.id === id ? { ...a, trending: !a.trending } : a));
  };

  const openEditor = (article = null) => {
    if (article) {
      setForm({
        title: article.title, excerpt: article.excerpt, content: article.content,
        category: article.category, author: article.author, owner: article.owner || '', authorBio: article.authorBio || '',
        image: article.image, imageAlt: article.imageAlt || '',
        featured: article.featured, trending: article.trending,
        readTime: article.readTime, tags: article.tags?.join(', ') || '',
      });
      setEditingArticle(article);
    } else {
      setForm({ title: '', excerpt: '', content: '', category: 'noticias', author: currentUser?.username || '', owner: currentUser?.username || '', authorBio: '', image: '', imageAlt: '', featured: false, trending: false, readTime: 3, tags: '' });
      setEditingArticle(null);
    }
    setShowEditor(true);
  };

  const handleSaveArticle = (e) => {
    e.preventDefault();
    const slug = form.title.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 80);

    const articleData = {
      ...form,
      slug,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      publishedAt: editingArticle?.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: editingArticle?.views || 0,
      id: editingArticle?.id || Date.now().toString(),
    };

    if (editingArticle) {
      saveArticles(articles.map((a) => a.id === editingArticle.id ? articleData : a));
    } else {
      saveArticles([articleData, ...articles]);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setShowEditor(false); }, 1500);
  };

  // ── IMAGE UPLOAD TO CLOUDINARY ────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Solo se permiten archivos de imagen.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('La imagen no puede superar 10MB.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'news_portal');
      formData.append('folder', 'news-portal/articles');

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/DKKW77byz/image/upload`,
        { method: 'POST', body: formData }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Error al subir');
      }
      const data = await res.json();
      // URL con optimización automática: WebP, calidad auto, máx 1200px
      const optimizedUrl = data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1200/');
      setForm((prev) => ({ ...prev, image: optimizedUrl }));
    } catch (err) {
      setUploadError('Error al subir: ' + err.message);
    } finally {
      setUploading(false);
    }
  };



  // ── RENDER COMPONENT: LOGIN ────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-dark)' }}>
        <div style={{ width: '100%', maxWidth: 400, padding: '40px 32px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 56, height: 56, background: 'var(--color-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 28, color: '#fff' }}>P</div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Panel de Administración</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Módulo de Acceso</p>
          </div>
          <form onSubmit={handleLogin}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nombre de Usuario</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. admin"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 8,
                background: 'var(--color-surface-2)', border: `1px solid ${error ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: '#fff', fontSize: 14, marginBottom: 16, outline: 'none',
              }}
              autoFocus
            />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 8,
                background: 'var(--color-surface-2)', border: `1px solid ${error ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: '#fff', fontSize: 14, marginBottom: 8, outline: 'none',
              }}
            />

            {error && <p style={{ fontSize: 13, color: 'var(--color-primary)', marginBottom: 12 }}>{error}</p>}
            
            <button
              type="submit"
              style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: 'var(--color-primary)', border: 'none',
                color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                marginTop: 8,
              }}
            >
              Ingresar de forma segura →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── RENDER COMPONENT: GENERIC INPUT STYLES ────────────────────────────────────────────
  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 6,
    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
    color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 5, letterSpacing: '0.05em', textTransform: 'uppercase' };


  // ── RENDER COMPONENT: USER EDITOR MODAL ────────────────────────────────────
  if (showUserEditor) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-dark)', padding: '20px 16px' }}>
        <div className="max-w-2xl mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#fff' }}>
              👤 Nuevo Usuario
            </h1>
            <button onClick={() => setShowUserEditor(false)} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              ← Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveUser}>
            <div style={{ display: 'grid', gap: 16, background: 'var(--color-surface)', padding: 24, borderRadius: 12, border: '1px solid var(--color-border)' }}>
              <div>
                <label style={labelStyle}>Nombre de Usuario (Único) *</label>
                <input required style={inputStyle} value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value.toLowerCase().trim() })} placeholder="Ej: pedro_escritor" />
              </div>
              
              <div>
                <label style={labelStyle}>Contraseña *</label>
                <input required type="password" style={inputStyle} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="Contraseña segura" />
              </div>

              <div>
                <label style={labelStyle}>Rol de acceso *</label>
                <select style={inputStyle} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                  <option value="writer">✍️ Escritor (Solo publica y ve artículos)</option>
                  <option value="admin">👑 Administrador (Acceso total)</option>
                </select>
                <div style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 8}}>
                  * Los <strong>Escritores</strong> no pueden crear usuarios, ni entrar al dashboard principal general. Solo gestionan la redacción.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12 }}>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: 8, background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Añadir Usuario
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── RENDER COMPONENT: ARTICLE EDITOR MODAL ────────────────────────────────────
  if (showEditor) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-dark)', padding: '20px 16px' }}>
        <div className="max-w-4xl mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#fff' }}>
              {editingArticle ? '✏️ Editar Artículo' : '📝 Nuevo Artículo'}
            </h1>
            <button onClick={() => setShowEditor(false)} style={{ background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              ← Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveArticle}>
            <div style={{ display: 'grid', gap: 16 }}>
              {/* Título */}
              <div>
                <label style={labelStyle}>Título *</label>
                <input required style={{ ...inputStyle, fontSize: 16, padding: '12px 14px' }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título del artículo..." />
              </div>

              {/* Extracto */}
              <div>
                <label style={labelStyle}>Extracto / Entradilla *</label>
                <textarea required rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Resumen breve del artículo (aparece en las tarjetas)..." />
              </div>

              {/* Contenido */}
              <div>
                <label style={labelStyle}>Contenido *</label>
                <textarea required rows={14} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-serif)', lineHeight: 1.7 }} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Escribe el contenido completo del artículo aquí...&#10;&#10;Usa **texto** para negrita, dos saltos de línea para párrafos." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Categoría */}
                <div>
                  <label style={labelStyle}>Categoría *</label>
                  <select style={inputStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>

                {/* Tiempo de lectura */}
                <div>
                  <label style={labelStyle}>Tiempo de lectura (min)</label>
                  <input type="number" min={1} max={60} style={inputStyle} value={form.readTime} onChange={(e) => setForm({ ...form, readTime: parseInt(e.target.value) })} />
                </div>
              </div>

                {/* Propietario (Asignación) */}
                <div>
                  <label style={labelStyle}>Asignado a (Usuario interno)</label>
                  {currentUser?.role === 'admin' ? (
                    <select style={inputStyle} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>
                      <option value="">-- Sin asignar --</option>
                      {users.map(u => <option key={u.id} value={u.username}>@{u.username} ({u.role})</option>)}
                    </select>
                  ) : (
                    <input disabled style={{...inputStyle, opacity: 0.6}} value={'@' + form.owner} />
                  )}
                  <p style={{ fontSize: 10, color: 'var(--color-text-dim)', marginTop: 4 }}>Determina qué usuario del panel puede editar este artículo.</p>
                </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Autor */}
                <div>
                  <label style={labelStyle}>Nombre a mostrar (Display) *</label>
                  <input required style={inputStyle} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Ej. Redacción PulsoNoticias..." />
                  <p style={{ fontSize: 10, color: 'var(--color-text-dim)', marginTop: 4 }}>Nombre público que verán los lectores.</p>
                </div>

                {/* Bio autor */}
                <div>
                  <label style={labelStyle}>Bio del autor</label>
                  <input style={inputStyle} value={form.authorBio} onChange={(e) => setForm({ ...form, authorBio: e.target.value })} placeholder="Descripción breve..." />
                </div>
              </div>

              {/* Imagen — subida o URL */}
              <div>
                <label style={labelStyle}>Imagen destacada *</label>
                {/* Zona de arrastre / subida */}
                <div style={{ border: '2px dashed var(--color-border)', borderRadius: 8, padding: '20px 16px', textAlign: 'center', marginBottom: 8, background: 'rgba(255,255,255,0.02)', position: 'relative' }}>
                  <input
                    id="img-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <p style={{ color: 'var(--color-primary)', fontSize: 13, margin: 0 }}>⏳ Subiendo imagen...</p>
                  ) : (
                    <>
                      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 4px' }}>📁 Arrastra una imagen aquí o haz clic para seleccionar</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-dim)', margin: 0 }}>JPG, PNG, WebP · Máx. 5MB</p>
                    </>
                  )}
                </div>
                {uploadError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 6 }}>{uploadError}</p>}
                {/* O pegar URL */}
                <p style={{ fontSize: 11, color: 'var(--color-text-dim)', margin: '6px 0 4px', textAlign: 'center' }}>— o pegar URL de imagen —</p>
                <input style={inputStyle} type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://images.unsplash.com/..." />
              </div>

              {/* Alt imagen */}
              <div>
                <label style={labelStyle}>Texto alternativo de imagen (SEO)</label>
                <input style={inputStyle} value={form.imageAlt} onChange={(e) => setForm({ ...form, imageAlt: e.target.value })} placeholder="Descripción de la imagen para SEO y accesibilidad..." />
              </div>

              {/* Tags */}
              <div>
                <label style={labelStyle}>Etiquetas / Tags</label>
                <input style={inputStyle} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="tecnología, economía, latinoamérica (separadas por comas)..." />
              </div>

              {/* Checkboxes (Solo visibles si es ADMIN, los Writers no pueden destacar) */}
              {currentUser?.role === 'admin' && (
                <div style={{ display: 'flex', gap: 24 }}>
                  {[
                    { key: 'featured', label: '⭐ Artículo Destacado (Hero)' },
                    { key: 'trending', label: '🔥 En Tendencias' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--color-text-muted)' }}>
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}

              {/* Preview imagen */}
              {form.image && (
                <div>
                  <label style={labelStyle}>Vista previa de imagen</label>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image} alt="preview" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-border)' }} />
                </div>
              )}

              {/* Botones */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" onClick={() => setShowEditor(false)} style={{ padding: '12px 20px', borderRadius: 8, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 13, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '12px 24px', borderRadius: 8, background: saved ? '#16a34a' : 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'background 0.3s', minWidth: 140 }}>
                  {saved ? '✓ Guardado' : (editingArticle ? 'Guardar cambios' : 'Publicar artículo')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── RENDER COMPONENT: ADMIN TABS LOGIC ──────────────────────────────────────
  const stats = CATEGORIES.map((c) => ({
    ...c, count: articles.filter((a) => a.category === c.slug).length,
  }));

  // Generación de pestañas según rol del usuario logueado
  // Roles: "admin" y "writer"
  const allTabs = [
    { id: 'dashboard', label: '📊 Dashboard', roles: ['admin'] },
    { id: 'articles', label: '📰 Artículos', roles: ['admin', 'writer'] },
    { id: 'users', label: '👥 Usuarios', roles: ['admin'] },
  ];
  
  const allowedTabs = allTabs.filter(t => t.roles.includes(currentUser?.role));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-dark)' }}>
      {/* Admin Header Top Bar */}
      <div style={{ background: 'var(--color-dark-2)', borderBottom: '1px solid var(--color-border)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 18, color: '#fff', textDecoration: 'none' }}>
            Pulso<span style={{ color: 'var(--color-primary)' }}>Noticias</span>
          </Link>
          <div style={{ display: 'flex', gap: 4 }}>
            {allowedTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none',
                  background: activeTab === t.id ? 'var(--color-primary)' : 'transparent',
                  color: activeTab === t.id ? '#fff' : 'var(--color-text-muted)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginRight: 10 }}>
            Hola, <strong style={{color:'#fff'}}>{currentUser?.username}</strong> 
            <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, marginLeft: 6, textTransform: 'uppercase'}}>{currentUser?.role}</span>
          </span>
          <Link href="/" target="_blank" style={{ padding: '7px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
            🌐 Ver portal
          </Link>
          <button onClick={handleLogout} style={{ padding: '7px 14px', borderRadius: 6, background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* ─ DASHBOARD TAB (Solo ADMIN) ─ */}
        {activeTab === 'dashboard' && currentUser?.role === 'admin' && (
          <>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Dashboard General</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Resumen y analíticas de PulsoNoticias</p>
            </div>

            {/* Stats generales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total artículos', value: articles.length, icon: '📰', color: '#3b82f6' },
                { label: 'Destacados', value: articles.filter((a) => a.featured).length, icon: '⭐', color: '#f59e0b' },
                { label: 'En tendencias', value: articles.filter((a) => a.trending).length, icon: '🔥', color: 'var(--color-primary)' },
                { label: 'Total vistas', value: articles.reduce((s, a) => s + (a.views || 0), 0).toLocaleString('es'), icon: '👁', color: '#10b981' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Por categoría */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Artículos por sección</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div key={s.slug} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <span style={{ fontSize: 20 }}>{s.emoji}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: s.color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{s.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => openEditor()} style={{ padding: '12px 24px', borderRadius: 8, background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>+ Nuevo artículo</button>
            </div>
          </>
        )}

        {/* ─ USUARIOS TAB (Solo ADMIN) ─ */}
        {activeTab === 'users' && currentUser?.role === 'admin' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Usuarios del Sistema</h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Gestiona acceso, administradores y escritores.</p>
              </div>
              <button
                onClick={() => setShowUserEditor(true)}
                style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                + Añadir Usuario
              </button>
            </div>

            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) 200px 150px', background: 'var(--color-surface-2)', padding: '12px 24px', fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', textTransform: 'uppercase' }}>
                <div>Usuario</div>
                <div>Rol</div>
                <div style={{ textAlign: 'right' }}>Acciones</div>
              </div>
              {users.map(u => (
                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) 200px 150px', padding: '16px 24px', borderBottom: '1px solid var(--color-border)', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    @{u.username}
                    {u.id === '1' && <span style={{ marginLeft: 8, fontSize: 10, background: '#f59e0b22', color: '#f59e0b', padding: '2px 6px', borderRadius: 4 }}>ROOT</span>}
                  </div>
                  <div>
                    {u.role === 'admin' 
                      ? <span style={{ fontSize: 12, background: 'rgba(193,18,31,0.15)', color: 'var(--color-primary)', padding: '4px 8px', borderRadius: 4, fontWeight: 700 }}>👑 Admin</span>
                      : <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-dim)', padding: '4px 8px', borderRadius: 4, fontWeight: 700 }}>✍️ Escritor</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button onClick={() => handleDeleteUser(u.id)} disabled={u.id === '1'} style={{ padding: '6px 10px', borderRadius: 6, background: u.id === '1' ? 'transparent' : 'rgba(220,38,38,0.1)', border: u.id === '1' ? 'none' : '1px solid rgba(220,38,38,0.3)', color: u.id === '1' ? 'var(--color-text-dim)' : '#ef4444', fontSize: 12, cursor: u.id === '1' ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                      {u.id === '1' ? 'Inborrable' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─ ARTICLES TAB (AMBOS ROLES) ─ */}
        {activeTab === 'articles' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                  {currentUser?.role === 'writer' ? 'Tus Artículos' : 'Todos los Artículos'}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Mostrando redacciones en el sistema</p>
              </div>
              <button
                onClick={() => openEditor()}
                style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--color-primary)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                + Redactar nuevo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {articles.filter(a => currentUser?.role === 'admin' || a.owner === currentUser?.username).map((article) => {
                const cat = CATEGORIES.find((c) => c.slug === article.category);
                return (
                  <div
                    key={article.id}
                    style={{
                      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                      borderRadius: 8, padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    {/* Imagen miniatura */}
                    <div style={{ width: 64, height: 48, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: 'var(--color-surface-2)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {article.image && <img src={article.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {cat && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0 }}>
                            {cat.emoji} {cat.label}
                          </span>
                        )}
                        {article.featured && <span style={{ fontSize: 10, background: '#f59e0b22', color: '#f59e0b', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>⭐ Destacado</span>}
                        {article.trending && <span style={{ fontSize: 10, background: 'rgba(193,18,31,0.15)', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>🔥 Trending</span>}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{article.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 2 }}>
                        ✍️ {article.author} · {new Date(article.publishedAt).toLocaleDateString('es-ES')} · 👁 {(article.views || 0).toLocaleString('es')}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {currentUser?.role === 'admin' && (
                        <>
                          <button onClick={() => toggleFeatured(article.id)} title="Destacar" style={{ padding: '6px 10px', borderRadius: 6, background: article.featured ? '#f59e0b22' : 'var(--color-surface-2)', border: '1px solid var(--color-border)', cursor: 'pointer', fontSize: 14 }}>⭐</button>
                          <button onClick={() => toggleTrending(article.id)} title="Trending" style={{ padding: '6px 10px', borderRadius: 6, background: article.trending ? 'rgba(193,18,31,0.15)' : 'var(--color-surface-2)', border: '1px solid var(--color-border)', cursor: 'pointer', fontSize: 14 }}>🔥</button>
                        </>
                      )}
                      
                      {/* En una app de producción reales, un writer solo editaría SUS propios artículos. Aquí permitimos colaborar. */}
                      <button onClick={() => openEditor(article)} style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Editar</button>
                      <Link href={`/articulo/${article.slug}`} target="_blank" style={{ padding: '6px 12px', borderRadius: 6, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: 12, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>Ver</Link>
                      
                      {currentUser?.role === 'admin' && (
                        <button onClick={() => deleteArticle(article.id)} style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
