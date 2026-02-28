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
    Eres un asistente experto en farmacovigilancia. Lee el siguiente texto de una alerta de seguridad de la AEMPS (Agencia Española de Medicamentos y Productos Sanitarios).
    
    Tu única tarea es extraer exactamente todos los medicamentos afectados y listar su Código Nacional (CN) y su Lote afectado.
    Si el texto menciona múltiples lotes para un mismo CN, o múltiples CNs, extráelos todos en objetos individuales.
    
    El texto es el siguiente:
    """
    ${alertText}
    """
    
    Devuelve estrictamente un array JSON en el que cada elemento sea un objeto con la forma:
    {"cn": "string con el código nacional de 6 dígitos", "lote": "string con el lote"}
    
    No devuelvas NADA más que el array JSON puro (sin bloques de código \`\`\`json ni comentarios). Si no encuentras ningún CN o Lote claro, devuelve [].
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

        // Parsear la respuesta JSON
        const rawText = response.text || "[]";

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
