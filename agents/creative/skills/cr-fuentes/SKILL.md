---
name: cr-fuentes
description: >
  Capa 1 de ④ Creatividad — la skill que CONSIGUE los anuncios. Decide de dónde salen las
  referencias (Meta Ad Library, TikTok Creative Center, MCPs de ad intelligence, recolección propia
  con navegador o modo manual), qué da y qué no da cada fuente, y con qué techos de consulta se
  trabaja; extrae id, anunciante, copy, plataformas y fecha de inicio, calcula la antigüedad y
  ordena por ella. Úsala cuando pidan "buscá los anuncios de esta marca", "qué está corriendo la
  competencia", "de dónde saco referencias", "conseguime ads de este formato", "ordená estos ads
  por antigüedad", "¿pagamos Foreplay?". No lee la imagen (eso es cr-lectura-de-video) ni decide
  qué entra a la bóveda (eso es cr-swipe-file).
---

# Capa 1 · Fuentes — conseguir los anuncios

| | |
|---|---|
| **Consume** | El hueco calculado en `cr-swipe-file` (qué formato, canal o tipo de hook falta) · los competidores del cliente de ② Estrategia · los canales con slot del calendario de ③ Marketing |
| **Produce** | El listado crudo de anuncios: **id de biblioteca · anunciante · copy · plataformas · fecha de inicio · antigüedad calculada · link · URL del creativo**, ordenado por antigüedad · y el registro de fuentes usadas, no disponibles y consumo |

Contexto del departamento: `agents/creative/WORKFLOW.md`.

**Consigue. No lee y no juzga.** Leer el video a fondo es `cr-lectura-de-video`; decidir qué entra a
la bóveda, con qué señal y en qué cubeta, es `cr-swipe-file`. Esta skill solo responde *"¿de dónde
salen los anuncios y cuántos días llevan corriendo?"*.

## 🛑 La regla dura: la antigüedad se lee, nunca se pregunta

> 🛑 **Ninguna fecha de antigüedad entra al swipe file si no fue leída directamente de la Ad
> Library** — de la página, o de un MCP que la lea. **NUNCA de un modelo.**

**Por qué.** Se le pidió a un modelo que listara anuncios activos: devolvió 5, con id y fecha.
Verificados uno por uno, **las marcas existían pero las fechas, los estados y las creatividades
estaban inventados**. Un modelo sin acceso a los datos no dice *"no sé"*: rellena.

❌ *"Estos 5 ads están activos desde junio"* (salida de un modelo)
✅ `id 1050002464327310 · 9-sep-2026 · Inactivo` (leído en la página, verificado uno por uno)

## Las 4 necesidades reales del departamento

Lo que se elige se elige contra esto, **no contra el precio ni contra lo que ya está conectado**.

| # | Necesidad | Por qué el método la exige | Sin esto… |
|---|---|---|---|
| **1** | **Longevidad de creativos de pauta** | *Longevidad, no gusto*: un ad con 90 días corriendo es un creativo validado con dinero | El swipe file entra por gusto y el `70·probado` es una mentira |
| **2** | **Outliers orgánicos con su base** | Un post con muchas vistas de una cuenta grande puede ser **el peor** de esa cuenta | No se distingue un outlier de un número absoluto |
| **3** | **El creativo en sí, no solo su texto** | La Capa 5 pide ambientación, luz, encuadre, paleta — y eso necesita el archivo o la transcripción | Se lee el mensaje y se queda ciego sobre la imagen |
| **4** | **Lenguaje literal del comprador** | El copy se escribe con sus palabras, no con las nuestras | El copy suena a marca hablándole a nadie |

Notion, Drive y Calendar son **logística**, no research. Útiles, pero no definen si el departamento
funciona.

## Qué da y qué no da cada fuente

