
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertArticle() {
  const article = {
    title: 'Tragedia en Pedro Brand: Niño de 4 años muere al caer en una cisterna; comunidad exige respuestas',
    slug: 'tragedia-pedro-brand-muere-nino-cisterna',
    excerpt: 'El menor, de nacionalidad extranjera, perdió la vida la tarde de este domingo en un solar del centro del pueblo, reavivando el debate sobre la seguridad en terrenos baldíos.',
    content: `La comunidad de Pedro Brand se encuentra sumida en una profunda consternación tras la trágica muerte de un niño de apenas 4 años de edad. El menor, cuya identidad se reserva por respeto a su familia pero de quien se sabe era de nacionalidad extranjera, perdió la vida de forma accidental al caer en una cisterna ubicada en un solar en el centro del municipio.

El fatídico incidente ocurrió la tarde de este domingo. Según informaciones preliminares recabadas en el lugar, el pequeño cayó en el depósito de agua en circunstancias que las autoridades aún intentan esclarecer. El hallazgo del cuerpo generó una ola de desesperación entre los familiares y vecinos que intentaron auxiliarlo, lamentablemente sin éxito.

### Un llamado urgente a la seguridad
La tragedia ha provocado una reacción inmediata de los residentes de Pedro Brand. Diversos líderes comunitarios y vecinos han hecho un llamado enérgico a las autoridades municipales y policiales para que se inicie una investigación exhaustiva sobre las condiciones del terreno donde se encuentra la cisterna.

"No podemos permitir que sigan ocurriendo estas desgracias por negligencia. Hay muchos solares abiertos con pozos y cisternas sin tapa que son una trampa mortal para nuestros niños", expresó un residente visiblemente afectado.

La comunidad exige que se adopten medidas preventivas rigurosas, especialmente en espacios abiertos o abandonados que representen un peligro latente. Este hecho ha reavivado el debate sobre la responsabilidad de los propietarios de terrenos baldíos y la necesidad de una regulación más estricta sobre la protección de estructuras en áreas urbanas.

Se espera que en las próximas horas las autoridades ofrezcan un informe oficial sobre el caso. Mientras tanto, el sector permanece de luto ante la pérdida de una vida tan joven en circunstancias tan lamentables.`,
    category: 'noticias',
    image: '/images/news/tragedia-pedro-brand.png',
    author: 'Redacción Imperio Público',
    tags: ['PedroBrand', 'Tragedia', 'Sucesos', 'SeguridadCiudadana'],
    publishedAt: new Date().toISOString(),
    featured: true,
    trending: true
  };

  const { data, error } = await supabase.from('articles').insert(article).select();

  if (error) {
    console.error('Error inserting article:', error);
  } else {
    console.log('Article inserted successfully:', data);
  }
}

insertArticle();
