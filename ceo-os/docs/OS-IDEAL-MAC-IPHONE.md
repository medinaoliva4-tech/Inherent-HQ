# Inherent OS · la versión ideal para Mac y iPhone

> **Para Fable.** Esto no describe lo que el OS es hoy. Describe **cómo debería verse, sentirse
> y funcionar si lo diseñáramos desde cero** para un Mac y un iPhone. Si algo de lo que ya existe
> estorba, se cambia. Botones, subpáginas, pantallas, nombres: todo se puede mover.
>
> **Lo único que no se mueve** son los cimientos de la empresa (§ 1). Todo lo demás es terreno libre.

---

## 0 · Cómo usar este documento

1. **Lee § 1 y § 2.** Son la idea y los límites. Sin ellos, el resto se vuelve un panel más.
2. **§ 3 y § 4** definen las dos plataformas y las piezas que se repiten en todas las pantallas.
3. **§ 5 recorre cada área**, con su versión Mac, su versión iPhone, sus botones y su toque mágico.
4. **§ 6** son los rituales: los momentos del mes en los que el OS tiene que brillar.
5. **§ 8** es el orden para construirlo. **§ 9** son las pocas decisiones que sí son del CEO.

**Cómo está escrito cada área:** *Para qué existe · En Mac · En iPhone · Botones y subpáginas ·
Lo mágico.* Donde dice «agente», es uno de los nueve del roster (`agents/README.md`).

---

## 1 · Lo que no cambia (los cimientos)

Si una idea de este documento choca con esto, **gana esto**.

- **El alcance contratado es el techo.** Sin ficha de oferta, esa marca queda bloqueada. El OS lo
  muestra como un candado claro, nunca como un error.
- **El CEO solo bloquea en dos lugares:** ① Strategy *(aprueba la estrategia)* y ⑧ Ads *(plan,
  presupuesto y cada cambio de presupuesto)*. Todo lo demás fluye.
- **El cliente nunca ve** costos, márgenes, horas, notas internas ni nada de otro cliente.
- **Nada destructivo sin OK.** El OS no gasta dinero, no borra *(archiva)* y no publica sin aprobar.
- **Evidencia o etiqueta.** Sin dato, dice `⚠️ SIN DATOS` y de dónde saldría. **Nunca un cero inventado.**
- **Español, de «tú».** Sin jerga. Un término técnico se explica en una frase.
- **El CEO tiene TDAH.** Lo accionable arriba, **una cosa a la vez**, mensajes mínimos, sin muros
  de texto. Esto no es una preferencia de estilo: es el requisito de diseño número uno.
- **Roles, no nombres.** Las pantallas hablan de CEO, COO, Operador, Editor… no de personas.
- **Seguridad por rol en el servidor.** La pantalla solo refleja lo que el servidor ya decidió.

---

## 2 · La idea madre: el OS late con el ciclo

Inherent trabaja en un ciclo de contenido **del día 1 al 20 de cada mes**:
`1 reunión · 1-3 plan · 2-3 calendario y shot list · 3-6 guidelines · 4-5 coordinar · 6-10 producir ·
11 último día para producir · 12-15 montar · 16-19 cambios y programación · 20 presentación al cliente`.
Lo presentado el 20 se publica desde el día 1 del mes siguiente.

**Hoy el OS es un tablero que muestra cosas. El ideal es un reloj que sabe en qué día del ciclo
estás y te lleva a lo único que importa hoy.**

### Tres preguntas, siempre las mismas

Cada pantalla del OS, en cualquier plataforma, responde en 10 segundos:

| Pregunta | Qué se ve |
|---|---|
| **¿Qué está pasando?** | El estado real, con su fuente. Sin adornos |
| **¿Qué sigue?** | La siguiente acción, un solo botón grande |
| **¿Qué me toca decidir?** | Solo lo que pide una persona: aprobar, corregir, escalar |

### El pulso

- **Una franja del ciclo** *(1 → 20)* vive arriba en Hoy y en cada marca. Un punto marca «hoy»,
  y los hitos que no se pueden mover *(11 y 20)* son más gruesos.
- Si vas **a tiempo**, la franja es discreta. Si algo **se desliza hacia el 11 o el 20**, la franja
  cambia de color *(ámbar, nunca rojo gritón)* y dice **qué** y **de quién**.
- El OS **se reordena según el día**: el día 6 prioriza producción; el 12, montaje; el 19,
  programación; el 20, la presentación. **Nadie busca nada: lo que toca hoy ya está arriba.**

### La regla del excepcionismo

Los agentes **levantan excepciones, no preguntas**. El OS lo traduce en una cosa simple:
**la bandeja «Decide»** (§ 4.2). Si el agente pregunta todo, no ahorra nada. Si el OS la llena de
ruido, falló.

---

## 3 · Las dos plataformas

> **Mismo OS, dos instrumentos.** El Mac es el **taller**: se crea, se compara, se corrige a fondo.
> El iPhone es el **bolsillo**: se decide, se responde, se captura y se está tranquilo.
> **Ninguno es una versión recortada del otro.** Cada uno hace mejor lo suyo.

### 3.1 · Mac — el taller

**Forma:** app nativa de Mac *(no una página en una ventana)*. Ventana principal + ventanas
sueltas + icono en la barra de menú.

- **Barra lateral** colapsable, con las secciones del día a día arriba y lo raro *(Conexiones,
  Ajustes)* abajo junto a tu cuenta. Muestra un **número solo cuando algo te espera a ti**.
- **Paleta de comandos `⌘K`** — la puerta de todo. Escribes «Akai cotización» y llegas; escribes
  «aprobar» y ves lo que espera tu OK. Entiende lenguaje normal, no solo nombres de pantalla.
- **Panel derecho contextual** *(`⌘⌥I`)* — en cualquier pantalla se abre el chat de **esa** pantalla:
  ya sabe qué marca, qué pieza y qué día del ciclo es. No hay que «ir al chat».
- **Vista rápida con barra espaciadora**, como el Finder: sobre cualquier pieza, entregable o
  documento, espacio la abre en grande sin salir de la lista.
- **Arrastrar y soltar de verdad:** un video del Finder a una tarea; una tarea al calendario;
  una idea a una campaña; un correo a un lead.
- **Atajos de teclado** para todo lo repetido: `A` aprobar, `C` pedir cambios, `E` escalar,
  `J/K` moverse, `⌘↩` enviar. Siempre visibles en un chip al pasar el cursor.
