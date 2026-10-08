# Research

**Investiga lo micro: la audiencia, los competidores, los referentes, las tendencias y el contenido
ganador, pieza por pieza.** Corre en los cuatro planes; lo que cambia es el volumen por Red.

| | 🔷 Marketing | 🔷 Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| **Contenidos a investigar, por cada Red del plan** | **50** | **50** | **100** | **100** |
| **Mitad competencia (Guatemala) · mitad referencias** | ✅ | ✅ | ✅ | ✅ |
| **Audience Intelligence** | ✅ | ✅ | ✅ | ✅ |
| **Biblioteca de winners orgánicos y de pauta** | ✅ | ✅ | ✅ | ✅ |
| **Datos propios del cliente** *(ventas, CRM)* | Si los entrega | Si los entrega | Si los entrega | Si los entrega |

**Entregable al cliente:** ninguno directo. Su valor se ve en lo que sale de Create.
**Quién lo corre:** el operador de agentes, desde Claude Code. La biblioteca se refresca sola por cron
cuando el servidor del equipo y el MCP de Apify estén conectados.
**Strategy ve lo macro; Research baja a lo micro.** Strategy cita la ruta de Research, no re-investiga.

---

## Las tres capas

```
PROPÓSITO   Investigar audiencias, competidores, referentes, tendencias y contenido ganador,
            y mantener viva la biblioteca de winners de cada cliente.
ACCIONES    Apify por MCP → Reels, comentarios y cuentas de Instagram, TikTok, YouTube, LinkedIn,
            Google Maps, Google Search y la biblioteca de anuncios de Meta.
            AdWhispr por MCP → competidores verificados que pautan hoy y sus anuncios más longevos.
            Firecrawl por MCP → leer sitios, ofertas y precios.
LÓGICA      audiencia → competencia y referentes → winners → tendencias.
```

| | |
|---|---|
| **Cómo corre** | Claude Code con el plan de la empresa: a mano con `/research`, y la biblioteca de winners por cron cuando exista el servidor |
| **Lo que lee** | `clients/<cliente>/00-onboarding/plan-contratado.md` · `01-estrategia/` *(el mapa de la categoría)* · `99-referencias/` · los datos que el cliente entregue |
| **Lo que escribe** | `clients/<cliente>/99-referencias/investigacion/` — audiencia, competencia y referentes, biblioteca de winners, tendencias y el registro de cada corrida |
| **Artifact del equipo** | **Creative Intelligence Engine** — una página donde viven todos los clientes de la agencia, con la biblioteca de winners de cada uno y los videos nuevos que el cron trae |

El método completo: `brain/WORKFLOW.md`. Las skills: `brain/skills/README.md`.
