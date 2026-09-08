---
name: st-ingenieria-inversa
description: >
  Capa 1 del método Inherent — evidencia liviana antes de decidir: cómo se compra y se descubre la
  categoría, demanda por crear (CEPs), audience behavior vía seguidores de un competidor, y estados
  de consciencia (awareness). Úsala SIEMPRE al iniciar una estrategia nueva, o cuando pidan
  "investigá la competencia/demanda de X", "qué está funcionando en esta categoría", "cómo se
  comporta la audiencia de X". Organiza lo que existe — no interpreta ni decide.
---

# Capa 1 — Evidencia

**Leé antes de empezar:**
- `agents/strategy/playbooks/INGENIERIA-INVERSA.md` — los 4 bloques
- `agents/strategy/playbooks/MCP-PLAYBOOK.md` — qué herramienta para qué
- `agents/strategy/playbooks/BUENAS-PRACTICAS-MCP.md` — reglas de uso
- `agents/strategy/archetypes/NN-*.md` — a quién estudiar en este arquetipo

**Plantillas:** `templates/ingenieria-inversa.md` + `templates/demanda.csv`

## Los 4 bloques (ninguno opcional)

| | Bloque | Qué produce |
|---|---|---|
| **1.1** | Cómo se compra y se descubre | Canal de descubrimiento, canal de decisión, qué hace la competencia ahí |
| **1.2** | Demanda por crear | CEPs en lenguaje real + volumen dimensionado con AdWhispr/Eden — este volumen es lo que la Capa 3 valida contra la meta del ciclo |
| **1.3** | Audience behavior | Vía seguidores de un competidor verificado: qué consumen, con qué interactúan, funnel real |
| **1.4** | Awareness stages | Distribución estimada del mercado frente al problema |

## Reglas duras
- 🛑 **Esta capa NO recomienda.** Si escribís "por lo tanto deberíamos…", te saliste del rol.
  Termina en observación.
- 🛑 **Nunca inventes competidores.** Se verifican con MCP (`AdWhispr find_competitors`,
  `Eden eden_resolve_creator`).
- **Nunca inventes volumen de demanda.** Sale de AdWhispr/Eden, nunca de estimación propia.
- **Máximo 3 búsquedas infructuosas por objetivo.** Después se pide al usuario un nombre, handle
  o link de referencia.
- Un error o timeout **no es** un cero. Nunca reportes un fallo como "no hay datos".
- Si falta un MCP: `⚠️ SIN [MCP] — [qué evidencia falta]`. No rellenar con inferencia.

## Cierre
Registrar fecha del relevamiento, MCPs usados y no disponibles, y confianza general 🟢/🟡/🔴.

## Handoff
→ `st-tres-verdades`.
