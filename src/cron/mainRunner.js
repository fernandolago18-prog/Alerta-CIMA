import { createClient } from '@supabase/supabase-js';
import { fetchAempsAlerts } from './aempsScraper.js';
import { extractBatchesWithGemini } from './geminiExtractor.js';
import { sendAlertEmail } from './emailSender.js';

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function runScraperCron() {
    console.log("🚀 Iniciando Motor de Vigilancia AEMPS...");

    try {
        // 1. Obtener última alerta procesada
        const { data: estadoData, error: estadoError } = await supabase
            .from('estado_aemps')
            .select('*')
            .eq('id', 1)
            .single();

        if (estadoError) throw estadoError;

        const ultimaAlertaId = estadoData.ultima_alerta_id;
        console.log(`Última alerta en memoria: ${ultimaAlertaId}`);

        // 1b. Obtener correos configurados
        const { data: configData } = await supabase
            .from('configuracion_alertas')
            .select('emails_destinatarios')
            .eq('id', 1)
            .single();
        const emailsDestinatarios = configData?.emails_destinatarios && configData.emails_destinatarios.length > 0
            ? configData.emails_destinatarios
            : [process.env.EMAIL_USER]; // Fallback si no hay configuración

        console.log(`Destinatarios de correo activos: ${emailsDestinatarios.length}`);

        // 2. Extraer alertas nuevas de la AEMPS
        const nuevasAlertas = await fetchAempsAlerts(ultimaAlertaId);

        if (nuevasAlertas.length === 0) {
            console.log("✅ No hay alertas nuevas en AEMPS. Sistema actualizado.");
            return;
        }

        console.log(`🚨 Se han detectado ${nuevasAlertas.length} alertas nuevas. Procesando...`);

        // 3. Iterar por cada una de manera cronológica (desde la más antigua a la más nueva)
        // para que si el proceso falla, el puntero se quede en la última que sí se procesó bien.
        const chronAlerts = nuevasAlertas.reverse();

        for (const alerta of chronAlerts) {
            console.log(`Procesando con IA: ${alerta.title}`);
            const textToProcess = (alerta.fullText || alerta.briefDescription).substring(0, 3000);
            const affectedItems = await extractBatchesWithGemini(textToProcess);

            console.log(`Gemini ha detectado ${affectedItems.length} lotes defectuosos:`, affectedItems);
            console.log('Estructura:', JSON.stringify(affectedItems));

            // Pausa para evitar Rate Limit de Gemini (429)
            await new Promise(r => setTimeout(r, 2500));

            const validItems = Array.isArray(affectedItems) ? affectedItems : [];

            // Guardar en el histórico (opcional para trazabilidad)
            const { error: histError } = await supabase.from('alertas_historico').upsert({
                alerta_id: alerta.alertaId,
                titulo: alerta.title,
                cns_afectados: validItems.map(i => i.cn).filter(Boolean),
                lotes_afectados: validItems.map(i => i.lote).filter(Boolean),
                raw_texto: alerta.link
            }, { onConflict: 'alerta_id' });

            if (histError) {
                console.error("Error guardando progreso en histórico de alertas:", histError);
            }

            // 4. Cruzar con el inventario del hospital
            if (validItems.length > 0) {
                for (const item of validItems) {
                    if (!item.cn || !item.lote) continue;

                    const cnStr = String(item.cn).trim();
                    const loteStr = String(item.lote).toUpperCase().replace(/[\s-]/g, '');
                    console.log(`Checking DB for CN: ${cnStr}, Lote: ${loteStr}`);

                    const { data: inventarioMatch, error: inventarioError } = await supabase
                        .from('inventario_local')
                        .select('*')
                        .eq('cn', cnStr)
                        .eq('lote', loteStr);

                    if (inventarioError) {
                        console.error('Error buscando en inventario:', inventarioError);
                        continue;
                    }

                    // 5. ¡Match detectado! El hospital tiene ese lote en stock (o lo ha tenido)
                    if (inventarioMatch && inventarioMatch.length > 0) {
                        const loteEncontrado = inventarioMatch[0];
                        console.log(`⚠️ MATCH CRÍTICO DETECTADO: CN ${item.cn} Lote ${item.lote} (Stock: ${loteEncontrado.cantidad})`);

                        // 5.1 Evitar duplicados: Comprobar si ya existe esta incidencia
                        const { data: existingIncidence, error: existError } = await supabase
                            .from('incidencias_hospital')
                            .select('id')
                            .eq('alerta_id', alerta.alertaId)
                            .eq('cn', item.cn)
                            .eq('lote_afectado', item.lote);

                        if (existError) {
                            console.error('Error verificando incidencia existente:', existError);
                            continue;
                        }

                        if (existingIncidence && existingIncidence.length > 0) {
                            console.log(`Incidencia duplicada evitada para CN ${item.cn} - Lote ${item.lote}. Ya estaba registrada y notificada.`);
                            continue;
                        }

                        // Guardarlo en la tabla de incidencias del dashboard
                        const { data: incidenciaInsertada, error: incidenciaError } = await supabase
                            .from('incidencias_hospital')
                            .insert({
                                alerta_id: alerta.alertaId,
                                cn: item.cn,
                                lote_afectado: item.lote,
                                notas: `Match generado por alerta: ${alerta.title}`
                            })
                            .select();

                        if (incidenciaError) {
                            console.error('Error registrando la incidencia:', incidenciaError);
                        } else {
                            // 6. Enviar correo de alta prioridad a los destinatarios configurados
                            await sendAlertEmail({
                                tituloAemps: alerta.title,
                                cn: item.cn,
                                lote: item.lote,
                                cantidad: loteEncontrado.cantidad,
                                enlace: alerta.link
                            }, emailsDestinatarios);
                        }
                    } else {
                        console.log(`Cruce limpio: El lote ${item.lote} del CN ${item.cn} no está en nuestro inventario.`);
                    }
                }
            } else {
                console.log(`La IA no encontró lotes aplicables en ${alerta.title}`);
            }

            // 7. Actualizar la "Memoria" INMEDIATAMENTE después de procesar esta alerta con éxito
            await supabase
                .from('estado_aemps')
                .update({
                    ultima_alerta_id: alerta.alertaId,
                    fecha_ultimo_escaneo: new Date().toISOString()
                })
                .eq('id', 1);

            console.log(`💾 Memoria actualizada. Nueva marca: ${alerta.alertaId}`);
        }

    } catch (error) {
        console.error("❌ Error grave en la ejecución del CRON:", error);
    }
}

// Ejecutar si se llama directamente (para el workflow de GitHub)
if (process.argv[1] === import.meta.url || process.argv[1].endsWith('mainRunner.js')) {
    runScraperCron().then(() => {
        console.log('Cron Job Finalizado.');
        process.exit(0);
    });
}
