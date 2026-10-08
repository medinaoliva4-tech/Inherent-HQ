---
name: po-verificacion
description: >
  Capa 5 de ⑨ Posting — revisa en Zernio el estado de cada publicación del ciclo: programada,
  publicada o fallida. Lee cada `zernio_post_id` del registro con `posts_get`, cruza las fallidas con
  `posts_list_failed`, las reintenta con `posts_retry` y reporta lo que sigue fallando. Actualiza la
  columna `estado` de `calendario-de-publicacion.csv` y escribe la sección § Verificación de
  `publicaciones.md`, con la URL de lo publicado. No abre las redes: el control de calidad de lo
  publicado lo hace el CEO en persona. Úsala cuando pidan "¿salió todo?", "¿qué falló?", "revisá lo
  programado", "pasame los links de lo que salió".
---

# Capa 5 · Verificación — ¿salió?

| | |
|---|---|
| **Consume** | `calendario-de-publicacion.csv` — las filas con `zernio_post_id` · el estado de cada publicación en Zernio |
| **Produce** | La columna **`estado`** en `programada` / `publicada` / `fallida` · la sección **§ Verificación** de `publicaciones.md`, con la URL de cada publicación y lo que sigue fallando |

Contexto del departamento: `pipelines/contenido/05-convert/posting/brain/WORKFLOW.md`.

🛑 **Sin Zernio conectado no se verifica:** `BLOQUEADO — falta Zernio. Instalala: ver INSTALAR.md § Zernio`.

## 1 · 🛑 La regla de la capa

**El estado sale de Zernio, publicación por publicación. No se abren las redes.**

El control de calidad de lo publicado —cómo se ve en el teléfono, si el link funciona, si el Reel
quedó como Reel— lo hace **el CEO en persona**, y no se registra.

**Corre en dos momentos:** después de programar, para confirmar que todo quedó `programada`, y
después de las fechas del calendario, para saber qué se publicó y qué falló.

## 2 · Qué se revisa

| Paso | Herramienta | Qué se hace |
|---|---|---|
| 1 | **`posts_get`** | Por cada `zernio_post_id` del registro: su estado, su cuenta y su fecha y hora |
| 2 | **`posts_list_failed`** | Las fallidas de Zernio — se cruzan con el registro por `zernio_post_id` |
| 3 | **`posts_list`** | El panorama por estado, si hace falta. 🛑 Trae 10 por defecto: se le pone un `limit` que cubra el ciclo |

| Zernio dice | `estado` en el registro |
|---|---|
| `scheduled` | **`programada`** |
| `published` | **`publicada`** — se registra la URL de la publicación |
| `failed` · `partial` *(salió en unas cuentas y en otras no)* | **`fallida`** |

🛑 **Se reporta igual que una fallida:** una publicación que `posts_get` no encuentra, una que sigue
`programada` después de su fecha, o una cuya cuenta o fecha no coinciden con el registro.

**Se registra la URL de cada publicación publicada.** Es lo que después necesitan ④ Creatividad para
su loop y ⑩ Ads para pautar sobre el orgánico.

## 3 · Las fallidas

| Paso | Qué se hace |
|---|---|
| 1 | Se lee en `posts_get` **qué dice Zernio** de la falla |
| 2 | **`posts_retry`** con su `zernio_post_id` |
| 3 | Se vuelve a leer el estado: si salió, pasa a `publicada` |
| 4 | **Lo que sigue fallando se reporta** — qué publicación, qué dice Zernio, cuántos reintentos y qué hace falta |

🛑 **`posts_retry_all_failed` reintenta todo lo fallido de Zernio, de cualquier cliente.** Solo se
usa si todas las fallidas de `posts_list_failed` son de este cliente y de este ciclo; si no, se
reintenta una por una.

🛑 **Bajar o borrar una publicación** (`posts_unpublish_post`, `posts_delete`) **no se decide en
esta capa:** se escala al COO.

## 4 · Qué se pasa para adelante

| A quién | Qué |
|---|---|
| **④ Creatividad** (`cr-loop`) | Las URLs de lo publicado — sin ellas no puede leer el rendimiento pieza por pieza |
| **⑩ Ads** | Las piezas marcadas para pauta, con su URL de post orgánico |
| **⑧ Community** | Qué salió y cuándo, para el seguimiento de comentarios |
| **El COO** | Lo que sigue fallando después del reintento |
| **`po-loop`** | Lo que falló y lo que llegó tarde |

---

## Control de calidad de la Capa 5

- [ ] 🛑 **El estado de cada publicación salió de Zernio** (`posts_get`), una por una — ninguna se dio por buena sin leerla
- [ ] Toda fila del registro con `zernio_post_id` tiene su **`estado` actualizado**: `programada` / `publicada` / `fallida`
- [ ] Las fallidas se cruzaron con **`posts_list_failed`** y se **reintentaron**
- [ ] 🛑 `posts_retry_all_failed` solo se usó si todas las fallidas eran de **este cliente y este ciclo**
- [ ] Lo que **sigue fallando está reportado**, con lo que dice Zernio y qué hace falta
- [ ] Las publicaciones que Zernio no encuentra, o que siguen `programada` después de su fecha, están reportadas
- [ ] La **URL** de cada publicación publicada está registrada
- [ ] 🛑 **Nada se bajó ni se borró desde acá** — se escaló al COO
- [ ] Las URLs se pasaron a **④ Creatividad para su loop** y a **⑩ Ads** las marcadas para pauta
