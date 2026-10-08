---
name: po-carga
description: >
  Capa 4 de Posting — programa el ciclo en Zernio. Confirma cada cuenta con su `account_id`
  explícito (nunca la adivina), sube la media a Zernio y la valida, valida cada post y programa
  cada publicación a la fecha y hora del calendario. Registra el
  `zernio_post_id` y el estado de cada una en `calendario-de-publicacion.csv`, y deja listos los
  paquetes de email y de envío manual. Úsala cuando pidan "programalo en Zernio", "subí el ciclo a
  Zernio", "dejalo programado", "cargá el calendario en Zernio". Requiere las Capas 0-3 hechas.
  🛑 Lo que no pasa la validación no se programa, y nunca publica en el acto.
---

# Capa 4 · Carga — se programa en Zernio

| | |
|---|---|
| **Consume** | `calendario-de-publicacion.csv` con `caption_ok` y `specs_ok` en ✅, y `cuenta`, `fecha` y `hora` puestas · los captions y el alt text de `publicaciones.md` · los archivos finales en Drive · el **ID de Zernio** de cada cuenta, de `clients/<cliente>/00-onboarding/LINKS.md` *(o de `05-comunidad/respuestas.md`, si Community ya lo anotó)* |
| **Produce** | Las publicaciones **programadas en Zernio** · en `calendario-de-publicacion.csv`, el **`zernio_post_id`** de cada una y su `estado` en `programada` · § Los envíos de email y § Los envíos manuales de `publicaciones.md`, con sus checklists |

Contexto del departamento: `pipelines/contenido/05-convert/posting/brain/WORKFLOW.md`. Plantilla del registro:
`pipelines/contenido/05-convert/posting/brain/entregables/calendario-de-publicacion.csv`. Herramienta: el MCP de Zernio,
slot «Publicación y bandeja de mensajes» de `inherent/05-OPERACION.md`.

🛑 **Sin Zernio conectado no se programa:** `BLOQUEADO — falta Zernio. Instalala: ver INSTALAR.md § Zernio`.

## 0 · Tres rutas, tres paquetes

| Ruta | Qué se produce | Quién lo hace |
|---|---|---|
| **Social** | Las publicaciones **programadas en Zernio**, con su `zernio_post_id` en el registro | Posting, en Zernio, **después de validar** |
| **Email** | La sección **§ Los envíos de email** de `publicaciones.md` + su checklist | Un humano, en la herramienta de email del cliente |
| **Manual** | La sección **§ Los envíos manuales** de `publicaciones.md` + su checklist | Un humano, **a mano**: lo manda desde el teléfono, o lo imprime y lo pega |

🛑 **Solo la ruta social se programa en Zernio.** Las filas de `Email` y de la ruta manual se
separaron en la Capa 0 y no entran acá.

🛑 **Ni la herramienta de email ni la lista de WhatsApp se suponen** — están en `00-onboarding/comprension.md`
§D. Si no están, `⚠️ SIN DATOS` y el paquete se entrega igual: es agnóstico de herramienta.

🛑 **La ruta manual se entrega igual de completa que las otras dos.** El texto va **listo para
copiar**, con su fecha, su hora y su destinatario; el impreso va con **la ruta de su archivo final**
y dónde se pega. *"Es por WhatsApp, lo resuelve el cliente"* no es un paquete.

### El checklist del envío de email

```markdown
- [ ] Estoy en la cuenta y el remitente correctos
- [ ] La lista o segmento es el que dice el paquete, y sé a cuántas personas le llega
- [ ] Mandé una prueba a una casilla propia y la leí **en el celular**
- [ ] El asunto no se corta en un lugar que cambia lo que dice
- [ ] Todos los links funcionan y llevan a donde dicen
- [ ] Hay forma de desuscribirse
- [ ] 🛑 Ninguna pieza con claim pendiente está en la cola
```

### El checklist del envío manual — WhatsApp o SMS

```markdown
- [ ] Estoy en el número y la cuenta correctos
- [ ] La lista o difusión es la que dice el paquete, y sé a cuántas personas le llega
- [ ] Me mandé el mensaje a mí primero y lo leí **en el celular**
- [ ] El texto entra sin cortarse, y los links funcionan
- [ ] 🛑 **Sé quién contesta lo que entre, y en qué horario** — un aviso que abre una conversación
      que nadie atiende es peor que no mandarlo
- [ ] 🛑 Ninguna pieza con claim pendiente está en la cola
```

### El checklist del impreso

```markdown
- [ ] El archivo es el **export final de Diseño gráfico**, no un borrador ni una captura
- [ ] Se lee **a la distancia real** a la que va a estar, y con la luz que hay ahí
- [ ] 🛑 Tengo el permiso para intervenir el lugar: contrato de alquiler, municipal o el dueño del espacio
- [ ] Está puesto donde dice el paquete, no donde quedaba cómodo
- [ ] Saqué una foto del lugar, puesta — es la única verificación posible
- [ ] 🛑 Ninguna pieza con claim pendiente está en la cola
```

