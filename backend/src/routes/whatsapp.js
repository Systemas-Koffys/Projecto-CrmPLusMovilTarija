const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/verifyToken');
const { clients, sendMessage } = require('../services/whatsapp');

/**
 * GET /api/whatsapp/status
 * Get connection status and QR codes of both WhatsApp lines
 */
router.get('/status', verifyToken, (req, res) => {
  const statusData = {};
  
  Object.keys(clients).forEach((key) => {
    statusData[key] = {
      name: clients[key].name,
      status: clients[key].status,
      hasQr: !!clients[key].qr,
      // Provide the QR code base64 source if ready
      qr: clients[key].qr
    };
  });

  res.json(statusData);
});

/**
 * POST /api/whatsapp/send
 * Send a message using one of the WhatsApp lines
 */
router.post('/send', verifyToken, async (req, res) => {
  const { linea, to, mensaje } = req.body;

  if (!linea || !to || !mensaje) {
    return res.status(400).json({ error: 'Faltan parámetros requeridos (linea, to, mensaje)' });
  }

  try {
    const response = await sendMessage(linea, to, mensaje);
    res.json({ success: true, messageId: response.id.id });
  } catch (err) {
    console.error(`Error sending message:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