- **Barra de menú:** el icono muestra el día del ciclo y un punto si algo te espera. Un clic
  abre un mini-panel: **«Decide»** (3 cosas máximo) y un campo de texto para hablarle al OS.
- **Widgets de escritorio y Centro de notificaciones:** «Hoy», «Decide», «Ciclo 1→20».
- **Spotlight y Atajos de Apple:** «Pregunta a Inherent…», «Aprueba la pieza de Akai»,
  «Nueva tarea para Cerantola» desde cualquier lugar del sistema.
- **Touch ID** para las acciones graves: aprobar presupuesto de pauta, ver Finanzas, salir de un
  modo privado.
- **Ventanas sueltas:** el Calendario, el Chat y una marca pueden vivir en su propia ventana,
  una por monitor. Se recuerdan al reabrir.
- **Modo concentración:** `⌘⇧F` deja solo lo que toca hoy; todo lo demás se atenúa.

### 3.2 · iPhone — el bolsillo

**Forma:** app nativa *(o, como mínimo, una web instalable que se sienta nativa)*. Una mano, pulgar.

- **Barra inferior de 5 puertas:** **Hoy · Decide · Chat · Calendario · Más.** Nada más. Lo demás
  vive dentro.
- **Todo lo importante está al alcance del pulgar:** botones primarios abajo, nunca arriba.
- **Gestos:** deslizar a la derecha = **aprobar**; a la izquierda = **pedir cambios**; mantener
  presionado = **vista previa y acciones**; jalar hacia abajo = **actualizar con el estado real**.
- **Dynamic Island y Live Activities:** el ciclo vive ahí. En rodaje: el cronómetro de la
  jornada. En pauta: el gasto del día contra el tope. En «Decide»: cuántas esperan.
- **Notificaciones con acción directa:** «Pieza de Akai lista» → *Aprobar · Cambios · Ver*, **sin
  abrir la app.** Con Face ID cuando es grave.
- **Widgets en la pantalla de inicio y de bloqueo:** «Decide (2)», «Día 14 del ciclo», «Próximo
  rodaje en 3 h». Un toque y estás en lo que importa.
- **Botón de Acción y Siri:** «Oye Siri, agrega una nota a Cerantola» · «¿qué me toca hoy?» ·
  «Aprueba la estrategia de NAO» *(pide Face ID)*.
- **Hoja de compartir:** desde Fotos, Safari, WhatsApp o Notas → «Mandar a Inherent»: llega como
  referencia a una marca, como material crudo o como lead. **Cada cosa llega al lugar correcto.**
- **Cámara y micrófono como herramientas, no como adornos:** en rodaje se captura directo a la
  tarea; una nota de voz se vuelve una tarea o un brief.
- **Haptics con sentido:** un tap suave al aprobar; uno doble al escalar; ninguno en lo trivial.
- **Modo sin conexión:** lo de hoy y lo de rodaje se pueden leer y capturar sin señal; sube solo
  cuando vuelve la red, con un indicador claro de «pendiente de subir».

### 3.3 · Lo que SOLO hace cada plataforma

| Solo en Mac | Solo en iPhone |
|---|---|
| Comparar dos versiones lado a lado | Aprobar con un deslizamiento |
| Editar la estrategia, las fichas, las recetas | Capturar material en rodaje y notas de voz |
| Trabajar con el Chat de capacidades (Código, Figwright, imágenes) | Responder un DM o una duda de equipo en 5 segundos |
| Ver tablas grandes y el calendario completo | Ver «qué me toca» con un vistazo en bloqueo |
| Arrastrar archivos del Finder | Llamar o abrir WhatsApp de un lead con un toque |
| Preparar la presentación del día 20 | **Presentar** el día 20 desde una pantalla o AirPlay |

---

## 4 · Las piezas que se repiten (el lenguaje común)

Estas piezas existen **una sola vez** y se reusan en todo el OS. Si el OS tiene diez maneras de
hacer lo mismo, está mal.

### 4.1 · La tarjeta de entregable

Todo trabajo que sale de un agente o de una persona es **un entregable** con la misma cara:

- **Quién lo hizo** *(agente o rol)* y **de dónde viene** *(el nodo del hilo del que sale)*.
- **Estado:** `Borrador · Para revisar · Aprobado · Cambios pedidos · Publicado`.
- **Su ficha de criterios** *(`inherent/08-CRITERIOS-DE-ACEPTACION.md`)* como una **lista de
  verificación visible**: cada criterio tiene un check *(cumple / falta)*. **No se puede pasar a
  «Listo» con un criterio en falta**; el botón dice cuál.
- **Tres botones, siempre los mismos:** **Aprobar · Pedir cambios · Escalar.**
- **Historial** de versiones, con «ver qué cambió» *(diferencia visual, no una lista de cambios)*.

### 4.2 · «Decide» — la bandeja del CEO y del COO

La pieza más importante del OS. **No es una lista de tareas: es lo que solo tú puedes resolver.**

- Cada tarjeta tiene **la decisión en una frase**, lo que está en juego, la recomendación del
  agente y **dos botones grandes**. Sin tablas, sin contexto de más. *«Detalle»* lo abre si lo pides.
- **Se ordena por el reloj del ciclo:** lo que bloquea el día 11 o el 20 sube.
- **Solo muestra** lo que tu rol decide: precio, alcance y fechas → CEO; lo demás → COO.
- **Una decisión a la vez** en iPhone: pantalla completa, deslizar para decidir, siguiente.
- Cuando la bandeja está vacía dice algo humano: **«Nada espera por ti. Disfruta.»**

### 4.3 · El hilo del cliente

Lo que viaja entre áreas no son hojas de cálculo: son **nodos** con estado (`hipótesis` o
`aprobado`) y de dónde vienen. En el OS esto se ve como **un mapa vivo por marca**:

- Producto → Cliente ideal (ICP) → Dolores y deseos → Historia → Adquisición → Brief → piezas.
- Cada nodo muestra su estado. **Un nodo en `hipótesis` se ve distinto de uno `aprobado`.**
- **Si cambias un nodo, los de abajo se marcan** «a revisar» con un aviso. El cambio se propaga
  a la vista, no solo a la base de datos.
- Tocar una pieza muestra **su camino hasta el ICP**: *«esta pieza existe por este dolor de este
  cliente ideal»*. **Lo que no traza hasta el ICP no se produce.**

