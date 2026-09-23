---
name: po-carga
description: >
  Capa 4 de ⑦ Posting — genera `publer-import.csv` con las 12 columnas exactas de Publer, resuelve
  las URLs públicas de cada media (un link privado de Drive Publer no lo puede leer) y deja el
  checklist de qué verificar dentro de Publer antes de apretar programar. Es donde PARA el
  departamento: deja el archivo listo y lo sube un humano. Úsala cuando pidan "armá el archivo de
  Publer", "dejalo listo para subir", "exportá el calendario para cargar", "el CSV de publicación".
  Requiere el GATE 1 de captions. 🛑 No publica, no programa y no manda nada afuera.
---

# Capa 4 · Carga — qué se sube y cómo

| | |
|---|---|
| **Consume** | `calendario-de-publicacion.csv` con `caption_ok` y `specs_ok` en ✅ y el **Gate 1 aprobado** · los captions de `publicaciones.md` · las rutas de los archivos en Drive |
| **Produce** | **`publer-import.csv`** con las 12 columnas exactas · el **checklist de subida** · la columna `estado` en `listo` |

Contexto del departamento: `agents/posting/WORKFLOW.md`. Plantilla:
`agents/posting/entregables/publer-import.csv`.

## 0 · Dos rutas, dos paquetes

| Ruta | Qué se produce | Quién lo carga |
|---|---|---|
| **Social** | `publer-import.csv` + checklist de subida | Un humano, en Publer |
| **Email** | La sección **§ Los envíos de email** de `publicaciones.md` + su checklist | Un humano, en la herramienta de email del cliente |

🛑 **`publer-import.csv` lleva solo las filas de la ruta social.** Publer no manda email: una fila de
`Email` ahí hace fallar la importación entera, con todo el ciclo adentro.

🛑 **La herramienta de email no se supone** — está en `comprension.md` § La capacidad. Si no está,
`⚠️ SIN DATOS` y el paquete se entrega igual: es agnóstico de herramienta.

### El checklist del envío de email

```markdown
- [ ] Estoy en la cuenta y el remitente correctos
- [ ] La lista o segmento es el que dice el paquete, y sé a cuántas personas le llega
- [ ] Mandé una prueba a una casilla propia y la leí **en el celular**
- [ ] El asunto no se corta en un lugar que cambia lo que dice
- [ ] Todos los links funcionan y llevan a donde dicen
- [ ] Hay forma de desuscribirse
- [ ] 🛑 Ninguna pieza con claim pendiente está en la cola
- [ ] 🚦 Tengo la aprobación del GATE 2
```

## 1 · 🛑 Acá para el departamento

**Se genera el archivo. No se sube, no se publica, no se programa.**

No es una limitación técnica —Publer tiene API— sino una decisión declarada: la **regla 10** del
`CLAUDE.md` dice que nada se publica sin autorización, y `.claude/settings.json` ya tiene las
herramientas de publicación automática en `deny`. Un error de copy o de fecha que sale publicado no
se puede despublicar del timeline de nadie.

**Si piden publicar directo:** se explica la regla y se ofrece dejarlo listo para subir. No se busca
una vía alternativa.

🛑 **Ninguna credencial de Publer vive en el repo.** El archivo se sube desde la sesión del cliente.

## 2 · Las 12 columnas — de Publer, no nuestras

```
Date · Text · Link · Media URL · Title · Label · Alt text(s) · Comment(s) ·
Pin board, FB album, or Google category · Post subtype · CTA · Reminder
```

🛑 **No se renombran, no se reordenan y no se borra ninguna**, aunque queden vacías: la importación
falla si falta una.

| Columna | Qué le va | De dónde sale |
|---|---|---|
| `Date` | `YYYY/MM/DD HH:MM`, 24 h | `fecha` + `hora` del calendario |
| `Text` | El **caption completo**, con saltos de línea y hashtags | `publicaciones.md` |
| `Link` | El link del CTA, si lleva | ④ |
| `Media URL` | 🛑 **URL pública** del archivo. Varias, separadas por coma | Drive |
| `Title` | Título, donde la plataforma lo use | Normalmente vacío |
| `Label` | La campaña — sirve para filtrar dentro de Publer | `campana` |
| `Alt text(s)` | El alt text. Varios: separados por **doble pipe** `\|\|` | `publicaciones.md` |
| `Comment(s)` | Primer comentario automático. Varios: `\|\|` | Solo si ④ lo pidió |
| `Pin board, FB album…` | Solo para Pinterest, álbum de FB o categoría de Google | Normalmente vacío |
| `Post subtype` | `reel`, `story`, `short`… según la plataforma | `formato` |
| `CTA` | El botón, donde la plataforma lo soporte | ④ |
| `Reminder` | Recordatorio en vez de publicación automática | Normalmente vacío |

