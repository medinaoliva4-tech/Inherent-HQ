# ⑦ Posting — cómo trabaja

> **En una frase:** toma lo que ⑥A y ⑥B terminaron y lo deja **listo para salir** — con el caption
> final, la ficha técnica verificada, la fecha y la hora, cargado en un archivo que un humano sube a
> Publer. Creatividad escribe **el mensaje**; Posting lo **adapta a la plataforma** y lo **agenda**.

Este documento es todo lo que hay que saber para operar el departamento. El **cómo se hace** cada
paso vive en las skills: `skills/COMO-LAS-USA.md`.

---

## 1 · La distinción que define el departamento

**④ Creatividad escribe el mensaje. ⑦ Posting lo hace publicable.**

| ④ Creatividad decidió | ⑦ Posting resuelve |
|---|---|
| El hook y el copy, literales | Cómo entran en 125 caracteres antes del *"… más"*, sin perder el hook |
| *"un Reel para Instagram"* | 9:16, bajo 3 min, con el texto fuera de la safe zone, subido como Reel y no como video de feed |
| *"sale la semana del 6"* | Jueves 9 de octubre, 12:45, en la cuenta `@cliente`, con el archivo correcto |

> 🛑 **Posting no cambia el mensaje.** Puede recortar para que entre, mover el CTA de lugar o partir
> una frase — **nunca reescribir la idea ni cambiar el hook.** Si el copy no entra en la plataforma
> sin romperse, **vuelve a ④** con motivo y dos alternativas.

### Dónde para: el humano sube

Este departamento **no publica.** Deja el paquete completo y el archivo de carga; **un humano lo sube
y aprieta programar.**

Es una decisión declarada del repo, no una limitación: la regla 10 del `CLAUDE.md` dice que nada se
publica sin autorización, y `.claude/settings.json` ya tiene las herramientas de publicación
automática en `deny`. Un error de copy o de fecha que sale publicado no se puede despublicar del
timeline de nadie.

### Las dos rutas de salida

No todo lo que ③ Marketing programa es una red social. El calendario trae **`Email / Newsletter`**
como canal de primera clase, y **Publer no manda email**. Por eso hay dos rutas, y toda fila cae en
una de las dos:

| Ruta | Canales | Sale por | Quién carga |
|---|---|---|---|
| **Social** | Instagram · TikTok · Facebook · Google Business · YouTube… | **`publer-import.csv`** | Un humano, en Publer |
| **Email** | Email / Newsletter | La sección **§ Los envíos de email** de `publicaciones.md` | Un humano, en la herramienta de email del cliente |

🛑 **La herramienta de email no se supone.** Cuál usa el cliente está en
`agents/comprension/clients/<cliente>/comprension.md` § La capacidad. Si no está: `⚠️ SIN DATOS`, y
el paquete se entrega igual — es agnóstico de herramienta.

> 🛑 **Una fila de `Email` que se mete en `publer-import.csv` falla la importación entera.** Se
> separan en la Capa 0, no al cargar.

---

## 2 · Qué entrega

**Dos entregables, con dos lectores distintos.**

| Archivo | Para quién | Qué es |
|---|---|---|
| **`publicaciones.md`** | **Quien aprueba** — el lead, y el cliente si corresponde | Una sección por publicación: caption final, hashtags, alt text, link, qué archivo va, fecha y hora, y el QA de plataforma. Se lee para dar el OK |
| **`publer-import.csv`** | **Quien carga** | El archivo con las **12 columnas exactas de Publer**, listo para subir. No se lee: se sube. **Solo lleva las filas de la ruta social** |

**Más dos archivos de trabajo interno** que no se entregan pero **sí se guardan**:
`calendario-de-publicacion.csv` (una fila por publicación, 12 columnas — es el control de estado) y
`aprendizaje-de-posting.md`, el cierre del ciclo.

### Las 12 columnas de `calendario-de-publicacion.csv` *(interno)*

```
id · id_creativo · campana · canal · cuenta · formato · fecha · hora · archivo · caption_ok · specs_ok · estado
```

| Columna | Qué lleva | De dónde sale |
|---|---|---|
| `id` | `PO-001`, correlativo del ciclo | Posting |
| `id_creativo` | `CR-007` — **obligatorio** | ④ Creatividad |
| `campana` | Nombre de la campaña | ③ Marketing |
| `canal` · `formato` | Heredados sin cambio | ④ Creatividad |
| `cuenta` | La cuenta concreta: `@cliente`, no *"Instagram"* | Posting |
| `fecha` · `hora` | Día y hora exactos | ④ pone la fecha · Posting pone la **hora** |
| `archivo` | El nombre del archivo final de ⑥A o ⑥B | ⑥A / ⑥B |
| `caption_ok` · `specs_ok` | `✅` / `⬜` | Posting |
| `estado` | `pendiente` / `listo` / `cargado` / `publicado` / `↩️ devuelto` | Posting |

