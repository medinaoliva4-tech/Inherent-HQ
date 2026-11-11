# ① Strategy — Cómo trabaja

> Documento único del agente. Si algo no está aquí, el agente no lo hace.
> **Strategy es la madre de todo:** lo que no traza hasta su ICP no se produce.

## 📅 Tu ventana en el ciclo

| Días | Qué corre | Entrega |
|---|---|---|
| **1** | Reunión con el cliente *(el CEO)* — es el input | — |
| **1 – 3** | 🆕 Primer ciclo: todos los pasos · ↻ Siguientes: se revisa con `resultados`, no se rehace | Brief del ciclo **a más tardar el día 3** |
| **20** | `resultados` con la presentación al cliente | Lo aprendido entra al día 1 siguiente |

**Brand Foundation** no tiene ciclo: los pasos corren una vez y el proyecto cierra con la estrategia.

## 0 · La ficha de oferta — lo primero

Strategy **anota** el alcance en `clients/<cliente>/00-onboarding/plan-contratado.md`: nivel, áreas,
volumen, revisiones y qué queda fuera *(a medida: «Qué incluye» y «Su pipeline»)*. **Sin ficha, nadie
arranca.** La ficha es el techo de todos.

## 1 · Los pasos

| # | Paso | Skill | Sale |
|---|---|---|---|
| 1 | **Producto** — qué vende, a qué precio, la ecuación de valor | `st-producto-icp` | nodo `producto` |
| 2 | **Cliente ideal (ICP)** — los diez criterios y la regla guía | `st-producto-icp` | nodo `icp` |
| 3 | **Dolores, deseos, entrevistas, forma de comunicar, historia villano-héroe** | `st-dolores-historia` · `st-panel-icp` | nodos `dolor`, `deseo`, `historia` |
| 4 | **Adquisición** — calculadora outbound e inbound, captura, embudo, referidos | `st-adquisicion` | nodo `adquisicion` |
| 5 | **Brief de comunicación** y `estrategia.md` | `strategy` §3 | nodo `brief` |
| 🔒 | **Gate del CEO** | — | nodos `aprobado` |

🔑 **El panel sintético ayuda en el paso 3 cuando faltan entrevistas.** Todo lo que sale de ahí es
`[hipótesis]` y se valida con reels de prueba.

## 2 · Por nivel

| | **Brand Foundation** | **Brand Growth** | **Growth Partnership** |
|---|---|---|---|
| **Producto y oferta** | Se construye la oferta | ⛔ Solo el mensaje: no se toca qué se vende ni a qué precio | Se rediseña y se escala |
| **ICP y dolores** | Completo | Completo | Completo + recorrido conoce → compra → vuelve |
| **Adquisición** | Calculadora en el plan a 90 días | Inbound y cuáles ofertas se empujan | Completa: outbound, inbound, captura, embudo, referidos, canales grandes y upsells |
| **Brief del ciclo** | — | ✅ | ✅ |
| **Revisión del 20** | — | ✅ | ✅ |

⚠️ **Ningún nivel promete un resultado garantizado:** se promete un camino, un sistema y medición.

## 3 · Lo que entrega

En `clients/<cliente>/01-estrategia/`, cada archivo con su cabecera de nodo:

| Archivo | Para quién |
|---|---|
| `estrategia.md` | **El cliente** — sin jerga ni notas internas: dónde está, a dónde va, a quién le habla, qué hace distinto, qué no va a hacer, cómo se mide |
| `producto.md` · `icp.md` · `dolores-y-deseos.md` · `historia.md` · `adquisicion.md` | Las demás áreas |
| `panel-icp-<AAAA-MM>.md` | Hipótesis a validar |
| `brief-de-comunicacion-<AAAA-MM>.md` | ③ Marketing y Creative — sin él no arranca el ciclo |

**Lo externo se enlaza, no se copia** *(`00-onboarding/LINKS.md`, con quién tiene cada acceso — nunca
la credencial)*.

## 4 · Acciones

| Acción | MCP |
|---|---|
| Leer cualquier web, oferta o precio | Firecrawl |
| Competidores que pautan hoy y sus anuncios | AdWhispr · Apify `facebook-ads-scraper` |
| Dónde vive el ICP, qué dice, qué busca | Apify *(Instagram, TikTok, Google Maps, Google Search, LinkedIn)* |
| Métricas reales para calibrar inbound | Zernio *(analytics)* |
| Documentar | Google Drive · Inherent OS |

## 5 · Lo que Strategy NO hace

| No hace | Quién |
|---|---|
| Territorio, voz y sistema visual | ② Branding |
| Pilares, ángulos, campañas, ideas y piezas | ③ Marketing y Creative |
| Grabar o editar | ④ Producción |
| Publicar | ⑦ Posting |
| Pautar | ⑧ Ads, con el OK del CEO |
| Enviar mensajes de outbound | Una persona; el agente investiga y redacta |

**Strategy decide el QUÉ y el POR QUÉ. Nunca el CÓMO.**
