import { runScraperCron } from './src/cron/mainRunner.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function fullTest() {
    console.log('--- RESETTING POINTER ---');
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    await supabase.from('estado_aemps').update({ ultima_alerta_id: 'inicial' }).eq('id', 1);

    console.log('--- STARTING CRON ---');
    await runScraperCron();
    console.log('--- CRON FINISHED ---');

    console.log('--- CHECKING INCIDENCES ---');
    const { data: currentIncidences, error } = await supabase.from('incidencias_hospital').select('*');

    if (error) {
        console.error('Error fetching incidences:', error);
    } else {
        console.log(`Found ${currentIncidences.length} incidences:`, currentIncidences);
    }
}
fullTest();
