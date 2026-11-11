# ③ Marketing y Creative — Cómo trabaja

> **Un solo agente.** Del ICP de ① Strategy a piezas listas para producir: qué mira la gente, qué
> le prometemos cada mes, a quién y con qué palabras exactas.

## 📅 Tu ventana en el ciclo

| Días | Qué corre | Entrega |
|---|---|---|
| **1 – 3** | Radar, tablero y campaña | Campaña y tablero **el día 3** |
| **2 – 3** | Ideas, piezas y calendario | Piezas y calendario **el día 3** · el CEO aprueba |
| **semanal** | Refresco del radar | Lo nuevo de los referentes |

En **Brand Foundation** corre una vez: la dirección creativa y los ejemplos de aplicación del proyecto.

## 1 · Los pasos

| # | Paso | Skill | Sale |
|---|---|---|---|
| 0 | Recepción | `recepcion` | — |
| 1 | **Radar con sentido** — dónde vive el ICP, quién tiene sus ojos, referentes, winners adaptables, contenido quemado | `mc-radar` | nodo `radar`, fichas de referente |
| 2 | **Pilares × ángulos** — oferta, dolor y deseo × jóvenes, millennials, mayores | `mc-pilares-angulos` | nodos `pilar`, `angulo` |
| 3 | **Campañas → ideas → piezas** — atadas al resultado esperado, con copy íntegro | `mc-campanas-piezas` | nodos `campana`, `pieza` |
| 🔒 | El CEO aprueba ideas y calendario | — | piezas `aprobado` |

🔑 **Todo traza al ICP:** pieza → campaña → pilar y ángulo → dolor, deseo u oferta → ICP.

## 2 · Por nivel

| | **Brand Foundation** | **Brand Growth** | **Growth Partnership** |
|---|---|---|---|
| **Qué entrega** | Dirección creativa y ejemplos de aplicación | El ciclo completo según la ficha | El ciclo completo, más campañas de captura con ① Strategy |
| **Volumen** | El del proyecto | **El de la ficha** | **El de la ficha** |

## 3 · Lo que entrega

| Dónde | Qué |
|---|---|
| `clients/<cliente>/03-marketing/<AAAA-MM>/` | `radar.md`, fichas de referente y `pilares-angulos.md` |
| `clients/<cliente>/04-contenido/<AAAA-MM>/ideas/` | Campañas y piezas con todo el copy literal |

Cada archivo con su cabecera de nodo. **No hay hoja de cálculo entre áreas:** ④ Producción, ⑤ Diseño
gráfico y ⑦ Posting leen los nodos `pieza`.

## 4 · Acciones

| Acción | MCP |
|---|---|
| Anuncios, Instagram y TikTok de referentes | Apify |
| Leer un video | `leer-video.py` *(ffmpeg, tesseract)* · la skill `/watch` |
| Métricas propias | Zernio *(analytics)* |

## 5 · Lo que NO hace

| No hace | Quién |
|---|---|
| Decidir el ICP, la oferta o el resultado esperado | ① Strategy |
| Validar claims | ② Branding (`br-guardian`) |
| Grabar, editar o componer | ④ Producción · ⑤ Diseño gráfico |
| Poner hora y cuenta, publicar | ⑦ Posting |
