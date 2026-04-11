# Imperio Público 🗞️

Portal de noticias dominicano con CMS de administración, bot de automatización con IA, y diseño editorial premium.

**Stack:** Next.js 16 · Supabase · Google Gemini AI · Tailwind CSS · Vercel Analytics

---

## 🚀 Deploy a Vercel (Producción)

### Paso 1 — Configurar Supabase

1. Entra a [supabase.com](https://supabase.com) → tu proyecto.
2. Ve a **SQL Editor** → pega y ejecuta el contenido de **`supabase_final.sql`** completo.
3. Ve a **Authentication → Users** → asegúrate de que tu usuario admin existe.
4. Ve a **Table Editor → profiles** → confirma que ese usuario tiene `role = 'admin'`.

### Paso 2 — Subir el código a GitHub

```bash
git add .
git commit -m "feat: listo para producción"
git push origin main
```

### Paso 3 — Deploy en Vercel

1. Entra a [vercel.com](https://vercel.com) → **Add New Project**.
2. Importa el repositorio desde GitHub.
3. En **Environment Variables**, agrega las siguientes:

| Variable | Descripción | Requerida |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto en Supabase | ✅ Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon de Supabase | ✅ Sí |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo servidor) | ✅ Sí |
| `NEXT_PUBLIC_SITE_URL` | Tu dominio, ej: `https://imperiopublico.com` | ✅ Sí |
| `NEXT_PUBLIC_ADSENSE_ID` | ID de Google AdSense | Opcional |
| `GEMINI_API_KEY` | Solo para el bot de automatización | Opcional |

4. Haz clic en **Deploy**. ¡Listo! 🎉

### Paso 4 — Dominio Personalizado (Opcional)

En Vercel → tu proyecto → **Settings → Domains** → agrega tu dominio.

---

## 🤖 Bot de Automatización

El bot publica artículos automáticamente usando Google News + Gemini AI.

```bash
# Ejecutar manualmente por categoría:
node scripts/agent.js noticias
node scripts/agent.js deportes
node scripts/agent.js entretenimiento
node scripts/agent.js tecnologia
node scripts/agent.js economia
```

> El bot respeta el toggle del Dashboard de Admin.  
> Si está **PAUSADO** desde el panel, no publicará nada.

---

## 🛠️ Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env.local con las variables de entorno (ver arriba)

# 3. Iniciar servidor local
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000)  
Panel Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📁 Estructura del Proyecto

```
news-portal/
├── app/
│   ├── page.js              # Portada principal
│   ├── articulo/[slug]/     # Página de artículo
│   ├── categoria/[slug]/    # Página por categoría
│   ├── admin/               # Panel CMS completo
│   │   ├── page.js          # Dashboard
│   │   ├── articulos/       # CRUD de artículos
│   │   ├── usuarios/        # Gestión de equipo
│   │   └── login/           # Login admin
│   └── auth/sign-out/       # Cierre de sesión
├── components/              # Componentres reutilizables
├── lib/                     # Data fetching, Supabase clients
├── scripts/
│   └── agent.js             # Bot de publicación automática
├── supabase_final.sql       # ← SQL DEFINITIVO para Supabase
└── .env.local               # Variables de entorno (no commitear)
```

---

## 🔐 Roles y Permisos

| Rol | Publicar | Editar Propio | Editar Todo | Borrar | Panel Usuarios | Control Bot |
|---|---|---|---|---|---|---|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Editor** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

© 2026 Imperio Público. La Autoridad de la Actualidad.