| Regla del formato | Detalle |
|---|---|
| **Máximo** | 500 posts por archivo |
| **Separador de varios media o labels** | Coma |
| **Separador de varios alt text o comentarios** | Doble pipe `\|\|` |
| **Codificación** | UTF-8. Los acentos y emojis se verifican abriendo el archivo |

> ⏱️ **Formato verificado contra la documentación de Publer en 2026-09.** Es de un proveedor externo:
> 🛑 **antes de la primera carga de cada ciclo se descarga la plantilla vigente desde Publer y se
> comparan los encabezados uno por uno.** Un formato que cambió y nadie verificó falla con 40 posts
> adentro, y la ventana de publicación ya pasó.

## 3 · `Media URL` — el paso que más falla

🛑 **Publer necesita una URL que pueda leer sin estar logueado.** Un link normal de Drive es privado:
Publer recibe una página de permiso, no el archivo.

| Paso | Qué se hace |
|---|---|
| 1 | Se ubica el archivo final en Drive — la ruta la dejó ⑥A o ⑥B |
| 2 | Se pide que el archivo quede **accesible por link** |
| 3 | Se arma la URL de descarga directa, no la de vista previa |
| 4 | 🛑 **Se verifica abriéndola en una ventana sin sesión.** Si pide permiso, no sirve |

**Compartir un archivo cambia su acceso:** es una acción sobre los archivos del cliente. Se pide, no
se decide solo — y se acota a los archivos de este ciclo.

## 4 · El checklist de subida

Se entrega junto al archivo. Es lo que hace la persona que sube:

```markdown
## Antes de importar
- [ ] Estoy en el workspace correcto de Publer
- [ ] Las cuentas del ciclo están conectadas y activas: [lista de @handles]
- [ ] La zona horaria del workspace es [x] — la misma del calendario
- [ ] Descargué la plantilla vigente de Publer y los encabezados coinciden con el archivo
- [ ] No quedaron posts del ciclo anterior en cola sin publicar

## Al importar
- [ ] El archivo subió sin errores de formato
- [ ] La cantidad de posts importados es [n] — la misma del archivo
- [ ] Abrí 3 al azar: el caption se ve completo, con saltos de línea y emojis correctos
- [ ] La media cargó en los 3 — ninguno quedó sin imagen o video
- [ ] Las fechas y horas se ven como en el calendario, no corridas
- [ ] Cada post quedó en la cuenta correcta

## Antes de programar
- [ ] 🛑 Ninguna pieza con claim pendiente está en la cola
- [ ] Los Reels están como Reel, no como video de feed
- [ ] Reviso el primero de cada cuenta en la vista previa de la plataforma
- [ ] 🚦 Tengo la aprobación del GATE 2
```

## 5 · El gate

🚦 **GATE 2 — el paquete de carga.** Se presenta el archivo y el checklist, con:

```
- Posts en el archivo: [n] · cuentas: [lista] · rango de fechas: [x] a [y]
- Media URLs verificadas sin sesión: [n/n]
- Encabezados comparados contra la plantilla vigente: [✅ fecha]
- Filas que NO entraron y por qué: [lista]
```

🛑 **Es el último punto donde un error todavía es gratis.** Después de esto, lo que salga mal está
publicado.

---

## Control de calidad de la Capa 4

- [ ] 🛑 **No se publicó ni se programó nada** — el archivo quedó listo para que lo suba un humano
- [ ] 🛑 **Ninguna credencial de Publer quedó en el repo**
- [ ] El archivo tiene **las 12 columnas exactas**, en orden, sin renombrar ni borrar ninguna
- [ ] Los **encabezados se compararon** contra la plantilla vigente descargada de Publer, con fecha
- [ ] Toda `Date` está en `YYYY/MM/DD HH:MM` y en la **zona horaria declarada**
- [ ] 🛑 **Toda `Media URL` se verificó abriéndola sin sesión** — ninguna pide permiso
- [ ] Los separadores son los correctos: **coma** para media y labels, **doble pipe** para alt text y comentarios
- [ ] El archivo no pasa de **500 filas**
- [ ] El `Text` conserva saltos de línea, acentos y emojis — se verificó abriendo el archivo
- [ ] 🛑 **Ninguna fila con claim ⏸️ entró al archivo**
- [ ] Toda fila del archivo tiene su `id_creativo` trazable en el calendario interno
- [ ] 🛑 **Ninguna fila de `Email` entró a `publer-import.csv`**
- [ ] Los envíos de email tienen su paquete completo —asunto, preheader, cuerpo, lista, fecha— y su checklist
- [ ] El **checklist de subida** está entregado junto al archivo
- [ ] 🚦 **GATE 2** presentado a un humano
