---
name: mk-calendario-comercial
description: >
  Fase M5 del método de Marketing — el calendario comercial. Convierte las campañas aprobadas en
  fechas reales: fechas importantes y de temporada, fechas de preparación calculadas hacia atrás,
  ventanas de expectativa, lanzamiento, sostenimiento, promoción y cierre, con dependencias y
  responsables. Úsala cuando pidan "cuándo lanzamos", "el calendario de campañas", "las fechas",
  "cuándo hay que empezar a preparar esto", "el cronograma". Requiere las campañas aprobadas.
  No reemplaza al calendario estratégico de Strategy: se apoya sobre él. Ninguna fecha de
  lanzamiento entra sin su fecha de preparación.
---

# M5 — Calendario comercial

Leé `agents/marketing/METHOD.md` sección **M5** y
`agents/marketing/playbooks/CALENDARIO-COMERCIAL.md`.
Plantilla: `agents/marketing/templates/calendario-comercial.csv`
**Input obligatorio:** `campanas.md` con GATE M-2 pasado + `research-comercial.md` 1.3

## Las 5 fases de toda campaña

```
PREPARACIÓN → EXPECTATIVA → LANZAMIENTO → SOSTENIMIENTO → CIERRE
invisible     tensión       el pico       la conversión   el corte
```

## La regla de la fecha de preparación

> **Ninguna fecha de lanzamiento entra sin su `fecha_prep_inicio`.**

Se calcula **hacia atrás**, paso por paso:

```
LANZAMIENTO
 − carga y programación
 − setup técnico (landing, links, automatizaciones)
 − aprobación del cliente        ← el que más se subestima (sale de nucleo.md)
 − revisión interna
 − producción
 − brief a Creative
= FECHA DE INICIO DE PREPARACIÓN
```

Si la velocidad de aprobación no está documentada: `⚠️ SIN DATOS — se asume [N] días` + riesgo declarado.

## Columnas fijas

```
campana · fase · fecha_inicio · fecha_fin · hito · fecha_prep_inicio ·
dependencia · responsable · canal · naturaleza · funcion · estado
```

## Expectativa — opcional y peligrosa

| Entra si… | NO entra si… |
|---|---|
| Hay algo real que revelar | Es relleno con cuenta regresiva |
| La audiencia ya conoce la marca | Nadie conoce la marca todavía |
| El payload aguanta lo prometido | Lo revelado va a decepcionar |

> La expectativa es un **préstamo de atención**. Si lo revelado no la paga, la próxima vez nadie presta.

## Chequeos obligatorios
- [ ] Toda fila de lanzamiento tiene `fecha_prep_inicio` · toda fila tiene `responsable`
- [ ] Toda campaña tiene `fecha_fin` — ninguna queda abierta
- [ ] Las fechas duras de M1.3 están reflejadas
- [ ] Ninguna campaña de **activación** cae en un valle sin justificación
- [ ] Ninguna cae en ventana de **saturación** sin presupuesto extra declarado
- [ ] No hay dos lanzamientos solapados compitiendo por el mismo equipo
- [ ] Las dependencias están marcadas secuenciales o paralelas
- [ ] El horizonte respeta el **ciclo de compra** de la categoría
- [ ] **No contradice** al `calendario-estrategico.csv` de Strategy

> El error más caro no es olvidar una tarea: es poner **dos campañas en paralelo que compiten por
> la misma persona**. Se ve recién en la semana de producción, cuando ya es tarde.

Si hay MCP de calendario disponible, cruzar contra el calendario real del equipo y del cliente.

## Cierre
Correr el bloque **M5** de `agents/marketing/qa/QA-GATES.md`.
🚦 **GATE M-3** — el calendario lo aprueba un humano.
