import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendAlertEmail } from './src/cron/emailSender.js';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function mockMatch() {
    const validItems = [{ cn: '658252', lote: '2297801' }];
    const alertaId = 'mock_alerta_id';
    const titulo = 'Alerta de Prueba Fosfato';
    const link = 'https://ejemplo.com/alerta';

    for (const item of validItems) {
        const cnStr = String(item.cn).trim();
        const loteStr = String(item.lote).toUpperCase().replace(/[\s-]/g, '');

        console.log(`Buscando CN: ${cnStr}, Lote: ${loteStr}`);
        const { data: inventarioMatch, error } = await supabase
            .from('inventario_local')
            .select('*')
            .eq('cn', cnStr)
            .eq('lote', loteStr);

        if (inventarioMatch && inventarioMatch.length > 0) {
            console.log("MATCH FOUND!", inventarioMatch);
            for (const inv of inventarioMatch) {
                // Registrar Incidencia
                const { error: incidenciaError } = await supabase.from('incidencias_hospital').insert({
                    alerta_id: alertaId,
                    cn: inv.cn,
                    lote_afectado: inv.lote,
                    notas: `Match generado automáticamente por el sistema de alertas.`
                });

                if (incidenciaError) {
                    console.error("Error al registrar incidencia:", incidenciaError);
                } else {
                    console.log("Incidencia registrada!");
                    // Enviar Email
                    await sendAlertEmail({
                        tituloAemps: titulo,
                        cn: inv.cn,
                        lote: inv.lote,
                        cantidad: inv.cantidad,
                        enlace: link
                    });
                }
            }
        } else {
            console.log("No match found.");
        }
    }
}
mockMatch();
