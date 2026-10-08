---
name: po-recepcion
description: >
  Capa 0 de Posting — verifica qué llegó y está realmente publicable antes de escribir un solo
  caption. Cruza `plan-de-contenido.csv` de Creatividad fila por fila contra los exports de Diseño
  gráfico y Video Editing, verifica que cada archivo corresponda a su `id_creativo`, que la pieza
  tenga copy escrito, que no arrastre claims sin validar y que exista la cuenta donde va, con
  alguien que tenga las claves y su ID de Zernio. Escribe las filas base de `calendario-de-
  publicacion.csv`. Úsala cuando pidan "qué nos falta para publicar", "¿llegó todo?", "arrancá el
  ciclo de posting", "cruzá lo entregado contra el calendario".
---

# Capa 0 · Recepción — qué llegó y está publicable

| | |
|---|---|
| **Consume** | **El Excel del ciclo cerrado** de Creatividad (`plan-de-contenido.csv`, en `clients/<cliente>/04-contenido/AAAA-MM/ideas/`) · los exports de Diseño gráfico y Video Editing con su ruta · `clients/<cliente>/00-onboarding/LINKS.md` (las cuentas, **quién tiene el acceso** y su **ID de Zernio**) · `00-onboarding/comprension.md` §D (restricciones) · guidelines de Branding, si existen |
| **Produce** | Las **filas base** de `calendario-de-publicacion.csv` — una por publicación — y la tabla **§ Lo que no sale este ciclo** de `publicaciones.md` |

Contexto del departamento: `pipelines/contenido/05-convert/posting/README.md`. Plantillas:
`pipelines/contenido/05-convert/posting/brain/entregables/`.

**No escribís nada todavía: cruzás y verificás.** Escribir el caption de una pieza que no tiene
archivo es trabajo tirado, y se descubre recién al programar.

## 0 · Lo primero: separar las tres rutas

Antes de verificar nada, se parte el ciclo por la columna `canal`. **Toda fila cae en una y solo
una**:

| Ruta | Canales | Qué necesita para estar completa |
|---|---|---|
| **Social** | Instagram · TikTok · Facebook · Google Business · YouTube… | El **export** de Diseño gráfico o Video Editing, más copy y cuenta |
| **Email** | Email / Newsletter | El **cuerpo escrito por Creatividad**, la lista y la herramienta. El export de Diseño gráfico solo si lleva imágenes |
| **Manual** | **WhatsApp** (lista o difusión) · **SMS** · **impresos**: cartel, vidriera, packaging | **WhatsApp y SMS:** el texto de Creatividad, la lista y **quién la opera**. **Impresos:** el export de Diseño gráfico, más dónde va y el permiso para ponerlo |

**Solo la ruta social se programa en Zernio.** Una fila de `Email` o de la ruta manual que se
cuela ahí se programa en una red donde no va.

**Una pieza de email o de WhatsApp no se marca `⚠️ SIN ARCHIVO` por no tener video.** Es un falso
bloqueo que retrasa un envío que se podía mandar. Su archivo es el texto, y lo escribió Creatividad.
**Los impresos sí llevan archivo**: sin el export de Diseño gráfico no hay nada que imprimir.

**Si un `canal` del plan no cae en ninguna de las tres, no se fuerza.** Se declara la fila como
`SIN RUTA DE SALIDA` y **se devuelve a Marketing**. Inventar la ruta en el momento es cómo un
canal termina programado donde no va.

## 1 · Los inputs bloqueantes

| De | Qué se carga | Si falta |
|---|---|---|
| **Creatividad** | **El Excel del ciclo cerrado** (`plan-de-contenido.csv`) · el copy y el caption literales del `ideas-<formato>.md` de cada pieza · la `fecha` | **FALTA** |
| **Video Editing** | Los videos finales por plataforma, con nombre de archivo y ruta | **FALTA** para esas filas |
| **Diseño gráfico** | Las piezas estáticas exportadas, por formato | **FALTA** para esas filas |
| **Strategy** | Las restricciones del cliente, de `00-onboarding/comprension.md` §D | **FALTA** |
| **`LINKS.md`** | **Quién tiene el acceso a cada cuenta** — la fuente única — y su **ID de Zernio** *(o el de `05-comunidad/respuestas.md`, si Community ya lo anotó)* | **FALTA** |
| **Branding** | Tono de voz, do's & don'ts, cómo se nombra la marca | Se usan si existen. **No bloquea** |

**Ningún archivo de otro departamento se copia: se cita su ruta.**

## 2 · El cruce, fila por fila

Se recorre **cada fila del Excel de Creatividad** del ciclo y se le busca su archivo. Sin
muestreo: una fila que no se verificó es una fila que se cae al programar.

