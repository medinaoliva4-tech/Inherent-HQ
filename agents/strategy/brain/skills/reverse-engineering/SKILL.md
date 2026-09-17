---
name: reverse-engineering
description: >
  Ingeniería inversa conectada con media. Saca de la media que ya existe y ya funciona los patrones
  que explican POR QUÉ funciona, y los traduce a hipótesis propias. Es el paso 01 del workflow de
  Strategy. Úsala cuando pidan investigar la competencia, ver qué está funcionando en una categoría,
  analizar anuncios o contenido de otras marcas, o al arrancar la estrategia de un cliente nuevo.
  Organiza lo que existe — no interpreta ni recomienda.
---

# Ingeniería inversa conectada con media

> 🛑 **Regla dura:** esto termina en **patrón observado**. Si el output dice "por lo tanto deberíamos…",
> se salió de su rol. Decidir es del paso 02 en adelante.

## 1 · A quién estudiar
No solo competidores. La pregunta es: **¿quién ya captura la atención de mi comprador en el momento
en que decide?**

| Anillo | Qué se saca |
|---|---|
| **Directos** | El default de la categoría — de qué hay que despegarse |
| **De categoría** | Los sustitutos reales de presupuesto y atención |
| **No hacer nada** | El competidor invisible |
| **Fuera de categoría** | Los formatos que todavía no llegaron a este rubro |
| **Creadores** | Quién ya tiene la audiencia, y el lenguaje real del comprador |

**Verificar, no recordar.** Los competidores se confirman con herramienta. Un nombre que no se puede
verificar va como `🟡 sin verificar`.

## 2 · Qué cosechar
Las piezas, no las opiniones sobre la marca.

| Qué | Dónde |
|---|---|
| Anuncios activos y **cuánto tiempo llevan corriendo** | AdWhispr |
| Posts que rinden **muy por encima de su propia media** | Eden |
| Títulos, portadas y carruseles que ganan | Eden |
| Landings, páginas de venta | Firecrawl |
| Reviews, comentarios, quejas | Firecrawl |
| **Descubrir competidores, referentes y UGC creators en Instagram** | **Muse Spark, manual** ↓ |

### Muse Spark — paso manual, no automático

Muse Spark (Meta) tiene **búsqueda semántica directa sobre Instagram, Facebook y Threads**: filtra
por autor, menciones, comentarios y engagement. Es la única herramienta con acceso nativo a esa data.

