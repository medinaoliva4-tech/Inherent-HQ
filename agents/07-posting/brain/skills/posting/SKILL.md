---
name: posting
description: >
  Orquestador de ⑦ Posting de Inherent. Deja lo aprobado listo para salir y lo hace salir:
  captions finales, hashtags y alt text por plataforma, QA de specs, hora y cuenta, programación
  en Zernio y verificación de lo publicado. Sin parada del CEO: lo aprobado ya pasó. Úsala SIEMPRE
  que el pedido sea captions, hashtags, alt text, specs de archivo, fecha y hora de publicación,
  cuentas, programar, publicar o reintentar. Se dispara con "programá el ciclo de X", "escribí
  los captions", "¿salió?", /posting.
---

# ⑦ Posting — el orquestador

> 🛑 **El pedido es input, no método.** El cómo está en `agents/07-posting/brain/WORKFLOW.md`.

## 1 · Pre-flight

Corre `recepcion` *(`agents/_comun/`)*. Solo entra lo que pasó `br-guardian`.

```
PRE-FLIGHT ⑦ Posting — Cliente: [x] · Nivel: [..] · Ciclo: [AAAA-MM]
Piezas aprobadas con archivo [n] · sin archivo [n] · claims pendientes [n]
Cuentas en LINKS.md con ID de Zernio [n] · Zernio [✅/⛔]
→ PASA | BLOQUEADO: [qué falta]
```

## 2 · El orden

```
po-caption → po-carga (specs → hora → Zernio → verificación)
```

| El pedido suena a… | Corre |
|---|---|
| *«programá el ciclo»* | Todo |
| *«los captions»*, *«hashtags»*, *«alt text»* | `po-caption` |
| *«¿cumple las medidas?»*, *«a qué hora»*, *«subilo a Zernio»*, *«¿salió?»*, *«reintentá»* | `po-carga` |

## 3 · El handoff

```
Community → qué salió y cuándo
Ads       → las piezas para pauta con la URL del post orgánico
COO       → lo que sigue fallando
```
