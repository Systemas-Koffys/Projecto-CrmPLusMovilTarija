const supabase = require('../config/supabase');
const { analyzeChat } = require('./gemini');

// Memory state storage for conversations
// Structure: { [phoneNumber]: { history: [{role, text}], address, reference, passengerName, gps: {lat, lng}, lastActive } }
const chatStates = {};
const STATE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes inactivity timeout

/**
 * Clean up expired conversation states to prevent memory leaks
 */
function cleanExpiredStates() {
  const now = Date.now();
  Object.keys(chatStates).forEach((num) => {
    if (now - chatStates[num].lastActive > STATE_TIMEOUT_MS) {
      delete chatStates[num];
    }
  });
}

/**
 * Main chatbot message processor integrated with Google Gemini AI
 */
async function processChatbotMessage(lineaKey, client, msg) {
  cleanExpiredStates();

  const fromNumber = msg.from.split('@')[0];
  const msgType = msg.type;
  
  // Ignore group chats and system broadcast messages
  if (msg.from.includes('@g.us') || msg.from === 'status@broadcast') {
    return;
  }

  // Retrieve contact name
  let contactName = 'Cliente WhatsApp';
  try {
    const contact = await msg.getContact();
    contactName = contact.pushname || contact.name || contactName;
  } catch (err) {
    console.warn(`Could not get contact details for ${fromNumber}:`, err.message);
  }

  // Get or initialize state
  let userState = chatStates[fromNumber];
  const now = Date.now();

  // If state exists but is expired, reset it
  if (userState && (now - userState.lastActive > STATE_TIMEOUT_MS)) {
    delete chatStates[fromNumber];
    userState = null;
  }

  if (!userState) {
    userState = {
      history: [],
      gps: null,
      address: null,
      passengerName: null,
      reference: null,
      lastActive: now
    };
    chatStates[fromNumber] = userState;
  }

  // 1. Intercept GPS Location directly (highest priority)
  const isGps = msgType === 'location' || (msg.location && msg.location.latitude);
  let msgText = (msg.body || '').trim();

  if (isGps) {
    const lat = msg.location.latitude;
    const lng = msg.location.longitude;

    userState.gps = { lat, lng };
    userState.address = '[Ubicación GPS Compartida]';
    userState.lastActive = Date.now();

    // Inject GPS event into history so Gemini understands what happened
    userState.history.push({
      role: 'user',
      text: '[Compartió su ubicación GPS]'
    });

    // We let Gemini generate the response by passing this simulated message
    msgText = '[Ubicación GPS recibida. Pregúntame mi nombre para proceder con la confirmación de mi móvil]';
  }

  // 2. Query Google Gemini AI
  console.log(`[Chatbot - ${fromNumber}] Querying Gemini with message: "${msgText}"`);
  const aiResult = await analyzeChat(msgText, userState.history);
  console.log(`[Chatbot - ${fromNumber}] Gemini JSON response:`, JSON.stringify(aiResult));

  const { replyText, extractedData } = aiResult;

  // Update extracted properties in session state
  if (extractedData) {
    if (extractedData.direccion) userState.address = extractedData.direccion;
    if (extractedData.referencia) userState.reference = extractedData.referencia;
    if (extractedData.nombrePasajero) userState.passengerName = extractedData.nombrePasajero;
  }

  // 3. Handle Cancel intent
  if (extractedData?.intentCancelar === true) {
    console.log(`[Chatbot - ${fromNumber}] Intent: CANCEL`);
    delete chatStates[fromNumber];
    await msg.reply(replyText || '❌ Tu solicitud ha sido cancelada. Si nos necesitas más tarde, no dudes en volver a escribirnos. ¡Que tengas un excelente día! 👋');
    return;
  }

  // 4. Handle Confirm intent
  if (extractedData?.intentConfirmar === true) {
    console.log(`[Chatbot - ${fromNumber}] Intent: CONFIRM. Address: ${userState.address || 'GPS'}, Name: ${userState.passengerName}`);
    
    // Check if we have the minimum requirements (address or GPS + name)
    const hasAddress = userState.gps || (userState.address && userState.address !== '[Ubicación GPS Compartida]');
    const nameToUse = userState.passengerName || contactName;

    if (hasAddress) {
      // REGISTER THE REQUEST IN DATABASE
      try {
        // Register client in Supabase if they do not exist
        let clienteId = null;
        const { data: clientData, error: clientErr } = await supabase
          .from('clientes')
          .select('id')
          .eq('numero_whatsapp', fromNumber)
          .maybeSingle();

        if (clientErr) throw clientErr;

        if (!clientData) {
          const { data: newClient, error: createErr } = await supabase
            .from('clientes')
            .insert({
              numero_whatsapp: fromNumber,
              nombre: nameToUse,
            })
            .select('id')
            .single();
          
          if (createErr) throw createErr;
          clienteId = newClient.id;
        } else {
          clienteId = clientData.id;
          // Update client name if we got a more specific passenger name
          if (userState.passengerName && clientData.nombre !== userState.passengerName) {
            await supabase
              .from('clientes')
              .update({ nombre: userState.passengerName })
              .eq('id', clienteId);
          }
        }

        // Format message field for the operator panel
        let fullDescription = userState.address;
        if (userState.reference) {
          fullDescription += ` (Ref: ${userState.reference})`;
        }

        // Insert WhatsApp request as pending
        const { error: insertErr } = await supabase
          .from('solicitudes_whatsapp')
          .insert({
            linea: lineaKey,
            cliente_telefono: fromNumber,
            cliente_nombre: nameToUse,
            mensaje: fullDescription || 'Pedido de móvil por WhatsApp',
            gps_latitud: userState.gps ? userState.gps.lat : null,
            gps_longitud: userState.gps ? userState.gps.lng : null,
            estado: 'pendiente'
          });

        if (insertErr) throw insertErr;

        // Clear session state
        delete chatStates[fromNumber];

        await msg.reply(replyText || '🔎 ¡Solicitud registrada con éxito! Estamos buscando un móvil disponible cerca de ti. Te notificaremos en este chat en cuanto el conductor sea asignado. ¡Muchas gracias! 🚗💨');
        return;

      } catch (err) {
        console.error('Error saving chatbot request to database:', err.message);
        await msg.reply('⚠️ Ocurrió un inconveniente técnico al guardar tu solicitud. Por favor, reintenta o comunícate directamente con la central.');
        return;
      }
    } else {
      // Missing info, override confirmation intent and let the conversation request it
      console.log(`[Chatbot - ${fromNumber}] Confirm intent but missing address/GPS. Overriding.`);
    }
  }

  // 5. Standard conversation turn: Save to history and send reply
  userState.history.push({
    role: 'user',
    text: isGps ? '[Ubicación GPS Compartida]' : msgText
  });
  
  userState.history.push({
    role: 'model',
    text: replyText
  });

  // Keep history size reasonable (last 8 turns) to save token window space
  if (userState.history.length > 8) {
    userState.history = userState.history.slice(-8);
  }

  userState.lastActive = Date.now();

  // Send the AI generated response back
  await msg.reply(replyText);
}

module.exports = {
  processChatbotMessage
};
