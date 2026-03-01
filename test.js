import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
    const { data: incidenciaInsertada, error: incidenciaError } = await supabase
        .from('incidencias_hospital')
        .insert({
            alerta_id: 'test_id',
            cn: '658252',
            lote_afectado: '2297801',
            notas: `Match generado por alerta de prueba`
        })
        .select();

    console.log("Error:", incidenciaError);
    console.log("Data:", incidenciaInsertada);
}
test();