> 🛑 **`cuenta` no es `canal`.** Un cliente puede tener dos cuentas de Instagram. Cargar en la
> equivocada es de los pocos errores de este departamento que se ven desde afuera.

### Las 12 columnas de `publer-import.csv`

**Son las de Publer, no las nuestras. No se renombran, no se reordenan y no se borra ninguna** —
aunque queden vacías, o la importación falla.

```
Date · Text · Link · Media URL · Title · Label · Alt text(s) · Comment(s) ·
Pin board, FB album, or Google category · Post subtype · CTA · Reminder
```

| Regla | Detalle |
|---|---|
| **Fecha y hora** | `YYYY/MM/DD HH:MM`, en 24 h |
| **Varios media o labels** | Separados por **coma** |
| **Varios alt text o comentarios** | Separados por **doble pipe** `\|\|` |
| **Máximo** | 500 posts por archivo |
| **`Media URL`** | 🛑 Tiene que ser una **URL pública**. Un link de Drive privado no lo puede leer Publer |

> ⏱️ **Verificado contra la documentación de Publer en 2026-09.** Es el formato de un proveedor
> externo: **antes de la primera carga de cada ciclo se descarga su plantilla vigente y se comparan
> los encabezados.** Un formato que cambió y nadie verificó falla con 40 posts adentro.

---

## 3 · Qué recibe, y de quién

| De | Qué recibe | ¿Bloqueante? |
|---|---|---|
| **⑥B Video Editing** | Los videos finales, por plataforma, con su nombre de archivo y su ruta | 🛑 Sí |
| **⑥A Diseño gráfico** | Las piezas estáticas exportadas, por formato | 🛑 Sí |
| **④ Creatividad** | `plan-de-contenido.csv` con Gate 3 · el **copy y el caption literales** del `ideas-<formato>.md` de cada pieza · la `fecha` | 🛑 Sí |
| **②B Branding** | Tono de voz, do's & don'ts, cómo se nombra la marca | 🛑 Sí |
| **① Comprensión** | **Quién tiene las claves de las cuentas** y quién aprueba, de § La capacidad | 🛑 Sí |
| **③ Marketing** | Qué es campaña pagada y qué es orgánico | No — pero sin esto se puede publicar en orgánico algo que era de pauta |

Si falta un bloqueante: **BLOQUEADO**, y se pide el archivo exacto.

> 🛑 **Una pieza sin archivo final no entra al calendario.** *"El video está casi"* no es un archivo.
> Se declara como `⚠️ SIN ARCHIVO` y se nombra a quién pedírselo.

---

## 4 · Qué NO hace

| No hace | De quién es |
|---|---|
| Decidir el concepto, el hook, el mensaje o la idea | ④ Creatividad |
| Reescribir el copy — se **devuelve**, no se reinventa | ④ Creatividad |
| Elegir qué se publica, en qué canal, en qué semana | ③ Marketing |
| Definir tono de voz, paleta o cómo se nombra la marca | ②B Branding |
| Editar el video, recortar, poner subtítulos, exportar otra versión | ⑥B Video Editing |
| Recomponer una pieza, cambiar un texto en pantalla, reexportar | ⑥A Diseño gráfico |
| **Apretar publicar** | 🛑 **Un humano**, en Publer |
| Contestar comentarios, DMs, seguimiento de comunidad | ⑧A Orgánico |
| Segmentar, pautar, presupuestar, optimizar | ⑧B Ads |

### Las dos líneas que más se pisan

| Frontera | Posting hace | El otro hace |
|---|---|---|
| **④ Creatividad** | **Adapta**: recorta para que entre, ordena para que el hook sobreviva al corte, elige hashtags | **Escribe** el mensaje. Si no entra sin romperse, decide ④ |
| **⑥A / ⑥B** | **Verifica** que el archivo cumpla la spec de la plataforma y **devuelve** el que no | **Produce y corrige** el archivo. Posting no abre Figma ni el editor |

> 🛑 **Posting nunca arregla un archivo.** Si el Reel vino en 1:1, no se recorta acá: se devuelve a
> ⑥B. Recortarlo en Posting significa que nadie revisó la composición contra lo que pidió ④.

---

## 5 · Las reglas duras

