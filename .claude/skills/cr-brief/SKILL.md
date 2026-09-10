---
name: cr-brief
description: >
  Capa 0 del método de Creatividad — traduce la estrategia aprobada a un brief creativo que se puede
  idear: carga el contexto de Strategy, Branding y Growth, lee los slots del calendario y convierte
  función + temperatura + awareness en goal del arte y etapa del funnel. Úsala al arrancar cualquier
  bloque de contenido, o cuando pidan "traducí la estrategia a brief", "qué pide este slot",
  "en qué etapa juega esta pieza". Es la capa que impide que Creative reinvente lo que Strategy ya
  decidió. Bloquea si falta posicionamiento aprobado o calendario.
---

# Capa 0 — Brief Creativo

Leé `agents/creative/METHOD.md` sección **CAPA 0** completa + `playbooks/TRADUCCION-STRATEGY.md`.
Plantilla: `templates/brief-creativo.md`.

## Qué hacés
**Traducís.** No decidís nada creativo todavía. Convertís lo que otros departamentos ya resolvieron
en un brief que se puede idear.

## Input obligatorio
| Archivo | De |
|---|---|
| `posicionamiento.md` **con Gate 2 aprobado** | Strategy |
| `estrategia-de-contenido.md` | Strategy |
| `contenido-por-canal.md` (función única y **qué NO se hace** por canal) | Strategy |
| `calendario-estrategico.csv` | Strategy |
| `ingenieria-inversa.md` | Strategy |
| `nucleo.md` (arquetipo + capacidad) | Strategy |
| Guidelines, tono y **lente de marca** | Branding |
| Ads que funcionan + claims aprobados *(no bloqueante)* | Growth |

🛑 **Si falta un bloqueante: BLOQUEADO.** Nombrá el archivo exacto y a quién pedírselo.
**No reconstruyas el posicionamiento leyendo el calendario, ni la audiencia leyendo el swipe file.**

## Secciones fijas
1. **A — Contexto cargado**: checklist con estado y ruta de cada archivo
2. **B — Extracto de estrategia**: promesa, mecanismo único, enemigo, territorio, activos, CEPs,
   objeciones + RTB, idea de campaña — **citados con ruta y sección, nunca reescritos**
3. **C — Jerarquía de mensaje**: copiada tal cual de Strategy §6.5. Es la ley del bloque
4. **D — Avatar**: buyer persona, dolores, deseo y **lenguaje literal**, declarado **como filtro**
5. **E — Slots del bloque**: las filas del calendario, sin editar
6. **F — Traducción**: la `funcion` → `goal_del_arte` (**vocabulario cerrado** de 6 valores) + la
   `temperatura` → etapa y fricción del CTA + el `awareness` → ángulo. Y la `fecha`: el día concreto
   dentro de la semana del slot
7. **G — Función y vetos por canal**: de `contenido-por-canal.md`, copiados
8. **H — Restricciones**: capacidad → **cuántas filas caben** · do's & don'ts · claims aprobados

## Reglas duras
- **Nunca reescribís un campo de otro departamento.** Se cita con su ruta. Reescribirlo crea una
  segunda versión de la verdad, y en dos ciclos no coinciden.
- **El `goal_del_arte` se DERIVA de la función**, del vocabulario cerrado
  `alcance · memoria · valor-de-uso · confianza · accion · pertenencia`. Creative no reasigna
  función, temperatura, awareness ni `objetivo_del_slot`.
- **El `goal_del_arte` no puede contradecir el `objetivo_del_slot`.** Si lo contradice, se devuelve
  el slot — no se elige uno de los dos.
- **El `awareness` se copia con la etiqueta literal de Strategy** (`Unaware`, `Problem aware`,
  `Solution aware`, `Product aware`, `Most aware`). Abreviarlo es reescribirlo.
- **La audiencia no se re-analiza.** Ya viene masticada por Strategy. Se usa como filtro: si una idea
  no le habla a ese avatar, **se descarta antes de escribirla**.
- **No se agregan slots, no se mueve la semana, no se cambian canales.** El calendario es un encargo.
  **La única excepción es la `fecha`:** Creative fija el día dentro de la semana del slot, respetando
  la `frecuencia`. Nada más.
- **Un slot sin `traza_a_must_be_true` no se produce**: se devuelve a Strategy.
- **La capacidad de producción es techo duro.** Si el calendario pide más de lo que el cliente puede
  producir, se declara y se devuelve a Strategy — **no se recorta en silencio**.

## Cierre
Correr el bloque **Capa 0** de `qa/QA-GATES.md`.
🚦 **GATE 1** — un humano confirma que el brief refleja la estrategia antes de gastar tiempo ideando.

## Handoff
→ `cr-swipe-file` (Capa 1)
