-- Habilitar extensión UUID si la necesitamos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla: inventario_local
-- Guarda el stock actualizado del hospital
CREATE TABLE IF NOT EXISTS public.inventario_local (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cn TEXT NOT NULL,
    nombre TEXT,
    lote TEXT NOT NULL,
    fecha_caducidad DATE,
    cantidad INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(cn, lote)
);

-- 2. Tabla: estado_aemps (La Memoria)
-- Un registro de una sola fila para saber la última alerta procesada
CREATE TABLE IF NOT EXISTS public.estado_aemps (
    id INTEGER PRIMARY KEY DEFAULT 1,
    ultima_alerta_id TEXT NOT NULL,
    fecha_ultimo_escaneo TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    -- Truco para asegurar una única fila
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insertar valor inicial por defecto (luego se actualizará por el cron)
INSERT INTO public.estado_aemps (id, ultima_alerta_id) 
VALUES (1, 'inicial') 
ON CONFLICT (id) DO NOTHING;

-- 3. Tabla: alertas_historico
-- Registro general de todas las alertas emitidas por AEMPS leídas
CREATE TABLE IF NOT EXISTS public.alertas_historico (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alerta_id TEXT UNIQUE NOT NULL, -- Ej: Identificador o URL de la AEMPS
    titulo TEXT,
    fecha_publicacion DATE,
    cns_afectados JSONB, -- Array de CNs extraídos
    lotes_afectados JSONB, -- Array de lotes extraídos
    raw_texto TEXT, -- Texto completo o enlace para auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabla: incidencias_hospital
-- Núcleo del dashboard. Se llena SOLAMENTE cuando hay coincidencia (match)
CREATE TYPE estado_incidencia AS ENUM ('Pendiente', 'Resuelta', 'Falsa Alarma');

CREATE TABLE IF NOT EXISTS public.incidencias_hospital (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alerta_id TEXT REFERENCES public.alertas_historico(alerta_id),
    cn TEXT NOT NULL,
    lote_afectado TEXT NOT NULL,
    estado estado_incidencia DEFAULT 'Pendiente',
    accion_tomada TEXT, -- (Ej. cuarentena, devolución, etc.)
    fecha_deteccion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    notas TEXT
);

-- Políticas de Seguridad RLS (Opcional pero recomendable bajar la seguridad si usamos Server-Side con Service Role, o habilitarlas si va público)
-- Por ahora deshabilitamos RLS para desarrollo rápido o lo dejamos por defecto (cerrado a anon, abierto a authenticated/service_role).
