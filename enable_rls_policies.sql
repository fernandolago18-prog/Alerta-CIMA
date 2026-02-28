-- 1. Habilitar RLS en todas las tablas sensibles
ALTER TABLE public.inventario_local ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidencias_hospital ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estado_aemps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_alertas ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar cualquier política existente (limpieza opcional)
DROP POLICY IF EXISTS "Denegar todo a anon" ON public.inventario_local;
DROP POLICY IF EXISTS "Denegar todo a anon" ON public.incidencias_hospital;
DROP POLICY IF EXISTS "Denegar todo a anon" ON public.estado_aemps;
DROP POLICY IF EXISTS "Denegar todo a anon" ON public.alertas_historico;
DROP POLICY IF EXISTS "Denegar todo a anon" ON public.configuracion_alertas;

-- 3. Crear Políticas restrictivas que DENEGAN todas las operaciones al rol "anon" (el que usa el cliente web por defecto)
-- Nota: En Supabase, RLS habilitado sin ninguna política que diga "PERMITIDO" significa que, por defecto, se deniega el acceso a "anon" y "authenticated".
-- El Service Role Key (que usan los scripts locales o el servidor de Next.js si se configura) saltará este bloqueo por defecto.
-- Dado que vamos a continuar usando el cliente NEXT_PUBLIC_SUPABASE_ANON_KEY desde el SERVER de Next.js, en realidad el servidor actuará como "anon".
-- ¡ESPERA! Si usamos ANON_KEY en el servidor, Supabase lo verá como anónimo y lo bloqueará, rompiendo la app.
-- Solución: Debes añadir tu SUPABASE_SERVICE_ROLE_KEY a las variables de entorno para que el servidor pueda saltar RLS.

-- Por tanto, esta política RLS cerrará a cal y canto la base de datos a internet, asumiendo que el servidor NEXT.js pasará a usar SERVICE_ROLE_KEY.
-- Si prefieres seguir usando la clave anónima (poco seguro), tendríamos que permitir acceso desde IPs concretas o deshabilitar RLS.

-- **RECOMENDADO**: Ve a tu panel de Supabase -> Project Settings -> API -> `service_role` (secret) y cópialo.
-- Ponlo en el `.env.local` y Vercel como `SUPABASE_SERVICE_ROLE_KEY="tu-clave"`.
-- Y en `src/lib/supabase.ts` cambia la inicialización para que use esa clave (o mantén ambas).
