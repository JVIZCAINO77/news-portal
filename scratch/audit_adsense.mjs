
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function getInventory() {
  console.log('--- Reporte de Inventario de Contenido ---')
  
  // 1. Total de artículos
  const { count, error: countError } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('Error al contar artículos:', countError)
    return
  }
  
  console.log(`Total de artículos publicados: ${count}`)
  
  // 2. Artículos por categoría
  const { data: articles, error: catError } = await supabase
    .from('articles')
    .select('category')
  
  if (catError) {
    console.error('Error al obtener categorías:', catError)
    return
  }
  
  const stats = articles.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1
    return acc
  }, {})
  
  console.log('\nDistribución por categoría:')
  Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cat, num]) => {
      console.log(`- ${cat}: ${num} artículos`)
    })
    
  // 3. Longitud promedio del contenido (últimos 10)
  const { data: recent, error: contentError } = await supabase
    .from('articles')
    .select('content, title')
    .order('publishedAt', { ascending: false })
    .limit(10)
    
  if (contentError) {
    console.error('Error al obtener contenido:', contentError)
    return
  }
  
  console.log('\nAnálisis de los últimos 10 artículos:')
  recent.forEach(art => {
    const words = art.content?.split(/\s+/).length || 0
    console.log(`- [${words} palabras] ${art.title}`)
  })
  
  const avgWords = recent.reduce((acc, curr) => acc + (curr.content?.split(/\s+/).length || 0), 0) / recent.length
  console.log(`\nPromedio de palabras (últimos 10): ${Math.round(avgWords)} palabras`)
  
  if (avgWords < 300) {
    console.log('⚠️ ALERTA: El contenido es muy corto (menos de 300 palabras). Esto causa rechazo por "Bajo Valor".')
  } else {
    console.log('✅ Longitud de contenido promedio aceptable.')
  }
}

getInventory()
