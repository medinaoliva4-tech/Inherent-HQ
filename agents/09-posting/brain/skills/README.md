# Las skills de ⑦ Posting — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. `agents/09-posting/brain/WORKFLOW.md` dice qué pasa, en qué orden y con
qué reglas; acá está el detalle de cada herramienta.

**Dónde viven:** acá mismo, una carpeta por skill, al lado de este documento. Todo el departamento
en un solo lugar: `agents/09-posting/brain/`.

> **Cómo cargan:** cada carpeta de skill está **enlazada** en `.claude/skills/` de la raíz del repo
> (`.claude/skills/po-carga` → `agents/09-posting/brain/skills/po-carga`), igual que las de Strategy. Es un enlace,
> no una copia: lo que se edita acá es lo que corre, y no hay nada que instalar ni actualizar
> después de un `git pull`.
>
> **Cómo se invocan:** por su nombre, sin prefijo — `/posting` es el orquestador, `/po-carga` una de
> sus capas, y así.
>
> 🛑 **La sesión de Claude Code se abre en la carpeta raíz del repo.** Los enlaces viven en
> `.claude/skills/` de la raíz: si la sesión arranca en una subcarpeta, las skills no aparecen.

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`posting`** | La puerta de entrada. Lee el pedido, verifica el pre-flight, decide qué capas correr y llama a las demás en orden, con la auto-revisión de cada capa y un solo OK del CEO: antes de programar. **Si no sabés cuál usar, es esta.** |

## Las 7 skills, en orden del flujo

| Capa | Skill | Se dispara cuando… | Produce |
|---|---|---|---|
| **0** | **`po-recepcion`** | Arranca el ciclo · *"¿qué nos falta para publicar?"* | Las **filas base** de `calendario-de-publicacion.csv` + las piezas `⚠️ SIN ARCHIVO` |
| **1** | **`po-caption`** | *"escribí los captions"*, *"el texto del post"* | El **caption final** de cada sección de `publicaciones.md`, con el hook antes del corte |
| **2** | **`po-specs`** | *"¿esto cumple?"*, *"revisá los archivos"* | La columna `specs_ok` + el **bloque de QA** de cada sección |
| **3** | **`po-programacion`** | *"¿a qué hora sale?"*, *"armá el calendario"* | Las columnas `cuenta`, `fecha` y `hora`, sin pisadas |
| **4** | **`po-carga`** | *"programalo en Zernio"*, *"dejalo programado"* | Las publicaciones **programadas en Zernio**, con el OK del CEO + su **`zernio_post_id`** en `calendario-de-publicacion.csv` |
| **5** | **`po-verificacion`** | *"¿salió todo?"*, *"¿qué falló?"* | La columna `estado` según Zernio —programada · publicada · fallida— + la **§ Verificación** de `publicaciones.md` |
| **6** | **`po-loop`** | *"¿qué se cayó este mes?"*, *"por qué llegó tarde"* | **`aprendizaje-de-posting.md`** — las 4 lecturas |

Los entregables son **dos** —`publicaciones.md`, que lee el CEO para dar el OK, y
`calendario-de-publicacion.csv` (13 columnas), el registro de lo programado en Zernio con su
`zernio_post_id`— más uno interno: `aprendizaje-de-posting.md`. **Ninguna skill inventa un archivo
nuevo: todas escriben dentro de esos tres.**

---

## Cómo se encadenan

```
po-recepcion ──→ po-caption ──→ po-specs ──→ po-programacion ──→ po-carga
      │                                                              │
      │                                         valida → 🚦 OK del CEO → programa en Zernio
      │                                                              │
      │                                                              ↓
      └────────── po-loop ←──── qué se cayó ←──── po-verificacion ←──┘
                     │                        (estado en Zernio · reintento)
                     ├──→ piezas que llegan tarde → ③ Marketing
                     └──→ specs que fallan siempre → ⑥A / ⑥B
```

**Las reglas de encadenado:**

1. **Ninguna skill arranca sin el output de la anterior.** Si falta, se dice qué falta y se ofrece
   correrla. **No se improvisa el faltante.**
2. 🛑 **`po-specs` va antes que `po-carga`, siempre.** Un archivo que no cumple detectado antes de
   programar se arregla en una hora; detectado después de publicar no se arregla nunca.
3. 🛑 **`po-carga` programa solo con el OK del CEO.** Uno solo, para el ciclo, antes de crear nada
   en Zernio. Ninguna otra skill programa.
4. **Las demás capas se auto-revisan** con su control de calidad y siguen: no hay otra parada.
5. **`po-verificacion` lee el estado en Zernio** —programada, publicada o fallida— y reintenta las
   fallidas. No abre las redes.
6. **Cada skill trae su propio control de calidad al final.**

---

## Las que se confunden

| | Qué hace | Qué NO hace |
|---|---|---|
| **`po-recepcion`** | **Cruza** lo que pidió ④ contra lo que entregaron ⑥A y ⑥B | No escribe caption ni revisa specs técnicas |
| **`po-caption`** | **Adapta el texto**: largo, orden, hashtags, alt text | 🛑 No cambia el mensaje. Si no entra sin romperse, devuelve a ④ |
| **`po-specs`** | **Verifica el archivo** contra la spec de la plataforma | 🛑 No arregla el archivo. Devuelve a ⑥A o ⑥B |
| **`po-programacion`** | **Fija hora y cuenta**, y evita pisadas | No elige el día — ese lo puso ④ — ni el canal, que es de ③ |
| **`po-carga`** | **Programa en Zernio** lo que pasó por las Capas 0-3, con el OK del CEO | 🛑 **No programa sin el OK** ni publica en el acto |
| **`po-verificacion`** | **Lee el estado** en Zernio y reintenta las fallidas | No abre las redes: el control de calidad de lo publicado es del CEO |

