# QC y Entrega — [Cliente] / [Proyecto]

> Fase 5 · 🚦 Gate humano · **Ninguna pieza sale sin este documento completo.**

**Fecha:** · **Versión:** · **Editor:** · **Revisó:**

---

## A · Archivos entregados

| Archivo | Plataforma | Aspecto | Resolución | FPS | Peso | Duración |
|---|---|---|---|---|---|---|
| | | | | | | |

Nomenclatura: `<cliente>_<proyecto>_<version>_<formato>.<ext>`

---

## B · QC técnico

- [ ] Resolución y aspecto correctos para **cada** plataforma de destino
- [ ] FPS constante, sin drops ni frames duplicados
- [ ] `-pix_fmt yuv420p` en todos los exports
- [ ] `-movflags +faststart` en lo que va a web o social
- [ ] Loudness ≈ −14 LUFS · true peak ≤ −1.5 dBTP
- [ ] Sin clipping de audio ni ruido de fondo audible
- [ ] Texto y logo dentro de safe areas en **todos** los formatos
- [ ] Primer frame legible y elegido (sirve de miniatura)
- [ ] Último frame no negro: marca + CTA, ≥1.5s
- [ ] Sin frames negros intermedios ni flashes de render
- [ ] Reproduce bien en móvil, no solo en escritorio

## C · QC de contenido

- [ ] El hook cumple lo que promete
- [ ] **Un solo CTA**, hablado y en pantalla
- [ ] Todos los open loops abiertos se cierran
- [ ] Cada beat se traza al goal del brief
- [ ] Sin errores de ortografía en pantalla
- [ ] Datos, precios y nombres verificados contra el brief
- [ ] Se entiende **sin sonido** (si la plataforma lo exige)

## D · QC de marca

- [ ] Tipografía, pesos y tamaños según guideline
- [ ] Paleta correcta
- [ ] Look / LUT aprobado
- [ ] Logo: posición, tamaño, clear space y timing según guideline
- [ ] Sonotipo presente si el guideline lo exige
- [ ] Nada contradice el posicionamiento definido por Strategy

## E · QC legal

- [ ] Música con licencia vigente — [cuál, licencia]
- [ ] Imágenes y stock con licencia
- [ ] Personas en cuadro con autorización
- [ ] Material generado con IA declarado — [qué planos]
- [ ] Sin marcas de terceros sin permiso

---

## F · Retención — autochequeo

| Chequeo | Resultado |
|---|---|
| ¿Qué pasa en los primeros 3 segundos? | |
| ¿Hay algún tramo sin cambio de estímulo > [3-5s social / 20-30s YT]? | |
| ¿El mejor plano está antes de la mitad? | |
| ¿El CTA está en los últimos 3-5s? | |

---

## G · Hallazgos y correcciones

| # | TC | Hallazgo | Severidad | Acción | Estado |
|---|---|---|---|---|---|
| 1 | | | 🔴 bloquea / 🟡 mejorable | | ⬜ |

**Ninguna pieza se entrega con un 🔴 abierto.**

---

## H · Resultado

| | |
|---|---|
| QC técnico | ✅ / ⚠️ / 🔴 |
| QC de contenido | ✅ / ⚠️ / 🔴 |
| QC de marca | ✅ / ⚠️ / 🔴 |
| QC legal | ✅ / ⚠️ / 🔴 |
| **Apto para entrega** | ✅ Sí / 🔴 No — [qué falta] |

---

## 🚦 GATE 3 — Aprobación del master

| | |
|---|---|
| Estado | ⬜ Pendiente / ✅ Aprobado / 🔁 Con cambios |
| Aprobó | |
| Fecha | |
| Cambios pedidos | |

---

## I · Handoff

```markdown
## HANDOFF — Video → Content / Social Media
- Cliente: · Proyecto: · Fecha:
- Goal: · Runtime: · Plataformas:
- Masters: [rutas]
- Gates: brief [✅/⬜] · plan [✅/⬜] · master [✅/⬜]
- Disciplinas aplicadas:
- Brand guideline: ✅ aplicado / ⚠️ SIN GUIDELINE
- Música y assets con licencia: ✅ / ⚠️
- Material generado con IA: [qué planos] / ninguno
- Huecos abiertos: [⚠️ FALTA MATERIAL]
- Siguiente: Content (QA final) · Social Media (publicación)
```

**El agente no publica.**
