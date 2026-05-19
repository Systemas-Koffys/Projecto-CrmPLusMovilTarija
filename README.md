# 🚀 CRM Plus Móvil Tarija

Sistema CRM de alto rendimiento para el control de Radio Móviles, despacho de servicios automatizados por WhatsApp y administración de turnos de cabina.

> **Desarrollado y mantenido por:** Sistemas Koffys 🎧🚗

---

## 🛠️ Tecnologías y Arquitectura

- **Frontend**: React 18, Vite, CSS Vanilla (diseño premium de cristal templado - Glassmorphism).
- **Backend**: Node.js, Express, Puppeteer (WhatsApp Web integration).
- **Base de Datos**: Supabase (PostgreSQL) con políticas de seguridad RLS.
- **Autenticación**: Firebase Admin SDK (integrado con roles: Admin, Operadora, Contadora).

---

## 📦 Características Implementadas (Fase 2)

- **Conexión de WhatsApp Gateway**: Integración de dos líneas simultáneas de WhatsApp mediante Puppeteer y autogeneración de códigos QR de alta resolución con refresco en tiempo real.
- **Turnos de Cabina**: Apertura y cierre de turnos en tiempo real, registrando asistencias de móviles con checklist de limpieza.
- **Despacho Rápido**: Asignación de servicios directamente desde los chats entrantes de WhatsApp con envío automático de notificaciones a los clientes.
- **Caja de Turno**: Registro inmediato de cobros rápidos (turno libre, multas, limpieza).

---

## 🚀 Guía de Inicio Rápido (Local)

### 1. Requisitos previos
- Node.js (v18 o superior)
- Base de datos en Supabase (ejecutar `database/init.sql`)
- Archivo de credenciales de Firebase `serviceAccountKey.json` en la carpeta `backend/`

### 2. Configurar variables de entorno (`.env`)
Tanto en la carpeta `backend/` como en `frontend/` configura las variables correspondientes basadas en los archivos `.env.example`.

### 3. Ejecutar en desarrollo

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

*Made with 💖 by Sistemas Koffys*