### 4.4 · Los estados vacíos enseñan

Una pantalla sin datos **no está vacía**: dice qué es, de dónde van a salir los datos y qué hacer
primero. Con un botón. Nunca un cero, nunca «No hay resultados».

### 4.5 · El selector de marca

Casi todo se hace **dentro de una marca**. Un selector único arriba *(Mac)* o en la cabecera
*(iPhone)* cambia el contexto de toda la app. Atajo: `⌘1…9`. **Cada marca tiene un color y un
monograma** para reconocerla de reojo. Cambiar de marca nunca deja datos de la anterior en pantalla.

### 4.6 · El chat de cada pantalla

Toda pantalla tiene **un asistente a un toque** que ya sabe dónde estás. Mac: panel derecho.
iPhone: una hoja que sube desde abajo. Tiene **chips de acciones rápidas** según el contexto
*(«resumir el ciclo», «qué falta para el día 11», «redactar respuesta»)*.

### 4.7 · Estados del sistema, honestos

Cada conexión *(Zernio, Drive, Figma, Meta)* tiene un **semáforo discreto**: lista / sin
conexión / necesita permiso. **Si algo no está conectado, el OS lo dice y no finge hacerlo.**
Esto aplica sobre todo a promesas: *un MCP declarado no es un MCP conectado.*

---

## 5 · Área por área

> Orden de lo que ves al abrir el OS. Cada área dice **para qué existe**, **cómo es en Mac**,
> **cómo es en iPhone**, **sus botones y subpáginas** y **su toque mágico**.

### 5.1 · Hoy

**Para qué existe.** Tu día en una pantalla. Responde: *¿qué toca hoy?*

**En Mac.** Una sola columna central, ancha pero no densa:
1. **La franja del ciclo** (1→20) con «hoy» marcado.
2. **Decide** — hasta 3 tarjetas.
3. **Lo que toca hoy**, agrupado por marca, ordenado por el reloj del ciclo.
4. **Lo que se está moviendo solo** — qué hicieron los agentes ayer, en una línea cada uno.
5. **Indicadores** que solo usan datos reales *(ver § 5.20)*.

**En iPhone.** La misma lógica en una sola columna con scroll corto: franja, **Decide**, «Lo que
toca». Un botón flotante **«+»** abajo a la derecha para capturar *(nota, foto, voz, lead)*.

**Botones y subpáginas.**
- **Empezar el día** — el OS lee tu día en voz alta *(texto o audio)*: «Hoy es día 14. Hay 2
  piezas por aprobar de Akai y una cotización de Cerantola esperando fecha.»
- **Cerrar el día** — resume lo hecho, lo que quedó, y propone lo de mañana.
- **Posponer** en cada tarjeta *(hoy · mañana · el lunes)*.
- **Subpágina «Semana»** — vista de 7 días con la carga de cada uno.

**Lo mágico.** **El OS te dice qué no hacer hoy.** Si algo puede esperar sin romper el 11 o el 20,
lo aplaza con una frase: *«Esto puede esperar al jueves.»* Un OS que ordena le quita ansiedad al
CEO; uno que solo lista se la suma.

---

### 5.2 · Chat (Inherent LLM)

**Para qué existe.** Hablar con la empresa. Un solo chat, **no un chat por herramienta**.

**En Mac.**
- **Centro:** la conversación, centrada, limpia, tipo ChatGPT o Claude: lo tuyo en una burbuja
  suave a la derecha; la respuesta sin burbuja, con el avatar del agente.
- **Izquierda:** proyectos *(carpetas por cliente)* y conversaciones recientes.
- **Derecha (se abre cuando hace falta):** el panel de trabajo — tareas, cambios, archivos,
  terminal y vista previa; o una pieza del Hilo que la conversación está tocando.
- **Debajo de la caja:** la **barra de capacidades** — *Código · Figwright · Imágenes · Radar ·
  Video · Herramientas.* Cada chip dice si está **lista, sin conexión o apagada**, y por qué.
- **Selector de equipo**, no de modelo: *Auto* (cocina por tarea) · *Planifica fuerte, ejecuta
  barato* · *Todo rápido* · *Máxima calidad.* **El modelo es un detalle; el equipo es la decisión.**
- **Escribir `@`** invoca un agente por su nombre de área: `@strategy`, `@community`, `@ads`.

**En iPhone.**
- **Una pantalla, una conversación.** La lista de conversaciones es una hoja que se jala desde el
  borde izquierdo. Las capacidades viven en un menú compacto **encima del teclado**.
- **Dictado de primera clase:** un botón de micrófono grande. Mantenlo y habla; suéltalo y se
  envía. Para el CEO, **hablar es más rápido que escribir** y debe sentirse como tal.
- **La cámara es una entrada:** apunta a un producto, un cartel, un recibo → entra al chat con
  contexto de la marca activa.
- **Respuestas largas se pliegan:** primero la conclusión en dos líneas, y «Ver todo».

**Botones y subpáginas.**
- **Nuevo chat · Nuevo proyecto · Mover a carpeta.**
- **Tarjeta de gasto:** cuando algo cuesta *(una imagen, una corrida de scraping)*, se muestra
  **«Cuesta $X · necesita tu OK»** con **Aprobar $X / No**. Nunca un «siempre» automático.
- **Detener · Reintentar · Editar y reenviar.**
- **Modo privado** — nada se guarda y se usa un modelo local.
- **Continuar en otro dispositivo:** empiezas en Mac, sigues en iPhone en el mismo punto.

**Lo mágico.** **Las capacidades se prenden solas por intención** *(«entra a Figma…» prende
Figwright; «genera una imagen» prende Imágenes)*, **avisan en una línea**, y si no están listas lo
dicen y ofrecen la alternativa. **El chat nunca finge haber hecho algo que no pudo.**

---

### 5.3 · Agentes

**Para qué existe.** Ver al equipo de agentes trabajar, **sin tener que vigilarlos.**

**En Mac.**
- **Una vista tipo «línea de producción»:** las 9 áreas de izquierda a derecha, con lo que cada
  una tiene en la banda *(ahora haciendo · esperando a una persona · bloqueado)*. Un vistazo dice
  dónde se atoró el ciclo.
- Tocar un agente abre su **Resumen** *(qué entrega según el nivel de esa marca)*, su **Flujo**
  *(los pasos de su `WORKFLOW.md`, con el actual resaltado)*, sus **Trabajos** y su **Configuración**.
