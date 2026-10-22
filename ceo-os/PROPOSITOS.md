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
- **Los chats se sienten como ChatGPT o Claude.** La caja abajo, la franja con cliente, mes, contexto y modo, el modelo con su punto verde o rojo, la voz y el panel que se esconde.
- **Evidencia o etiqueta.** Lo que no tiene fuente dice «⚠️ SIN DATOS». El OS no inventa.

## 3 · Lo que no se negocia

- **El CEO es el candado de la estrategia y de la pauta.** Además aprueba los avatares, las variaciones de anuncios y todo lo que se escribe en el repo.
- **El alcance contratado es el techo.** Sin ficha de oferta, la marca se bloquea.
- **El cliente nunca ve** costos, márgenes, horas, notas internas ni nada de otro cliente. Los precios y costos nunca van en el código público.
- **Nada destructivo sin OK.** El OS no gasta dinero (Ads crea la tarea para ⑩), no borra (se archiva) y no publica sin aprobación.
- **La regla de solo lectura del chat de Estrategia (`puente.py`) no se quita.**
- **La IA corre en la compu de cada persona**, con su propia cuenta. Es privado: Vercel nunca habla con el puente.
- **El servidor local nunca usa la base de producción.**

## 4 · Cada parte: su propósito y lo que no se pierde

### Organization

- **Hoy** — lo que necesita atención hoy. *No se pierde:* corto; al CEO, el pulso del mes; al equipo, sus responsabilidades.
- **Mis tareas** — el puesto de cada quien. *No se pierde:* solo lo que ese rol hace hoy, sin información suelta.
- **Clientes y Proyectos** — quién es cada cliente, qué se le entrega y cuándo. *No se pierde:* un solo Kanban; cada entrega pasa por revisión.
- **Ventas** — que ningún lead se enfríe. *No se pierde:* el primer contacto se responde en un minuto; un lead abierto siempre tiene siguiente paso y fecha; nada duplicado.
- **Servicios** — lo que se vende y cómo se entrega. *No se pierde:* el precio se arma por alcance, no por volumen; los costos solo los ve el CEO.
- **Finanzas** — que quede utilidad. *No se pierde:* facturas por cobrar y por pagar, el cruce con el banco y la rentabilidad por alcance; la factura electrónica la emite el contador.
- **Inherent** (Equipo, Visión, Roadmap, Library) — la empresa por dentro. *No se pierde:* Vistas por rol las decide el CEO y las hace cumplir el servidor.
- **Laya** — el criterio del sistema. *No se pierde:* responde preguntas fijas sobre un texto, en la compu de cada persona; propone, no decide.

### Estrategia

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
