# Canales de mensajería

El equipo habla con el OS y resuelve sus decisiones desde Telegram. No hay chat nuevo: es una puerta más al Chat y a **Decide**. Código: `api/_lib/canales.js` y `public/js/canales/mensajeria.js`. Prueba: `npm run test:vision-canales`.

## Telegram (listo para conectar)

1. En Telegram habla con **@BotFather** → `/newbot` → guarda el **token**.
2. Pon estas variables de entorno en Vercel (nunca en el repo):
   - `TELEGRAM_BOT_TOKEN`: el token del bot.
   - `TELEGRAM_WEBHOOK_SECRET`: una cadena larga al azar (la inventas tú).
   - `CANALES_SECRETO`: otra cadena larga al azar; firma los botones.
   - `APP_URL`: la URL del OS (ya existe; da el botón «Abrir en el OS»).
3. Registra el webhook una vez (cambia los valores):
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/canales/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>`
4. **Vincular a una persona:** en el OS pide un código (`POST /api/canales/vincular` con `{"canal":"telegram"}`). Sirve una vez y vence en 10 minutos. La persona le escribe al bot `/vincular ABCD-EFGH`.
5. Comandos: `/hoy` o `/decide` (tus decisiones con botones), `/ayuda`, `/baja` (desvincula).

Qué hace: te muestra lo que espera por ti y te deja **Aprobar** o **Pedir cambios** (te pregunta qué cambiar). Pasa por las mismas reglas que la web: tu rol, tu área, la ficha, los criterios y la versión (si cambió, te manda al OS). Texto libre y notas de voz van al Chat cuando se conecte.

Qué **no** hace: pauta, presupuesto y precio **nunca** se resuelven por mensaje (solo «Abrir en el OS»). Solo habla con gente vinculada (los demás: silencio). Un cliente del portal no recibe nada de aquí. No manda costos ni notas internas.

## Conectado y lo que falta

- **Texto libre → Chat: conectado** (`api/index.js` inyecta `responderPorCanal` de `chat.js`). El mensaje entra como un turno «en cola» en una conversación **oculta** de esa persona (la misma ruta que la web); lo responde el trabajador del servidor y la respuesta vuelve al canal. Sin servidor en línea dice «El Chat del servidor no está en línea ahora». Si tarda más de 45 s: «Sigo trabajando… lo verás en el Chat del OS».
- **Notas de voz: sin conectar a propósito.** El servidor no tiene voz→texto; `configurar({ transcribir })` queda libre. Sin él, el bot lo dice («Aún no entiendo notas de voz»).
- **Decide → Telegram: conectado** vía `avisarDecisiones()`, que corre en cada pasada del despertador (`docs/DESPERTADOR.md`). Una vez por versión, solo con `TELEGRAM_BOT_TOKEN` y chat vinculado. Hasta agendar el despertador, no sale solo.
- `enviarDecision(email, item)` y `enviarAviso(email, texto)` siguen disponibles para empujar un mensaje puntual.

## WhatsApp (adaptador mínimo)

Solo la **WhatsApp Cloud API oficial** de Meta. **Prohibido** Baileys, whatsapp-web.js o similares: violan los términos y banean el número.

- Hace falta: un **número dedicado**, **verificación de Meta Business**, y las variables `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` (más `CANALES_SECRETO`).
- Webhook: `<APP_URL>/api/canales/whatsapp/webhook` (verifica la firma `X-Hub-Signature-256` y el desafío `hub.verify_token`).
- **Solo responde dentro de las 24 h** del último mensaje de la persona. Escribirle primero fuera de esa ventana exige una **plantilla aprobada por Meta**: no está construido; el aviso queda en `canal_pendientes` y sale cuando la persona escribe.
- Costos: las conversaciones iniciadas por la persona dentro de la ventana de servicio hoy no se cobran, pero **verifica los precios vigentes de Meta** antes de prometer nada.
- Pendiente de verificar con un número real: la firma sobre el cuerpo exacto (ver el reporte de la entrega) y la versión de la Graph API (`v21.0`).

## iMessage

No tiene API oficial de servidor. Solo existe con un **puente en un Mac encendido**. El adaptador solo responde `disconnected` y el porqué; no se construye.

## Estado

`GET /api/canales` devuelve `ready | disconnected | needs_permission` por canal, con su razón, y si tú tienes el canal vinculado. Los secretos salen del entorno y no se devuelven ni se escriben en logs.