- Cada paso muestra **qué decide la persona** *(la sección «Lo que decide la persona» de las skills)*.

**En iPhone.**
- Una lista corta: **nombre, estado en una palabra, un punto de color.** Tocas y ves el último
  entregable y un botón **«Revisar»** si te espera.
- **Notificaciones de excepción únicamente:** *«⑥ Community: escaló una queja»*. Nada de «terminé».

**Botones y subpáginas.**
- **Correr ahora · Pausar · Reanudar** por agente.
- **Bloqueado → «Ver qué falta»:** la recepción dice si falta la ficha de oferta, un nodo
  `aprobado`, un archivo o una cuenta, y **de quién**. **Un botón avisa a esa persona.**
- **Modo borrador / modo activo** para Community y Posting, con un interruptor claro y una
  semana de prueba visible.

**Lo mágico.** **Cada agente tiene una voz y una cara breve en el OS** — no un robot genérico: el
estratega, la secretaria de WhatsApp, el guardián de marca. La persona entiende **a quién** le está
pidiendo qué.

---

### 5.4 · Calendario

**Para qué existe.** Tener **el ciclo y el contenido en un solo lugar.**

**En Mac.**
- Tres vistas por pestaña: **Ciclo** *(1→20, por marca, con hitos)* · **Contenido** *(lo que se
  publica, con la pieza visible en cada casilla)* · **Equipo** *(rodajes, reuniones, fechas)*.
- **Arrastrar una pieza** a otro día re-programa; el OS avisa si choca con el 11 o el 20.
- **Overlay del ciclo:** las barras del 1→20 sobre el mes real, para ver **si el mes cabe.**
- Ajusta cada mes al calendario real **respetando 11 y 20**: se ven como líneas firmes.

**En iPhone.**
- **Día / Semana / Agenda.** La agenda es la reina: una lista del día con la hora y el qué.
- **Mantener presionado** un evento → *Mover · Aprobar · Abrir.*
- **Widget** de «Próximo rodaje» y del hito más cercano.

**Botones y subpáginas.**
- **Nuevo rodaje** *(abre la jornada con call sheet y shot list)* · **Nueva reunión** · **Nueva fecha límite.**
- **Sincronizar con Google Calendar.**
- **Exportar** una semana *(PDF o enlace)*.

**Lo mágico.** **«Cuánto cabe.»** Al arrastrar piezas al calendario, una barra muestra el
**volumen contratado vs. lo programado**. Si te pasas, avisa; si faltas, avisa. **El techo
comercial se vuelve visible sin que nadie lo recuerde.**

---

### 5.5 · Proyectos

**Para qué existe.** Ver en qué está cada proyecto y quién lo mueve.

**En Mac.** Tablero **por etapas del pipeline** *(las 9 áreas)* para cada marca; una fila por
marca, columnas por etapa. Una tarjeta es una pieza o un entregable. Arrastrar mueve de etapa **si
cumple los criterios**; si no, el OS dice cuál falta.

**En iPhone.** Lista de proyectos con una **barra de progreso del ciclo** debajo de cada uno.
Entras a una marca y ves las etapas como una **línea vertical**; la actual brilla.

**Botones y subpáginas.**
- **Activar paquete** *(desde la ficha de oferta, arma el ciclo mensual con las áreas que toca)*.
- **Crear proyecto a medida** · **Duplicar ciclo** · **Archivar** *(nunca borrar)*.
- **Subpágina «Qué falta»:** lo que impide que la marca avance, con responsable.

**Lo mágico.** **La salud de una marca se ve de un golpe:** un solo color por marca *(en camino ·
atención · trabado)* y, al tocarlo, **la causa en una frase**.

---

### 5.6 · Tareas

**Para qué existe.** Que cada persona sepa qué es suyo, hoy.

**En Mac.** Lista con **tres vistas** *(Hoy · Semana · Por marca)* y, a la derecha, el detalle de la
tarea con su SOP **embebido** *(no un enlace)*. **`⌘↩` completa.** **Arrastrar** un archivo la
adjunta.

**En iPhone.** Una lista simple con **deslizar para completar.** Si la tarea es de rodaje, abre
**la cámara con la shot list de esa escena.**

**Botones y subpáginas.**
- **Tipo** *(Delivery · Comercial · Interna · Personal)*; **Personal** solo la ve quien la creó.
- **Dependencias visibles:** «esperando a ④ Producción».
- **Reasignar con razón:** al reasignar pide una línea de contexto.
- **Subpágina «Mis perfiles»:** si tienes varios *(COO, Operador…)*, cambias de perfil y la lista cambia.

**Lo mágico.** **Una tarea que lleva un SOP se vuelve guiada:** el SOP aparece **como pasos
marcables en la propia tarea.** La persona nunca busca «cómo se hacía esto».

---

### 5.7 · CRM / Ventas

**Para qué existe.** **Responder en un minuto** y no perder a nadie.

**En Mac.** Pipeline por etapas *(Nuevo · Conversando · Cotizado · Cerrado · Perdido)*, con **el
tiempo de respuesta** como indicador principal. Cada lead tiene su **historial unificado** *(WhatsApp,
correo, llamadas, cotizaciones)* y **su caso en tres líneas**: *qué quiere, qué está en juego,
qué falta*.

**En iPhone.** **Una bandeja de leads** ordenada por «hace cuánto sin respuesta». Cada tarjeta:
**Llamar · WhatsApp · Responder con el agente.** El cronómetro del primer contacto es visible.

**Botones y subpáginas.**
- **Primera respuesta:** el agente propone el mensaje con el guion de la primera conversación
  *(entender el caso → ver lo que está en juego → entonces el precio, con el alcance delante)*.
- **Hablemos:** botón que abre conversación y **crea el lead solo.**
- **Cotización:** arma la propuesta **con el alcance primero y el precio después.** Nunca
  precio solo. Exporta a PDF.
- **Motivo de pérdida** obligatorio al cerrar como perdido.
- **Subpágina «Fuentes»:** de dónde vienen los leads *(web, referidos, captura con Zernio, Maps, LinkedIn)*.

**Lo mágico.** **El temporizador del primer contacto** — un anillo que se llena en 60 segundos.
Si la promesa es «respuesta en un minuto», **el OS la hace visible y la mide.**

---

### 5.8 · Clientes y portal del cliente

**Para qué existe.** Un folder vivo por cliente — y **una ventana limpia para que el cliente se vea.**

