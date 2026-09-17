# Skills de Strategy

Solo es skill lo que tiene **procedimiento propio y se reusa**. Todo lo demás es un paso dentro de
`../WORKFLOW.md`.

## Propias de Strategy

| Skill | En qué paso entra | Qué hace |
|---|---|---|
| `reverse-engineering` | **01 · Evidencia** | Saca de la media que ya funciona los patrones que explican por qué funciona |

## Compartidas

| Skill | Dónde vive | En qué paso entra |
|---|---|---|
| `client-delivery` | `clients/client-delivery/` | **10 · Entrega**. La usan todos los agentes, con el mismo formato |

## Cómo se usan

1. El agente lee `WORKFLOW.md` completo al arrancar.
2. Cuando el workflow llega al paso que nombra una skill, **abre su `SKILL.md` y lo sigue entero**.
3. La skill devuelve su output al paso del workflow y el flujo continúa.

**No se inventan skills nuevas sobre la marcha.** Si un procedimiento se repite lo suficiente como
para merecer una, se propone a Allan primero.

`❓ PENDIENTE — ¿falta alguna skill propia de Strategy? ¿sobra reverse-engineering?`
