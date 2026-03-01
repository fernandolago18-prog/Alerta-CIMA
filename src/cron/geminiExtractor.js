import { GoogleGenAI, Type } from '@google/genai';

let ai = null;

function getAiClient() {
    if (!ai) {
        ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY
        });
    }
    return ai;
}
export async function extractBatchesWithGemini(alertText) {
    const prompt = `
    Eres un asistente experto en farmacovigilancia. Lee el siguiente texto extraído de una alerta de seguridad de la AEMPS. El texto puede contener mucho ruido, menús o texto legal, ignóralo.
    
    Tu ÚNICA tarea es buscar todas las menciones a medicamentos afectados y extraer estrictamente su Código Nacional (CN) y su Lote afectado.
    El Código Nacional (CN) es siempre un número de 6 o 7 dígitos (ej: 658252).
    El Lote es una cadena alfanumérica.
    Debes buscar exhaustivamente en todo el texto hasta encontrar la combinación de CN y Lote de los medicamentos retirados o afectados.
    Si el texto menciona múltiples lotes para un mismo CN, inclúyelos todos como objetos separados.
    
    El texto completo es este:
    """
    ${alertText}
    """
    
    Devuelve ESTRICTAMENTE UN ARRAY JSON. Cada elemento debe tener esta estructura exacta:
    [{"cn": "658252", "lote": "2297801"}, ...]
    
    Si estás absolutamente seguro de que no hay ningún lote ni CN en todo el texto, devuelve []. No añadas explicaciones ni bloques de markdown.
    `;

    try {
        const client = getAiClient();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                // Forzar respuesta en JSON
                responseMimeType: "application/json",
                temperature: 0.1,
                responseSchema: {
                    type: Type.ARRAY,
                    description: "List of affected medicines",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            cn: {
                                type: Type.STRING,
                                description: "Código Nacional de 6 dígitos"
                            },
                            lote: {
                                type: Type.STRING,
                                description: "Lote del medicamento"
                            }
                        },
                        required: ["cn", "lote"]
                    }
                }
            }
        });

        // Debug
        console.log("Raw Gemini Output:", response.text);

        // Parsear la respuesta JSON
        let rawText = response.text || "[]";

        // Limpiar posible formato markdown (ej: ```json ... ``` o ```javascript ... ```)
        rawText = rawText.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim();

        try {
            const data = JSON.parse(rawText);
            return Array.isArray(data) ? data : [];
        } catch (parseError) {
            console.error("Error al parsear el JSON de Gemini:", rawText);
            return [];
        }
    } catch (error) {
        console.error("Error comunicando con Gemini API:", error);
        throw error;
    }
}
