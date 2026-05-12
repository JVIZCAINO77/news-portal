require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const validCategories = [
  'politica', 'policia', 'deportes', 'tecnologia', 'sucesos', 
  'entretenimiento', 'tendencias', 'economia', 'internacional', 
  'salud', 'cultura'
];

// Mapping for common invalid categories to valid ones
const categoryMapping = {
  'noticias': 'sucesos',
  'nacional': 'sucesos',
  'deporte': 'deportes',
  'policiales': 'policia',
  'espectaculos': 'entretenimiento',
  'espectaculo': 'entretenimiento',
  'farandula': 'entretenimiento',
  'tecnologias': 'tecnologia',
  'opinion': 'sucesos', // We don't have opinion in navbar right now, wait, is it in data.js?
  'tendencia': 'tendencias'
};

async function checkAndFixCategories() {
  console.log('Fetching all articles categories...');
  
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, category');
    
  if (error) {
    console.error('Error fetching articles:', error);
    return;
  }
  
  console.log(`Found ${articles.length} articles.`);
  
  const categoryCounts = {};
  for (const article of articles) {
    categoryCounts[article.category] = (categoryCounts[article.category] || 0) + 1;
  }
  
  console.log('Current category distribution:');
  console.table(categoryCounts);
  
  let updatedCount = 0;
  
  for (const article of articles) {
    if (!validCategories.includes(article.category)) {
      let newCategory = categoryMapping[article.category] || 'sucesos'; // Default to sucesos if unknown
      
      console.log(`Updating article "${article.title.substring(0, 30)}..." from [${article.category}] to [${newCategory}]`);
      
      const { error: updateError } = await supabase
        .from('articles')
        .update({ category: newCategory })
        .eq('id', article.id);
        
      if (updateError) {
        console.error(`Error updating article ${article.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }
  
  console.log(`\nFinished. Updated ${updatedCount} articles.`);
}

checkAndFixCategories();