| Chequeo | Qué se mira | Si falla |
|---|---|---|
| **Tiene archivo final** *(ruta social e impresos)* | Existe el export de Diseño gráfico o Video Editing, con ruta | `⚠️ SIN ARCHIVO` — se nombra **de quién se espera y desde cuándo** |
| **El archivo es el correcto** | El `id_creativo` del nombre coincide con la fila | ↩️ **DEVUELTO** a Diseño gráfico / Video Editing — motivo 3 |
| **Tiene copy y caption** | Están escritos y **literales** en su `ideas-<formato>.md` | ↩️ **DEVUELTO** a Creatividad — motivo 4. *"Un caption de curiosidad"* no es un caption |
| **No arrastra claims ⏸️** | La pieza no tiene `⏸️ PENDIENTE APROBACIÓN` de Creatividad | **No entra al ciclo** hasta que Branding o Ads validen |
| **Existe la cuenta** *(social)* | La `cuenta` concreta está identificada, alguien tiene las claves y tiene su **ID de Zernio** | **FALTA** — `LINKS.md` |
| **Existe la lista** *(email)* | La lista o segmento y la herramienta de email están identificadas | **FALTA** — `LINKS.md` |
| **Existe la lista y quién la opera** *(manual · WhatsApp y SMS)* | La lista o difusión existe, y hay alguien que la manda **y que contesta lo que entre** | **FALTA** — `LINKS.md`. **Sostener la conversación es de Community**, no de Posting |
| **Existe el permiso** *(manual · impresos)* | Se puede intervenir el lugar donde va: contrato de alquiler, permiso municipal, dueño del espacio | **FALTA** — `LINKS.md` |

**Una fila de Creatividad puede ser más de una publicación.** Si la misma pieza va a dos cuentas,
son **dos filas de Posting**, cada una con su `id` y su archivo.

## 3 · Las filas base

```
id,id_creativo,campana,canal,cuenta,formato,fecha,hora,archivo,caption_ok,specs_ok,zernio_post_id,estado
PO-001,CR-001,Lanzamiento,instagram-reels,@<cuenta-del-cliente>,reel,2026-10-06,,<cliente>_..._v01.mp4,⬜,⬜,,pendiente
```

| Columna | En esta capa |
|---|---|
| `id` | `PO-001`, correlativo del ciclo |
| `id_creativo` | **Obligatorio.** Ninguna fila suelta |
| `campana` · `canal` · `formato` · `fecha` | **Heredados sin cambio** de Creatividad |
| `cuenta` | Se identifica acá; la asignación definitiva la cierra `po-programacion` |
| `hora` | Vacía todavía — es de la Capa 3 |
| `archivo` | El nombre exacto del export, o `⚠️ SIN ARCHIVO` |
| `caption_ok` · `specs_ok` | `⬜` — se llenan en las capas 1 y 2 |
| `zernio_post_id` | Vacío — lo llena `po-carga` al programar |
| `estado` | `pendiente`, o `↩️ devuelto` |

## 4 · Lo que no sale, se declara

**Una pieza que desaparece en silencio es un hueco en el calendario que el cliente ve antes que
nosotros.**

```
| id_creativo | Qué falta          | De quién se espera | Desde cuándo | Motivo              |
| CR-003      | El carrusel export | Diseño gráfico  | 2026-10-02   | ⚠️ SIN ARCHIVO      |
| CR-009      | Validación de claim| Branding        | 2026-09-28   | ⏸️ PENDIENTE        |
```

## 5 · El resumen de recepción

Se cierra con la foto, que es lo primero que lee el COO:

```
Filas del ciclo en Creatividad:  [n]
Con archivo y publicables:         [n]
⚠️ SIN ARCHIVO:                    [n]  → Diseño gráfico [n] · Video Editing [n]
↩️ DEVUELTAS:                      [n]  → Creatividad [n] · Diseño gráfico [n] · Video Editing [n]
⏸️ Claims sin validar:             [n]
```

| Confianza | Cuándo |
|---|---|
| 🟢 | Todas las filas con archivo, copy y cuenta |
| 🟡 | Faltan piezas, pero todas identificadas con responsable y fecha |
| 🔴 | Falta un bloqueante de departamento: accesos o el Excel del ciclo cerrado |

---

## Control de calidad de la Capa 0

- [ ] Existe **el Excel del ciclo cerrado** de Creatividad — si no, `FALTA`
- [ ] Se cruzó **fila por fila**, sin muestreo
- [ ] Toda fila tiene su **`id_creativo`**; ninguna fila suelta
- [ ] Cada archivo se verificó que **corresponde** a su pieza, no solo que existe
- [ ] Las piezas sin export están como `⚠️ SIN ARCHIVO` con **de quién se esperan y desde cuándo**
- [ ] **Ninguna pieza con claim ⏸️ entró al ciclo**
- [ ] La **cuenta** de cada fila está identificada, sabemos quién tiene las claves y tiene su **ID de Zernio**
- [ ] Las piezas que van a dos cuentas son **dos filas**, no una
- [ ] La tabla **§ Lo que no sale este ciclo** está escrita — ninguna pieza desapareció en silencio
- [ ] **Las tres rutas están separadas por `canal`** — ninguna fila de `Email` ni de la ruta manual quedó del lado de Zernio
- [ ] **Ninguna pieza de email ni de WhatsApp se marcó `⚠️ SIN ARCHIVO`** por no tener export de Diseño gráfico ni de Video Editing — su archivo es el texto
- [ ] **Todo impreso de la ruta manual sí lleva su export de Diseño gráfico**, o quedó `⚠️ SIN ARCHIVO`
- [ ] **Ningún `canal` quedó sin ruta en silencio** — el que no cae en las tres va `SIN RUTA DE SALIDA` y se devuelve a Marketing
- [ ] **No se escribió ningún caption todavía** — eso es la Capa 1
