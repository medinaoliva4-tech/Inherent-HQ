---
name: st-foundation
description: >
  Capa 0 del método Inherent — documenta el núcleo real de una marca ANTES de que exista cualquier
  estrategia, oferta o campaña: qué significa GANAR para esta marca, qué tiene hoy, con qué recursos
  cuenta y qué restricciones reales enfrenta. Úsala al arrancar con un cliente nuevo, o cuando
  cualquier otra capa detecte que no existe un núcleo previo. Es la fuente humana cruda — describe
  lo que es verdad hoy, no diagnostica ni recomienda hacia dónde ir.
---

# Capa 0 — Foundation

Leé `agents/strategy/METHOD.md` sección **CAPA 0** completa. Plantilla: `templates/nucleo.md`.

## Qué hacés
Entendés **qué empresa estamos intentando hacer ganar**. Nada más. Es contexto y guardrails.

## Input

🔄 **Primero: ① Comprensión.** Este departamento corre **antes** que vos y ya dejó los hechos por
escrito. Se leen de ahí, **no se vuelven a preguntar**:

| Sección de `nucleo.md` | De dónde sale |
|---|---|
| **A · La empresa** — qué hace, oferta, precio, audiencia actual | `agents/comprension/clients/<cliente>/comprension.md` § El negocio · § El cliente · `oferta.csv` |
| **C · Economía unitaria** — ticket, capacidad de entrega | ídem § La oferta · § La capacidad |
| **D · Restricciones reales** — presupuesto, equipo, producción, aprobación | ídem § La capacidad |

🛑 **Se citan con su ruta, no se recopian.** Un campo copiado con otras palabras crea una segunda
versión de la verdad:

```markdown
| **Producto / oferta actual** | → `agents/comprension/clients/<cliente>/oferta.csv` |
| **Capacidad de producción** | → `comprension.md` § La capacidad |
```

🛑 **Si no existe `comprension.md` con su Gate 2 aprobado: BLOQUEADO.** Se corre ① primero. Esta
skill **no sustituye a ①** — lo único que decide acá es **la dirección**: el **WIN** (sección B) y el
arquetipo (sección E). Detalle del corte en `agents/comprension/WORKFLOW.md §11`.

**Lo que ① no cubre** —visión, ambición, propósito y valores, diferenciación percibida— sí se
pregunta acá: brief, chat, sitio, redes actuales, brand book viejo, pitch deck. **No exijas notas de
reunión.** Buscá material previo en Notion / Inherent OS / Drive antes de arrancar de cero.

Si el input es escaso: **documentá menos**. Nunca completes con inferencia sin marcarla.

## Secciones fijas
1. **A — La empresa**: qué hace, visión, propósito, oferta, precio, tono, visuales, audiencia actual,
   diferenciación *percibida por ellos*
2. **B — WIN**: qué significa ganar, específico y verificable. Operacionalizá el "#1": **¿#1 en qué?**
3. **C — Economía unitaria**: ticket promedio, margen bruto, capacidad de entrega, punto de
   equilibrio. **No es money model** (eso es de Growth) — es la restricción de viabilidad.
   Si faltan: `⚠️ SIN DATOS` + declarar **viabilidad no verificada**. Nunca estimarlos.
4. **D — Restricciones reales**: presupuesto, equipo, capacidad de producción, aprobación, legales
5. **E — Arquetipo**: → invocá `st-arquetipo`

## Reglas duras
- **Nunca recomendás ni decidís.** Si escribís "por lo tanto la marca debería…", te saliste del rol.
- **La visión del cliente se respeta, pero no se toma como verdad de mercado.** Se registra tal cual
  y la Capa 1 la comprueba.
- Toda diferenciación declarada por el cliente va como `[percepción del cliente, no verificado]`.
- **"Ser la mejor marca del mercado" no es un WIN válido.** Pedí especificidad.
- **Si la capacidad de entrega ya está al tope**, declaralo: la estrategia no será generar más
  demanda sino filtrar mejor o subir precio. Sin ese dato el sistema se equivoca de problema.

## Cierre
Correr el bloque **Capa 0** de `qa/QA-GATES.md`.
🚦 **GATE 1** — el núcleo lo aprueba un humano antes de pasar a Capa 1.

## Handoff
→ `st-arquetipo` (obligatorio) → `st-ingenieria-inversa`
