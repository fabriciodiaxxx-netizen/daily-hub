# Daily Hub v2

Versión actualizada del proyecto para uso diario desde iPhone y sticker NFC.

## Cambios incluidos

- Se reemplazó "Credencial" por "Cargador".
- Recordatorios recurrentes estilo alarmas de iPhone:
  - Nunca
  - Todos los días
  - Días laborables
  - Fines de semana
  - Cada semana
  - Personalizado por días
- Fecha opcional para finalizar una repetición.
- Las tareas recurrentes aparecen automáticamente en "Hoy" y "Próximos".
- Completar una tarea recurrente solo completa esa ocurrencia; vuelve a aparecer en su siguiente día correspondiente.
- El modo vehículo también incluye las tareas recurrentes del día.
- Editar una tarea recurrente modifica toda su regla.
- Eliminar una tarea recurrente elimina toda la serie.

## Abrir localmente

1. Abrí la carpeta `daily-hub-v2` en VS Code.
2. Clic derecho en `index.html`.
3. `Open with Live Server`.

## Modo vehículo

Para probar el acceso que luego usaría el NFC:

`http://127.0.0.1:5500/index.html?modo=auto`

Cuando la página esté publicada, el sticker NFC tendrá una URL como:

`https://TU-DOMINIO/?modo=auto`

## Notificaciones

El proyecto ya guarda:
- fecha,
- hora,
- margen de aviso,
- repetición,
- días personalizados,
- fecha final.

Mientras la página/PWA está activa puede mostrar una notificación web cuando corresponde.

Para recibir avisos fiables en iPhone aunque la PWA esté completamente cerrada, la próxima etapa será conectar Web Push real con backend y notificaciones push programadas.