⚠️ **Solo funciona en [meta.ai](https://meta.ai) o la app de Meta AI, con login de Facebook o
Instagram.** La Meta Model API y OpenRouter dan el **modelo**, no esta herramienta.

**Y no se puede automatizar.** No es una limitación técnica, es política de Meta: *"scripting a
través de tu sesión logueada"* está prohibido, y el update de 2025 dejó explícito que **estar
logueado no es excusa y que un agente manejando el navegador tampoco lo cambia**. El riesgo real
es que deshabiliten la cuenta.

> **Probado el 2026-09-17.** Un agente con Muse Spark por OpenRouter devolvió **0 links** — intentó
> búsqueda web, yt-dlp y viewers públicos, todo bloqueado. La misma consulta en meta.ai logueado
> devolvió **12 creadores** con handle, seguidores, link y descripción. La diferencia es la sesión,
> no el modelo.

**El manual no es un parche: es el proceso.** Dos minutos por consulta, y encaja con la regla de
fuentes: la info la entrega Allan.

**Límite:** solo contenido público, desde el **1 de enero de 2025** en adelante.

**Cómo entra al proceso:** Allan corre la consulta en meta.ai y pega los resultados. El agente los
procesa como cualquier otra evidencia entregada.

**Consultas listas para copiar:**

```
DESCUBRIR COMPETIDORES Y REFERENTES
Encontrá videos de Instagram publicados en las últimas [X] semanas donde el creador
hable de [categoría / producto], con al menos [N] seguidores. Dame el link a cada video.

DESCUBRIR UGC CREATORS
Encontrá videos de Instagram de las últimas [X] semanas que cumplan: el creador tiene
al menos [N] seguidores y menciona [marca / categoría] en el video. Links directos.

MENCIONES DE UNA MARCA
Encontrá todos los videos de Instagram de los últimos [30] días donde el creador
mencione [marca]. Incluí también los videos donde [marca] aparezca en los comentarios.
```

**Qué se saca de ahí:** el anillo 1 (directos) y el anillo 5 (creadores) del universo, con nombres
verificados en vez de recordados. Y la voz literal del comprador, en los comentarios.

**Después de traer los candidatos, filtrar por tipo.** La consulta devuelve todo mezclado. Separar:
`hauls y reviews` · `embajadores de marca` · `análisis financiero o de negocio` · `la marca oficial` ·
`menciones incidentales`. Para ingeniería inversa sirven los primeros dos; el resto es ruido.

**Complemento — Eden.** `eden_search_social_content` trae posts con métricas reales, outlier score
sobre la base del propio creador y descripción del contenido por AI. Menos volumen de descubrimiento,
pero **mejor data por pieza**. El flujo que funciona: **descubrir en meta.ai, medir en Eden.**
⚠️ `eden_search_creators` requiere plan Starter · el filtro `minFollowerCount` se ignora en
content search, hay que filtrar a mano.

**Camino autorizado a futuro.** Si hace falta automatizar de verdad, el único legítimo es la
**Instagram Creator Marketplace API**: filtra creadores por seguidores, engagement, demografía,
nicho y menciones previas de marca. Requiere cuenta de Meta Business y cuenta profesional de
Instagram, y está en 18+ países — **verificar disponibilidad en Guatemala antes de contar con ella**.

**Qué cuenta como "ganadora":**
- **Anuncio:** lleva mucho tiempo corriendo → está pagando
- **Orgánico:** rinde muy por encima de la media **de esa cuenta**, no en números absolutos
- **Página:** existe hace tiempo y no la rehicieron → funciona

> Un post con muchas vistas de una cuenta enorme puede ser **su peor contenido**. Siempre relativo
> a su propia base.

## 3 · Descomponer cada pieza ganadora
En este orden, sin saltarse ninguna:

`Gancho` cómo detiene el scroll · `Promesa` qué ofrece · `Mecanismo` por qué dice que funciona ·
`Prueba` con qué lo respalda · `Formato` cómo está construido · `Distribución` cómo llegó ·
`Oferta` qué pide

## 4 · Separar patrón de ruido
| | |
|---|---|
| 🟢 **Patrón** | Aparece en 3+ piezas de **fuentes distintas** |
| 🟡 **Señal** | 1-2 apariciones, o varias de la misma fuente |
| ⚪ **Ruido** | Una sola aparición sin repetición |

**Nunca reportar una señal como patrón.** Es el error que más caro sale: construye una estrategia
sobre una casualidad.

## 5 · Lo que entrega
1. **Qué hace todo el mundo** → el default de categoría, del que hay que despegarse
2. **Qué nadie está haciendo** → el espacio vacío, y si es relevante
3. **Las objeciones del comprador**, en su lenguaje literal — salen de las reviews de la competencia
4. **Hipótesis propias**, no copias

## 6 · Reglas de traducción
- Se puede modelar la **estructura**. Nunca se copia la **ejecución**
- Un patrón que no apalanca ninguna ventaja propia es un patrón ajeno → se descarta
- **Lo que nadie hace vale más que el patrón**, si es relevante
- Si la hipótesis podría llevar el logo de un competidor sin que nadie note la diferencia, **falló**

## 7 · Antes de cerrar
- [ ] Los competidores están **verificados**, no listados de memoria
- [ ] Cada patrón marcado 🟢 / 🟡 / ⚪ con su conteo de fuentes
- [ ] Las objeciones están en **lenguaje literal** del comprador
- [ ] **Ninguna frase empieza con "deberíamos"**
- [ ] Queda registrada la fecha — la evidencia caduca
