-- 1. Borramos el historial y las incidencias de prueba
DELETE FROM public.incidencias_hospital;
DELETE FROM public.alertas_historico;

-- 2. Borramos nuestro inventario actual
DELETE FROM public.inventario_local;

-- 3. Reiniciamos la memoria de la AEMPS para que el bot empiece a leer desde hace una semana, no solo las de "hoy"
UPDATE public.estado_aemps 
SET ultima_alerta_id = 'inicial'
WHERE id = 1;

-- 4. Inyectar el inventario de prueba con el Lote afectado
INSERT INTO public.inventario_local (cn, nombre, lote, fecha_caducidad, cantidad)
VALUES 
('664977', 'LOSARTAN POTASICO KERN PHARMA 100 mg', 'M221', '2025-10-31', 300),
('650012', 'LOSARTAN CINFA 50 mg', 'LoteSeguro99', '2026-12-31', 500); -- Lote falso, no debe saltar
