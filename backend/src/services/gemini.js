const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';

/**
 * Service to interact with Google Gemini AI API
 */
async function analyzeChat(newMsgText, history = []) {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY no está configurada en las variables de entorno.');
    return {
      replyText: 'Lo sentimos, el asistente inteligente está temporalmente inactivo. Por favor, escribe tu dirección exacta y un chofer te asistirá.',
      extractedData: {
        direccion: null,
        referencia: null,
        nombrePasajero: null,
        intentConfirmar: false,
        intentCancelar: false
      }
    };
  }

  // System Prompt explaining how the dispatcher bot should behave and what JSON schema to output
  const systemInstruction = 
    `Eres el asistente inteligente de despacho automático de radiotaxis de la empresa "Plus Móvil Tarija" en Tarija, Bolivia.\n\n` +
    `Tu objetivo principal es conversar con el cliente por WhatsApp para obtener dos datos esenciales de manera amigable:\n` +
    `1. La dirección exacta o de referencia para recogerlo (ej. "Calle Cochabamba entre Sucre y Gral. Trigo", o "Barrio El Molino al lado del hotel...").\n` +
    `2. El nombre del pasajero o familia (ej. "Familia Flores" o "Carlos").\n\n` +
    `PAUTAS DE COMPORTAMIENTO:\n` +
    `- Sé extremadamente educado, servicial, rápido y conciso. Evita rodeos innecesarios.\n` +
    `- Debes entender los modismos de Bolivia (Tarija) y abreviaciones (ej: "porfa", "móvil", "auto", "carrera", "estoy en...").\n` +
    `- Si el cliente ya te dio toda la información (dirección y nombre), genera un texto amigable resumiendo el pedido y pregúntale explícitamente si confirma la solicitud del móvil.\n` +
    `- Si el cliente responde afirmativamente a la confirmación (ej: "sí", "sí porfa", "correcto", "dale", "s"), establece "intentConfirmar" en true en el JSON.\n` +
    `- Si el cliente dice que quiere cancelar, salir, o detener el pedido, establece "intentCancelar" en true en el JSON.\n` +
    `- Si falta información, pídesela educadamente en "replyText".\n\n` +
    `FORMATO DE RESPUESTA EXCLUSIVO:\n` +
    `Debes devolver SIEMPRE tu respuesta en formato JSON estructurado con el siguiente esquema de campos:\n` +
    `{\n` +
    `  "replyText": "El mensaje de texto amigable en español que le enviaremos de vuelta al cliente por WhatsApp.",\n` +
    `  "extractedData": {\n` +
    `    "direccion": "La dirección o calle de recogida extraída del chat. Si no se ha dado o es vaga, mantén esto como null.",\n` +
    `    "referencia": "Puntos de referencia como tiendas, colegios, letreros, etc. Si no hay, pon null.",\n` +
    `    "nombrePasajero": "El nombre del cliente o familia. Si no lo ha mencionado aún, pon null.",\n` +
    `    "intentConfirmar": false, // Cambiar a true SOLAMENTE si el cliente ha confirmado que desea pedir el móvil en este turno.\n` +
    `    "intentCancelar": false // Cambiar a true si el cliente solicita cancelar, anular o no desea el servicio.\n` +
    `  }\n` +
    `}\n\n` +
    `IMPORTANTE: No añadas explicaciones fuera del JSON. Devuelve únicamente el objeto JSON válido.`;

  // Format history from chatbot state to Gemini API format
  // Gemini expects roles: 'user' or 'model' (we map client history 'user' and 'model' respectively)
  const contents = history.map(item => ({
    role: item.role === 'user' ? 'user' : 'model',
    parts: [{ text: item.text }]
  }));

  // Append the new user message
  contents.push({
    role: 'user',
    parts: [{ text: newMsgText }]
  });

  const requestBody = {
    contents: contents,
    systemInstruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2 // Lower temperature for consistent JSON structure and logic
    }
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('Gemini API returned an empty response');
    }

    // Parse the JSON output
    const parsedJson = JSON.parse(responseText.trim());
    return parsedJson;

  } catch (err) {
    console.error('Error querying Gemini API:', err.message);
    // Fallback response in case of API failure or parsing error
    return {
      replyText: 'Disculpa, tuvimos un inconveniente al procesar tu mensaje. ¿Podrías volver a escribir tu dirección y nombre?',
      extractedData: {
        direccion: null,
        referencia: null,
        nombrePasajero: null,
        intentConfirmar: false,
        intentCancelar: false
      }
    };
  }
}

module.exports = {
  analyzeChat
};
