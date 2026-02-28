-- 1. Borrar todas las incidencias (matches de los tests)
DELETE FROM public.incidencias_hospital;

-- 2. Borrar todo el historial de alertas scrapeadas
DELETE FROM public.alertas_historico;

-- 3. Reiniciar la "memoria" del Bot para que vuelva a escanear desde cero
UPDATE public.estado_aemps 
SET ultima_alerta_id = 'inicial', 
    fecha_ultimo_escaneo = timezone('utc'::text, now())
WHERE id = 1;

-- 4. Borrar el inventario actual de medicamentos cargado desde el Excel 
DELETE FROM public.inventario_local;
