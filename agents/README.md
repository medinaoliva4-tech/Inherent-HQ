# Los agentes

**Un agente por etapa, en el orden en que corre el trabajo.** La carpeta lleva el número,
así que el pipeline se lee de arriba abajo.

```
agents/<NN>-<área>/
├── README.md              qué hace, qué acciones tiene y QUÉ ENTREGA SEGÚN EL PLAN
└── brain/
    ├── WORKFLOW.md        cómo trabaja, de 0 a 100 — incluye cómo entrega
    └── skills/
        ├── README.md      cuándo y cómo usa cada skill
        └── <skill>/SKILL.md
```

> **`brain/` es el agente.** El `README.md` es la ficha; el `brain/` es el cerebro.

---

## El pipeline

| # | Agente | Qué produce | Estado |
|---|---|---|---|
| **00** | [**Account Manager**](00-account/) | La relación con el cliente. **El único que le habla** | ✅ **perfil listo** |
| **01** | [**Strategy**](01-strategy/) | La estrategia y un brief por área | ✅ **construido** |
| **01.2** | [Branding](01.2-branding/) | Identidad, voz y sistema visual | ✅ **construido** |
| **02** | [Growth](02-growth/) | La oferta, los canales grandes y los upsells | ✅ **construido** |
| **03** | [Marketing](03-marketing/) | El plan del ciclo y el calendario de slots | ✅ **construido** |
| **04** | [Creative](04-creative/) | Los ángulos y las ideas | ✅ **construido** |
| **05** | [Production](05-production/) | La grabación | ✅ **construido** |
| **06** | [Graphic Design](06-graphic-design/) | Estáticos, carruseles y stories | ✅ **construido** |
| **07** | [Video Editing](07-video-editing/) | Reels y sus derivadas | ✅ **construido** |
| **08** | [Community Management](08-community-management/) | Respuesta, seguimiento y comunidad | ⬜ **el único que falta** |
| **09** | [Posting](09-posting/) | Lo aprobado, publicado | ✅ **construido** |
| **10** | [Ads Management](10-ads-management/) | La pauta corriendo | ✅ **construido** |
| ↻ | [Strategy](01-strategy/) | La revisión del 20 | ✅ |

**Por qué Account Manager es 00:** no produce nada del pipeline. **Vive antes y alrededor de
todo** — recibe al cliente, lo mantiene al día y abre la sesión del agente que toca.

**Por qué Branding es 01.2:** con la data de Strategy **ya se puede armar la marca**.
No espera al resto del pipeline.

🔑 **El QA no es un agente aparte: cada departamento se auto-revisa antes de su gate**, y
**②B Branding valida con `br-guardian`** antes de que nada se publique.

**La cadena de entrega completa está en `inherent/05-OPERACION.md`.**

---

## 🔑 Cada agente sabe qué entrega según el plan

**Todas las fichas tienen la misma tabla: qué le toca en Ignite, en Accelerate y en Compound.**

**El plan contratado es el techo, no una sugerencia.** Un agente que entrega de más rompe el
margen; uno que entrega de menos rompe la promesa publicada.

---

## Antes de tocar un agente

| Antes de… | Preguntar |
|---|---|
| **Agregar una skill** | ¿el agente tiene la **acción** para ejecutarla? |
| **Agregar un MCP** | ¿esta acción cae dentro del **propósito** de este agente? |
| **Prometer algo** | ¿está en «Capacidades reales» de `inherent/06-ECONOMIA.md`? |

---

## Cómo se construye uno

1. **`README.md` del área** — propósito, las acciones con su MCP, **qué entrega según el plan**, y qué falta.
2. **`brain/WORKFLOW.md`** — el proceso de 0 a 100, con los gates humanos marcados y una sección
   de **lo que este agente NO hace**.
3. **`brain/skills/README.md`** — cuándo se invoca cada skill dentro del workflow.
4. **Una carpeta por skill**, con su `SKILL.md`.
5. **Enlazarla** en `.claude/skills/` para que se pueda invocar por nombre.
6. **Cerrar con la entrega**, escrita en el propio `WORKFLOW.md`.

> ⚠️ **La entrega no es una skill compartida.** Cada agente entrega algo distinto —Strategy un
> documento de estrategia, Design un lote de piezas, Ads una campaña corriendo— así que
> **cada workflow define su propia entrega.** Lo único igual para todos es el gate: **Allan
> aprueba antes de que algo salga.**
