# Skills de Strategy

Los 4 bloques del workflow son **pasos y además skills**. Se corren en orden; cada uno se puede
invocar suelto si ya existe el anterior.

```
context → analysis → reverse-engineering → methodology → entrega
```

| # | Skill | Qué hace | Input que necesita |
|---|---|---|---|
| **01** | `context` | Junta la data cruda: comprensión, negocio, demanda, restricciones, arquetipo. **Describe, no decide** | Lo que entregue el cliente y Allan |
| **02** | `analysis` | Las 3 preguntas fijas: qué tiene que ser verdad · qué tienen a su ventaja · qué hay que ir a buscar. De ahí salen los pasos | `context` |
| **03** | `reverse-engineering` | Saca de la media real los patrones que explican por qué funciona. **Termina en patrón, no en recomendación** | `analysis` |
| **04** | `methodology` | Arma la estrategia: posicionamiento, ICP, identidad y branding, historia, comunicación, canales, monetización y medición | los tres anteriores |

> **La entrega no es una skill.** Cada agente entrega distinto, así que su formato vive en el
> workflow del agente — acá, en `../WORKFLOW.md` §7.

---

## Cómo se usan

1. El agente lee `../WORKFLOW.md` completo al arrancar.
2. Corre los bloques **en orden**. Cada skill abre su `SKILL.md` y lo sigue entero.
3. Si falta el input de un bloque, **se corre el anterior**. Nunca se improvisa el faltante.

**No se inventan skills nuevas sobre la marcha.** Si un procedimiento se repite lo suficiente como
para merecer una, se propone a Allan primero.
