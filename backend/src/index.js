require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initWhatsApp } = require('./services/whatsapp');

const app = express();
const PORT = process.env.PORT || 3000;

// Dynamic CORS configuration to allow local development on any port (5173, 5174, etc.)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or if origin is in the allowed list
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const whatsappRoutes = require('./routes/whatsapp');
const turnoRoutes = require('./routes/turno');

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/turno', turnoRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    service: 'CRM Radio Móviles — Plus Móvil Tarija',
    author: 'Sistemas Koffys',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   CRM Radio Móviles — Backend API           ║
  ║   Puerto: ${PORT}                              ║
  ║   Estado: ✅ Online                           ║
  ║   Made in Sistemas Koffys                    ║
  ╚══════════════════════════════════════════════╝
  `);

  // Start WhatsApp instances after server is up and listening
  initWhatsApp();
});
