# Los pipelines

**Un pipeline es el camino que recorre un negocio para crecer.**
Cada **paso** del pipeline es un **departamento**, porque cada paso lleva muchas tareas.
Cada departamento tiene los **agentes** que trabajan el resultado y el propósito de ese paso.

```
pipelines/
├── README.md
├── 00-account/                 la secretaria — vive antes y alrededor de todo
├── _router/                    /inherent — la puerta de entrada
│
└── contenido/                  🏭 EL PIPELINE DE CONTENIDO
    ├── README.md
    ├── 01-understand/          comprender el negocio
    ├── 02-strategize/          strategy · branding · growth · marketing
    ├── 03-research/            research
    ├── 04-create/              creative · production · graphic-design · video-editing
    ├── 05-convert/             community-management · posting · ads-management
    └── 06-optimize/            performance
```

> **El pipeline de contenido no es de ningún plan.** Dice qué tiene que lograr cada paso.
> **El plan contratado fija cuánto volumen y qué profundidad** — es el techo de todos los agentes.

---

## Cómo se compone cada paso

```
PROPÓSITO   qué tiene que lograr el paso. Es el mismo para todos los agentes del departamento
    │
    ▼
LÓGICA      cómo lo logra cada agente. Son sus skills y su WORKFLOW
    │
    ▼
ARTIFACT    la herramienta donde el equipo ve el resultado. Visual y comprensible
```

🔑 **Un agente puede estar en dos pasos:** en uno tiene una responsabilidad y en el otro, otra.
Su carpeta vive en el paso donde trabaja más, y cada departamento dice qué le toca a cada agente
en ese paso. Hoy son **Strategy** *(01 y 02)*, **Growth** *(02 y 05)* y **Branding** *(02 y 04)*.

---

## Lo que aplica a todos los pasos

🧭 **La puerta de entrada es `/inherent`** (`pipelines/_router/`): lee el pedido, imprime el
`ENRUTAMIENTO` y lo pasa al orquestador que toca. **Si una respuesta de trabajo de cliente no
arranca con `ENRUTAMIENTO` o con el `PRE-FLIGHT` del orquestador, se saltó el método.**

📅 **Cada ciclo de contenido corre del día 1 al 20 del mes, con fechas fijas.** 🔴 **Día 11:** último
día para producir · 🔴 **Día 20:** presentación al cliente. Cada `WORKFLOW.md` abre con
**«📅 Tu ventana en el ciclo»**. Calendario completo en `inherent/05-OPERACION.md`.

🔑 **El QA no es un agente aparte: cada departamento se auto-revisa y sigue**, y
**Branding valida con `br-guardian`** antes de que nada se publique.

🔑 **Primero se lee la LÍNEA, después el plan.** 🔷 Marketing promete atención · 🟨 Growth
promete facturación. **En la línea Marketing, Growth corre ligero:** elige qué ofertas que ya
existen se empujan, sin cambiar la oferta. ⬜ **Un Tailor Made no se cuestiona:** su
`plan-contratado.md` declara qué incluye y su pipeline, y los agentes lo siguen.

**El plan contratado es el techo, no una sugerencia.** Un agente que entrega de más rompe el
margen; uno que entrega de menos rompe la promesa publicada.

**Por qué `00-account` va aparte:** no produce nada del pipeline. **Vive antes y alrededor de
todo** — recibe al cliente, lo mantiene al día y abre la sesión del agente que toca.

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
2. **`brain/WORKFLOW.md`** — el proceso de 0 a 100, con su auto-revisión, sus gates y sus escalaciones
   marcados, y una sección de **lo que este agente NO hace**.
3. **`brain/skills/README.md`** — cuándo se invoca cada skill dentro del workflow.
4. **Una carpeta por skill**, con su `SKILL.md`.
5. **Enlazarla** en `.claude/skills/` para que se pueda invocar por nombre.
6. **Cerrar con la entrega**, escrita en el propio `WORKFLOW.md`.

> ⚠️ **La entrega no es una skill compartida.** Cada agente entrega algo distinto —Strategy un
> documento de estrategia, Design un lote de piezas, Ads una campaña corriendo— así que
> **cada workflow define su propia entrega.** Lo único igual para todos es cómo se cierra:
> **cada departamento se auto-revisa y sigue.** Lo que está en el repo ya pasó por el CEO.
>
> 🚦 **El CEO solo para el flujo en dos puntos:** aprueba la estrategia de **Strategy** antes de
> que pase a los departamentos, y en **Ads** da el OK antes de lanzar *(plan + presupuesto)* y
> ante cualquier cambio de presupuesto.
>
> 📣 **Las escalaciones no son paradas — avisan y el flujo sigue:** precio, alcance y fechas →
> **el CEO** · todo lo demás → **el COO**.