1. **Sin archivo final no hay fila.** Una pieza sin su archivo exportado no entra al calendario.
2. **Toda fila traza a un `id_creativo`.** Una publicación sin pieza de ④ es contenido que nadie aprobó.
3. **El mensaje no se cambia.** Se adapta el largo y el formato, nunca la idea ni el hook.
4. **El hook sobrevive al corte.** Instagram muestra ~125 caracteres en feed y ~55 en Reels antes del
   *"… más"*. Si el gancho quedó después del corte, el caption está mal escrito.
5. **🛑 Nadie publica desde acá.** El departamento deja el paquete; sube un humano. Sin excepción.
6. **Una fila por cuenta, no por canal.** Dos cuentas del mismo cliente son dos filas.
7. **El QA de plataforma se hace antes de cargar**, no después de publicar.
8. **Alt text siempre.** En toda pieza con imagen. No es opcional y no se autogenera con adjetivos.
9. **Los claims pendientes no se publican.** Una pieza con `⏸️ PENDIENTE APROBACIÓN` de ④ no entra al
   archivo de carga, aunque el archivo esté listo.
10. **La hora se elige con dato o se declara que no lo hay.** Si no hay métricas de la cuenta, se usa
    la hora que ③ indicó y se marca `⚠️ SIN DATOS` — **no se inventa la «mejor hora»**.
11. **Nada se sube dos veces.** Antes de cargar se verifica que el ciclo anterior no dejó filas en
    `cargado` sin publicar.
12. **Lo que se publicó se verifica mirándolo.** No se da por publicado porque Publer dijo que sí.

---

## 6 · El flujo — 7 capas

```
RECIBIR      Capa 0      ¿Qué llegó y está realmente publicable?
PREPARAR     Capas 1-2   El caption que entra y el archivo que cumple
AGENDAR      Capas 3-4   Cuándo sale y en qué archivo se carga
                 ↓
CERRAR       Capa 5      ¿Salió y se ve bien?
LOOP         Capa 6      ¿Qué se cayó, qué llegó tarde?
```

> **El valor del departamento está en la Capa 0 y en la Capa 2.** Todo lo que se detecta ahí se
> arregla en una hora; lo mismo detectado después de publicar no se arregla nunca.

### Capa 0 · RECEPCIÓN — ¿qué llegó y está publicable?
**Skill:** `po-recepcion` · **Output:** las filas base de `calendario-de-publicacion.csv`

Cruzar `plan-de-contenido.csv` de ④ **fila por fila** contra lo que entregaron ⑥A y ⑥B. Lo primero
es **separar las dos rutas por el `canal`**: lo que va a Publer y lo que va por email. Después, cada
fila con lo que necesita se convierte en fila de publicación; lo que falta **se declara**.

| Chequeo | Ruta | Si falla |
|---|---|---|
| La pieza tiene su **archivo final**, con ruta | social | `⚠️ SIN ARCHIVO` — se nombra a quién pedírselo |
| El archivo corresponde al `id_creativo` correcto | social | ↩️ **DEVUELTO** a ⑥A / ⑥B |
| La pieza tiene **copy y caption** en su `ideas-<formato>.md` | ambas | ↩️ **DEVUELTO** a ④ |
| La pieza **no tiene claims pendientes** | ambas | 🛑 No entra al ciclo hasta que ②B o ⑧B la validen |
| Existe la **cuenta** donde va y sabemos quién tiene las claves | social | 🛑 **BLOQUEADO** — ① § La capacidad |
| Existe la **lista o segmento** y la herramienta de email | email | 🛑 **BLOQUEADO** — ① § La capacidad |

> 🛑 **Una pieza de email está completa sin export de ⑥.** Su cuerpo lo escribió ④; ⑥A solo entra si
> la pieza lleva imágenes. Marcarla `⚠️ SIN ARCHIVO` porque no hay video es un falso bloqueo, y
> retrasa un envío que se podía mandar.

### Capa 1 · CAPTION — ¿qué texto sale?
**Skill:** `po-caption` · **Output:** el caption de cada sección de `publicaciones.md`

El copy de ④ se adapta al largo y a la forma de cada plataforma **sin cambiar el mensaje**.

```
Línea 1    EL HOOK          antes del corte. Es lo único que se lee sin tocar "… más"
Cuerpo     EL VALOR         lo que ④ escribió, acomodado a la plataforma
Cierre     EL CTA           el de ④, según la etapa — no "comprá" por default
Al final   LOS HASHTAGS     los que corresponden, no los que caben
```

