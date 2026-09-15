---
name: pr-entrega
description: >
  Capa 6 del método de Producción — cierra el rodaje y entrega el material de forma que ⑥A Diseño y ⑥B Video
  pueda trabajar sin renombrar ni preguntar. Corre el checklist de cierre de locación, verifica
  cobertura y backup doble, marca selects, aplica nomenclatura y estructura de carpetas, y arma el
  manifiesto que cruza el Excel fila por fila contra lo entregado. Úsala cuando pidan "cerrá la
  entrega", "qué quedó grabado", "subí el material", "está completo esto". Requiere los call sheets
  aprobados (GATE 2).
---

# Capa 6 — Rodaje y entrega

Leé `agents/production/METHOD.md` sección **CAPA 6** + `toolkit/05-cobertura.md` y
`toolkit/07-entrega.md`. Plantilla: `templates/entrega.md`.

## La prueba de una buena entrega
⑥A o ⑥B abren la carpeta, cruzan contra el Excel creativo y **encuentran cada escena sin escribirle a
nadie**.

## Checklist de cierre de locación — antes de desarmar
- [ ] Todas las escenas de esta locación grabadas y marcadas en `estado`
- [ ] **Al menos dos tomas buenas** por escena
- [ ] Las 5 tomas de cobertura hechas por escena con talento o producto
- [ ] Ambiente de la locación grabado (30 s)
- [ ] Audio de cada escena con voz **escuchado con auriculares**, no asumido por el medidor
- [ ] 🛑 **Backup en dos lugares antes de salir de la locación**
- [ ] Faltantes anotados con motivo

> El backup doble no es paranoia: es la diferencia entre una tarjeta corrupta y una jornada perdida.

## Selects
Producción marca **las tomas buenas, y solo esas**. El frame exacto, el recorte y la composición son
de ⑥A Diseño; el corte, de ⑥B Video Editing. Marcar de más los obliga a revisar todo; marcar de menos les esconde la toma buena.

## Estructura
```
<cliente>/<campana>/
├── 00_RAW/jornada-N/     ← todo, incluido el descarte
├── 01_SELECTS/<id_creativo>/  ← punto de entrada de ⑥A. POR PIEZA, no por jornada
├── 02_AMBIENTES/
└── _ENTREGA/entrega.md
```

## El manifiesto
Cruza el Excel **fila por fila**: `id` · `id_creativo` · escena · ¿grabada? · archivo · ¿cobertura? ·
estado. Más el resumen por pieza.

🛑 **Una fila creativa está completa solo si TODAS sus escenas están entregadas.** Declarar completa
una pieza incompleta hace que ⑥A lo descubra en su mesa: una jornada entera de vuelta.

🛑 **Toda escena `Planificada` que no llegó a `Entregada` lleva motivo escrito.** Una escena que
desaparece en silencio es una pieza que no se va a poder armar.

## Lo que NO se entrega
Piezas terminadas, el frame elegido y recortado, la mezcla final, el retoque, la adaptación por
formato, el montaje y las versiones por plataforma. Todo eso es de ⑥A Diseño y ⑥B Video Editing.

🛑 **Nada se borra**, ni el descarte. Se marca.

## 🚦 GATE 3
La entrega se confirma antes de cerrar la jornada como completa. Después se emite el bloque de
HANDOFF de `PROCESS.md`.

## QA
`agents/production/qa/QA-GATES.md` → bloque **Capa 6**.

## Siguiente
→ `pr-loop` (Capa 7)