**En Mac (lado Inherent).**
- **Ficha de marca:** nivel contratado, ficha de oferta, **el hilo** *(§ 4.3)*, el ciclo, las
  cuentas conectadas, los entregables y las métricas.
- **Onboarding guiado:** un asistente que lleva los pasos del día 1 *(la reunión, los accesos,
  los links, el brief)* y **muestra cuánto falta**.

**En iPhone (lado Inherent).** La ficha como **tarjetas verticales**: estado, próximo hito, lo que
espera del cliente. Un botón **«Mandar recordatorio al cliente»** que pasa por la secretaria.

**El portal del cliente** *(otra cara del mismo OS)*:
- **Lo que el cliente ve:** su calendario del mes, lo que se publica, lo que debe aprobar, sus
  métricas en lenguaje de negocio y la presentación del día 20.
- **Lo que NUNCA ve:** costos, márgenes, horas, notas internas, nada de otro cliente.
- **Aprobar desde el celular en 10 segundos:** el cliente recibe un enlace, ve la pieza, toca
  **Aprobar o Pedir cambios** con un comentario *(o nota de voz)*.
- **Sin cuenta ni contraseña en lo simple:** enlace firmado de un solo uso por aprobación.

**Botones y subpáginas.**
- **Invitar al cliente · Revocar acceso.**
- **Ficha de oferta** *(ver § 5.9)* con **«lo que quedó fuera»** siempre visible.

**Lo mágico.** **La presentación del día 20 se arma sola** *(ver § 6.5)*: el portal se vuelve la
presentación; el cliente puede seguirla desde su casa mientras tú hablas.

---

### 5.9 · Servicios y ficha de oferta

**Para qué existe.** **Que el techo sea visible y vendible.**

**En Mac.**
- **Catálogo de las 12 áreas**, con qué cae en cada nivel *(Foundation · Growth · Partnership)*.
- **Constructor de propuestas:** marcas las áreas necesarias, el OS arma **el alcance primero**,
  el precio después, con los factores *(canales, producción, ubicaciones, integración,
  responsabilidad de ejecución)*. **No existe un solo pipeline: existe uno por cliente.**
- **Ficha de oferta** por módulo: resultado, entregables exactos, volumen, revisiones, qué aporta
  el cliente, **qué queda fuera**, plazo, responsables, métricas.

**En iPhone.** **Una calculadora de bolsillo** para la llamada de venta: eliges nivel y áreas, ves
el alcance y la cotización sugerida. **Compartir** envía el PDF por WhatsApp.

**Botones y subpáginas.**
- **Guardar como ficha del cliente** *(la convierte en `plan-contratado`)*.
- **Subir de nivel** *(muestra el diagnóstico del cuello, no el catálogo)*.
- **Añadir módulo extra** *(el extra no lleva precio de lista, se cotiza)*.

**Lo mágico.** **El salto de nivel se vende con el diagnóstico.** Al lado de cada marca, el OS
dice **dónde está trabado el negocio** *(«llega gente y se pierde»; «funciona pero todo pasa por
el dueño»)* y **qué nivel resuelve eso.** Es la conversación de venta, ya escrita.

---

### 5.10 · Finanzas · 🔒 solo CEO

**Para qué existe.** **Saber qué queda**, sin abrir una hoja de cálculo.

**En Mac.**
- **Tres cifras arriba:** *Caja · Cobros por venir · Utilidad del mes.* Debajo, **el piso
  mensual** de la empresa y **cuántos clientes lo cubren**.
- **Por marca:** lo cotizado vs. lo que cuesta **por rubro y por rol**, el margen y el
  performance fee *(solo Growth Partnership con atribución limpia)*.
- **Cobros:** facturas, vencimientos, recordatorios, **un botón «Cobrar»** que lanza el mensaje.
- **Impuestos (SAT):** calendario de obligaciones con su estado.
- **Costos de terceros siempre aparte:** pauta, producción especial, talento, mentores arriba de $180.

**En iPhone.** **Face ID siempre.** **Una pantalla, una cifra grande:** la caja. Deslizas para ver
cobros y utilidad. **Notificación** cuando cobra alguien o vence algo. **Nada de tablas.**

**Botones y subpáginas.**
- **Registrar cobro · Registrar gasto** *(con foto del recibo → el agente lo clasifica)*.
- **Cerrar el mes** *(concilia, escribe la narrativa, actualiza el pronóstico)*.
- **Pronóstico 30/60/90** con bandas de confianza.
- **El CEO y el COO no son rubro:** cobran de la utilidad; sus horas se ven como **capacidad**.

**Lo mágico.** **«¿Cuántas cuentas más aguanto?»** Una pregunta con respuesta visual: con la
capacidad actual de cada rol, **cuántos clientes más caben antes de que alguien se queme**, y **qué
cuenta consume más de lo contratado** *(para cotizar extra o subir de nivel, nunca absorber)*.

---

### 5.11 · Estrategia (① Strategy)

**Para qué existe.** **La madre de todo:** producto → ICP → dolores → adquisición → brief.

**En Mac.**
- **El mapa del hilo** de la marca ocupa el centro. Cada nodo se abre en un **panel de trabajo**.
- **Panel del ICP:** el cliente ideal como **una tarjeta viva**, con sus dolores, deseos y su
  historia; a un lado, **las entrevistas y evidencias** de donde sale cada afirmación.
- **Calculadora de adquisición** *(outbound e inbound)*: sliders con el resultado en vivo.
- **Brief por área:** el entregable final, que se manda a los demás departamentos.
- **Pantalla de aprobación — GATE del CEO:** estrategia a un lado, **checklist de criterios** al
  otro, **Aprobar** o **Devolver con comentario.**

**En iPhone.** **Lo que importa es aprobar.** La estrategia como **resumen de 1 pantalla** + los
nodos clave; **Aprobar con Face ID**, o grabar **una nota de voz** con lo que quieres cambiar.

**Botones y subpáginas.**
- **Correr agente: Producto→ICP · Dolores e historia · Adquisición · Brief.**
- **Marcar nodo como `aprobado`.**
- **Subpágina «Evidencia»:** todo lo que dice el cliente, con la etiqueta `[dice el cliente, sin verificar]`.

**Lo mágico.** **Cada afirmación lleva su fuente al lado**, y las que no la tienen **se ven
marcadas** `⚠️ SIN DATOS`. **La estrategia no se aprueba a ciegas:** el CEO ve qué está probado y
qué es hipótesis.