> 🛑 **Adaptar no es reescribir.** `po-caption` puede recortar, partir una frase o mover el CTA de
> lugar. En el momento en que cambia la idea o el hook, dejó de ser Posting y se metió en ④ — y nadie
> aprobó ese mensaje.

> 🛑 **Verificar no es arreglar.** Si el Reel vino en 1:1, `po-specs` lo devuelve a ⑥B. Recortarlo
> acá significa que nadie revisó la composición contra lo que pidió ④.

| | Qué mide | De quién es la otra pregunta |
|---|---|---|
| **`po-loop`** | **Ejecución**: qué llegó tarde, qué se devolvió, qué falló al publicar | Si la pieza **rindió** es Capa 7 de **④ Creatividad** (`cr-loop`) |

---

## Las tres rutas de salida

No todo lo que ③ programa es una red social, y **no todo pasa por una herramienta**. El calendario
trae `Email / Newsletter` como canal de primera clase, y trae canales que salen a mano:
**WhatsApp** y los **impresos**. **Solo la ruta social se programa en Zernio.**

| Ruta | Canales | Sale por |
|---|---|---|
| **Social** | Instagram · TikTok · Facebook · Google Business · YouTube… | Zernio — `po-carga` |
| **Email** | Email / Newsletter | § Los envíos de email de `publicaciones.md` |
| **Manual** | WhatsApp · SMS · impresos: cartel, vidriera, packaging | § Los envíos manuales de `publicaciones.md` |

🛑 **Se separan en `po-recepcion`, no al programar.** Una fila de `Email` o de la ruta manual no se
programa en Zernio.
🛑 **Una pieza de email o de WhatsApp no se marca `⚠️ SIN ARCHIVO` por no tener video:** su archivo
es el texto, y lo escribió ④. **Los impresos sí llevan archivo** — sin el export de ⑥A no hay qué imprimir.
🛑 **La ruta manual no es un cajón de descartes.** El canal de mayor ROI del arquetipo `01` es
WhatsApp: un plan puede apoyar su objetivo central en algo que ninguna herramienta programa.
🛑 **Un `canal` que no cae en ninguna de las tres se declara y se devuelve a ③** — no se fuerza
dentro de Zernio ni se reescribe el plan.

## Sobre Zernio

| | |
|---|---|
| **Qué es** | El MCP del slot «Publicación y bandeja de mensajes» (`inherent/05-OPERACION.md`). ⑧ Community lo usa para la bandeja; Posting, para programar y leer el estado |
| **La cuenta** | 🛑 **Siempre con `account_id` explícito.** Sale de `clients/<cliente>/00-onboarding/LINKS.md` —o de `05-comunidad/respuestas.md`, si ⑧ ya lo anotó— y se confirma con `accounts_list`. **Nunca se adivina** |
| **Credenciales** | 🛑 **Ninguna en el repo** |
| **Si no está conectado** | `BLOQUEADO — falta Zernio. Instalala: ver INSTALAR.md § Zernio` |

| Para qué | Herramienta | Skill |
|---|---|---|
| Las cuentas | `accounts_list` | `po-carga` |
| Subir la media | `media_generate_upload_link` → `media_check_upload_status` | `po-carga` |
| Validar la media | `validate_media` | `po-carga` |
| Validar el post | `validate_post` · `validate_post_length` | `po-carga` |
| Programar | `posts_create` · `posts_cross_post` · `queue_*` si el cliente usa cola | `po-carga` |
| Leer el estado | `posts_get` · `posts_list` · `posts_list_failed` | `po-verificacion` |
| Reintentar las fallidas | `posts_retry` · `posts_retry_all_failed` | `po-verificacion` |

Lo que no está en la lista se busca con `search_tools`. 🛑 **Solo `po-carga` programa, y solo con el
OK del CEO.**

---

## Si tenés que agregar o cambiar una skill

1. **¿Es un paso del flujo o es conocimiento?** Si es conocimiento —una tabla de specs, una lista de
   hashtags, un checklist— **va adentro de la skill que lo usa**.
2. **El `name` del encabezado tiene que ser igual al nombre de la carpeta.** Si no, no carga.
3. **Toda skill declara arriba qué consume, qué produce y en qué sección de qué entregable escribe.**
4. **Toda skill cierra con su bloque de QA.**
5. **Ninguna skill nueva agrega un entregable.** Los tres archivos están cerrados.
6. 🛑 **Solo `po-carga` programa, y solo con el OK del CEO.** Ninguna skill publica en el acto ni
   manda nada al cliente.
7. **Todo dato de plataforma lleva fecha de verificación.** Un límite de caracteres sin fecha caduca.
8. **Enlazala en `.claude/skills/`** de la raíz (`ln -s ../../agents/09-posting/brain/skills/<skill> .claude/skills/<skill>`), o no se puede invocar por nombre.
9. **Agregala a la tabla de arriba**, o en tres meses nadie sabe que existe.