🛑 **Un impreso no se verifica en la Capa 5 como una publicación.** No tiene estado en Zernio ni
métrica que leer: se verifica con **la foto del lugar**, y su rendimiento **no es medible** con lo
que hay. Eso se declara; no se inventa un proxy.

## 1 · 🛑 Antes de programar — se valida todo, sin parada

**Publicar no se deshace:** un error de copy o de fecha que sale publicado no se puede despublicar
del timeline de nadie. Por eso se valida todo (§2-§4) antes de crear nada en Zernio. **No hay parada
del CEO:** lo que pasó la validación se programa, y lo que está en el repo ya pasó por el CEO.

- 🛑 **Lo que no pasó §2-§4 no se programa:** se declara.
- 🛑 **Nada se publica en el acto** (`publish_now`): todo sale a la fecha y hora del calendario.
- 🛑 **Ninguna credencial de Zernio vive en el repo.**

Lo que queda anotado arriba de `publicaciones.md` antes de programar — es lo que lee el COO en el QA
final:

```
RESUMEN DE CARGA — Cliente: [x] · Ciclo: [x] · Zona horaria: [x]
- Publicaciones a programar: [n] · rango: [aaaa-mm-dd] a [aaaa-mm-dd]
- Cuentas: [@handle → account_id de Zernio] — confirmadas con accounts_list
- Media subida a Zernio y validada (validate_media): [n/n]
- Posts validados (validate_post): [n/n] · con advertencia: [n]
- Envíos de email: [n] · envíos manuales: [n]
- Filas que NO entran y por qué: [lista]
```

🛑 **Es el último punto donde un error todavía es gratis.** Después de esto, lo que salga mal está
publicado.

## 2 · Las cuentas — `account_id` explícito, nunca adivinado

| Paso | Qué se hace |
|---|---|
| 1 | Se toma el **ID de Zernio** de cada `cuenta` del calendario, de `LINKS.md` *(o de `05-comunidad/respuestas.md`)* |
| 2 | **`accounts_list`** — se confirma que ese ID existe y que su usuario es el `@handle` del calendario |
| 3 | Toda llamada que programa lleva ese **`account_id` explícito** |

🛑 **Nunca se adivina la cuenta** — ni por el nombre, ni dejando que Zernio elija. Zernio tiene las
cuentas de varios clientes: la cuenta equivocada publica en el perfil de otro.
🛑 **Una cuenta sin ID de Zernio en `LINKS.md` ni en `respuestas.md`:**
`BLOQUEADO — falta el ID de Zernio de @<cuenta> en clients/<cliente>/00-onboarding/LINKS.md`.
🛑 **Un ID que `accounts_list` no devuelve, o cuyo usuario no coincide con el `@handle`:**
`BLOQUEADO` para esa cuenta — se nombra cuál.

## 3 · La media — subida a Zernio y validada

Los archivos finales viven en Drive, donde los dejaron Diseño gráfico y Video Editing. **Zernio
necesita una URL que pueda leer**, y la forma segura es subirlos a Zernio:

| Paso | Herramienta | Qué se hace |
|---|---|---|
| 1 | — | Se ubica el archivo final en Drive — la ruta la dejó Diseño gráfico o Video Editing |
| 2 | **`media_generate_upload_link`** | Zernio da un link de subida. Quien opera los agentes lo abre y sube los archivos del ciclo |
| 3 | **`media_check_upload_status`** | Devuelve las URLs de lo subido. 🛑 Si dice `pending` o `expired`, no se sigue |
| 4 | **`validate_media`** | Por cada URL: que se pueda leer, su tipo y su peso contra el límite de cada plataforma |

🛑 **Una URL que `validate_media` no puede leer, o que pasa el límite de su plataforma, no se
programa.** Si es el peso, es una devolución a Video Editing — motivo 2 —: no se comprime acá.

**Abrir por link un archivo de Drive cambia su acceso:** es una acción sobre los archivos del
cliente. Se pide, no se decide solo — por eso la vía es la subida a Zernio.

## 4 · Validar antes de programar

| Herramienta | Qué detecta |
|---|---|
| **`validate_post_length`** | El conteo de caracteres del caption contra el límite de cada plataforma |
| **`validate_post`** | Lo que haría fallar la publicación: media que falta en Instagram, TikTok o YouTube, límite de hashtags, requisitos del Reel de Facebook, caracteres. Se le pasa la plataforma con su `accountId`, el caption y la media con su alt text |