---

### 5.12 · Marketing (③ Marketing y Creative)

**Para qué existe.** **El plan del ciclo, las ideas y el copy.**

**En Mac.**
- **Radar:** competencia y referentes — anuncios, TikTok, Instagram — en una **galería** con
  filtros por plataforma, recencia y rendimiento. **Sin plata gastada de más** *(mostrar el costo
  de scraping de cada corrida)*.
- **Pilares × ángulos:** una **matriz visual**; cada celda es un grupo de ideas.
- **Campañas con su copy:** hook, guion, estructura de reel o story. **Nada sin ICP detrás.**
- **El plan del mes:** el calendario de slots con los **volúmenes de la ficha como techo.**

**En iPhone.** **Inspiración + aprobación.** El Radar como **carrusel vertical** *(estilo feed)*;
**guardar** una pieza como referencia con un toque. Las ideas se **aprueban o descartan deslizando.**

**Botones y subpáginas.**
- **Correr radar** *(con tope de gasto visible)*.
- **«Quemar contenido»:** marcar lo ya usado para no repetir.
- **Generar variantes** de un hook *(3+ variantes)*.
- **Enviar a ④ Producción** · **Enviar a ⑤ Diseño.**

**Lo mágico.** **El Radar explica por qué algo funciona**, no solo lo muestra: *«Este reel de la
competencia sostiene 12 días porque abre con el dolor, no con el producto.»* Una frase, con la
evidencia, **para que la idea nazca de lo que ya se probó.**

---

### 5.13 · Branding y diseño (② y ⑤)

**Para qué existe.** **Que todo sea de marca, sin que nadie lo vigile.**

**En Mac.**
- **La guía de marca viva:** territorio, voz, paleta, tipografía, activos — **con valores
  ejecutables** *(hex, pesos, tamaños, safe zones)*, no solo imágenes bonitas.
- **El guardián:** cada pieza pasa por `br-guardian`; **el OS muestra qué regla pasó o falló**
  y devuelve **con la regla escrita, no con opinión.**
- **Borradores en Figma:** una vista previa de lo que Figwright armó; **«Abrir en Figma»** salta
  al archivo exacto.
- **Assets de imagen** *(texturas, recortes, ilustraciones)*: cada generación muestra **el costo
  antes**, pide OK y guarda el resultado con su cabecera.

**En iPhone.** **Revisar piezas** como un **feed**: ves el estático o el carrusel como se verá en
Instagram. Deslizas para aprobar; **mantén presionado para comentar sobre una zona de la pieza.**

**Botones y subpáginas.**
- **Validar claim** *(escribes una frase y el guardián dice si se puede decir)*.
- **Comparar versiones** *(Mac)*.
- **Exportar paquete de diseño** con el id de cada pieza.

**Lo mágico.** **Comentar sobre la pieza misma.** Tocas el lugar exacto del carrusel y escribes
*«más aire aquí»*; el comentario viaja **con coordenadas** al agente.

---

### 5.14 · Producción (④)

**Para qué existe.** **Rodar bien y rápido.**

**En Mac.**
- **La jornada:** call sheet, shot list, permisos, compras y presupuesto **en una sola pantalla.**
  **La unidad es la escena**, no la pieza: se ve que varias piezas comparten locación y luz.
- **Post:** primer corte y derivados. **Editor simple** con las plantillas; derivados con un clic.
- **Margen de rodaje** por ficha a la vista.

**En iPhone.** **El modo rodaje:** una pantalla para el set.
- **La shot list como lista tocable**; cada toma tiene **grabar, marcar buena, repetir.**
- **Cronómetro de la jornada** *(Live Activity)* contra las horas contratadas *(tiempo de cámara)*.
- **Captura directa** a la tarea; sube sola con wifi. **Funciona sin señal.**
- **Lista de compras y permisos** con checks.

**Botones y subpáginas.**
- **Iniciar jornada · Pausar · Terminar y subir.**
- **Marcar como «material crudo del cliente»** *(para multiplicar sin pasarse del monto de Grabación)*.
- **Pedir derivados** de un video *(mínimo 1 derivado por cada 2 planificados)*.

**Lo mágico.** **El «¿llegamos?» del rodaje:** una barra que dice, con lo grabado hasta ahora,
**cuántas de las piezas del plan ya están cubiertas.** El set no termina «a ver qué salió»: termina
sabiendo si falta algo mientras todavía hay luz.

---

### 5.15 · Community y Posting (⑥ y ⑦)

**Para qué existe.** **Nadie se queda sin respuesta, y todo sale a tiempo.**

**En Mac.**
- **Bandeja única** *(comentarios, DMs y menciones de todas las redes)*, clasificada: *apoyo ·
  pregunta simple · evento · reserva · queja · colaboración · fuera de la ficha · spam.*
- **Dos modos por marca:** **Borrador** *(el agente propone, una persona envía)* y **Activo**
  *(el agente envía lo seguro; escala lo demás)*.
- **Reporte del ciclo** de lo respondido y lo escalado.
- **Posting:** cola programada con captions, hashtags y specs por red; **reintentar fallidas.**

**En iPhone.** **La bandeja como mensajería:** una lista de conversaciones con el agente ya
proponiendo la respuesta. **Un toque envía.** Las quejas llevan una etiqueta ámbar y suben
primero. **Notificación inmediata de quejas y de DMs de leads.**

**Botones y subpáginas.**
- **Enviar · Editar · Escalar al COO/CEO.**
- **Ocultar spam** con confirmación.
- **Ficha de respuestas** por cliente *(lo que el agente puede y no puede decir)*.
- **Publicar ahora · Reprogramar · Despublicar.**

**Lo mágico.** **La respuesta sale de la ficha del cliente, nunca inventada.** Si el dato no está,
el agente **lo dice y escala**, y **deja anotado qué falta en la ficha** para que la próxima vez sí
sepa. **La bandeja aprende.**

---

### 5.16 · Ads (⑧) · 🔒 Gate del CEO

**Para qué existe.** **Pauta con un candado humano.**

**En Mac.**
- **El plan de pauta** en una pantalla: objetivo en una métrica, presupuesto aprobado, pocas
  campañas por temperatura, públicos y **3+ variantes de hook.**
- **GATE 1:** aprobar plan y presupuesto. **GATE 2:** cada movimiento de presupuesto.
- **Salud en vivo:** pacing, fatiga, rendimiento. **«Una cosa a la vez»:** el OS sugiere un solo
  movimiento.
