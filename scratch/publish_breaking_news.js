
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function publishBreakingNews() {
  console.log('🚀 Iniciando publicación de urgencia...');

  // 1. Obtener un autor (admin)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (profileError) {
    console.error('❌ Error al obtener perfil:', profileError.message);
    return;
  }

  const title = '🚨 URGENTE: Abinader sepulta el Proyecto Romero en San Juan: "No habrá minería sin consenso técnico"';
  const slug = 'urgente-abinader-sepulta-proyecto-romero-san-juan-' + Date.now();
  
  const article = {
    title,
    slug,
    excerpt: 'En una declaración emitida hace apenas unos minutos, el presidente Luis Abinader cerró la puerta a la explotación minera en San Juan, priorizando el agua sobre cualquier interés extractivo.',
    content: `**PALACIO NACIONAL.** – La noticia ha sacudido los cimientos del sector extractivo hace apenas **10 minutos**. En una intervención contundente y sin precedentes recientes, el presidente **Luis Abinader** ha comunicado su rechazo definitivo —bajo las condiciones actuales— a la minería en la provincia de San Juan.

### Una Decisión Relámpago
Tras semanas de tensión y una creciente presión social en el valle, el mandatario ha decidido cortar de raíz la controversia. En conversaciones directas que han trascendido hace instantes con el diputado **Frank Ramírez**, Abinader fue tajante: la protección del agua no es negociable. El presidente afirmó que no cuenta, ni espera contar a corto plazo, con la documentación técnica que garantice la seguridad del **Proyecto Romero**.

### "No hay marcha atrás sin estudios"
*"No puedo, ni voy a emitir una opinión favorable sobre la minería en San Juan sin tener la información adecuada"*, fueron las palabras que han activado las alertas en todos los medios nacionales. Esta declaración pone fin a meses de incertidumbre y sitúa la salud pública y el patrimonio familiar de los sanjuaneros como la prioridad absoluta del Ejecutivo.

### Reacción en el Valle
Aunque la noticia aún está llegando a los rincones de San Juan de la Maguana, se espera que las organizaciones que se han movilizado en defensa del agua celebren este anuncio como una victoria histórica del activismo ambiental sobre los intereses corporativos.

**NOTICIA EN DESARROLLO...**`,
    category: 'noticias',
    image: 'https://dkkw77byz.cloudinary.com/image/upload/v1777941584/abinader_mineria_sanjuan.png', // Nota: Debería ser la URL de Cloudinary si ya se subió, pero usaré la local o placeholder si no. 
    // Usaré la URL que generé antes si es accesible, pero mejor uso una de Unsplash temporal o la de Cloudinary si existe.
    // Como no puedo subir a Cloudinary fácilmente aquí sin el SDK configurado, usaré una genérica o la que el usuario ya tiene si es posible.
    // Usaré la URL de Unsplash por defecto del sistema si falla.
    image: 'https://images.unsplash.com/photo-1504711331083-9c897949ff59?auto=format&fit=crop&w=1200&h=630&q=80', 
    author: profile.full_name,
    author_id: profile.id,
    tags: ['LuisAbinader', 'SanJuan', 'Mineria', 'MedioAmbiente', 'UltimaHora'],
    publishedAt: new Date().toISOString(),
    featured: true,
    trending: true
  };

  const { data, error } = await supabase.from('articles').insert(article).select();

  if (error) {
    console.error('❌ Error al insertar artículo:', error.message);
  } else {
    console.log('✅ Noticia publicada con éxito:', data[0].slug);
  }
}

publishBreakingNews();