🛑 **Un error de `validate_post` no se programa:** se corrige en su capa —el caption en `po-caption`,
el archivo ↩️ a Diseño gráfico / Video Editing — y se vuelve a validar. Las advertencias
*(más del 90 % del límite)* se anotan.
🛑 **Lo que Zernio no mide sigue siendo de las capas anteriores:** el hook antes del corte
(`po-caption`) y las safe zones (`po-specs`).

**La fila que pasó §2-§4 queda en `estado = listo`**, y se programa.

## 5 · Programar

Cada fila de la ruta social en `listo` se crea en Zernio:

| Caso | Herramienta |
|---|---|
| Una publicación en una cuenta | **`posts_create`** con `account_id` explícito |
| La misma pieza, con el mismo caption, en varias cuentas a la misma hora | **`posts_cross_post`** con `account_ids` en paralelo a `platforms` |
| El cliente publica por cola | **`queue_list_queue_slots`** · **`queue_preview_queue`** para ver sus horarios; el post entra a la cola de su perfil en vez de llevar hora |

**Las tres reglas de la llamada:**

1. 🛑 **La hora es la del calendario, con su zona.** `posts_create` en su forma simple programa por
   `schedule_minutes` *(minutos desde ahora)*, y `posts_cross_post` simple no recibe hora: programa a
   una hora desde ahora. Para fijar la fecha y hora exactas se usa su versión completa
   (`search_tools` → `call_tool`), con **`scheduled_for` y `timezone` explícitos**. 🛑 Una
   `scheduled_for` en el pasado publica en el acto: se verifica que toda fecha sea futura.
2. 🛑 **El alt text y el tipo de publicación van en la llamada:** el alt text de cada imagen y si es
   Reel, story o feed. La forma simple no los recibe: se usa la completa.
3. 🛑 **Nunca `publish_now`.**

**Después de cada creación:** `posts_get` con el ID que devolvió Zernio — se confirma que quedó
programada, en la cuenta y a la fecha y hora del calendario. Si quedó corrida, se corrige con
`posts_update` (`scheduled_for`).

🛑 **Nada se programa dos veces.** Una fila que ya tiene `zernio_post_id` no se vuelve a crear: se
lee su estado con `posts_get`.

**Una story que Zernio no puede programar** va a la lista aparte para subir a mano, con su fecha y su
hora (`WORKFLOW.md` §0). Sigue siendo una pieza entregada del plan.

## 6 · El registro — `calendario-de-publicacion.csv`

Cada publicación programada queda anotada en el registro del ciclo:

```
id,id_creativo,campana,canal,cuenta,formato,fecha,hora,archivo,caption_ok,specs_ok,zernio_post_id,estado
PO-001,CR-001,Lanzamiento,instagram-reels,@<cuenta-del-cliente>,reel,2026-11-03,12:45,<cliente>_..._v01.mp4,✅,✅,<id de Zernio>,programada
```

| Columna | En esta capa |
|---|---|
| `zernio_post_id` | El ID que devuelve Zernio al crear la publicación. Si un solo post va a varias cuentas, sus filas comparten el ID |
| `estado` | `programada`. Desde acá lo actualiza `po-verificacion`: `publicada` / `fallida` |

🛑 **Una fila sin `zernio_post_id` no está programada**, diga lo que diga el chat.

---

## Control de calidad de la Capa 4

- [ ] 🛑 **Solo se programó lo que pasó §2-§4** — lo que no, quedó declarado
- [ ] 🛑 **Nada se publicó en el acto** — ninguna llamada con `publish_now` ni con fecha en el pasado
- [ ] 🛑 **Toda publicación lleva `account_id` explícito**, tomado de `LINKS.md` (o `respuestas.md`) y confirmado con `accounts_list`
- [ ] 🛑 **Ninguna credencial de Zernio quedó en el repo**
- [ ] Toda la media se subió a Zernio y **pasó `validate_media`**
- [ ] Todo post **pasó `validate_post`** sin errores; las advertencias están anotadas
- [ ] Toda publicación quedó a la **fecha y hora del calendario, en la zona declarada** — confirmado con `posts_get`
- [ ] El **alt text** quedó en toda imagen de una plataforma que lo acepta
- [ ] 🛑 **Ninguna fila con claim ⏸️ se programó**
- [ ] 🛑 **Ninguna fila de `Email` ni de la ruta manual se programó en Zernio**
- [ ] Toda fila programada tiene su **`zernio_post_id`** y `estado = programada` en `calendario-de-publicacion.csv`
- [ ] **Ninguna fila se programó dos veces**
- [ ] Los envíos de email tienen su paquete completo —asunto, preheader, cuerpo, lista, fecha— y su checklist
- [ ] Los envíos manuales tienen su paquete completo —texto listo para copiar, destinatario, fecha y hora— y su checklist
- [ ] Los impresos tienen **la ruta de su archivo final**, dónde van y el permiso resuelto o declarado
- [ ] 🛑 **Nada se mandó ni se imprimió desde acá** — el email y la ruta manual los hace un humano