- **Atribución:** qué ventas vinieron de la pauta, con el modelo declarado *(requisito del
  performance fee)*.

**En iPhone.** **Aquí vive el GATE:** una pantalla, **«Subir de $X a $Y»**, con el motivo y la
evidencia. **Aprobar solo con Face ID.** **Live Activity** con el gasto del día contra el tope.

**Botones y subpáginas.**
- **Pausar campaña** *(permitido sin gate: es protección)* · **Aprobar cambio** *(con gate)*.
- **Reporte de pauta** exportable.

**Lo mágico.** **El gasto como un reloj de arena:** una barra que se vacía a lo largo del mes. El
CEO ve **cuánto queda y a qué ritmo**, sin leer una tabla de Meta.

---

### 5.17 · Resultados (↻)

**Para qué existe.** **Cerrar el mes y devolverlo a Strategy.**

**En Mac.** **El cierre del mes** en una sola vista: qué funcionó, qué no, **qué vuelve al ICP**.
**El criterio por comparación:** dos piezas lado a lado — *¿cuál prefieres?* — alimentan el ranking
de preferencias. **No se afirma causalidad** hasta correr experimentos con asignación aleatoria.

**En iPhone.** Un **resumen de 3 pantallas**: los números, lo que aprendimos, lo que cambia.

**Botones y subpáginas.**
- **Cerrar el mes · Generar la presentación del 20 · Mandar al cliente.**
- **Proponer ajuste de estrategia** *(entra al ciclo siguiente)*.

**Lo mágico.** **Cada resultado propone un cambio**, no solo se archiva. El ciclo **se cierra de
verdad**: el mes termina y el siguiente **ya empieza con lo aprendido**.

---

### 5.18 · Consulting

**Para qué existe.** **Entrar al backend cuando el negocio lo pide** *(procesos, CRM, roles, métricas)*.

**En Mac.** **Marcos de diagnóstico** *(operaciones, finanzas, estructura)* por cliente: preguntas,
evidencia y recomendación. Para Growth Partnership, **la auditoría del especialista** y el
**experto de industria** *(quién, cuántas horas, qué entrega)*.

**En iPhone.** **Captura de visita:** notas de voz y fotos en el negocio del cliente, **ligadas a un
marco**; el agente las ordena después.

**Botones y subpáginas.**
- **Nueva auditoría · Pedir mentor** *(arriba de $180/sesión se factura como add-on)*.
- **SOPs** de las áreas contratadas.

**Lo mágico.** **El diagnóstico del cuello** *(¿dónde está trabado este negocio?)* se arma
mientras hablas con el cliente. **Es lo que vende el salto de nivel.**

---

### 5.19 · Equipo, Visión, Roadmap, Laya, Configuración

**Equipo.** Quién es quién **por rol**, su **capacidad** *(horas)* y **cuántas cuentas aguanta**.
Vistas por rol: el CEO elige qué ve cada perfil *(Oculto · Resumen · Completo)*. En iPhone, **un
directorio** con llamar y WhatsApp a un toque.

**Visión.** La visión y misión como **una página que se lee en 30 segundos.** El OS la recuerda en
momentos clave *(al cerrar un mes, al decidir un nivel)*.

**Roadmap.** Lo que falta decidir, construir y probar — **la lista de `PENDIENTES.md` hecha
visual**: cada pendiente con su dueño, su bloqueo y un botón **«Decidir»** que abre la tarjeta de
decisión. **Cerrar un pendiente lo borra del roadmap y propone la regla para el manual.**

**Laya.** El juicio de gusto *(preferencias, comparación)*. En Mac, **dos piezas lado a lado**; en
iPhone, **la comparación como un juego rápido de «¿cuál?»** *(deslizas a la elegida)*.

**Configuración.** **Recetas** *(cómo se arma el trabajo)*, roles, conexiones. Solo CEO. **Cada
ajuste dice qué cambia** antes de guardar.

---

### 5.20 · Indicadores *(viven en Hoy, en cada marca y en Resultados)*

- **Solo datos que existen.** Lo que no tiene dato sale vacío **con de dónde va a salir.**
- **Comercial** *(leads, cierre por fuente, tiempo de respuesta, valor del pipeline)*.
- **Entregas** *(a tiempo contra su fecha límite)*.
- **Ingresos** del mes y **Clientes** *(metas contra real)*.
- **Una sola métrica de crecimiento por marca** *(la que el CEO decida, ver § 9)*, sin prometer
  resultado: **se mide y se reporta.**
- **Visualización honesta:** sin ejes truncados, sin colores que exageren; **una línea con su
  contexto vale más que cinco gráficas.**

---

### 5.21 · Biblioteca, Conexiones, Ajustes, Avisos, Mi perfil

**Biblioteca.** Manual, SOPs, plantillas, aprendizajes. **Búsqueda por significado**, no por
nombre: *«cómo respondemos una queja»* encuentra el SOP aunque se llame distinto. En iPhone, **se
lee bien y se comparte** con un toque.

**Conexiones.** **El semáforo de cada integración** *(Zernio, Drive, Figma, Meta, WhatsApp…)* con
un botón **«Reconectar»** y, si algo falta, **qué promesa queda en pausa** hasta que vuelva.

**Ajustes.** Apariencia *(día/noche/automático)*, **reducir movimiento**, atajos, notificaciones por
tipo, **horario de no molestar** que respeta el ciclo *(el día 11 y el 20 pasan por encima si es
urgente)*. IA: proveedor y equipo por defecto.

**Avisos.** **Una sola campanita**, agrupada por marca, **solo cosas que exigen algo.** Cada aviso
tiene su acción. **Lo informativo se queda en «Hoy», no en notificaciones.**

**Mi perfil.** Tus perfiles de trabajo, tu capacidad y tu **modo de trabajo**: el CEO puede elegir
*«Mensajes mínimos»* y **todo el OS baja el volumen** *(menos texto, un botón, una pregunta a la vez)*.

---

## 6 · Los rituales *(donde el OS tiene que brillar)*

### 6.1 · Día 1 — la reunión con el cliente
Al abrir la reunión, el OS arma **la sala**: ficha de oferta, hilo, lo aprobado hasta hoy, y **un
guion corto** de lo que hay que entender. **Se transcribe en vivo** *(si el cliente lo autoriza)*
y, al terminar, **propone los nodos nuevos** del hilo como `hipótesis` para aprobar.

