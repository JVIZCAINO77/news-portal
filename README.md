# PulsoNoticias — Portal de Noticias y Entretenimiento

Portal de noticias digital moderno construido con **Next.js 14 + App Router + JavaScript + Tailwind CSS**.

## 🚀 Arrancar en desarrollo

```bash
SET PATH=C:\;%PATH% && npm run dev
```

O en PowerShell:
```powershell
$env:PATH = "C:\;$env:PATH"; npm run dev
```

Luego abre: **http://localhost:3000**

## 📂 Estructura

```
app/
├── page.js                    → Página principal
├── articulo/[slug]/page.js    → Vista de artículo (SSG + SEO)
├── categoria/[slug]/page.js   → Páginas de categoría
├── admin/page.js              → CMS / Panel de administración
├── sitemap.js                 → Sitemap dinámico
└── robots.js                  → robots.txt

components/
├── Header.jsx                 → Navegación sticky
├── Footer.jsx                 → Pie de página
├── BreakingTicker.jsx         → Ticker de noticias
├── ArticleCard.jsx            → Tarjeta (hero/medium/small/list)
├── AdUnit.jsx                 → Slots de Google AdSense
└── AdSenseScript.jsx          → Inyección del script AdSense

lib/
└── data.js                    → Artículos de muestra, categorías, helpers
```

## 🔐 Panel de Administración

1. Ve a: **http://localhost:3000/admin**
2. Contraseña por defecto: `admin123`
3. Puedes:
   - Crear, editar y eliminar artículos
   - Marcar artículos como Destacados o Trending
   - Ver estadísticas por categoría

## 📰 Google AdSense

Configura tu ID de AdSense en `lib/data.js`:

```js
adsenseId: 'ca-pub-TUIDSDITORIAL',  // ← reemplaza aquí
```

Slots disponibles (reemplaza los IDs de slot):
- **Leaderboard** bajo el header
- **Rectangle 300×250** en sidebar
- **In-Article** entre el contenido
- **Leaderboard** antes del footer

## 🔍 SEO + GEO

- ✅ Metadata API (title, description, OG, Twitter Cards)
- ✅ JSON-LD: `NewsArticle`, `NewsMediaOrganization`, `WebSite`, `BreadcrumbList`
- ✅ Sitemap.xml dinámico (`/sitemap.xml`)
- ✅ robots.txt (`/robots.txt`)
- ✅ SSG para artículos (pre-rendizados, indexables)
- ✅ `next/image` para optimización de imágenes
- ✅ Headers de seguridad y rendimiento

## 🌐 Despliegue

```bash
npm run build
npm start
```

O despliega en **Vercel** (recomendado) conectando el repositorio Git.