| Fuente | Qué da | Qué **no** da |
|---|---|---|
| **Meta Ad Library (web)** | Los ads activos de cualquier página, con **fecha de inicio**, copy, plataformas, id de biblioteca y la **URL del creativo en el DOM** | Una columna de días corriendo. Sin exportación. Hay que abrir cada ad y hacer la resta — o extraer y ordenar nosotros |
| **API oficial de Ad Library** | Consulta programática | 🔴 **No sirve:** solo ads políticos y de temas sociales (los comerciales, solo para audiencias UE/UK por el DSA), **devuelve solo texto** —ni imagen ni video—, verificación con documento, token a ~60 días, ~200 llamadas/hora |
| **TikTok Creative Center** | Top Ads público y navegable: tendencias de **formato** | 🟡 **Sin API oficial.** Y es la **curaduría de TikTok**, no los competidores del cliente: no responde *"qué está haciendo esta marca"* |
| **Foreplay** (MCP oficial, 200M+ ads) | Días corriendo y estado · el creativo, copy, CTA y landing · **transcripción con timestamps** · filtros por formato, duración, mercado, idioma y fecha · boards | Cuesta **$49/mes** (plan Basic, el MCP viene en los tres planes). No cubre orgánico con base del creador |
| **MCPs de ad intelligence** *(si están habilitados)* | Ads ordenables **por antigüedad**, competidores verificados, búsqueda por ángulo | 🛑 Instalado **no es** habilitado: un MCP sin habilitar en la sesión no tiene sus tools cargadas |

> **Dato verificado:** la Ad Library **solo ordena por "impresiones" o "más recientes"**. **No tiene
> orden por antigüedad.** Por eso hay que **extraer y ordenar nosotros**: es el paso que ninguna
> fuente gratis hace sola, y es exactamente la señal que el método necesita.

> **No se paga por los datos —son públicos—: se paga por el índice.** Tenerlos ordenados por
> longevidad, filtrables por formato, con transcripción, y alcanzables en una sola llamada.

### Corrección registrada · Muse Spark

**Existe y es oficial de Meta.** Muse Spark es el primer modelo de la familia Muse, de Meta
Superintelligence Labs (8-abr-2026; Muse Spark 1.3, 2-sep-2026). Acepta video, imagen y texto de
entrada y devuelve texto. *(Una versión anterior de la documentación del departamento afirmaba que
«Meta Spark» solo se refería a **Spark AR Studio** —la plataforma de efectos de AR que Meta
discontinuó en enero de 2025— y que no existía nada más con ese nombre. **Era incorrecto.**)*

**Y no sirve como fuente de anuncios, por un motivo estructural:**

| Lo que es | Lo que Creative necesita |
|---|---|
| Un **modelo generalista** dentro de las apps de Meta | Un **índice de anuncios** con días corriendo |
| Sin acceso a datos de publicidad, Ad Library ni research de competidores | Exactamente eso |
| Sin API pública ni acceso al modelo | Algo cableable |

🛑 **Un modelo no es una base de datos.** Puede *razonar* sobre un video que se le muestre, y sirve
para transcribir audio o como segunda lectura de ambientación. Lo que **no** puede es decir qué
anuncios corre un competidor y desde cuándo: eso es un índice, y los índices los tiene quien los
construyó.

## El estado de la decisión

**Se eligió la vía propia — recolección con navegador — sobre pagar Foreplay Basic ($49/mes).**
Probado sobre la Ad Library real: **48 anuncios extraídos** con id, anunciante, copy, plataformas y
fecha de inicio leyendo el DOM; antigüedad calculada y ordenada; las URLs de los videos están en el
DOM y son descargables.

El proceso automatizado —cron nocturno, Chromium headless, extracción, descarga, lectura y fichas—
está documentado en **`agents/creative/skills/BARRIDO-NOCTURNO.md`**.
🟡 **Está PENDIENTE de construir.** Mientras no exista, se recolecta a mano o por MCP, y se declara.

**Foreplay se compra el día que pase cualquiera de estas tres:**

1. **Meta bloquea la IP del VPS** y el barrido deja de correr.
2. **El extractor se rompe dos veces en un mes.**
3. **Se pasan de 4 clientes** y hace falta TikTok en serio.

> Los $49 no compran una capacidad que no tengamos: compran que un rediseño de Meta no sea problema
> nuestro. El arreglo típico es cambiar el texto que el script busca — una línea, diez minutos.

## 🟡 El modo manual es legítimo y se declara

Un humano navega la Ad Library o el Creative Center, pega los links o suelta el archivo de video, y
el agente lo lee con `cr-lectura-de-video`. **El departamento funciona.** Lo que se pierde es el
barrido semanal a escala, el orden por antigüedad y las transcripciones — o sea, el trabajo pasa de
la herramienta a una persona. Cuando se corre así, el entregable lo dice:
`🟡 recolección manual — [n] anuncios · sin barrido a escala`.

