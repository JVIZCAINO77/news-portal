
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const articleData = {
  title: "Donald Trump endurece sanciones contra Cuba: Nueva escalada en la política exterior de EE. UU.",
  slug: "donald-trump-amplia-las-sanciones-de-estados-unidos-contra-el-gobierno-cubano-2026",
  excerpt: "El presidente de Estados Unidos firma una orden ejecutiva que amplía el cerco económico sobre la isla, citando preocupaciones de seguridad nacional y alianzas con Irán.",
  content: `
## El anuncio que redefine la relación bilateral

En una jornada marcada por la tensión diplomática, el presidente de Estados Unidos, **Donald Trump**, ha dado un paso decisivo en su política hacia el Caribe al firmar una nueva orden ejecutiva este viernes 1 de mayo. Según adelantaron fuentes de la Casa Blanca a la agencia **Reuters**, la medida no solo amplía las sanciones existentes, sino que introduce mecanismos de castigo secundario para cualquier entidad o individuo que realice transacciones con los sectores sancionados en Cuba.

Este endurecimiento de la postura estadounidense busca, según el texto oficial, neutralizar lo que Washington describe como un "entorno propicio para operaciones hostiles" de inteligencia extranjera y terrorismo a menos de 160 kilómetros de sus costas. La administración Trump ha sido explícita en señalar que La Habana mantiene alianzas estratégicas con grupos como **Hezbolá** e influencias de **Irán**, lo que representa una amenaza directa a la seguridad nacional de los Estados Unidos.

## Alcance de las nuevas medidas económicas

Las sanciones apuntan quirúrgicamente a civiles, funcionarios de alto rango y empresas estatales que colaboran activamente con el aparato de seguridad del gobierno cubano. Sin embargo, lo más preocupante para la economía de la isla es la inclusión de los "castigos secundarios". Estos permitirán al Departamento del Tesoro de EE. UU. sancionar a bancos o empresas de terceros países que mantengan relaciones comerciales con las entidades cubanas designadas.

"No permitiremos que el régimen de La Habana utilice el sistema financiero internacional para financiar su aparato de represión y corrupción", declaró un funcionario bajo anonimato. La medida busca asfixiar las fuentes de divisas que aún fluyen hacia el Estado cubano, afectando directamente a sectores clave como la logística, el turismo controlado por militares y la red de empresas importadoras.

## Reacción de La Habana y contexto regional

La respuesta de Cuba no se hizo esperar. El canciller **Bruno Rodríguez** rechazó categóricamente la medida, calificándola como un acto de "agresión económica" basado en pretextos fabricados. Para el gobierno cubano, la acusación de nexos con el terrorismo internacional es una estrategia recurrente de Washington para justificar el bloqueo económico que ha durado más de seis décadas.

Analistas internacionales coinciden en que este movimiento de Trump refuerza su base electoral en el sur de la Florida, pero también advierten sobre las consecuencias humanitarias en una isla que ya atraviesa una de sus peores crisis de desabastecimiento. La inclusión de Cuba en una narrativa que la vincula con conflictos en el Medio Oriente escala el conflicto a un nivel de confrontación que recuerda los momentos más álgidos de la Guerra Fría.

## Impacto para el sector privado y la sociedad civil

Aunque las sanciones dicen enfocarse en el aparato gubernamental, expertos señalan que el "efecto de sobrecumplimiento" (overcompliance) por parte de bancos internacionales terminará afectando el envío de remesas y la operatividad de los pequeños emprendedores cubanos (mipymes). Al restringirse los canales financieros, el costo de la vida para el ciudadano común tiende a aumentar, mientras que el gobierno central suele priorizar el gasto militar y de seguridad.

Este nuevo paquete de sanciones se suma a una serie de restricciones de viaje y comerciales impuestas durante los últimos años, dejando claro que el diálogo diplomático iniciado hace una década ha sido completamente sustituido por una política de máxima presión. El mundo observa con cautela cómo esta decisión impactará no solo la estabilidad de Cuba, sino también las relaciones de EE. UU. con sus aliados europeos y latinoamericanos que mantienen inversiones significativas en la mayor de las Antillas.
  `.trim(),
  tags: ["Trump", "Cuba", "Sanciones", "Internacional", "Diplomacia"],
  category: "internacional",
  author: "Redacción Internacional",
  image: "https://image.pollinations.ai/prompt/Donald%20Trump%20signing%20an%20executive%20order%20with%20a%20background%20showing%20the%20Cuban%20flag%20and%20an%20airport.%20Editorial%20news%20photography%20style,%20cinematic%20lighting.%2016:9%20aspect%20ratio?width=1280&height=720&nologo=true",
  imageAlt: "Donald Trump firma orden ejecutiva contra el gobierno de Cuba",
  source_link: "https://www.msn.com/es-xl/noticias/other/donald-trump-ampl%C3%ADa-las-sanciones-de-estados-unidos-contra-el-gobierno-cubano/ar-AA22buBa",
  publishedAt: new Date().toISOString(),
  featured: true,
  trending: true
};

async function publishArticle() {
  const { data, error } = await supabase
    .from('articles')
    .insert(articleData)
    .select('id, title')
    .single();

  if (error) {
    console.error('Error publishing article:', error.message);
    return;
  }

  console.log('✅ Artículo publicado con éxito:', JSON.stringify(data, null, 2));
}

publishArticle();
