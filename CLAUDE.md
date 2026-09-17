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
