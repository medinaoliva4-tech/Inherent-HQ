# Los agentes

**Un agente por etapa, en el orden en que corre el trabajo.** La carpeta lleva el número,
así que el pipeline se lee de arriba abajo.

```
agents/<NN>-<área>/
├── README.md              qué hace, qué acciones tiene y QUÉ ENTREGA SEGÚN EL NIVEL
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
| **08** | [Community Management](08-community-management/) | Respuesta, seguimiento y comunidad | ✅ **construido** |
| **09** | [Posting](09-posting/) | Lo aprobado, publicado | ✅ **construido** |
| **10** | [Ads Management](10-ads-management/) | La pauta corriendo | ✅ **construido** |
| ↻ | [Strategy](01-strategy/) | La revisión del 20 | ✅ |

**Por qué Account Manager es 00:** no produce nada del pipeline. **Vive antes y alrededor de
todo** — recibe al cliente, lo mantiene al día y abre la sesión del agente que toca.

**Por qué Branding es 01.2:** con la data de Strategy **ya se puede armar la marca**.
No espera al resto del pipeline.

🔑 **El QA no es un agente aparte: cada departamento se auto-revisa y sigue**, y
**②B Branding valida con `br-guardian`** antes de que nada se publique.

**La cadena de entrega completa está en `inherent/05-OPERACION.md`.**

🧭 **La puerta de entrada es `/inherent`** (`agents/_router/`): lee el pedido, imprime el
`ENRUTAMIENTO` y lo pasa al orquestador que toca. **Si una respuesta de trabajo de cliente no
arranca con `ENRUTAMIENTO` o con el `PRE-FLIGHT` del orquestador, se saltó el método.**

📅 **Cada ciclo de contenido corre del día 1 al 20 del mes, con fechas fijas.** 🔴 **Día 11:** último
día para producir · 🔴 **Día 20:** presentación al cliente. Cada `WORKFLOW.md` abre con
**«📅 Tu ventana en el ciclo»**. Calendario completo en `inherent/05-OPERACION.md`.

---

## 🔑 Cada agente sabe qué entrega según el nivel

**Todas las fichas tienen la misma tabla: qué le toca en Brand Foundation, Brand Growth y
Growth Partnership.** El detalle de volumen, formatos, canales y revisiones sale de la **ficha de
oferta del cliente** *(`clients/<cliente>/00-onboarding/plan-contratado.md`)*, no de este manual.

🔑 **Qué departamentos corren por nivel:**

| Nivel | Departamentos |
|---|---|
| **Brand Foundation** | ① Strategy y ②B Branding como núcleo · ④ Creatividad para la dirección creativa y los ejemplos de aplicación |
| **Brand Growth** | ③ Marketing · ④ Creatividad · ⑤ Producción · ⑥A Diseño gráfico · ⑦ Video Editing · ⑨ Posting · ⑩ Ads — según los canales contratados |
| **Growth Partnership** | Todo Brand Growth, más ② Growth · ⑧ Community Management y el especialista |

**Las escaleras por nivel:** cada departamento escala lo que hace según el nivel y según lo que
diga la ficha. **Un departamento que la ficha no incluye no corre para ese cliente.**

⬜ **Un alcance a medida no se cuestiona:** su `plan-contratado.md` declara qué incluye y su
pipeline, y los agentes lo siguen.

**El alcance contratado (la ficha de oferta) es el techo, no una sugerencia.** Un agente que
entrega de más rompe el margen; uno que entrega de menos rompe la promesa de la propuesta. **Sin
ficha, el agente bloquea ese cliente.**

---

## Antes de tocar un agente

| Antes de… | Preguntar |
|---|---|
| **Agregar una skill** | ¿el agente tiene la **acción** para ejecutarla? |
| **Agregar un MCP** | ¿esta acción cae dentro del **propósito** de este agente? |
| **Prometer algo** | ¿está en «Capacidades reales» de `inherent/06-ECONOMIA.md`? |

---

## Cómo se construye uno

1. **`README.md` del área** — propósito, las acciones con su MCP, **qué entrega según el nivel**, y qué falta.
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
> 🚦 **El CEO solo para el flujo en dos puntos:** aprueba la estrategia de **① Strategy** antes de
> que pase a los departamentos, y en **⑩ Ads** da el OK antes de lanzar *(plan + presupuesto)* y
> ante cualquier cambio de presupuesto.
>
> 📣 **Las escalaciones no son paradas — avisan y el flujo sigue:** precio, alcance y fechas →
> **el CEO** · todo lo demás → **el COO**.
