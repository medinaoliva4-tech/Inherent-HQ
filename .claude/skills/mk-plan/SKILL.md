---
name: mk-plan
description: >
  Fases M2-M3 del método de Marketing — la decisión. Distribuye el objetivo del ciclo en fuentes de
  demanda con porcentajes, números y supuestos declarados (de dónde sale cada pedazo del número),
  y define el mix: qué tipos de marketing entran, qué rol comercial tiene cada canal y cómo se
  reparte el balance marca/respuesta en plata. Úsala cuando pidan "de dónde va a salir el número",
  "cómo llegamos a la meta", "qué tipos de marketing usamos", "qué canales", "el mix", "cuánto va
  a marca y cuánto a ventas". Requiere el research comercial hecho. Si el número no cierra con
  supuestos realistas, emite RETORNO A ESTRATEGIA en vez de maquillar la distribución.
---

# M2-M3 — Distribución del objetivo y mix

Leé `agents/marketing/METHOD.md` secciones **M2** y **M3**, y
`agents/marketing/playbooks/TIPOS-DE-MARKETING.md`.
Plantilla: `agents/marketing/templates/plan-de-marketing.md` (secciones 1 y 2)
**Input obligatorio:** `handoff-recibido.md` + `research-comercial.md`

## M2 — De dónde sale el número

> El error más común: asumir que el 100% del objetivo sale de un solo canal. **Casi nunca es así.**

```
OBJETIVO DEL CICLO (copiado de Strategy, sin reinterpretar)
   ├── Fuente A · canal/mecanismo  →  __%  →  [número]  →  supuesto + origen
   ├── Fuente B · ...
   └── Base actual (lo que ya vende sin hacer nada)  →  __%
                                                       ────
                                                       100%
```

**Las tres reglas:**
1. **Suma 100%.** Si no suma, falta una fuente o el número no cierra.
2. **Todo supuesto declara su origen:** `baseline propio` / `benchmark de categoría` / `⚠️ estimado`.
   Si más del 50% descansa en estimados → la distribución es **HIPÓTESIS, no plan**, y se define
   qué se mide en las primeras 2 semanas.
3. **La base no es cero.** Lo que el negocio ya vende entra como fuente, o Marketing se está
   atribuyendo demanda que ya existía.

**Test de viabilidad** contra `nucleo.md` C y `research-comercial.md` 1.4:

| Pregunta | Si falla |
|---|---|
| ¿El CAC implícito cabe en el margen? | Se reduce la fuente pautada o sube el aporte orgánico |
| ¿La capacidad de entrega aguanta el volumen? | Se recorta el objetivo de volumen y se declara |
| ¿El ciclo de compra deja ver el resultado a tiempo? | Se declara qué parte **no se va a ver** en este ciclo |

> Si ninguna combinación realista llega al número → **⟲ RETORNO A ESTRATEGIA**.
> No se maquilla la distribución para que cierre.

## M3 — El mix

**3.1 Tipos** — del toolkit de 12, se eligen pocos y a propósito. Cuatro filtros:
`apalanca una UNFAIR` · `coherente con el motor de demanda` · `cabe en los recursos` · `tiene dueño`.
**Todo tipo descartado se documenta con su razón.** Un mix sin descartes es un mix por costumbre.

**3.2 Rol comercial por canal** — el rol de Strategy se **copia**; encima se agrega:
`puesto comercial · naturaleza · formatos · métrica de compra · techo realista`.

> **Regla de arranque:** 1 canal de descubrimiento + 1 de confianza + 1 de conversión.
> Empezar con diez canales es no empezar con ninguno.

**3.3 Balance marca/respuesta** — el balance de Strategy se traduce a **plata y campañas**.
Las campañas de marca se declaran y **no se juzgan con ROAS**.

## Reglas duras
- El objetivo se **copia** de `posicionamiento.md`, nunca se reinterpreta.
- Ningún canal duplica el trabajo de otro (regla heredada de Strategy).
- Ningún canal entra sin dueño con nombre.
- El balance declarado tiene que coincidir con el de Strategy, o la diferencia se justifica.

## Cierre
Correr los bloques **M2** y **M3** de `agents/marketing/qa/QA-GATES.md`.
Continuar con `mk-campanas` — el gate M-2 se pide recién al cerrar M4.
