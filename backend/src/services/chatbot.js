const supabase = require('../config/supabase');

// Memory state storage for conversations
// Structure: { [phoneNumber]: { state: 'awaiting_info'|'awaiting_confirm', address: string, gps: {lat, lng}, lastActive: timestamp } }
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
 * Main chatbot message processor
 */
async function processChatbotMessage(lineaKey, client, msg) {
  cleanExpiredStates();

  const fromNumber = msg.from.split('@')[0];
  const msgType = msg.type;
  const msgText = (msg.body || '').trim();

  // Ignore group chats and system broadcast messages
  if (msg.from.includes('@g.us') || msg.from === 'status@broadcast') {
    return;
  }

  // Fetch contact name
  let contactName = 'Cliente WhatsApp';
  try {
    const contact = await msg.getContact();
    contactName = contact.pushname || contact.name || contactName;
  } catch (err) {
    console.warn(`Could not get contact details for ${fromNumber}:`, err.message);
  }

  // 1. Check if user wants to cancel the current flow
  const isCancel = /^(cancelar|salir|no|detener|cancel)$/i.test(msgText);
  if (isCancel && chatStates[fromNumber]) {
    delete chatStates[fromNumber];
    await msg.reply('❌ Solicitud cancelada. Si necesitas un móvil más adelante, solo escríbenos. ¡Que tengas un buen día! 👋');
    return;
  }

  // Get or initialize state
  let userState = chatStates[fromNumber];
  const now = Date.now();

  // If state exists but is expired, reset it
  if (userState && (now - userState.lastActive > STATE_TIMEOUT_MS)) {
    delete chatStates[fromNumber];
    userState = null;
  }

  // 2. Handle GPS Location directly (at any stage, even first message)
  const isGps = msgType === 'location' || (msg.location && msg.location.latitude);
  if (isGps) {
    const lat = msg.location.latitude;
    const lng = msg.location.longitude;

    chatStates[fromNumber] = {
      state: 'awaiting_confirm',
      address: '[Ubicación GPS Compartida]',
      gps: { lat, lng },
      lastActive: Date.now()
    };

    await msg.reply('📍 Recibimos tu ubicación GPS con éxito.\n\n¿Confirmas tu solicitud de móvil en esta ubicación?\n\nResponde *SÍ* para confirmar o escribe una dirección de referencia.');
    return;
  }

  // 3. State Machine Flow
  if (!userState) {
    // Welcome / Initial State
    chatStates[fromNumber] = {
      state: 'awaiting_info',
      address: null,
      gps: null,
      lastActive: Date.now()
    };

    await msg.reply(
      `¡Hola *${contactName}*! 📡 Bienvenido a *Plus Móvil Tarija*.\n\n` +
      `Para solicitar un radio móvil de inmediato, por favor envíanos:\n` +
      `1️⃣ Tu *Ubicación GPS actual* (Recomendado 📍)\n` +
      `2️⃣ O escribe tu *Dirección exacta* (Ej: Calle Cochabamba entre Sucre y Gral. Trigo).\n\n` +
      `*Escribe CANCELAR en cualquier momento si deseas salir.*`
    );
  } else if (userState.state === 'awaiting_info') {
    // User sent text address
    if (msgText.length < 5) {
      await msg.reply('⚠️ Por favor ingresa una dirección más específica (ej. nombre de calle y referencias) para que el móvil pueda ubicarte fácilmente.');
      userState.lastActive = Date.now();
      return;
    }

    chatStates[fromNumber] = {
      state: 'awaiting_confirm',
      address: msgText,
      gps: null,
      lastActive: Date.now()
    };

    await msg.reply(
      `Confirmemos tu dirección:\n` +
      `🏠 *${msgText}*\n\n` +
      `¿Es correcto?\n` +
      `Responde *SÍ* para confirmar y buscar un móvil, o escribe una nueva dirección si deseas corregirla.`
    );
  } else if (userState.state === 'awaiting_confirm') {
    // User is confirming the address/GPS
    const isConfirm = /^(si|sí|ok|confirmar|correcto|yes|s)$/i.test(msgText);
    
    if (isConfirm) {
      // REGISTER THE REQUEST IN SUPABASE!
      try {
        // Register customer first if they don't exist
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
              nombre: contactName,
            })
            .select('id')
            .single();
          
          if (createErr) throw createErr;
          clienteId = newClient.id;
        } else {
          clienteId = clientData.id;
        }

        // Insert WhatsApp request as pending
        const { error: insertErr } = await supabase
          .from('solicitudes_whatsapp')
          .insert({
            linea: lineaKey,
            cliente_telefono: fromNumber,
            cliente_nombre: contactName,
            mensaje: userState.address,
            gps_latitud: userState.gps ? userState.gps.lat : null,
            gps_longitud: userState.gps ? userState.gps.lng : null,
            estado: 'pendiente'
          });

        if (insertErr) throw insertErr;

        // Clear state
        delete chatStates[fromNumber];

        await msg.reply('🔎 ¡Solicitud registrada con éxito! Estamos buscando un móvil disponible cerca de ti. Te notificaremos en este chat en cuanto el conductor sea asignado. ¡Muchas gracias! 🚗💨');
      } catch (err) {
        console.error('Error saving chatbot request to database:', err.message);
        await msg.reply('⚠️ Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente o llama directamente a la central.');
      }
    } else {
      // User sent text instead of confirming, treat it as a correction
      chatStates[fromNumber] = {
        state: 'awaiting_confirm',
        address: msgText,
        gps: null,
        lastActive: Date.now()
      };

      await msg.reply(
        `Dirección actualizada:\n` +
        `🏠 *${msgText}*\n\n` +
        `¿Confirmas este pedido? Responde *SÍ* para confirmar o ingresa otra dirección.`
      );
    }
  }
}

module.exports = {
  processChatbotMessage
};