> 🛑 **Si el hook quedó después del corte, el caption está mal escrito.** No es un detalle de estilo:
> es la diferencia entre que se lea y que no.

### Capa 2 · SPECS — ¿el archivo cumple?
**Skill:** `po-specs` · **Output:** columna `specs_ok` + el bloque de QA de cada sección

Aspecto, duración, peso, safe zones, límite de caracteres, cantidad de hashtags y **alt text**.
Lo que no cumple **se devuelve a ⑥A o ⑥B** — 🛑 **nunca se arregla acá**.

### Capa 3 · PROGRAMACIÓN — ¿cuándo y dónde exactamente?
**Skill:** `po-programacion` · **Output:** columnas `cuenta`, `fecha`, `hora`

④ fijó el día. Acá se fija **la hora y la cuenta**, y se verifica que dos piezas de la misma cuenta
no se pisen el mismo día.

> 🛑 **La «mejor hora» no se inventa.** O sale de las métricas de la cuenta, o se usa la de ③ y se
> marca `⚠️ SIN DATOS`.

🚦 **GATE 1 — los captions.** Antes de armar el archivo de carga. Es lo que aprueba el cliente.

### Capa 4 · CARGA — ¿qué se sube y cómo?
**Skill:** `po-carga` · **Output:** `publer-import.csv` + § Los envíos de email + los checklists

**Ruta social:** se genera el archivo con las 12 columnas de Publer, se resuelven las **URLs
públicas** de cada media y se deja el checklist de qué verificar **dentro de Publer** antes de
apretar programar.

**Ruta email:** se arma el paquete de envío —asunto, preheader, cuerpo, lista o segmento, fecha y
hora— en `publicaciones.md`, agnóstico de herramienta, con su propio checklist.

🚦 **GATE 2 — el paquete de carga.** 🛑 **Acá para el departamento.** Un humano revisa, sube y
programa. Nada se publica desde el repo.

### Capa 5 · VERIFICACIÓN — ¿salió y se ve bien?
**Skill:** `po-verificacion` · **Output:** columna `estado` + § Verificación de `publicaciones.md`

Después de que sale: **se mira la publicación real.** Que esté, que se vea bien en móvil, que el
link funcione, que el caption no se haya cortado raro, que esté en la cuenta correcta.

> 🛑 **No se da por publicado porque Publer dijo que sí.** Una publicación fallida que nadie miró es
> una pieza que el cliente descubre antes que nosotros.

### Capa 6 · LOOP — ¿qué se cayó y por qué?
**Skill:** `po-loop` · **Output:** `aprendizaje-de-posting.md`

**Las cuatro lecturas:** qué no llegó a tiempo y de dónde venía · qué se devolvió y por qué ·
qué falló al publicar · cuánto tardó cada aprobación.

> **Si el 30 % de las piezas llega tarde, el problema no está en Posting:** está en las fechas de
> preparación de ③ o en los tiempos de ⑥. Eso se devuelve **como dato, no como reclamo**.

---

## 7 · Antes de arrancar — pre-flight

```
PRE-FLIGHT — Cliente: [x] · Capa: [0-6] · Ciclo: [x]
④ Creatividad: Excel con Gate 3 [✅/⬜] · filas del ciclo: [n]
⑥A entregó: [n/n] · ⑥B entregó: [n/n] · ⚠️ SIN ARCHIVO: [n]
②B Branding [✅/⬜] · ① cuentas y accesos [✅/⬜] · claims pendientes: [n]
→ PASS | BLOQUEADO: [qué falta exactamente]
```

**Se bloquea si:** no hay cliente · no existe su carpeta · falta el Excel de ④ con Gate 3 · no
sabemos quién tiene las claves de las cuentas · hay claims sin validar en las piezas del ciclo.

### Modos de entrada

| Pedido | Qué corre |
|---|---|
| *"Dejá listo el mes de X"* / *"programá el ciclo"* | **Completo** — Capas 0 → 4, con 2 gates |
| *"¿Qué nos falta para publicar?"* | Solo Capa 0 |
| *"Escribí los captions"* | Capas 1-2 — requiere Capa 0 |
| *"Armá el archivo de Publer"* | Capa 4 — requiere Gate 1 |
| *"¿Salió todo?"* | Solo Capa 5 |
| *"¿Qué se cayó este mes?"* | Solo Capa 6 |

### La carpeta del cliente

