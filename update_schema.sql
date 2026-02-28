-- Crear tabla para configuraciones de alertas (Destinatarios de correo)
CREATE TABLE IF NOT EXISTS public.configuracion_alertas (
    id INTEGER PRIMARY KEY DEFAULT 1,
    emails_destinatarios JSONB DEFAULT '[]', -- Array of email strings
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    CONSTRAINT single_row_config CHECK (id = 1)
);

-- Insertar valor por defecto
INSERT INTO public.configuracion_alertas (id, emails_destinatarios) 
VALUES (1, '[]') 
ON CONFLICT (id) DO NOTHING;
