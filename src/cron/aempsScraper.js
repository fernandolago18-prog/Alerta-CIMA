import axios from 'axios';
import * as cheerio from 'cheerio';

const AEMPS_URL = "https://www.aemps.gob.es/comunicacion/alertas/medicamentos-uso-humano/?cat=38";

export async function fetchAempsAlerts(ultimaAlertaProcesadaId) {
    console.log(`Buscando alertas de AEMPS. Última procesada: ${ultimaAlertaProcesadaId}`);
    try {
        const response = await axios.get(AEMPS_URL);
        const html = response.data;
        const $ = cheerio.load(html);

        const newAlerts = [];
        let reachedLastProcessed = false;

        // En la web de la AEMPS las notas están directamente en etiquetas <a> con enlaces que contienen 'informa/notasInformativas'
        $('a').each((index, element) => {
            if (reachedLastProcessed) return;

            const link = $(element).attr('href');
            const title = $(element).text().trim();

            if (link && link.includes('informa/notasInformativas') && title.length > 20) {
                const alertaId = link;

                if (alertaId === ultimaAlertaProcesadaId) {
                    reachedLastProcessed = true;
                    return;
                }

                // Evitar duplicados (a veces ponen la misma nota dos veces en menú y lista)
                if (!newAlerts.some(a => a.alertaId === alertaId)) {
                    newAlerts.push({
                        alertaId,
                        title,
                        link: link.startsWith('http') ? link : (link.startsWith('//') ? `https:${link}` : `https://www.aemps.gob.es${link}`),
                        briefDescription: title // Usamos el título como resumen inicial
                    });
                }
            }
        });

        // Como esto está en la primera página, tal vez debamos navegar a los enlaces específicos
        // para traer todo el texto donde Gemini pueda leer los CNs y lotes detallados.
        const fullAlerts = [];
        for (const alert of newAlerts) {
            console.log(`Descargando contenido detallado de: ${alert.title}`);
            try {
                const detailResponse = await axios.get(alert.link);
                const detail$ = cheerio.load(detailResponse.data);

                // Todo el contenido del comunicado
                const fullText = detail$('.entry-content').text().trim() || alert.briefDescription;

                fullAlerts.push({
                    ...alert,
                    fullText
                });
            } catch (err) {
                console.error(`No se pudo extraer contenido detallado de ${alert.link}. URL fallida: ${err.config?.url}. Usando breve.`);
                fullAlerts.push({
                    ...alert,
                    fullText: alert.briefDescription
                });
            }
            // Una pequeña pausa para no saturar AEMPS si hay muchas
            await new Promise(r => setTimeout(r, 500));
        }

        return fullAlerts;
    } catch (error) {
        console.error("Error al obtener datos de AEMPS:", error);
        throw error;
    }
}
