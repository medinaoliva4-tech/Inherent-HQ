# Las skills de ⑦ Posting — cuál, cuándo y en qué orden

Una skill es **cómo se hace un paso**. `agents/posting/WORKFLOW.md` dice qué pasa, en qué orden y con
qué reglas; acá está el detalle de cada herramienta.

**Dónde viven:** acá mismo, una carpeta por skill, al lado de este documento. Todo el departamento en
un solo lugar. El brain es un **plugin**, y por eso no hace falta copiar nada a otra carpeta.

> 🛑 **Un plugin no se carga solo.** El `plugin.json` de `agents/posting/.claude-plugin/` describe el
> plugin, pero **no hace que Claude lo encuentre**. Quien lo hace encontrable es
> `.claude-plugin/marketplace.json`, en la raíz del repo, que lista los departamentos; y
> `.claude/settings.json`, que los deja habilitados.
>
> 🛑 **Habilitar no es instalar.** `enabledPlugins` enciende un plugin **que ya está instalado**; por
> sí solo no lo instala. La primera vez, en cada máquina, hay que instalarlo a mano una vez.
>
> **Cómo se invocan:** las skills de un plugin llevan el nombre del plugin adelante —
> `posting:posting` es el orquestador, `posting:po-carga` la Capa 4, y así.
>
> **La instalación, paso a paso** *(verificado 2026-09, Claude Code v2.1.280)*:
>
> 1. `/plugin marketplace add /ruta/absoluta/al/repo`
>    🛑 El `.` pelado **no** lo acepta —*"Invalid marketplace source format"*—: pide una ruta
>    absoluta o `./path`. Y cuidado con el punto viejo si reescribís el campo: una ruta terminada en
>    `.` da *"Path does not exist"*.
> 2. `/plugin` → pestaña **Marketplaces** → `inherent-hq` → **Browse plugins**.
> 3. Entrar a cada departamento e instalarlo con **Install for all collaborators on this repository
>    (project scope)** — *user scope* lo instala solo para vos.
> 4. `/exit` y volver a entrar. `enabledPlugins` se lee **al arrancar**, no en caliente: hasta que no
>    reinicies, `/reload-plugins` va a seguir diciendo `0 plugins · 0 skills`.
>
> ⚠️ **Instalar con *project scope* reescribe `.claude/settings.json`.** Si al hacerlo te vacía
> `extraKnownMarketplaces`, restauralo **antes de commitear**: si no, el repo queda nombrando
> `@inherent-hq` en `enabledPlugins` sin ningún marketplace que lo defina, y no carga para nadie.
>
> **Mientras la rama no esté en `main`**, el marketplace de GitHub apunta a un `main` que todavía no
> tiene `marketplace.json`, y falla con *"Marketplace file not found"*. Por eso hasta el merge se
> registra el local con el paso 1.

---

## El orquestador

| Skill | Qué hace |
|---|---|
| **`posting`** | La puerta de entrada. Lee el pedido, verifica el pre-flight, decide qué capas correr y llama a las demás en orden, parando en los 2 gates. **Si no sabés cuál usar, es esta.** |

## Las 7 skills, en orden del flujo

| Capa | Skill | Se dispara cuando… | Produce |
|---|---|---|---|
| **0** | **`po-recepcion`** | Arranca el ciclo · *"¿qué nos falta para publicar?"* | Las **filas base** de `calendario-de-publicacion.csv` + las piezas `⚠️ SIN ARCHIVO` |
| **1** | **`po-caption`** | *"escribí los captions"*, *"el texto del post"* | El **caption final** de cada sección de `publicaciones.md`, con el hook antes del corte |
| **2** | **`po-specs`** | *"¿esto cumple?"*, *"revisá los archivos"* | La columna `specs_ok` + el **bloque de QA** de cada sección |
| **3** | **`po-programacion`** | *"¿a qué hora sale?"*, *"armá el calendario"* | Las columnas `cuenta`, `fecha` y `hora`, sin pisadas |
| **4** | **`po-carga`** | *"armá el archivo de Publer"*, *"dejalo listo para subir"* | **`publer-import.csv`** con las 12 columnas exactas + el checklist de subida |
| **5** | **`po-verificacion`** | *"¿salió todo?"*, *"revisá lo publicado"* | La columna `estado` + la **§ Verificación** de `publicaciones.md` |
| **6** | **`po-loop`** | *"¿qué se cayó este mes?"*, *"por qué llegó tarde"* | **`aprendizaje-de-posting.md`** — las 4 lecturas |

Los entregables son **dos** —`publicaciones.md`, que lee quien aprueba, y `publer-import.csv`, que
sube quien carga— más dos internos: `calendario-de-publicacion.csv` (12 columnas) y
`aprendizaje-de-posting.md`. **Ninguna skill inventa un archivo nuevo: todas escriben dentro de esos
cuatro.**

---

## Cómo se encadenan

