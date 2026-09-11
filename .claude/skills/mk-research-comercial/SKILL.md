---
name: mk-research-comercial
description: >
  Fase M1 del método de Marketing — el market research comercial. Releva qué ads están corriendo de
  verdad en la categoría, qué ofertas y promociones se usan, el calendario comercial (fechas duras,
  temporadas, valles, ventanas de saturación y de aire), los benchmarks de costo por canal y las
  tarifas de creadores, y abre al comprador en avatares con su nivel de consciencia y sofisticación.
  Úsala cuando pidan "qué está pautando la competencia", "qué anuncios corren en este rubro", "qué
  promociones usan", "cuándo vende esta categoría", "cuánto cuesta pautar acá", "quiénes son los
  avatares". NO es la ingeniería inversa de Strategy: esa estudia qué se dice, esta estudia qué se
  vende, cuándo y a qué costo. No decide campañas.
---

# M1 — Terreno comercial

Leé `agents/marketing/METHOD.md` sección **M1** y `agents/marketing/playbooks/MCP-PLAYBOOK.md`.
Plantilla: `agents/marketing/templates/research-comercial.md`
**Input obligatorio:** `handoff-recibido.md` con veredicto PASS

## La diferencia con Strategy

```
ingenieria-inversa.md (Strategy)  → qué se DICE y qué contenido funciona
research-comercial.md (Marketing) → qué se VENDE, cuándo y a qué costo
```

**No repitas el trabajo de Strategy.** Leé su `ingenieria-inversa.md` y construí encima.

## Los 5 bloques, ninguno opcional

| # | Bloque | Fuente principal |
|---|---|---|
| **1.1** | Publicidad viva: ads corriendo, con **días de longevidad** | AdWhispr · Eden |
| **1.2** | Ofertas y mecánicas promocionales vigentes + piso/techo de descuento | AdWhispr · web |
| **1.3** | Calendario comercial: fechas duras, picos, valles, saturación, aire | Firecrawl · WebSearch |
| **1.4** | Benchmarks de costo + tarifas de creadores + **CAC máximo tolerable** | AdWhispr · Eden |
| **1.5** | Avatares (2-4) + nivel de **sofisticación** del mercado | `ing-inversa.md` + ads de 1.1 |

## El número que gobierna todo lo demás

```
CAC MÁXIMO TOLERABLE = f(ticket promedio, margen bruto)   ← de nucleo.md sección C
```

Sin este número, el presupuesto de M6 es una lista de deseos. Si falta la economía unitaria:
`⚠️ SIN DATOS — viabilidad de paid no verificada`.

## Reglas duras

- **Un ad sin días de longevidad no dice nada.** Lo que lleva meses corriendo es lo que ganó.
- **Competidores verificados por MCP** (`🟢`) o marcados `🟡 no verificado`. Los nombres que genera
  un modelo con frecuencia **no anuncian**.
- **Ningún benchmark de costo se inventa.** Fuente, o `⚠️ estimado — a validar en 2 semanas`.
- **Toda fecha lleva fuente y año.** Una fecha de otro año sin confirmar va `⚠️ a confirmar`.
- **Cada avatar necesita su frase literal citada.** Sale de reviews, comentarios, DMs y objeciones
  de venta. Sin cita: `⚠️ SIN DATOS`. **Nunca se inventa.**
- **Dos avatares deben diferir en al menos dos dimensiones de motivación** — no solo en demografía.
- 🛑 **Esta fase no decide campañas.** Si escribís "por lo tanto hagamos una campaña de…",
  te saltaste a M4.

## Cierre
Bloque de fuentes obligatorio (MCPs usados, no disponibles, fecha, confianza, re-corrida).
Correr el bloque **M1** de `agents/marketing/qa/QA-GATES.md`.
