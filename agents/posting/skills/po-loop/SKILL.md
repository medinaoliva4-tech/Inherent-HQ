---
name: po-loop
description: >
  Capa 6 de ⑦ Posting — cierra el ciclo con las cuatro lecturas: qué no llegó a tiempo y de dónde
  venía, qué se devolvió y por qué, qué falló al publicar, y cuánto tardó cada aprobación. Devuelve
  como dato —no como reclamo— lo que es de ③ Marketing (fechas de preparación cortas) y de ⑥A/⑥B
  (specs que fallan siempre), y propone a ① Comprensión la corrección del tiempo real de aprobación.
  Escribe `aprendizaje-de-posting.md`. Úsala cuando pidan "qué se cayó este mes", "por qué llegó
  tarde", "cerrá el ciclo de posting", "cuánto tarda en aprobar este cliente". Requiere el ciclo
  publicado y verificado.
---

# Capa 6 · Loop — qué se cayó y por qué

| | |
|---|---|
| **Consume** | `calendario-de-publicacion.csv` completo, con `estado` de todas las filas · la § Verificación de `publicaciones.md` · las fechas de preparación de ③ · los tiempos reales de aprobación del ciclo |
| **Produce** | **`aprendizaje-de-posting.md`** — archivo de trabajo interno: no se entrega al cliente pero **sí se guarda**. Plantilla: `aprendizaje-de-posting.md`, al lado de esta skill |

Contexto del departamento: `agents/posting/WORKFLOW.md`.

## 1 · Las cuatro lecturas

| # | Lectura | La pregunta | De dónde sale |
|---|---|---|---|
| **1** | **Llegó tarde** | ¿Qué piezas no estaban a tiempo, y de dónde venían? | Fecha de entrega real de ⑥A/⑥B vs. la `fecha` de la fila |
| **2** | **Se devolvió** | ¿Qué se devolvió, a quién y por cuál de los 5 motivos? | La tabla de devoluciones de `publicaciones.md` |
| **3** | **Falló al publicar** | ¿Qué salió mal después de cargar? | La § Verificación |
| **4** | **Tiempo de aprobación** | ¿Cuánto tardó cada gate en volver aprobado? | Las fechas de los gates |

## 2 · Lectura 1 — el que llega tarde no siempre es el que falla

```
| id_creativo | Se esperaba | Llegó     | Atraso | De quién venía |
| CR-003      | 2026-10-02  | 2026-10-07| 5 días | ⑥A Diseño      |
| CR-009      | 2026-10-04  | nunca     | —      | ⑥B Video       |
```

> 🛑 **Si el 30 % de las piezas llega tarde, el problema no está en Posting.** Está en las fechas de
> preparación de ③ o en los tiempos de ⑥. Eso se devuelve **como dato, no como reclamo**: con el
> número, no con la queja.

| Patrón | A quién va |
|---|---|
| Siempre llega tarde el **mismo formato** | ⑥A o ⑥B: ese formato lleva más tiempo del previsto |
| Llega tarde **todo, parejo** | ③ Marketing: las fechas de preparación son cortas para el ciclo |
| Llega tarde lo que **depende del cliente** | ① Comprensión: el tiempo de respuesta declarado no es el real |

## 3 · Lectura 2 — las devoluciones que se repiten

Una devolución aislada es ruido. **La misma devolución tres ciclos seguidos es un proceso roto.**

```
| Motivo                        | Veces | A quién | ¿Se repite de ciclos anteriores? |
| 2 · No cumple la spec (9:16)  | 4     | ⑥B      | Sí — tercer ciclo                |
```

| Si se repite | Qué se propone |
|---|---|
| **Specs** que fallan siempre | Que ⑥A/⑥B fijen la spec **antes** de exportar. Se les pasa la tabla de aspectos |
| **Falta de copy** en ④ | Que ④ verifique el copy literal en su Gate 3 |
| **Claims** que llegan sin validar | Que ②B los valide **antes** del cierre de ④, no en Posting |

🛑 **Se propone, no se impone.** Cada departamento decide sobre su propio proceso.

## 4 · Lectura 3 — lo que falló publicado

```
| id     | Qué falló              | Causa raíz                    | Qué evita que se repita |
| PO-004 | Salió sin la media     | Media URL privada de Drive    | Verificar sin sesión — ya está en el QA de po-carga |
```

**La causa raíz importa más que el incidente.** Si la causa ya está cubierta por un chequeo que
existe, el problema no es el proceso: es que ese chequeo se saltó, y eso también se anota.

## 5 · Lectura 4 — cuánto tarda en aprobar este cliente

```
| Gate                | Presentado  | Aprobado    | Tardó   |
| 1 · Captions        | 2026-10-01  | 2026-10-03  | 2 días  |
| 2 · Paquete de carga| 2026-10-04  | 2026-10-04  | mismo día |
```

**El promedio del ciclo se compara con lo declarado** en `comprension.md` § La capacidad
(*"aprueba Ana, 24-48 h"*). Si no coincide después de 2-3 ciclos, **se propone la corrección a ①
Comprensión** — como propuesta, nunca editando su archivo.

> Un cliente que dice que aprueba en 24 h y tarda 6 días no está mintiendo: está describiendo la
> semana buena. **Ese número cambia el calendario entero de ③.**

## 6 · Lo que sube a las skills

| Si pasa esto | Va a |
|---|---|
| Un límite de plataforma cambió | La tabla de `po-caption`, con fecha nueva |
| Una spec falla siempre en el mismo formato | La tabla de `po-specs` |
| El formato de Publer cambió | `po-carga` y la § de Publer en `COMO-LAS-USA.md`, con fecha |
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
- [ ] El **tiempo real de aprobación** está medido y comparado con lo declarado en ①
- [ ] Si difiere tras 2-3 ciclos, se **propuso la corrección a ① Comprensión** — sin editar su archivo
- [ ] Los datos de plataforma que cambiaron se actualizaron **con fecha**
