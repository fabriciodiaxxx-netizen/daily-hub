# Daily Hub v4 — Web Push

Esta versión registra la suscripción Web Push del dispositivo y la guarda
en `public.push_subscriptions`.

## VAPID

Public key (puede estar en el frontend):
BD5J8cRzL91FBZJNMYhEPVuyUY8OwMdyjlU9IPXo_6SwlFejijdLymadHlyVopZCSH_mvTKvHdDZh83tS1z02yU

Private key (NO subir a GitHub):
Guardada aparte en el archivo `VAPID-PRIVATE-KEY.txt` que se entrega fuera del ZIP del proyecto.

## Supabase Edge Function

Se incluye:
`supabase/functions/send-reminders/index.ts`

La función necesita estos secretos:

- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- VAPID_SUBJECT

Ejemplo de VAPID_SUBJECT:
`mailto:tu-correo@example.com`

Supabase ya provee `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` a las Edge Functions alojadas.

## Flujo

1. El usuario inicia sesión.
2. Toca 🔔.
3. `PushManager.subscribe()` crea una suscripción.
4. Se guarda endpoint/p256dh/auth en `push_subscriptions`.
5. Un Cron llama `send-reminders` cada minuto.
6. La Edge Function detecta recordatorios que vencen.
7. Envía Web Push al iPhone.
8. `service-worker.js` muestra la notificación.

## Importante

La clave VAPID privada jamás debe entrar en el repositorio público.
