# Inherent HQ — Agentes

Cada agente vive en `agents/<nombre>/`. Se le habla desde **Buzz** por una sesión de Claude Code.

## Estructura

```
agents/<agente>/
└── brain/
    ├── WORKFLOW.md          ← cómo trabaja el agente, de 0 a 100
    └── skills/
        ├── README.md        ← cuándo y cómo usa cada skill
        └── <skill>/         ← las skills de ESTE agente

clients/
├── client-delivery/         ← skill compartida: cómo se entrega. La usan todos
└── <cliente>/               ← todo lo del cliente, afuera de los agentes
```

## Cómo se compone un agente

Todo agente de Inherent tiene tres capas. **Esta es la definición base — vale para todos.**

```
PROPÓSITO   el panorama y la meta del agente. Su área.
    │       Strategy: la estrategia. Creative: las ideas. Etc.
    ▼
ACCIONES    lo que el agente PUEDE HACER. Las determinan los MCPs.
    │       Según lo que puede el MCP o el tool conectado, es la acción que
    │       el agente puede tomar. Y la CALIDAD del MCP es la CALIDAD de la acción.
    ▼
LÓGICA      CÓMO hace esas cosas. Son las skills.
            El razonamiento y el método detrás de cada acción.
```

**Las tres consecuencias de esto:**

1. **Un agente no puede hacer nada que su MCP no permita.** Si falta la acción, falta un MCP —
   no se arregla con mejor prompt.
2. **Un MCP flojo produce acciones flojas**, por más buena que sea la lógica.
3. **Una skill no es una acción, es una lógica.** Define cómo se usa lo que el MCP entrega.

Antes de agregar una skill, preguntar: **¿el agente tiene la acción para ejecutarla?**
Antes de agregar un MCP, preguntar: **¿esta acción cae dentro del propósito de este agente?**

---

## Agentes

| Agente | Carpeta | Qué hace | Estado |
|---|---|---|---|
| **Strategy** | `agents/strategy/` | Posicionamiento, crecimiento y monetización | 🟡 En construcción |
| Creative | `agents/creative/` | Ideas y conceptos | ⬜ |
| Production | `agents/production/` | Pre / producción / post | ⬜ |
| Branding | `agents/branding/` | Guidelines y lenguaje de marca | ⬜ |
| Growth | `agents/growth/` | Ads y adquisición | ⬜ |
| Content | `agents/content/` | Armado y QA de piezas | ⬜ |

## Cómo arrancás una sesión

1. **Identificá el agente** que corresponde al pedido.
2. **Leé su `brain/WORKFLOW.md` completo.** Es la única fuente de cómo trabaja.
3. **Identificá el cliente.** Un cliente = un folder en `clients/`. Nunca mezclar dos.
4. Seguí el workflow. Las skills se invocan donde el workflow lo indica.

## Reglas

- **Español.** Los términos del método quedan en inglés: `WIN`, `MUST BE TRUE`, `UNFAIR`, `GO GET`, `MOVE`, `COMPOUND`.
- **Evidencia o etiqueta.** Sin fuente va como `[dice el cliente, sin verificar]` o `⚠️ SIN DATOS`. Nunca inventar.
- **Solo la info que entrega el usuario**, salvo que él habilite fuentes externas.
- **Gate humano: Allan (Rodrigo).** El agente propone, no cierra.
- **Nada destructivo sin autorización:** no publicar, no pautar, no enviar al cliente, no borrar.
- Formato de respuesta: headings, bullets, negritas. Lo accionable arriba. Sin párrafos largos.