### 6.2 · Día 3-6 — de la estrategia a la guía
El CEO **aprueba la estrategia en 10 segundos desde su teléfono** *(§ 5.11)*, y en ese instante **el
ciclo se pone en marcha solo**: se crean las tareas, se avisa a cada rol, se arranca ② Branding.

### 6.3 · Día 6-11 — producir
**El modo rodaje** del iPhone *(§ 5.14)*. **El día 11 es sagrado:** desde el día 9, la franja del
ciclo pregunta con suavidad *«¿falta algo por grabar?»*. El 11 por la noche, **si falta, lo dice el
OS, no la memoria de alguien.**

### 6.4 · Día 12-19 — montar, cambiar, programar
**El «feed de revisión»** *(§ 5.13)*: el COO y el CEO revisan en el iPhone **como si fueran el
cliente.** El día 16, **«programar» deja de ser un paso manual:** lo aprobado se programa en la cola
de Posting con un botón *(modo borrador)*.

### 6.5 · Día 20 — la presentación
**Un botón: «Presentar».** El OS arma la presentación del mes *(lo hecho, los números, lo que
aprendimos, lo que sigue)* **con las piezas reales dentro.** En Mac se presenta desde el portal; en
iPhone **se presenta por AirPlay o se comparte el enlace** con el cliente. Al terminar, **el mes
siguiente queda programado** *(se publica desde el día 1)*.

### 6.6 · Lunes — la semana
**Un resumen del lunes a la hora que elijas:** qué trajo el fin de semana, qué se atrasó, **las
tres cosas** de la semana. **Tres. No diez.**

### 6.7 · El momento «apaga todo»
**Un botón «Cerrar por hoy»** que **silencia notificaciones no urgentes**, **resume lo que pasó** y
**avisa a quien lo necesite** que ya no estás. **Un CEO tranquilo decide mejor.**

---

## 7 · Cómo se siente

- **Minimalista, intuitivo, funcional.** Entre más funciones y más claridad, **gana la claridad.**
- **Café como acento; gris cálido de noche y blanco cálido de día.** Un solo sistema de colores y
  de íconos. **Día y noche automáticos**; en iPhone, **sigue al sistema.**
- **Tipografía grande y calmada.** Pocas jerarquías. **Un solo foco por pantalla.**
- **Movimiento corto y con propósito:** menos de 300 ms, solo lo que ayuda a entender qué pasó;
  **con «reducir movimiento», nada se mueve.**
- **Nada se congela:** al tocar una sección se ve **la forma de la pantalla** al instante y los
  datos llegan encima. Lo que no cargó dice **«Reintentar»**, nunca queda en blanco.
- **Sonido casi nulo.** Un «tic» suave al aprobar y nada más.
- **Accesibilidad de verdad:** VoiceOver completo, Dynamic Type, contraste AA o mejor,
  **sin información solo por color**, objetivos táctiles de 44 pt, navegación completa por teclado
  en Mac.
- **Lenguaje:** de «tú», humano, en español. **Los términos del método quedan en inglés**
  *(`WIN`, `MUST BE TRUE`, `UNFAIR`, `GO GET`, `MOVE`, `COMPOUND`)*.

---

## 8 · Orden para construirlo

> **Una ola por vez.** Cada ola se puede usar el mismo día que sale. **Nada de «todo o nada».**

| Ola | Qué entrega | Por qué primero |
|---|---|---|
| **1** | **«Decide» + tarjeta de entregable + aprobar con Face ID / Touch ID + notificaciones con acción** | El CEO **ya no es el cuello**: aprueba desde cualquier lugar |
| **2** | **La franja del ciclo + Hoy + `⌘K`** | El OS **sabe en qué día estás** y lleva a lo que toca |
| **3** | **iPhone nativo: modo rodaje, captura, hoja de compartir, widgets, Live Activities** | Ahí es donde hoy se pierde tiempo |
| **4** | **Bandeja única de Community y CRM con respuesta en un minuto** | La promesa de «nadie se queda sin respuesta» y «respuesta en un minuto» se vuelve real |
| **5** | **El hilo visual y la ficha de criterios como lista de verificación** | **Lo que no traza hasta el ICP no se produce**: ahora se ve |
| **6** | **El portal del cliente con aprobación de 10 segundos y la presentación del día 20** | Menos idas y vueltas; el cliente **se ve** el valor |
| **7** | **Finanzas, capacidad y «cuántas cuentas aguanto»** | Para decidir crecer sin romper el margen |
| **8** | **Modo «mensajes mínimos», Spotlight, Atajos, modo concentración** | El OS **se adapta a cómo piensa el CEO** |

**Lo que NO se hace:**
- **No** replicar todo el Mac en el iPhone. **El iPhone decide y captura; no edita.**
- **No** mostrar costos, márgenes u horas en nada que vea el cliente, ni siquiera «sin querer» en un
  diseño de ejemplo.
- **No** automatizar el envío de nada que lleve **precio, alcance o fechas** sin humano.
- **No** meter un asistente que **hable por hablar.** Si el agente no tiene una acción real
  detrás, **el OS no la ofrece.** Un botón que miente es peor que un botón ausente.
- **No** convertir el OS en «una app más de tareas». **Su razón de ser es el ciclo y el hilo.**

---

## 9 · Decisiones que sí son del CEO

*(Una a la vez, cuando toque. Se anotan aquí para que Fable no las invente.)*

1. **La métrica de crecimiento** que se reporta por marca en Brand Growth.
2. **¿App nativa de Apple, o web instalable muy pulida?** Cambia el costo y qué tan lejos llegan
   Live Activities, Siri y widgets.
3. **¿El cliente tiene portal con acceso, o solo enlaces de aprobación?**
4. **La recompensa de referidos** *(se activa el módulo de referidos del CRM)*.
5. **Costos por hora de cada rol** *(hoy solo Producción tiene tarifa; sin las demás, no hay costo
   ni precio sugerido en el catálogo)*.
6. **¿Hasta dónde llega Siri?** *(solo lectura, o también aprobar con Face ID)*.

---

## 10 · En una frase

> **Un OS que sabe en qué día del ciclo estás, te dice qué toca, te deja decidir en diez
> segundos desde donde estés, y deja trabajar a los agentes sin que nadie los vigile.**
>
> **En el Mac se construye. En el iPhone se decide. En los dos, se está tranquilo.**