⚠️ **El agente no puede bajar el video** de TikTok, Instagram ni Meta: esos dominios están fuera de
alcance de red del entorno. Cuando hace falta leer la **imagen** y no solo el mensaje, el archivo lo
aporta un humano, sale de Drive, o lo baja el barrido nocturno desde el VPS.

## 🛑 Techos de disciplina de consulta

El riesgo no es el volumen: es la indisciplina. Ocho marcas × tres búsquedas × 500 resultados es un
barrido sin control.

| Regla | Límite |
|---|---|
| Resultados por búsqueda | **máximo 50.** Se ordena por antigüedad y se lee la primera página |
| Ads por marca en el barrido de competidores | **máximo 25** |
| Techo por cliente por semana | **400 anuncios.** Si se pasa, **se declara y se para** |
| Paginar más allá de la primera página | Solo si la primera trajo señal y falta cubrir el hueco |
| Volver a pedir un ad ya leído | 🛑 **Nunca.** Está en su ficha de referencia — la ficha es la caché |
| Metadata | **Completa, en una sola llamada.** Nunca en dos pasadas: se paga dos veces por lo mismo |
| Búsquedas infructuosas | **máximo 3 por objetivo.** Después se pide al usuario un nombre, un handle o un link |

**Y tres reglas de lectura de resultados:**

- **Un error o un timeout no es un cero.** Nunca se reporta un fallo como *"no hay datos"*.
- **Cero resultados describe esos términos y filtros**, nunca *"no hay contenido de esto"*.
- **Si una fuente no está disponible:** `⚠️ SIN [fuente] — [qué evidencia falta y qué confianza
  pierde el concepto]`, y se sigue con el resto. 🛑 **Nunca se rellena el hueco con inferencia
  presentada como dato.**

## Registro obligatorio

Todo relevamiento cierra con:

```
- Fuentes usadas: [lista] · no disponibles: [lista] → evidencia faltante: [qué]
- Anuncios extraídos: [n] · techo del cliente: 400/semana · consumo: [n]
- Modo: automatizado / MCP / 🟡 manual
- Fecha del relevamiento: [fecha]   ← la antigüedad se mide a esta fecha
- Confianza: 🟢 alta / 🟡 parcial / 🔴 insuficiente para dirigir
```

**Por qué importa:** la longevidad de un ad se mide **al momento de la consulta**. Un relevamiento
sin fecha es un relevamiento muerto. Refresco **semanal**.

## QA — Capa 1

Lo que le toca a las fuentes. El bloque completo de la capa lo cierra `cr-swipe-file`.

- [ ] 🛑 **Ninguna fecha de antigüedad viene de un modelo** — todas leídas de la Ad Library (página o MCP que la lea), con **fecha de lectura** registrada
- [ ] El **hueco** está calculado antes de salir a buscar, y **solo se cosechó el hueco**
- [ ] Cada anuncio trae **id de biblioteca, anunciante, fecha de inicio y antigüedad calculada**
- [ ] El listado está **ordenado por antigüedad**, no por impresiones ni por engagement
- [ ] Para orgánico: **la base del creador se midió** antes de declarar un outlier
- [ ] Ninguna referencia se pidió dos veces — se buscó su ficha antes de volver a consultar
- [ ] Los **techos** se respetaron: 50 por búsqueda · 25 por marca · 400 por cliente/semana
- [ ] La metadata se pidió **completa en una sola llamada**
- [ ] Máximo **3 búsquedas infructuosas** por objetivo; después se pidió un nombre, handle o link
- [ ] Ningún error ni timeout se reportó como cero; ningún cero se describió como *"no existe"*
- [ ] Las fuentes no disponibles están declaradas con **qué evidencia falta**
- [ ] Lo que no se pudo bajar está declarado: `⚠️ SIN ARCHIVO`
- [ ] El **modo** está declarado (automatizado / MCP / 🟡 manual) y el **registro** está completo

**Handoff →** `cr-lectura-de-video` (leer lo que llegó) y `cr-swipe-file` (filtrar por señal,
diseccionar y clasificar en 70/20/10).
