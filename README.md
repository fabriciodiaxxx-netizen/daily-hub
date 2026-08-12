# Daily Hub v3 — Supabase

Versión conectada a Supabase.

## Incluye

- Login con email + contraseña mediante Supabase Auth.
- Recordatorios almacenados en Supabase.
- Sincronización entre dispositivos.
- RLS por usuario.
- Migración automática de tareas antiguas guardadas en localStorage cuando la nube está vacía.
- Hoy / Próximos / Hechas.
- Recordatorios recurrentes.
- Modo vehículo.
- Checklist local diario.
- PWA instalable.

## Configuración Supabase usada

Project URL:
`https://phjbapqvtmxxchfuxzwe.supabase.co`

El frontend utiliza una Publishable Key de Supabase en `js/config.js`.
No se incluye ninguna Secret key ni contraseña de base de datos.

## Probar

1. Subí el contenido de esta carpeta a la raíz del repositorio GitHub Pages.
2. Esperá el despliegue.
3. Abrí la app.
4. Iniciá sesión con el usuario creado en Supabase Auth.
5. Creá un recordatorio.
6. Abrí Daily Hub desde otro dispositivo e iniciá sesión con la misma cuenta.
7. El recordatorio debería sincronizarse.

## Próxima etapa

Web Push real:
- registrar la suscripción Push del iPhone,
- guardarla en `push_subscriptions`,
- generar VAPID keys,
- Edge Function para envío,
- tarea programada/Cron para recordatorios.
