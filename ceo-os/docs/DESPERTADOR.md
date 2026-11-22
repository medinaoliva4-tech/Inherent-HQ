# El despertador del motor

`POST /api/workflow/tick` hace avanzar lo que ya toca, sin que nadie abra el OS. Código: `api/_lib/tick.js`. Prueba: `npm run test:vision-tick`.

## Qué hace en cada pasada
1. **Corridas de workflows** con un paso listo, un reintento ya vencido o un proceso que murió a mitad de un paso (máx. 20). Respeta los topes por proveedor del motor.
2. **Lotes de correos ya aprobados** que quedaron en cola (máx. 5), solo si su contenido es **exactamente** el aprobado. El horario, el tope diario, las bajas y la auto-pausa los decide la política del Lead Engine.
3. **Avisos de Decide por Telegram** (`avisarDecisiones`): lo nuevo le llega **una vez por versión** a quien tiene el bot vinculado.

## Qué NO hace
- No aprueba nada. Lo que espera a una persona sigue esperando.
- No se salta un tope ni un horario.
- Un adaptador **sin conexión se salta y se dice** (`saltadas` / `saltados`); la corrida no se marca como fallida.
- Los lotes no se tocan mientras el correo no esté conectado (hoy no lo está: `motivo: sin_correo`).

## Cómo se protege
- Sin `CRON_SECRET` en el entorno → **503** (apagado). Nadie lo activa por accidente.
- Con secreto: va en la cabecera `x-cron-secret: <secreto>` o `Authorization: Bearer <secreto>`. Se compara en tiempo constante. Falta o es otro → **401**.
- Solo `POST`.

## Cómo agendarlo (nada de esto está activado)
`vercel.json` **no tiene** cron de esto. Opciones, de la más simple:
1. **Desde tu Mac** (cada 5 min con `launchd` o `cron`):
   `curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" https://<APP_URL>/api/workflow/tick`
2. **Un cron externo** (cron-job.org, GitHub Actions con `schedule`) con ese mismo `curl`; el secreto va en sus secretos, nunca en el repo.
3. **Cron de Vercel**: manda `GET`, y esta ruta es `POST`. Habría que añadir una ruta `GET cron/tick` al estilo de las otras; no se hizo porque cambia `vercel.json`.

Cada 5 minutos alcanza: los avisos y los envíos tienen sus propios topes.

## Respuesta
```json
{ "corridas": { "avanzadas": 0, "saltadas": [], "errores": 0 },
  "lotes": { "enviados": 0, "procesados": 0, "saltados": [], "errores": 0 },
  "decisiones": { "enviados": 0, "motivo": "sin_telegram" } }
```
