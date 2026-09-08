# Playbook — Evidencia de Capa 1

**Qué es.** Cómo se levanta la Capa 1 (`ingenieria-inversa.md`): observar cómo se compra la
categoría, dimensionar la demanda por crear, y entender el comportamiento real de la audiencia —
sin inventar nada de esto.

**Qué NO es.** No es un informe de investigación de mercado. No interpreta ni recomienda — eso es
de la Capa 2.

> 🛑 **Regla dura:** este proceso termina en una **observación**. Si el output dice "por lo tanto
> deberíamos…", se salió de su rol.

**Dónde vive:** Capa 1 del método · **Output:** `ingenieria-inversa.md` + `templates/demanda.csv`

---

## 1.1 — Cómo se compra y se descubre

Entrar directamente a los canales donde está el cliente — Instagram, Google, Facebook, LinkedIn,
el que aplique según el arquetipo (ver `archetypes/`) — y mirar:

- ¿Por dónde descubre la categoría a las marcas? ¿Por dónde decide?
- ¿Qué está haciendo la competencia directa en ese canal ahora mismo?

Sin herramienta elaborada. Se documenta lo que se ve, con la fecha, y se marca `⚠️ SIN DATOS` si un
canal no se pudo revisar.

---

## 1.2 — Demanda por crear

1. Listar los **Category Entry Points (CEPs)** que aparecen de verdad: los momentos que llevan a
   alguien a considerar la compra, en su propio lenguaje (reviews, comentarios, búsquedas).
2. Dimensionar volumen real por CEP con `AdWhispr research_keywords` / `find_competitors` y `Eden
   search_social_content` — nunca inventar volumen de demanda.
3. ⏳ Herramienta adicional pendiente de confirmar (ver `MCP-PLAYBOOK.md`).

**Para qué sirve el volumen:** la Capa 3 (`posicionamiento.md`) calcula cuánta gente hace falta
alcanzar para llegar a la meta del ciclo. Este número dice si ese volumen **existe** en el CEP —
si no alcanza, el objetivo está mal dimensionado antes de gastar en producir nada.

Se registra en `templates/demanda.csv`.

---

## 1.3 — Audience behavior vía seguidores de competidor

1. Elegir un competidor de referencia (verificado, no de memoria — `AdWhispr find_competitors` o
   `Eden eden_resolve_creator`).
2. Mirar a sus seguidores/audiencia: qué contenido consumen, con qué interactúan de verdad
   (comentario, guardado, compra/reserva — no solo like).
3. Reconstruir el funnel real: quién solo mira, quién interactúa, quién cierra.

---

## 1.4 — Awareness stages

Con lo anterior, estimar dónde está la mayoría del mercado frente al **problema** (no a la marca):

| Estado | Qué sabe |
|---|---|
| No sabe que tiene el problema | |
| Sabe el problema, no la solución | |
| Conoce la solución, no la marca | |
| Nos conoce, no compró | |
| Convencido, no compró todavía | |

---

## Checklist de cierre

- [ ] 1.1 tiene los canales revisados, con fecha
- [ ] 1.2 tiene CEPs en lenguaje real, no inventados, y el volumen por CEP viene de una herramienta
      (no de memoria)
- [ ] 1.3 usa un competidor verificado, no listado de memoria
- [ ] 1.4 tiene una estimación de awareness con su evidencia
- [ ] **Ninguna oración del documento empieza con "deberíamos"**
- [ ] Fecha del relevamiento registrada (se re-corre si cambia la categoría o el contexto)
