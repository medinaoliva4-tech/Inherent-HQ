---
name: po-carga
description: >
  Paso 2 de ⑦ Posting — del archivo aprobado a la publicación verificada. Revisa que cada archivo
  cumpla la spec de su plataforma (aspecto, duración, peso, safe zones, audio, sin watermark),
  pone la hora y la cuenta concreta sin que nada se pise, programa en Zernio con el account_id
  explícito, y después verifica que salió, reintenta las fallidas y registra la URL. Deja listos
  los paquetes de email y de envío manual. Úsala cuando pidan "¿cumple las medidas?", "a qué hora
  sale", "programalo en Zernio", "subí el ciclo", "¿salió?", "qué falló", "reintentá".
  Nunca publica en el acto.
---

# Specs → hora → Zernio → verificación

| | |
|---|---|
| **Consume** | Nodos `pieza` aprobados con su archivo final y su caption · los IDs de Zernio de `00-onboarding/LINKS.md` *(o `05-comunidad/respuestas.md`)* |
| **Produce** | Las publicaciones programadas en Zernio · el nodo `pieza` con `zernio_post_id`, estado y URL · los paquetes de email y manual |

🛑 **Sin Zernio conectado no se programa:** `BLOQUEADO — falta Zernio. Ver INSTALAR.md § Zernio`.

## 1 · Specs — verificar no es arreglar

| Chequeo | Si falla, vuelve a |
|---|---|
| **Aspecto** — 9:16 reel/story/TikTok · 4:5 o 1:1 feed | Quien lo exportó *(④ Producción o ⑤ Diseño gráfico)* |
| **Duración y peso** — se verifican en cada ciclo, nunca de memoria | ④ Producción |
| **Safe zones** — nada bajo la UI de la plataforma | Quien lo exportó |
| **Watermark de otra app** — 🛑 ninguno | ④ Producción |
| **Audio** — existe, sincronizado, audible | ④ Producción |
| **Claims** — todos validados por `br-guardian` | 🛑 No se programa |

**No se recorta, no se comprime, no se reexporta aquí.** Se devuelve con el motivo.

## 2 · Hora y cuenta

- **El día lo puso ③ Marketing y Creative y no se mueve.** Si una pieza no llega, se declara.
- **Cuenta no es canal:** se asigna la cuenta concreta con su `account_id`, confirmado con `accounts_list`.
- **La hora sale de las métricas de la cuenta** *(Zernio `analytics_get_best_time_to_post`)*; sin
  datos va `⚠️ SIN DATOS` y se declara el supuesto. **La «mejor hora» no se inventa.**
- Misma cuenta, mismo día: separadas unas horas · misma hora: 🛑 nunca.
- **Trial reels** *(solo Instagram)*: se programan con `trialParams` *(`SS_PERFORMANCE` por
  defecto)*; el ganador se marca candidato a pauta para ⑧ Ads.

## 3 · Programar en Zernio

1. Subir la media *(`media_generate_upload_link`)* y validarla *(`validate_media`, `validate_post`,
   `validate_post_length`)*.
2. Programar cada publicación a su fecha y hora *(`posts_create` con `account_id` explícito)*.
3. Guardar el `zernio_post_id` en el nodo de la pieza, con estado `programada`.

🛑 **Nada se publica en el acto** *(`posts_publish_now`)*. 🛑 **Ninguna credencial vive en el repo.**

**Email y envío manual** *(WhatsApp, SMS, impreso)* no van a Zernio: se entregan como paquete listo
con su checklist *(cuenta correcta, prueba en el celular, links que funcionan, quién contesta lo
que entre, permiso para el impreso)* y los envía una persona.

## 4 · Verificar que salió

| Paso | Herramienta |
|---|---|
| Estado de cada publicación | `posts_get` por `zernio_post_id` → `programada` / `publicada` *(con URL)* / `fallida` |
| Fallidas | `posts_list_failed` → `posts_retry` → se vuelve a leer |
| Lo que sigue fallando | Se reporta al COO: qué, qué dice Zernio, cuántos reintentos |

- 🛑 `posts_retry_all_failed` reintenta todo lo de Zernio, de cualquier cliente: solo si todas las
  fallidas son de este cliente y este ciclo.
- 🛑 **Bajar o borrar una publicación no se decide aquí:** se escala al COO.
- Las URLs de lo publicado van al nodo `pieza`: las leen `resultados`, ⑥ Community y ⑧ Ads.
