-- ═══════════════════════════════════════════════════════════════
-- CRM RADIO MÓVILES — Módulo de Incidentes y Multas
-- Sentencia SQL para agregar la tabla y configuraciones en Supabase
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS incidentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chofer_id UUID REFERENCES choferes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('accidente', 'falta_uniforme', 'retraso_turno', 'queja_cliente', 'mal_comportamiento', 'limpieza_vehiculo', 'otro')),
  descripcion TEXT NOT NULL,
  gravedad TEXT NOT NULL CHECK (gravedad IN ('leve', 'moderada', 'grave')),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  monto_multa DECIMAL(10,2) DEFAULT 0.00,
  estado_multa TEXT CHECK (estado_multa IN ('pendiente', 'pagado', 'no_aplica')) DEFAULT 'no_aplica',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_incidentes_chofer ON incidentes(chofer_id);
CREATE INDEX IF NOT EXISTS idx_incidentes_fecha ON incidentes(fecha);

-- RLS y políticas
ALTER TABLE incidentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON incidentes FOR ALL USING (true) WITH CHECK (true);
