# Daily Hub v3 — Supabase

PWA de recordatorios conectada a Supabase y publicada como frontend estático en GitHub Pages.

## Incluye

- Login con email y contraseña mediante Supabase Auth.
- Recordatorios sincronizados entre dispositivos, con RLS por usuario.
- PWA instalable, checklist diario, recordatorios recurrentes y modo vehículo.
- Analítica de visitas con una Supabase Edge Function: fecha/hora, IP obtenida del lado servidor, user-agent, ruta y país sólo cuando el proxy lo aporta.

## Analítica de visitas

El frontend de GitHub Pages hace una llamada no bloqueante a la Edge Function log-visit. Sólo envía la ruta sin query string. La función obtiene la IP y el user-agent de los encabezados del proxy y escribe el registro usando una credencial de servidor que nunca se publica.

### Despliegue

1. En el proyecto de Supabase, ejecutá el SQL de supabase/migrations/20260905_visit_analytics.sql en SQL Editor.
2. Instalá/iniciá sesión en Supabase CLI y vinculá este directorio con tu proyecto.
3. Configurá el origen autorizado; incluí el dominio propio si luego agregás uno:

       supabase secrets set ALLOWED_ORIGINS=https://fabriciodiaxxx-netizen.github.io

4. Desplegá la función sin exigir JWT; el origen se valida dentro de la función:

       supabase functions deploy log-visit --no-verify-jwt

5. Confirmá en js/config.js que ANALYTICS_ENDPOINT apunte a la URL de tu proyecto. La publishable key ya presente es pública por diseño; no agregues una service-role key al frontend.
6. GitHub Pages se actualizará al llegar los cambios a main.

Supabase provee SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY a Edge Functions. No hace falta ni se debe subir esas variables al repositorio.

### Consultar registros

En Supabase Dashboard → SQL Editor, para ver los últimos registros:

    select visited_at, ip_address::text, country_code, user_agent, path
    from public.visit_events
    order by visited_at desc
    limit 100;

Para borrar lo anterior a 30 días, programalo semanalmente en Supabase o ejecutalo manualmente:

    delete from public.visit_events
    where visited_at < now() - interval '30 days';

La tabla no concede acceso a anon ni a authenticated; las consultas administrativas se hacen únicamente desde el Dashboard o con credenciales de administración.

## Privacidad

La política mínima está en PRIVACY.md. No se registran tareas, notas, credenciales, correos, cookies de analítica, referrer ni parámetros de URL. Si el endpoint no está disponible, la aplicación sigue funcionando con normalidad.
