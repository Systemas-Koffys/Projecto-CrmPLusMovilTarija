-- ═══════════════════════════════════════════════════════════════
-- CRM RADIO MÓVILES — Plus Móvil Tarija
-- Script de creación de tablas para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Made in Sistemas Koffys
-- ═══════════════════════════════════════════════════════════════

-- 1. TABLA DE USUARIOS Y ROLES
CREATE TABLE IF NOT EXISTS users_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT,
  role TEXT NOT NULL CHECK (role IN ('operadora', 'contadora', 'admin', 'personal')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE OPERADORAS
CREATE TABLE IF NOT EXISTS operadoras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users_roles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  telefono TEXT,
  fecha_ingreso TIMESTAMPTZ DEFAULT NOW(),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE CHOFERES
CREATE TABLE IF NOT EXISTS choferes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  ci TEXT UNIQUE,
  telefono TEXT,
  telefono_emergencia TEXT,
  tipo_sangre TEXT,
  fecha_ingreso TIMESTAMPTZ DEFAULT NOW(),
  es_socio BOOLEAN DEFAULT false,
  numero_movil TEXT,
  foto_url TEXT,
  foto_auto_url TEXT,
  foto_placa_url TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_whatsapp TEXT UNIQUE NOT NULL,
  nombre TEXT,
  zona TEXT,
  historial_servicios INT DEFAULT 0,
  blacklist BOOLEAN DEFAULT false,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE TURNOS
CREATE TABLE IF NOT EXISTS turnos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operadora_id UUID REFERENCES operadoras(id),
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'cerrado', 'cancelado')),
  resumen JSONB DEFAULT '{}',
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE SERVICIOS
CREATE TABLE IF NOT EXISTS servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES clientes(id),
  chofer_id UUID REFERENCES choferes(id),
  operadora_id UUID REFERENCES operadoras(id),
  turno_id UUID REFERENCES turnos(id),
  fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  zona TEXT,
  destino TEXT,
  gps_lat FLOAT,
  gps_lng FLOAT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'asignado', 'en_curso', 'completado', 'cancelado', 'no_entregado')),
  tiempo_respuesta INT, -- en minutos
  monto DECIMAL(10,2),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE COBROS
CREATE TABLE IF NOT EXISTS cobros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chofer_id UUID REFERENCES choferes(id),
  operadora_id UUID REFERENCES operadoras(id),
  turno_id UUID REFERENCES turnos(id),
  concepto TEXT NOT NULL,
  monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
  fecha_hora TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE DOCUMENTOS DE CHOFERES
CREATE TABLE IF NOT EXISTS documentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chofer_id UUID REFERENCES choferes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('soat', 'revision_tecnica', 'licencia', 'poliza', 'otro')),
  fecha_emision DATE,
  fecha_vencimiento DATE,
  archivo_url TEXT,
  estado TEXT DEFAULT 'valido' CHECK (estado IN ('valido', 'por_vencer', 'vencido')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA DE ASISTENCIAS
CREATE TABLE IF NOT EXISTS asistencias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chofer_id UUID REFERENCES choferes(id),
  turno_id UUID REFERENCES turnos(id),
  hora_entrada TIMESTAMPTZ,
  limpieza BOOLEAN DEFAULT false,
  falta BOOLEAN DEFAULT false,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- ÍNDICES PARA PERFORMANCE
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_users_roles_email ON users_roles(email);
CREATE INDEX IF NOT EXISTS idx_users_roles_role ON users_roles(role);
CREATE INDEX IF NOT EXISTS idx_servicios_fecha ON servicios(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_servicios_estado ON servicios(estado);
CREATE INDEX IF NOT EXISTS idx_cobros_fecha ON cobros(fecha_hora);
CREATE INDEX IF NOT EXISTS idx_turnos_fecha ON turnos(fecha);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos(estado);
CREATE INDEX IF NOT EXISTS idx_documentos_vencimiento ON documentos(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_choferes_estado ON choferes(estado);

-- ═══════════════════════════════════════════════════════════════
-- DATOS DE PRUEBA
-- ═══════════════════════════════════════════════════════════════

-- Usuarios (deben coincidir con Firebase Auth)
INSERT INTO users_roles (email, nombre, role) VALUES
  ('operadora@test.com', 'Ana García', 'operadora'),
  ('contadora@test.com', 'María López', 'contadora'),
  ('admin@test.com', 'Kevin Flores', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Operadora de prueba
INSERT INTO operadoras (user_id, nombre, telefono)
SELECT id, 'Ana García', '+591 70000001'
FROM users_roles WHERE email = 'operadora@test.com'
ON CONFLICT DO NOTHING;

-- Choferes de prueba
INSERT INTO choferes (nombre, ci, telefono, numero_movil, es_socio) VALUES
  ('Juan Pérez', '1234567', '+591 70000010', '201', true),
  ('Carlos Mendoza', '2345678', '+591 70000011', '202', true),
  ('Roberto Flores', '3456789', '+591 70000012', '203', false),
  ('Miguel Torres', '4567890', '+591 70000013', '204', true),
  ('Pedro Vargas', '5678901', '+591 70000014', '205', false)
ON CONFLICT (ci) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

-- Habilitar RLS en todas las tablas
ALTER TABLE users_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE operadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE choferes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cobros ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- Política para permitir acceso con service_role key (backend)
CREATE POLICY "Service role full access" ON users_roles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON operadoras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON choferes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON turnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON servicios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON cobros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON documentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON asistencias FOR ALL USING (true) WITH CHECK (true);
