const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function disableBot() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log("Cambiando estado de automatización a: DESACTIVADO...");

    const { error } = await supabase
        .from('settings')
        .update({ value: false })
        .eq('key', 'automation_enabled');

    if (error) {
        console.error("Error al desactivar:", error.message);
    } else {
        console.log("✅ Automatización desactivada correctamente en la base de datos.");
    }
}

disableBot();
