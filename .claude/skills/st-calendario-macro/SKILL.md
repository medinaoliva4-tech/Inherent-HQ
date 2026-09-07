---
name: st-calendario-macro
description: >
  Capa 7 del método Inherent — define distribución (owned/paid/earned/borrowed) y produce el
  calendario estratégico macro: frecuencia por canal, función y pilar por slot, temperatura, balance
  marca/activación, estacionalidad y fases del movimiento. Úsala cuando pidan "el calendario",
  "la cadencia de publicación", "cuánto publicamos y dónde", "el plan de distribución".
  Requiere el sistema de contenido hecho. NO baja a ideas día por día ni copies — eso es de Creative.
---

# Capa 7 — Distribución y Calendario Macro

Leé `agents/strategy/METHOD.md` sección **CAPA 7**.
Plantilla: `templates/calendario-estrategico.csv`

**Input obligatorio:** `estrategia-de-contenido.md` + `contenido-por-canal.md`

## 7.1 — Los 4 tipos de alcance

| | Qué es | Cuándo pesa |
|---|---|---|
| **Owned** | Perfiles, lista, sitio, local | Siempre — es la base que acumula |
| **Paid** | Pauta, patrocinio, medios | Cuando hay oferta validada o hay que forzar alcance |
| **Earned** | PR, boca a boca, reviews, UGC | Cuando el movimiento merece cobertura |
| **Borrowed** | Creadores, partners, comunidades | Cuando el unfair es acceso o relación |

**Volvé a mirar las UNFAIR:** si hay acceso privilegiado a una comunidad, medio, creador o
distribución física, la distribución tiene que explotarlo. Es donde más se desperdicia ventaja.

## 7.2 — Balance marca / activación

Punto de partida **60/40 a favor de marca**. Se rompe con justificación:

| Situación | Balance |
|---|---|
| Marca nueva, sin memoria | 70/30 marca |
| Categoría de captura pura (1.2c) | 40/60 activación |
| Ventana de lanzamiento / temporada alta | 30/70 activación |
| **Capacidad de entrega al tope** (Capa 0) | 80/20 marca |
| **Punto de equilibrio no cubierto** (Capa 0) | 40/60 activación |

Un balance sin justificación contra estas condiciones es un balance elegido por costumbre.

## 7.3 — El calendario

Columnas fijas:
```
semana · fase_del_movimiento · canal · funcion · pilar · temperatura · formato ·
frecuencia · balance · objetivo_del_slot · traza_a_must_be_true · estado
```

**Qué SÍ define Strategy:** frecuencia, función, pilar, temperatura, balance marca/activación,
estacionalidad, fases del movimiento.

**Qué NO define Strategy:** ideas concretas, temas del día, copies, guiones, diseños.
Eso lo convierte Creative a partir de este calendario.

## Reglas duras
- **Todo slot tiene `traza_a_must_be_true`.** Un slot sin traza se elimina.
- **La cadencia total tiene que caber en la capacidad de producción real.** Un calendario que el
  cliente no puede producir no es un calendario, es una fantasía. Verificá contra `nucleo.md` sección C.
- Las 4 temperaturas tienen que estar cubiertas entre todos los canales.
- El balance marca/activación se declara explícitamente, no queda implícito.

## Cierre
Correr el bloque **Capa 7** de `qa/QA-GATES.md`.
🚦 **GATE 3** — el calendario lo aprueba un humano antes del handoff.

## Handoff
Emitir el bloque HANDOFF de `PROCESS.md` → Growth (monetización) y Creative (piezas concretas).
