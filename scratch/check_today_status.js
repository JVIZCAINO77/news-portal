require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const start = new Date(today + 'T00:00:00-04:00').toISOString();
const end   = new Date(today + 'T23:59:59-04:00').toISOString();

const allCats = ['noticias','politica','policia','deportes','tecnologia','sucesos','entretenimiento','tendencias','economia','internacional','salud','cultura'];

(async () => {
  const { data } = await s.from('articles').select('category').gte('publishedAt', start).lte('publishedAt', end);
  const bycat = {};
  (data || []).forEach(a => { bycat[a.category] = (bycat[a.category] || 0) + 1; });
  
  console.log('Estado actual hoy (' + today + '):');
  allCats.forEach(c => {
    const n = bycat[c] || 0;
    const icon = n === 0 ? 'FALTA' : 'OK';
    console.log(' [' + icon + '] ' + c + ': ' + n + ' articulo(s)');
  });
  
  const missing = allCats.filter(c => !bycat[c]);
  console.log('\nSecciones SIN articulo hoy: ' + (missing.join(', ') || 'ninguna'));
  console.log('Total hoy: ' + (data || []).length + ' articulos');
})().catch(console.error);
