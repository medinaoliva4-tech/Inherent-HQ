# Brief de Producción — [Cliente]
**Campaña(s):** [nombres] · **Ciclo:** [bloque] · **Fecha:** [aaaa-mm-dd]
**Capa 0**

> **Esta capa verifica, no produce.** No cambia ninguna decisión creativa.

---

## A. Contexto cargado

| Departamento | Qué aporta | Estado | Ruta |
|---|---|---|---|
| **④ Creatividad** | `ideas-de-contenido.csv` **con Gate 3 aprobado** | ⬜ / ✅ | `agents/creative/clients/<cliente>/ideas-de-contenido.csv` |
| **②B Branding** | Guidelines · dirección visual · do's & don'ts · **banco de assets** | ⬜ / ✅ | |
| **③ Marketing** | Fechas de campaña y **fechas de preparación** | ⬜ / ✅ | |
| **① Comprensión** | Presupuesto disponible · capacidad declarada · restricciones reales | ⬜ / ✅ | |

**Gate 3 de ④ Creatividad aprobado:** ⬜ / ✅ → si ⬜, **BLOQUEADO**

---

## B. Filas a producir

Filtradas por `handoff = produccion-video` / `produccion-foto`, agrupadas por campaña.

### Campaña: [nombre]

| `id_creativo` | Canal | Formato | Escenas | Concepto | `emocion` |
|---|---|---|---|---|---|
| | | | | | |

**Totales:** [n] filas creativas · [n] escenas · [n] campañas

---

## C. Verificación de producibilidad

| `id_creativo` | Escenas/encuadres/duraciones alineados | Acción y lugar declarados | Mood y emoción | Resultado |
|---|---|---|---|---|
| | ✅ / ❌ | ✅ / ❌ | ✅ / ❌ | ✅ producible / ↩️ DEVUELTO |

*(Cualquier ❌ manda la fila a la sección F.)*

---

## D. Reutilización — lo que ya existe

Cruce contra el banco de assets de ②B Branding **antes** de desglosar nada.

| `id_creativo` | Escena | Qué pide | Qué ya existe | Decisión |
|---|---|---|---|---|
| | | | | `reutiliza` / `se graba` |

**Escenas que no se vuelven a graban:** [n] → **ahorro estimado:** [monto]

> 🛑 Si esta tabla está vacía, el cruce no se hizo. Media campaña suele estar grabada ya.

---

## E. Techos de realidad

```
Presupuesto disponible:  [monto] [moneda]  (fuente: ① Comprensión, [fecha])
Días de rodaje posibles: [n]                (fuente: fechas de preparación de ③ Marketing)
Capacidad declarada:     [n piezas/ciclo]   (fuente: ① Comprensión §C/D)
```

| Techo | Lo que pide el ciclo | ¿Entra? | Exceso, en filas concretas |
|---|---|---|---|
| **Presupuesto** | | ✅ / ❌ | |
| **Días** | | ✅ / ❌ | |
| **Capacidad** | | ✅ / ❌ | |

> 🛑 **Nunca se recorta en silencio.** Si algo no entra, se declara en filas concretas y se devuelve
> a ③ Marketing y ④ Creatividad para que decidan qué se cae.

---

## F. Devoluciones a ④ Creatividad

*(Formato completo en `playbooks/DEVOLUCIONES.md` — los tres elementos son obligatorios.)*

### ↩️ DEVUELTO — [`id_creativo`] · [escena]

**QUÉ NO SE PUEDE**
[En términos físicos y verificables.]

**POR QUÉ IMPORTA**
[Qué intención se rompería: la `emocion`, el `concepto`, el `goal_del_arte`.]

**ALTERNATIVAS** *(ninguna cambia la intención)*
- **A)** [alternativa + viabilidad de fecha y costo]
- **B)** [alternativa + viabilidad de fecha y costo]

**RECOMENDADA:** [cuál y por qué]

**Respuesta de ④:** ⬜ pendiente / ✅ [qué decidió, fecha]

---

## Huecos abiertos

| ⚠️ Qué falta | A quién se le pide | Impacto si no llega |
|---|---|---|
| | | |

---

## Pre-flight declarado

```
PRE-FLIGHT — Cliente: [x] · Campaña(s): [x] · Capa: 0 · Ciclo: [x]
④ Creatividad: Excel aprobado [✅/⬜] · filas a producir: [n]
②B Branding: guidelines [✅/⬜]
③ Marketing: fechas [✅/⬜] · días disponibles: [n]
① Comprensión: presupuesto [✅/⬜] · capacidad [✅/⬜]
→ PASS | BLOQUEADO: [qué falta exactamente]
```
