-- Crear tabla de solicitudes entrantes de WhatsApp
CREATE TABLE IF NOT EXISTS solicitudes_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linea VARCHAR(50) NOT NULL, -- 'linea1' o 'linea2'
    cliente_telefono VARCHAR(20) NOT NULL,
    cliente_nombre VARCHAR(100),
    mensaje TEXT,
    gps_latitud DECIMAL(10, 8),
    gps_longitud DECIMAL(11, 8),
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'atendido', 'descartado')),
    servicio_id UUID REFERENCES servicios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indices para búsquedas rápidas en tiempo real
CREATE INDEX IF NOT EXISTS idx_solicitudes_whatsapp_estado ON solicitudes_whatsapp(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_whatsapp_telefono ON solicitudes_whatsapp(cliente_telefono);

-- Politicas RLS (Row Level Security)
ALTER TABLE solicitudes_whatsapp ENABLE ROW LEVEL SECURITY;

-- Permitir lectura y escritura a las operadoras/admins
CREATE POLICY "Permitir todo a usuarios autenticados" 
    ON solicitudes_whatsapp FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