```
clients/<cliente>/
├── _INPUTS/                        # accesos, métricas de la cuenta, plantilla vigente de Publer
├── publicaciones.md                # ← ENTREGABLE · para quien aprueba
├── publer-import.csv               # ← ENTREGABLE · para quien carga · solo la ruta social
├── calendario-de-publicacion.csv   # trabajo interno · una fila por publicación, 12 columnas
└── aprendizaje-de-posting.md       # trabajo interno · el cierre del ciclo
```

El nombre de la carpeta es **el mismo nombre canónico** que en `agents/comprension/clients/`.
🛑 **Nunca se duplica un archivo de otro departamento: se cita su ruta.**
🛑 **Los archivos de video y diseño no viven en el repo.** Viven en Drive; acá va su ruta y su URL.

---

## 8 · El handoff

```markdown
## HANDOFF — ⑦ Posting → ⑧A Orgánico / ⑧B Ads
- Cliente: · Campaña(s): · Ciclo: · Fecha:
- Entregables: publicaciones.md (aprobación) · publer-import.csv (carga)
- Gates: captions [✅/⬜] · paquete de carga [✅/⬜]
- Ruta social: en el archivo [n] · cargadas en Publer [n] · publicadas [n] · verificadas [n]
- Ruta email: envíos preparados [n] · enviados [n] · herramienta: [x o ⚠️ SIN DATOS]
- Filas SIN ARCHIVO: [n + de quién se esperaba]
- Devueltas a ④ / ⑥A / ⑥B: [n + motivos]
- Claims que quedaron ⏸️ sin publicar: [lista]
- Cuentas y horarios usados: [lista] · hora con dato [n] / ⚠️ SIN DATOS [n]
- Piezas marcadas para pauta: [lista de id_creativo] → ⑧B
- Confianza: 🟢 / 🟡 / 🔴
```

- Una fila `pendiente` **no se carga.** O se completa, o sale del ciclo y se declara.
- **El archivo de carga es la interfaz.** Si quien sube tiene que preguntar algo, el paquete estaba
  incompleto — y eso se corrige en el paquete, no por chat.

---

## 9 · Devoluciones

Los **5 motivos válidos**, y solo esos:

| # | Motivo | Vuelve a | Cómo se detecta |
|---|---|---|---|
| 1 | **Falta el archivo final** *(solo ruta social)* | ⑥A / ⑥B | La fila de ④ no tiene export correspondiente |
| 2 | **El archivo no cumple la spec** | ⑥A / ⑥B | Aspecto, duración o peso fuera de lo que acepta la plataforma |
| 3 | **El archivo no corresponde** | ⑥A / ⑥B | El `id_creativo` del nombre no coincide con la fila |
| 4 | **No hay copy o caption** | ④ | La pieza llegó descrita, no escrita |
| 5 | **El mensaje no entra sin romperse** | ④ | Recortarlo para que entre le sacaría el hook o el CTA |

**Toda devolución lleva tres cosas:** qué no se puede, **en términos verificables** · qué se
rompería si lo adaptáramos por cuenta propia · **al menos dos alternativas** concretas.

**Lo que NO es una devolución:**

| Situación | Qué es en realidad | A dónde va |
|---|---|---|
| Las piezas llegan sistemáticamente tarde | Problema de calendario | **③ Marketing**, vía Capa 6 |
| Un claim no está aprobado | Falta una validación | **②B Branding** o **⑧B Ads** |
| No tenemos acceso a la cuenta | Restricción de acceso | **① Comprensión** § La capacidad |
| El cliente quiere cambiar el copy | Cambio de mensaje | **④ Creatividad** decide, no Posting |

---

## 10 · Convenciones

| Marca | Significado |
|---|---|
| 🟢 | Listo — archivo, caption y specs verificados |
| 🟡 | Falta algo menor, identificado y con responsable |
| 🔴 | No sale este ciclo |
| ⚠️ SIN ARCHIVO | La pieza no tiene export. Se nombra de quién se espera. 🛑 No aplica a la ruta email |
| ⚠️ SIN DATOS | Falta el dato — típicamente la hora óptima de la cuenta |
| ⏸️ PENDIENTE APROBACIÓN | Claim, precio o promesa sin validar. **No se carga** |
| ↩️ DEVUELTO | Vuelve a ④, ⑥A o ⑥B, con motivo y alternativas |
| BLOQUEADO | No se puede avanzar. Se nombra qué desbloquea |

**Cómo responde:** español, con los términos de plataforma fijos (`CAPTION`, `ALT TEXT`, `SAFE ZONE`,
`FEED`, `REEL`, `STORY`, `CAROUSEL`, `HANDLE`). Tablas y bullets. Lo accionable arriba: **qué falta
para poder cargar.** Toda fecha con hora y zona horaria.
