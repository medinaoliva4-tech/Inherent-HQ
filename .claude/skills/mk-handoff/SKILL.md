---
name: mk-handoff
description: >
  Fase M0 del método de Marketing — la aduana. Verifica qué entregó Strategy y Branding, extrae los
  campos críticos y declara faltantes antes de que Marketing produzca nada. Úsala al arrancar un
  ciclo de marketing con un cliente, o cuando pidan "arrancá marketing de X", "¿tenemos todo para
  hacer el plan?", "qué nos dejó estrategia". Bloquea si `posicionamiento.md` no pasó su gate humano
  — sin eso Marketing no existe. No interpreta ni completa lo que Strategy no entregó.
---

# M0 — Handoff

Leé `agents/marketing/METHOD.md` sección **M0** y `agents/marketing/FRONTERAS.md`.
Plantilla: `agents/marketing/templates/handoff-recibido.md`
Output: `agents/strategy/clients/<cliente>/marketing/handoff-recibido.md`

## Lo que hacés

1. **Verificás entregable por entregable** de Strategy (7 archivos) y de Branding (3 insumos).
2. **Extraés los 18 campos críticos** a la tabla §2 de la plantilla.
3. **Declarás faltantes** con su impacto, su supuesto y su vía de resolución.
4. **Emitís veredicto:** `PASS` o `BLOQUEADO`.

## La regla que bloquea todo

> 🛑 Si `posicionamiento.md` no existe o **no pasó su gate humano (GATE 2 de Strategy)**,
> Marketing está **BLOQUEADO**. Se para acá.

No se infiere el posicionamiento desde el brief, la web del cliente, las redes ni el research.
Se ofrece correr la skill `estrategia` primero.

## Los 5 campos que se copian LITERAL

```
promesa · territorio · enemigo · mecanismo único · movimiento elegido
```

**No se reformulan, no se "mejoran", no se resumen.** Reformularlos es empezar a rehacer la
estrategia con otras palabras — el error más común del departamento.

## Si Branding no existe

Se continúa y se marca `⚠️ SIN BRANDING — campañas sujetas a revisión de consistencia`.
Branding es requisito de **calidad**, no de arranque.

## Cierre
Correr el bloque **M0** de `agents/marketing/qa/QA-GATES.md`.
Si el veredicto es PASS → continuar con `mk-research-comercial`.
