# CRM RADIO MÓVILES — Plus Móvil Tarija

Sistema de gestión integral para la operación de servicios de taxi y distribución de líneas móviles en Tarija, Bolivia.

**Versión:** 1.0 (Fase 1 — Base y Autenticación)  
**Tecnología:** React · Node.js · Supabase · Firebase · Docker

---

## 📋 Descripción

El CRM centraliza la operación completa de **Plus Móvil**:

- 📱 Gestión de solicitudes vía WhatsApp
- 👥 Panel de operadoras con turno activo
- 🚗 Control de móviles y choferes
- 💰 Registro de cobros y finanzas
- 📊 Dashboard analítico con mapas
- 📄 Reportes exportables por período

---

## 🎯 Fases de Desarrollo

| Fase | Objetivo | Estado |
|------|----------|--------|
| **1** | Base, Docker, Auth, Roles | 🟢 EN PROGRESO |
| **2** | WhatsApp, Panel Operadora, Turno | ⏳ Próximo |
| **3** | Fichas, Contadora, Reportes | ⏳ Próximo |
| **4** | Dashboard, Mapa, Deploy | ⏳ Próximo |

---

## 🚀 Quick Start (Fase 1)

### Requisitos
- Docker Desktop
- Node.js 18+
- Cuenta en Supabase (gratuita)
- Proyecto en Firebase

### Instalación

1. **Clonar y entrar**
   ```bash
   git clone https://github.com/koffy/crm-radio-moviles.git
   cd crm-radio-moviles
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example backend/.env
   cp .env.example frontend/.env
   # Editar y llenar con tus credenciales
   ```

3. **Levantar con Docker**
   ```bash
   docker-compose up --build
   ```

4. **Acceder**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Usuarios de Prueba
```
operadora@test.com / Test123!
contadora@test.com / Test123!
admin@test.com / Test123!
```

---

## 📁 Estructura del Proyecto

```
crm-radio-moviles/
│
├── backend/              # Node.js + Express
│   ├── src/
│   │   ├── config/      # Firebase, Supabase
│   │   ├── routes/      # Endpoints API
│   │   ├── controllers/ # Lógica de negocio
│   │   ├── middleware/  # Auth, logging
│   │   └── index.js
│   ├── .env
│   ├── Dockerfile
│   └── package.json
│
├── frontend/             # React + Vite
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Vistas principales
│   │   ├── config/      # Firebase config
│   │   ├── hooks/       # Custom hooks
│   │   ├── utils/       # Utilidades
│   │   └── main.jsx
│   ├── .env
│   ├── Dockerfile
│   ├── vite.config.js
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🔧 Configuración

### Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar URL y API keys
3. Crear tablas (ver documentación Fase 1)
4. Insertar usuarios de prueba

### Firebase
1. Crear proyecto en [firebase.google.com](https://firebase.google.com)
2. Habilitar Email/Password authentication
3. Crear usuarios de prueba
4. Descargar credenciales JSON

---

## 📚 Documentación

- **FASE_1_Documentacion.pdf** — Guía completa técnica
- **FASE_1_QUICKSTART.txt** — Referencia rápida con código
- **.env.example** — Variables de entorno

---

## 🔐 Seguridad

⚠️ **Importante:**
- Nunca subir `.env` a git
- Agregar a `.gitignore`
- No compartir credenciales
- Rotar keys periodicamente en producción
- Service Account key solo en backend

---

## 🛠️ Troubleshooting

**"Cannot GET /api/auth/verify"**
- Verificar backend en puerto 3000
- Revisar CORS en .env

**"Firebase: Error (auth/invalid-api-key)"**
- Verificar config en frontend/.env
- Habilitada la API en Firebase Console

**"SUPABASE_URL is undefined"**
- Revisar backend/.env existe
- Verificar docker-compose.yml pasa variables

---

## 📊 Stack Tecnológico

| Layer | Tech | Propósito |
|-------|------|-----------|
| Frontend | React 18 + Vite | UI del CRM |
| Backend | Node.js + Express | API REST |
| Database | Supabase (PostgreSQL) | Datos |
| Auth | Firebase Auth | Login |
| WhatsApp | whatsapp-web.js | Mensajería |
| Maps | Leaflet.js | Geolocalización |
| Export | PDF-lib, xlsx | Reportes |
| Infra | Docker Compose | Dev/Prod |
| Deploy | Render | Cloud |

---

## 🤝 Contribuir

1. Fork el repo
2. Crear rama: `git checkout -b feature/nueva-feature`
3. Commit: `git commit -m "Agregar nueva feature"`
4. Push: `git push origin feature/nueva-feature`
5. PR

---

## 📝 Licencia

Privada — Koffy (Kevin Flores Vallejos)

---

## 👤 Autor

**Kevin Flores Vallejos (Koffy)**
- 📍 Tarija, Bolivia
- 💼 Systemas Koffyz — Digital Design & Development
- 🌐 Especialidad: Low-code (AppSheet), Web, CRM

---

## 📞 Contacto

- Email: koffy.dev@example.com
- GitHub: [@koffy](https://github.com/koffy)

---

**Última actualización:** Fase 1 en desarrollo  
**Siguiente:** Fase 2 — WhatsApp Gateway
