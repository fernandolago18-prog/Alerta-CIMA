-- Añadir la nueva columna de Comunicados (array JSON de strings) a la tabla de incidencias
ALTER TABLE public.incidencias_hospital
ADD COLUMN IF NOT EXISTS comunicados JSONB DEFAULT '[]'::jsonb;
