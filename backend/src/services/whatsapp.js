const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const supabase = require('../config/supabase');

// Store the client instances and their states
const clients = {
  linea1: {
    client: null,
    qr: null,
    status: 'disconnected',
    name: 'Línea Principal (Plus Móvil 1)'
  },
  linea2: {
    client: null,
    qr: null,
    status: 'disconnected',
    name: 'Línea Secundaria (Plus Móvil 2)'
  }
};

/**
 * Initialize WhatsApp Clients
 */
function initWhatsApp() {
  Object.keys(clients).forEach((key) => {
    console.log(`Initializing WhatsApp client for: ${clients[key].name}...`);
    
    // Modern user agent to make sure WhatsApp Web allows scanning and doesn't loop
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `whatsapp-${key}`
      }),
      puppeteer: {
        headless: true,
        userAgent: userAgent,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      }
    });

    clients[key].client = client;
    clients[key].status = 'connecting';

    // QR Code Generation
    client.on('qr', async (qr) => {
      console.log(`[WhatsApp - ${key}] QR Code updated.`);
      try {
        // Convert to high resolution QR with white margins (margin: 4)
        const qrBase64 = await qrcode.toDataURL(qr, {
          margin: 4,
          width: 300,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
        clients[key].qr = qrBase64;
        clients[key].status = 'qr_ready';
      } catch (err) {
        console.error(`[WhatsApp - ${key}] Error generating QR image:`, err.message);
      }
    });

    // Client Ready
    client.on('ready', () => {
      console.log(`[WhatsApp - ${key}] Client is READY! Connection established.`);
      clients[key].status = 'connected';
      clients[key].qr = null;
    });

    // Authenticated
    client.on('authenticated', () => {
      console.log(`[WhatsApp - ${key}] Authenticated successfully.`);
    });

    // Auth fail
    client.on('auth_failure', (msg) => {
      console.error(`[WhatsApp - ${key}] Authentication FAILURE:`, msg);
      clients[key].status = 'disconnected';
      clients[key].qr = null;
    });

    // Disconnected
    client.on('disconnected', (reason) => {
      console.log(`[WhatsApp - ${key}] Client was logged out / disconnected. Reason:`, reason);
      clients[key].status = 'disconnected';
      clients[key].qr = null;
    });

    // Incoming Messages
    client.on('message', async (message) => {
      try {
        await handleIncomingMessage(key, message);
      } catch (error) {
        console.error(`[WhatsApp - ${key}] Error handling incoming message:`, error.message);
      }
    });

    client.initialize().catch((err) => {
      console.error(`[WhatsApp - ${key}] Failed to initialize client:`, err.message);
      clients[key].status = 'disconnected';
    });
  });
}

/**
 * Handle incoming WhatsApp messages
 */
async function handleIncomingMessage(lineaKey, msg) {
  const fromNumber = msg.from.split('@')[0];
  
  if (msg.from.includes('@g.us') || msg.from === 'status@broadcast') {
    return;
  }

  console.log(`[WhatsApp - ${lineaKey}] Message from ${fromNumber}: ${msg.body}`);

  let contactName = 'Cliente WhatsApp';
  try {
    const contact = await msg.getContact();
    contactName = contact.pushname || contact.name || contactName;
  } catch (err) {
    console.warn(`Could not fetch WhatsApp contact name:`, err.message);
  }

  let lat = null;
  let lng = null;

  if (msg.type === 'location' || (msg.location && msg.location.latitude)) {
    lat = msg.location.latitude;
    lng = msg.location.longitude;
    console.log(`[WhatsApp - ${lineaKey}] GPS Location received: Lat ${lat}, Lng ${lng}`);
  }

  let clienteId = null;
  try {
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
      console.log(`[WhatsApp] Created new client: ${contactName} (${fromNumber})`);
    } else {
      clienteId = clientData.id;
    }
  } catch (err) {
    console.error(`[WhatsApp] Error registering client:`, err.message);
  }

  try {
    const { error: insertErr } = await supabase
      .from('solicitudes_whatsapp')
      .insert({
        linea: lineaKey,
        cliente_telefono: fromNumber,
        cliente_nombre: contactName,
        mensaje: msg.body || (msg.type === 'location' ? '[Ubicación GPS]' : `[Mensaje tipo: ${msg.type}]`),
        gps_latitud: lat,
        gps_longitud: lng,
        estado: 'pendiente'
      });

    if (insertErr) throw insertErr;
    console.log(`[WhatsApp] Saved request to Supabase for ${fromNumber}`);
  } catch (err) {
    console.error(`[WhatsApp] Error saving request to DB:`, err.message);
  }
}

/**
 * Send a message via a specific line
 */
async function sendMessage(lineaKey, to, message) {
  const line = clients[lineaKey];
  if (!line || line.status !== 'connected' || !line.client) {
    throw new Error(`La línea ${lineaKey} no está conectada`);
  }

  const formattedTo = to.includes('@c.us') ? to : `${to}@c.us`;
  const sentMsg = await line.client.sendMessage(formattedTo, message);
  return sentMsg;
}

module.exports = {
  initWhatsApp,
  clients,
  sendMessage
};
