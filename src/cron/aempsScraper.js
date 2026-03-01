import axios from 'axios';
import * as cheerio from 'cheerio';

const AEMPS_URL = "https://www.aemps.gob.es/comunicacion/alertas/medicamentos-uso-humano/?cat=38";

export async function fetchAempsAlerts(ultimaAlertaProcesadaId, retries = 3) {
    console.log(`Buscando alertas de AEMPS. Última procesada: ${ultimaAlertaProcesadaId}`);

    let html = null;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(AEMPS_URL, { timeout: 10000 });
            html = response.data;
            break;
        } catch (error) {
            console.error(`Intento ${attempt}/${retries} fallido al conectar con AEMPS: ${error.message}`);
            if (attempt === retries) throw new Error("Fallo de red al conectar con AEMPS tras varios intentos.");
            await new Promise(res => setTimeout(res, 2000 * attempt)); // Exponential backoff
        }
    }

    try {
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
                // Diferentes formatos en AEMPS, intentamos entry-content, luego main, luego el body quitando scripts
                detail$('script, style, nav, header, footer, noscript, iframe').remove();

                let fullText = detail$('.entry-content').text() || detail$('main').text() || detail$('body').text();

                // Extra clean up to give Gemini clean raw text
                fullText = fullText.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
                if (!fullText) fullText = alert.briefDescription;

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
