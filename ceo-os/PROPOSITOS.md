# Inherent OS · los propósitos

**Para quien vaya a cambiar el OS: esto es lo que no se pierde.**
`MAPA.md` dice qué hace cada archivo. Este documento dice **para qué existe cada parte y qué la hace valer.**
Si un cambio choca con un propósito, no se hace: se le pregunta al CEO.

---

## 1 · Para qué existe el OS

- **Para operar Inherent rápido.** El trabajo del día a día se hace y se entrega aquí; el repo guarda el manual y los clientes.
- **Para que el método se cumpla solo.** Lo que el manual decide (el alcance como techo, los gates del CEO, lo que el cliente nunca ve) lo hace cumplir el OS, no la memoria de alguien.
- **Para trabajar con agentes.** La IA de cada persona trabaja dentro de las reglas de la empresa y levanta excepciones, no preguntas.

## 2 · Cómo se siente (vale para todas las pantallas)

- **Se entiende en 10 segundos.** Minimalista, intuitivo y funcional. Entre más funciones y más claridad, gana la claridad.
- **Habla como persona.** De «tú», sin jerga. Si un término técnico hace falta, se explica en una frase.
- **Lo accionable arriba, una cosa a la vez.** El CEO tiene TDAH: un mensaje corto vale más que una pantalla llena.
- **Los vacíos enseñan.** Una pantalla vacía dice qué hacer y de dónde va a salir el dato. Nunca un cero inventado.
- **Un mismo lenguaje.** Los chats tienen la misma estructura; los calendarios se ven igual; cada módulo de una marca dice de dónde viene, qué se hace ahí y a dónde pasa.
- **Los chats se sienten como ChatGPT o Claude.** La conversación centrada; lo tuyo en una burbuja suave a la derecha; la respuesta sin burbuja, con el avatar del agente y sus acciones al pasar el mouse (copiar, reintentar, guardar); el chat vacío con un título y tarjetas de lo que se puede pedir; la caja abajo con la franja de cliente, mes, contexto y modo, el modelo con su punto verde o rojo y la voz; un aviso de que puede equivocarse; el panel que se esconde. **Un chat por parte del proceso, no un historial de chats.**
- **Evidencia o etiqueta.** Lo que no tiene fuente dice «⚠️ SIN DATOS». El OS no inventa.
- **Dos apps, un OS.** El Tablero (las pantallas: proyectos, briefs, clientes, ventas, finanzas, marcas) y el Chat (el Inherent LLM) se separan y se unen con el dock, como un escritorio. Cada una vuelve a donde estabas.
- **Cinco áreas, las mismas en las dos apps:** Estrategia · Organización · Marketing · Diseño · Consulting. Marketing planea y mide la demanda de cada marca (plan del mes, campañas y eventos, calendario y pauta); Diseño hace sus piezas. El área dice qué trabajas; la app, cómo. Se escoge una vez con el switch (un ícono y un color por área) y las dos apps la siguen. La barra lateral (como la del Chat) va primero para el CEO y se apaga en Mi perfil; en el cel sigue la barra de abajo.
- **Un solo sistema de diseño.** Organización y el Chat comparten colores (de noche gris cálido tipo Claude, de día blanco cálido, café solo de acento), íconos (un solo set) y un solo día/noche. Las zonas de papel (cotización, login, portadas) no cambian.
- **Nada se congela.** Al tocar una sección se ve al momento la forma de la pantalla y los datos llegan encima; lo que no cargó dice «Reintentar», nunca se ve vacío.
- **Movimiento corto y con propósito.** Menos de 300 ms, solo lo que ayuda a entender qué pasó; con «reducir movimiento» no se mueve nada.

## 3 · Lo que no se negocia

- **El CEO es el candado de la estrategia y de la pauta.** Además aprueba los avatares, las variaciones de anuncios y todo lo que se escribe en el repo.
- **El alcance contratado es el techo.** Sin ficha de oferta, la marca se bloquea.
- **El cliente nunca ve** costos, márgenes, horas, notas internas ni nada de otro cliente. Los precios y costos nunca van en el código público.
- **Nada destructivo sin OK.** El OS no gasta dinero (Ads crea la tarea para ⑩), no borra (se archiva) y no publica sin aprobación.
- **La regla de solo lectura del chat de Estrategia (`puente.py`) no se quita.**
- **La IA corre en la compu de cada persona**, con su propia cuenta y el modelo que elija (ChatGPT, Claude o local, por Hermes o por el puente). Es privado: Vercel nunca habla con el puente ni con Hermes.
- **El servidor local nunca usa la base de producción.**

## 4 · Cada parte: su propósito y lo que no se pierde

### Organization

