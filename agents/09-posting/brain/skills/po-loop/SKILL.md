---
name: po-loop
description: >
  Capa 6 de ⑨ Posting — cierra el ciclo con las cuatro lecturas: qué no llegó a tiempo y de dónde
  venía, qué se devolvió y por qué, qué falló al publicar, y si el ciclo quedó programado a tiempo.
  Devuelve como dato —no como reclamo— lo que es de ③ Marketing (fechas de preparación cortas) y de
  ⑥A Diseño gráfico / ⑦ Video Editing (specs que fallan siempre). Escribe
  `aprendizaje-de-posting.md`. Úsala cuando pidan "qué se cayó este mes", "por qué llegó tarde",
  "cerrá el ciclo de posting", "qué falló en Zernio".
  Requiere el ciclo publicado y verificado.
---

# Capa 6 · Loop — qué se cayó y por qué

| | |
|---|---|
| **Consume** | `calendario-de-publicacion.csv` completo, con `estado` de todas las filas · la § Verificación de `publicaciones.md` · las fechas de preparación de ③ Marketing · cuándo quedó `programada` cada fila en Zernio |
| **Produce** | **`aprendizaje-de-posting.md`** — archivo de trabajo interno: no se entrega al cliente pero **sí se guarda**. Plantilla: `aprendizaje-de-posting.md`, al lado de esta skill |

Contexto del departamento: `agents/09-posting/brain/WORKFLOW.md`.

## 1 · Las cuatro lecturas

| # | Lectura | La pregunta | De dónde sale |
|---|---|---|---|
| **1** | **Llegó tarde** | ¿Qué piezas no estaban a tiempo, y de dónde venían? | Fecha de entrega real de ⑥A Diseño gráfico / ⑦ Video Editing vs. la `fecha` de la fila |
| **2** | **Se devolvió** | ¿Qué se devolvió, a quién y por cuál de los 5 motivos? | La tabla de devoluciones de `publicaciones.md` |
| **3** | **Falló al publicar** | ¿Qué quedó `fallida` en Zernio, y qué se recuperó con el reintento? | La § Verificación |
| **4** | **Programado a tiempo** | ¿El ciclo quedó programado a más tardar el día 19, y qué lo atrasó? | Cuándo quedó `programada` cada fila — Zernio (`posts_get`) |

## 2 · Lectura 1 — el que llega tarde no siempre es el que falla

```
| id_creativo | Se esperaba | Llegó     | Atraso | De quién venía |
| CR-003      | 2026-10-02  | 2026-10-07| 5 días | ⑥A Diseño gráfico |
| CR-009      | 2026-10-04  | nunca     | —      | ⑦ Video Editing   |
```

> 🛑 **Si el 30 % de las piezas llega tarde, el problema no está en Posting.** Está en las fechas de
> preparación de ③ Marketing o en los tiempos de ⑥A Diseño gráfico y ⑦ Video Editing. Eso se
> devuelve **como dato, no como reclamo**: con el número, no con la queja.

| Patrón | A quién va |
|---|---|
| Siempre llega tarde el **mismo formato** | ⑥A Diseño gráfico o ⑦ Video Editing: ese formato lleva más tiempo del previsto |
| Llega tarde **todo, parejo** | ③ Marketing: las fechas de preparación son cortas para el ciclo |
| Llega tarde lo que **depende del cliente** | ① Strategy: el tiempo de respuesta declarado no es el real |

## 3 · Lectura 2 — las devoluciones que se repiten

Una devolución aislada es ruido. **La misma devolución tres ciclos seguidos es un proceso roto.**

```
| Motivo                        | Veces | A quién | ¿Se repite de ciclos anteriores? |
| 2 · No cumple la spec (9:16)  | 4     | ⑦ Video Editing      | Sí — tercer ciclo                |
```

| Si se repite | Qué se propone |
|---|---|
| **Specs** que fallan siempre | Que ⑥A Diseño gráfico / ⑦ Video Editing fijen la spec **antes** de exportar. Se les pasa la tabla de aspectos |
| **Falta de copy** en ④ Creatividad | Que ④ Creatividad verifique el copy literal antes de cerrar el Excel del ciclo |
| **Claims** que llegan sin validar | Que ②B Branding los valide **antes** del cierre de ④ Creatividad, no en Posting |

🛑 **Se propone, no se impone.** Cada departamento decide sobre su propio proceso.

## 4 · Lectura 3 — lo que falló publicado

```
| id     | Qué falló              | Causa raíz                    | Qué evita que se repita |
| PO-004 | Fallida — sin la media | URL que Zernio no podía leer  | `validate_media` antes de programar — ya está en el QA de po-carga |
```

**La causa raíz importa más que el incidente.** Si la causa ya está cubierta por un chequeo que
existe, el problema no es el proceso: es que ese chequeo se saltó, y eso también se anota.

## 5 · Lectura 4 — ¿quedó programado a tiempo?

```
| Última fila programada | ¿Programado al día 19? | Qué lo atrasó |
| 2026-10-18             | ✅                     | —             |
```

🛑 **El ciclo queda programado a más tardar el día 19.** Si se programó tarde porque las capas
anteriores llegaron tarde, la causa va a la Lectura 1 — con el número.

## 6 · Lo que sube a las skills

| Si pasa esto | Va a |
|---|---|
| Un límite de plataforma cambió | La tabla de `po-caption`, con fecha nueva |
| Una spec falla siempre en el mismo formato | La tabla de `po-specs` |
| Zernio cambió una herramienta o lo que pide | `po-carga` y la § Sobre Zernio de `skills/README.md` |
| Una hora rindió consistentemente en una cuenta | Deja de ser `⚠️ SIN DATOS`: pasa a dato en `po-programacion` |

🛑 **Un dato de plataforma que se actualiza, se actualiza con fecha.** Sin fecha vuelve a caducar sin
que nadie lo note.

---

## Control de calidad de la Capa 6

- [ ] Las **cuatro lecturas** están hechas — ninguna se omitió
- [ ] Lo que llegó tarde tiene **de quién venía** y cuántos días
- [ ] Los patrones de atraso están atribuidos al **departamento correcto**, con el número
- [ ] 🛑 **Todo lo que vuelve a otro departamento va como dato, no como reclamo**
- [ ] Las devoluciones repetidas están identificadas, con **cuántos ciclos** llevan
- [ ] Cada falla publicada tiene su **causa raíz**, no solo el incidente
- [ ] Si la causa ya estaba cubierta por un chequeo, está anotado que **el chequeo se saltó**
- [ ] Está anotado **cuándo quedó programado el ciclo**, y si fue a más tardar el día 19
- [ ] Los datos de plataforma que cambiaron se actualizaron **con fecha**
