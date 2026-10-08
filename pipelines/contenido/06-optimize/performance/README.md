# Performance

**Mide cada cuenta contra sus KR, cruza lo que aprendió cada agente y propone qué cambia del
roadmap.** Corre en los cuatro planes; lo que cambia es qué KR tiene cada cliente y cuánto se
puede atribuir.

| | 🔷 Marketing | 🔷 Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| **Lectura de cada cuenta** *(crecimiento, alcance, engagement)* | ✅ | ✅ | ✅ | ✅ |
| **Comparación contra los KR de Attention Growth** | ✅ | ✅ | ✅ | ✅ |
| **Comparación contra los KR de Revenue Growth** | ✅ *Se lee en conversaciones y leads, sin prometer facturación* | ✅ *Igual* | ✅ *Con atribución limpia* | ✅ *Con atribución limpia* |
| **Cruce de los `aprendizaje-de-*.md` de todos los agentes** | ✅ | ✅ | ✅ | ✅ |
| **Propuesta de ajuste del roadmap** | ✅ | ✅ | ✅ | ✅ |

**Acción:** analítica de la herramienta de publicación *(slot en `inherent/05-OPERACION.md`)* +
scraping de perfiles + la lectura de pauta de AdWhispr.
**Quién lo corre:** el operador de agentes, el día 20 junto con la revisión de Strategy, más una
lectura ligera cada semana.
**Quién decide:** Strategy. Performance **propone**; no cambia la estrategia.

---

## Las tres capas

```
PROPÓSITO   Medir resultados, aprender, encontrar nuevos ganadores y ajustar el roadmap.
ACCIONES    Zernio por MCP → analítica por cuenta y por pieza, seguidores, mejores horas.
            Apify → engagement de perfiles de Instagram.
            AdWhispr → rendimiento de la pauta.
LÓGICA      cuentas → KR → ajuste → cruce de los loops.
```

| | |
|---|---|
| **Cómo corre** | Claude Code con el plan de la empresa: a mano con `/performance`, o programado |
| **Lo que lee** | `clients/<cliente>/01-estrategia/roadmap-okrs.md` · `00-onboarding/plan-contratado.md` · todos los `aprendizaje-de-*.md` · la analítica de las cuentas |
| **Lo que escribe** | `lectura-de-kr.md` y `aprendizaje-del-ciclo.md` en `clients/<cliente>/01-estrategia/revisiones-del-20/<AAAA-MM>/`. **Se presenta antes de escribir** |
| **Artifact del equipo** | **Growth Command Center** — el tablero donde se ve cada cuenta contra sus KR y qué se decidió |

El método completo: `brain/WORKFLOW.md`. Las skills: `brain/skills/README.md`.