- **Hoy** — lo que necesita atención hoy. *No se pierde:* corto; al CEO, el pulso del mes; al equipo, sus responsabilidades.
- **Mis tareas** — el puesto de cada quien. *No se pierde:* solo lo que ese rol hace hoy, sin información suelta.
- **Clientes y Proyectos** — quién es cada cliente, qué se le entrega y cuándo. *No se pierde:* un solo Kanban; cada entrega pasa por revisión.
- **Ventas** — que ningún lead se enfríe. *No se pierde:* el primer contacto se responde en un minuto; un lead abierto siempre tiene siguiente paso y fecha; nada duplicado.
- **Servicios** — lo que se vende y cómo se entrega. *No se pierde:* el precio se arma por alcance, no por volumen; los costos solo los ve el CEO.
- **Finanzas** — que quede utilidad. *No se pierde:* facturas por cobrar y por pagar, el cruce con el banco y la rentabilidad por alcance; la factura electrónica la emite el contador; las facturas de proveedores entran por la etiqueta «Facturas» de Gmail y las registra Claude, sin pagar nada.
- **Inherent** (Equipo, Visión, Roadmap, Library) — la empresa por dentro. *No se pierde:* Vistas por rol las decide el CEO y las hace cumplir el servidor.
- **Laya** — el criterio del sistema. *No se pierde:* responde preguntas fijas sobre un texto, en la compu de cada persona; propone, no decide.

### Chat · el Inherent LLM

- **Un solo chat con un modo por área** (Estrategia, Organización, Diseño, Consulting) para trabajar con IA dentro de las reglas de Inherent, con la IA que cada quien tenga (su suscripción de ChatGPT, Claude o una local), por Hermes en su compu. El switch de IA dice qué empresa responde; el modelo se elige dentro de ella.
- *No se pierde:*
  - cada modo trae su harness: las reglas de siempre, cómo trabaja ese departamento y sus criterios de aceptación; lo entregado se revisa contra ellos a la vista;
  - el repo no se edita desde el chat: Hermes no tiene terminal, ni código, ni navegador, y su copia del repo se limpia antes de cada turno;
  - lo que se guarda en el OS va por el conector, con lo que el perfil de la persona permite y con su OK;
  - lo que pide permiso, se pregunta en la conversación; una pregunta a la vez;
  - la estrategia la sigue aprobando el CEO: el chat no la cambia si ya está aprobada;
  - las conversaciones viven en la compu de cada persona, no en Vercel;
  - la **Brújula** convierte lo vago en una meta medible con fecha y tareas, y avisa cuando la conversación se desvía: el chat sirve para avanzar, no solo para explorar (pensado para el TDAH del CEO: una cosa a la vez, la de ahora a la vista);
  - el **modo privado** («En tu compu» en el switch de IA) existe para lo que no debe salir de la compu (datos de clientes, finanzas): responde un modelo local y, si no hay, no manda nada;
  - **Estrategia empodera a las demás áreas:** lo que la estrategia pide y se ejecuta en otra área (un BMC en Consulting, una pieza en Diseño) sale como encargo; la persona lo manda con un botón, queda como tarea y se trabaja ahí. Nada se manda solo. A Consulting solo va si el nivel del cliente lo trae; si no, se escala al CEO. El encargo lo ven quien lo manda y a quien se asigna (lleva el porqué de la estrategia).

### Marketing

- **Planear y medir la demanda de cada marca** — el plan del mes, las campañas y los eventos con su anticipación (primer aviso, recordatorio y último empujón), qué se pauta y qué funcionó. Se arma en el Chat (modo Marketing) y se guarda en el OS con un botón.
- *No se pierde:*
  - una campaña es un empujón con fecha; sin fecha es un pilar. Una por ciclo, dos como máximo (mk-campana);
  - sin estrategia aprobada no hay plan ni campañas;
  - el plan del mes vive solo en el OS;
  - quién lleva cada campaña o evento se asigna en cada una;
  - Marketing no escribe piezas ni copy: eso es de Diseño (④ Creatividad, ⑥A).

### Consulting

- **El backend de un cliente** — lo útil para organizar sus operaciones, sus finanzas (márgenes, precio, costo de adquisición, valor de vida, su modelo de negocio) y su equipo (quién decide qué, puestos, onboarding), más los encargos que le manda Estrategia. Lo lleva el CEO con Strategy.
- *No se pierde:*
  - Operations OS y Money OS son de Growth Partnership (Finanzas, según acuerdo: solo si la ficha la incluye): con otro nivel, lo que se proponga va FUERA DEL ALCANCE y se dice;
  - los números del cliente son el trabajo; los costos y márgenes de Inherent no entran (`inherent/06-ECONOMIA.md` no se lee);
  - los números son del cliente: sin costos confiables, el margen es teoría y se dice; nada de otro cliente;
  - las finanzas de Inherent no viven aquí: están en Organización → Finanzas.

### Estrategia