```
po-recepcion ──→ po-caption ──→ po-specs ──→ po-programacion ──→ po-carga
      │                                            │                 │
      │                                         GATE 1            GATE 2
      │                                       (captions)     (paquete de carga)
      │                                                            │
      │                                          🛑 acá sube un HUMANO a Publer
      │                                                            │
      │                                                            ↓
      └────────── po-loop ←──── qué se cayó ←──── po-verificacion ←─┘
                     │
                     ├──→ piezas que llegan tarde → ③ Marketing
                     └──→ specs que fallan siempre → ⑥A / ⑥B
```

**Las reglas de encadenado:**

1. **Ninguna skill arranca sin el output de la anterior.** Si falta, se dice qué falta y se ofrece
   correrla. **No se improvisa el faltante.**
2. 🛑 **`po-specs` va antes que `po-carga`, siempre.** Un archivo que no cumple detectado antes de
   cargar se arregla en una hora; detectado después de publicar no se arregla nunca.
3. 🛑 **`po-carga` es donde para el departamento.** Deja el archivo y el checklist; **sube un
   humano.** Ninguna skill de acá publica ni programa por su cuenta.
4. **Los gates son humanos.** `po-programacion` cierra con el Gate 1 —los captions, que es lo que
   aprueba el cliente— y `po-carga` con el Gate 2, antes de que alguien suba nada.
5. **`po-verificacion` corre después de que salió**, no antes. Es la única capa que se ejecuta con el
   contenido ya público.
6. **Cada skill trae su propio control de calidad al final.**

---

## Las que se confunden

| | Qué hace | Qué NO hace |
|---|---|---|
| **`po-recepcion`** | **Cruza** lo que pidió ④ contra lo que entregaron ⑥A y ⑥B | No escribe caption ni revisa specs técnicas |
| **`po-caption`** | **Adapta el texto**: largo, orden, hashtags, alt text | 🛑 No cambia el mensaje. Si no entra sin romperse, devuelve a ④ |
| **`po-specs`** | **Verifica el archivo** contra la spec de la plataforma | 🛑 No arregla el archivo. Devuelve a ⑥A o ⑥B |
| **`po-programacion`** | **Fija hora y cuenta**, y evita pisadas | No elige el día — ese lo puso ④ — ni el canal, que es de ③ |
| **`po-carga`** | **Arma el archivo** de Publer y el checklist | 🛑 **No sube ni publica** |

> 🛑 **Adaptar no es reescribir.** `po-caption` puede recortar, partir una frase o mover el CTA de
> lugar. En el momento en que cambia la idea o el hook, dejó de ser Posting y se metió en ④ — y nadie
> aprobó ese mensaje.

> 🛑 **Verificar no es arreglar.** Si el Reel vino en 1:1, `po-specs` lo devuelve a ⑥B. Recortarlo
> acá significa que nadie revisó la composición contra lo que pidió ④.

| | Qué mide | De quién es la otra pregunta |
|---|---|---|
| **`po-loop`** | **Ejecución**: qué llegó tarde, qué se devolvió, qué falló al publicar | Si la pieza **rindió** es Capa 7 de **④ Creatividad** (`cr-loop`) |

---

## Sobre Publer

| | |
|---|---|
| **Qué usamos** | El **archivo de carga masiva** (CSV, hasta 500 posts). `po-carga` lo genera con las 12 columnas exactas |
| **Qué NO usamos** | La API de publicación. El repo no publica: **sube un humano** |
| **Credenciales** | 🛑 **Ninguna en el repo.** El archivo se sube desde la sesión del cliente en Publer |
| **Formato** | ⏱️ Verificado en **2026-09**. Es de un proveedor externo: antes de la primera carga de cada ciclo se descarga la plantilla vigente y se comparan los encabezados |

> 🛑 **Las 12 columnas no se renombran, no se reordenan y no se borra ninguna**, aunque queden
> vacías. La importación falla si falta una.

---

## Si tenés que agregar o cambiar una skill

1. **¿Es un paso del flujo o es conocimiento?** Si es conocimiento —una tabla de specs, una lista de
   hashtags, un checklist— **va adentro de la skill que lo usa**.
2. **El `name` del encabezado tiene que ser igual al nombre de la carpeta.** Si no, no carga.
3. **Toda skill declara arriba qué consume, qué produce y en qué sección de qué entregable escribe.**
4. **Toda skill cierra con su bloque de QA.**
5. **Ninguna skill nueva agrega un entregable.** Los cuatro archivos están cerrados.
6. 🛑 **Ninguna skill de este departamento publica, programa ni manda nada afuera.** Si una skill
   nueva necesita hacerlo, no es de ⑦ Posting y hay que discutirla antes de escribirla.
7. **Todo dato de plataforma lleva fecha de verificación.** Un límite de caracteres sin fecha caduca.
8. **Agregala a la tabla de arriba**, o en tres meses nadie sabe que existe.