- **El tablero de Estrategia** — se abre desde el panel del modo Estrategia del Chat; el chat de siempre (por el puente) sigue ahí mientras alguien no tenga Hermes.
- **El chat con Strategy** — la estrategia de cada cliente en 5 bloques, con el método de Hormozi y la estrategia en vivo al lado.
- *No se pierde:*
  - solo lee el repo y cita sus fuentes;
  - parte de la meta financiera hacia atrás;
  - nada pasa a los departamentos sin la aprobación del CEO;
  - lo que falta en el repo (la ficha, un documento) lo escribe el CEO desde ahí.

### Marcas

**La línea del trabajo: entender → crear → diseñar → publicar y medir, y Tech.**

- **Investigación** — los posts que ganan en su mercado, con su porqué. *No se pierde:* el scraping semanal, el juicio de Laya y el ojo visual (si la imagen se parece a la marca; nunca si es «bonita»).
- **Cliente ideal** — a quién le hablamos y con qué peso. *No se pierde:* lo aprueba el CEO.
- **Brief del ciclo** — qué decimos este mes. *No se pierde:* sin brief no hay piezas con fecha de ese mes, salvo que el CEO lo abra.
- **Plan del mes, Formatos, Ideas y Guiones** — del plan a la pieza, en una sola línea. *No se pierde:* sin estrategia aprobada no hay plan; sin plan no hay ideas; una idea se cuenta en un formato que ya funcionó.
- **Identidad y Design system** — cómo se ve y cómo suena la marca. *No se pierde:* valores que se ejecutan, no adjetivos.
- **El chat de Diseño gráfico** — un solo chat con etapas cerradas: Plan del mes → Ideas → Diseño. *No se pierde:* diseña en Figma con el design system de la marca; la pieza suelta es la única que entra directo a Diseño.
- **Video** — el kit de edición de la marca y una ficha por video. *No se pierde:* el kit sale del design system; el OS no edita: arma el pedido para ⑦ Video Editing.
- **Calendario** — lo que hay que hacer, lo que se planea y lo que ya está programado. *No se pierde:* se ve igual que el calendario de Proyectos, con tres filtros que se prenden y se apagan: Operativo, Planificación y Programado.
- **Ads** — un anuncio muy específico por avatar, para que la IA de la plataforma lo lleve a esa persona, en variaciones para Meta y Google. *No se pierde:* solo el CEO aprueba; el OS nunca gasta: «Lanzar» crea la tarea para ⑩ Ads.
- **Resultados** — qué funcionó y qué no. *No se pierde:* vuelve a Investigación y al plan del mes siguiente.
- **Tech** — la web, las landings y las herramientas de la marca. *No se pierde:* una landing entra al CRM; la web viva la enciende el CEO y solo comparte lo ya publicado; la auditoría de SEO se guarda con su puntaje.

### El primer día y «Cómo se usa»

- **El OS lleva de la mano a quien entra por primera vez**, pantalla a pantalla, y **enseña cada parte con el video del CEO.**
- *No se pierde:*
  - seis pasos con check que se comprueban solos; se puede pausar y el OS recuerda dónde iba;
  - si algo falla, dice qué hacer en una frase;
  - el video se abre en una ventanita que sigue contigo mientras haces lo que explica;
  - el OS sabe qué videos vio cada quien y lo muestra en su perfil y en Equipo.

### Avisos

- **Un solo lugar dice qué falta: en tu trabajo, en cada cliente y en la plataforma.** La campanita lo cuenta; cada aviso dice qué pasa y trae un solo botón para resolverlo.
- *No se pierde:*
  - cada quien ve solo lo suyo y lo de los clientes de su alcance, nunca costos de Inherent ni nada de otro cliente;
  - cada aviso sale de una regla del manual (el día 11, el 20, la ficha, el gate del CEO…), no de una ocurrencia de la pantalla;
  - lo urgente se pospone un día como máximo, y lo que bloquea (un lead esperando, la pauta sin OK, un cliente sin ficha) no se pospone;
  - sin ruido: si un cliente no tiene ficha, solo sale eso de ese cliente.

### El celular

- **El OS en el bolsillo, como app, y avisa lo justo.** *No se pierde:* un aviso cuando entra un lead (responder en un minuto) y uno por la mañana con lo que necesita atención; nunca ruido. Cada quien lo enciende o lo apaga en su perfil.

### La app de Mac

- **El OS en su propia ventana, con el puente adentro.**
- *No se pierde:*
  - no hay que emparejar;
  - instala Laya la primera vez, con tu OK;
  - se actualiza sola;
  - recuerda el tamaño;
  - el token del puente solo lo recibe el OS;
  - si macOS bloquea algo, explica en una frase qué hacer.

### El conector MCP

- **La IA de cada persona entra al OS.** *No se pierde:* ve y hace solo lo que su perfil permite.

## 5 · Cuándo un cambio está bien

1. Respeta estos propósitos y las reglas de la sección 3.
2. Pasa las pruebas y se ve bien en el navegador, de día y de noche.
3. `MAPA.md` y este documento quedan al día en el mismo cambio.
4. Lo entiende alguien que nunca lo había visto, en 10 segundos.
