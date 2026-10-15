// Carga única: el folder de Cerantola con sus entrevistas. Se borra después de cargarlo.
// Formato de Entrevista: cada pregunta numerada lleva su caja de respuesta; «   > Lo ideal:» debajo es la guía para el CEO.
const CONTEXTO = `## Lo que ya sabemos

- **Empresa:** Cerantola, S.A. — fabricante de mobiliario en madera, metal y plástico. [fuente: https://delrisco.pe/informe/E0000911134002855/cerantola-sa]
- **Planta:** Santa Lucía Milpas Altas, Sacatepéquez. [fuente: https://www.emis.com/php/company-profile/GT/Cerantola_Sociedad_Anonima_en_22773671.html]
- **Showroom:** Design Center, Diagonal 6 12-42, zona 10. [fuente: https://es.panjiva.com/Cerantola-Sociedad-Anonima/41452729]
- **Exporta:** registros de más de 4,500 envíos a unos 100 compradores. [fuente: https://www.volza.com/company-profile/cerantola-s.a.-10119747/]
- **Ojo:** existe una Cerantola italiana de sillas de oficina (cerantola.com). ⚠️ SIN DATOS — no sabemos si tienen relación.
- **Plan contratado:** ⚠️ SIN DATOS — se define al cerrar el onboarding.

## Cómo usarlo

1. Graba la llamada. Cada entrevista dura entre 60 y 90 minutos.
2. Escribe su respuesta en la caja debajo de cada pregunta. Se guarda sola.
3. Las preguntas con ⭐ son las que no se pueden quedar sin respuesta.
4. **Lo ideal** es para ti, no se lee en voz alta: dice hacia dónde guiarlo y con qué servicio.
5. Si no sabe algo, escribe \`⚠️ SIN DATOS\`.
6. Al terminar, aprieta **Pedir diagnóstico** arriba: Claude te devuelve lo fuerte, las brechas, lo que falta saber y qué le recomendamos.
`;

const MARCA = `> **Para:** el CEO de Cerantola · **Objetivo:** entender su visión, su criterio y su mercado para construir el posicionamiento, el contenido de autoridad y la dirección comercial.
> **Alimenta:** ① Strategy (contexto → WIN, MUST BE TRUE, UNFAIR, GO GET) · ②B Branding · ③ Marketing · ⑩ Ads.
> **Si solo hay 30 minutos:** haz las 8 preguntas con ⭐.

${CONTEXTO}
---

## 1 · Visión y posicionamiento

1. ⭐ ¿Qué quieres que el mercado piense de Cerantola que hoy todavía no piensa?
   > Lo ideal: la distancia entre cómo los ven hoy y cómo quieren que los vean. Esa distancia es el trabajo del posicionamiento.
2. ¿Qué quieres que piense un arquitecto o un gerente cuando escucha «Cerantola»?
   > Lo ideal: una sola idea, no una lista. Si dice cinco cosas, hay que elegir una.
3. ¿Qué percepción del mercado quieres cambiar? (ej.: «lo hecho en Guatemala es de menor calidad», «lo importado es mejor»)
   > Lo ideal: esa percepción es el enemigo del mensaje. → ②B Branding (territorio).
4. ¿Qué hace la industria del mueble que te parece incorrecto o que podría hacerse mejor?
5. ¿Sobre qué temas debería Cerantola tener opinión propia, aunque no todos estén de acuerdo? (ej.: oficinas, trabajo híbrido, muebles desechables)
   > Lo ideal: una postura propia diferencia más que un catálogo. Es la base del contenido de autoridad.
6. ¿Qué tendría que pasar para que Cerantola sea una marca reconocida y respetada en su mercado?

## 2 · Oportunidades de mercado

1. ⭐ ¿Qué está cambiando en cómo las empresas arman y usan sus espacios, y cómo afecta a sus clientes? (trabajo híbrido, oficinas más pequeñas, bienestar del equipo)
   > Lo ideal: un cambio del mercado que Cerantola resuelva mejor que otros es el ángulo de toda la campaña.
2. ¿Qué problemas de sus clientes están siendo ignorados o mal resueltos por la competencia?
3. ¿Qué industrias o tipos de cliente tienen más potencial para Cerantola? ¿Por qué?
   > Lo ideal: uno o dos segmentos para ganar primero. Hablarle a todos es no hablarle a nadie.
4. ¿Qué oportunidad ves que la competencia todavía no está aprovechando?
   > Lo ideal: ahí suele estar el GO GET de la estrategia: lo que hay que ir a buscar.
5. ¿Qué tendencias del diseño y del mobiliario importan de verdad a sus clientes, y cuáles son solo ruido?
6. ¿Qué tendría que entender una empresa para darse cuenta de que necesita a Cerantola?
   > Lo ideal: eso que tiene que entender es el mensaje educativo del contenido.

## 3 · El criterio del CEO

1. ⭐ ¿Qué problemas de sus clientes entienden ustedes mejor que la competencia?
   > Lo ideal: ese conocimiento es la autoridad de la marca. Se cuenta en el contenido, no solo en la venta.
2. ¿Qué hace que un espacio de trabajo o comercial esté verdaderamente bien resuelto?
3. ¿Cuáles son los errores más comunes que cometen las empresas al amueblar sus espacios?
   > Lo ideal: cada error es una pieza de contenido que educa y genera confianza.
4. ¿Qué has aprendido de fabricar muebles que la mayoría de las personas no sabe?
5. ¿Qué prácticas de la industria te parecen anticuadas? ¿Qué debería reemplazarlas?
6. ¿Qué principios nunca sacrificarías, aunque te cueste una venta?
   > Lo ideal: valores con un ejemplo real. Un valor sin prueba no sirve para comunicar.

## 4 · Contenido y autoridad

1. ⭐ ¿Qué opiniones tienes sobre tu industria que vale la pena defender en público?
   > Lo ideal: 3 a 5 posturas claras. Son los pilares del contenido de autoridad. → ③ Marketing (pilares).
2. ¿Sobre qué temas podrías hablar una hora sin prepararte?
   > Lo ideal: en esos temas, la cara de la marca habla con naturalidad. Ahí está el contenido más fácil de producir.
3. ¿Qué te gustaría que tu audiencia entendiera, aunque nunca te comprara?
4. ¿Qué afirmaciones de tu industria te gustaría cuestionar en público?
5. ¿Qué experiencias, proyectos o decisiones propias respaldan tus opiniones?
   > Lo ideal: cada opinión con un caso real. Sin caso, es solo opinión.
6. ¿Qué conversación te gustaría provocar entre arquitectos, diseñadores y empresarios?
7. ¿Qué conocimiento tiene Cerantola que todavía no está comunicando? (la planta, el proceso, la exportación)
   > Lo ideal: ver cómo se hace un mueble vende más que la foto del mueble. → Jornada de rodaje (incluida desde Marketing Pro).
8. ¿En qué temas quieren educar al mercado y en cuáles quieren ser reconocidos como expertos?

## 5 · Dirección comercial

1. ⭐ ¿Qué tipo de cliente quieren atraer más en los próximos meses?
   > Lo ideal: un cliente ideal (ICP) concreto: tipo de empresa, tamaño y quién decide.
2. ¿Qué clientes no quieren atraer, aunque tengan presupuesto?
   > Lo ideal: el cliente que NO queremos se filtra desde el mensaje. Ahorra tiempo de ventas y protege el margen.
3. ¿Qué productos o soluciones quieren impulsar? ¿Por qué esos?
   > Lo ideal: un producto héroe que protagonice la comunicación. Elegir qué ofertas se empujan es ② Growth.
4. ⭐ ¿Qué tendría que entender un empresario o un arquitecto antes de considerar a Cerantola?
   > Lo ideal: eso se le enseña antes de la reunión, con contenido y casos. Así llega a la reunión medio convencido.
5. ¿Qué dudas o ideas equivocadas hacen que un cliente no valore lo que hacen? (precio, tiempos, «lo importado es mejor»)
   > Lo ideal: cada objeción tiene su pieza de contenido que la responde antes de que la digan.
6. ¿Qué quieres que haga una persona después de descubrir la marca? (seguirlos · visitar el showroom · visitar la planta · pedir cotización · agendar una reunión)
   > Lo ideal: una sola acción principal. Todo el contenido y la pauta empujan hacia ahí.

## 6 · Diferenciación y confianza

1. ⭐ ¿Qué pueden demostrar en público que otras empresas solo prometen?
   > Lo ideal: la ventaja injusta con su prueba. Ese es el UNFAIR de la estrategia.
2. ¿Qué resultados, procesos o proyectos merecen mostrarse en público?
3. ¿Qué pruebas necesita ver el mercado para confiar en ustedes? (proyectos, clientes conocidos, años, exportación, garantía)
   > Lo ideal: cada promesa con su prueba. Sin prueba, la promesa no se publica.
4. ¿Cómo evitan parecer un fabricante más con un catálogo de muebles?
   > Lo ideal: hacer lo opuesto a lo que hace toda la categoría (foto de producto en fondo blanco, «calidad y diseño»).
5. ¿Qué de su forma de trabajar es difícil de copiar?
6. ¿Qué tipo de afirmaciones o estilo de marketing nunca representarían a Cerantola?

## 7 · El resultado

1. ⭐ Si la estrategia de contenido funcionara perfecto los próximos 6 meses, ¿qué habría cambiado en el negocio?
   > Lo ideal: un cambio medible (más cotizaciones, otro tipo de cliente, un mercado nuevo). Ese es el WIN y se acuerda hoy.

## 8 · Para arrancar

1. ¿Quién aprueba el contenido y en cuánto tiempo responde?
   > Lo ideal: una sola persona, con respuesta en 48 horas o menos.
2. ¿Quién puede ser la cara de la marca? ¿Tú?
   > Lo ideal: una cara real genera confianza en ventas grandes. Una persona se sigue; un logo no.
3. ¿Podemos grabar en la planta? ¿Qué días?
4. ¿Cuánto podrían invertir al mes en anuncios? (va aparte del plan)
   > Lo ideal: un monto fijo cada mes. Sin presupuesto no hay pauta.
5. ¿Qué fechas importantes vienen? (ferias, lanzamientos, aniversario)

---

## Para pedir al final

- [ ] Fotos y videos que ya tengan, de producto, planta y proyectos (link de Drive)
- [ ] Catálogo actual y manual de marca si existe
- [ ] Contactos de 3 clientes felices que acepten una llamada corta
- [ ] Accesos a redes, web y cuentas de anuncios
`;

const EMPRESA = `> **Para:** el CEO de Cerantola · **Objetivo:** entender cómo funciona la máquina: qué vende, cómo lo produce, con quién, cuánto deja y dónde se traba.
> **Alimenta:** ① Strategy (contexto) · ② Growth · Operations OS · Money OS.

${CONTEXTO}
---

## 1 · Historia y estructura

1. ¿Cuándo y cómo nació Cerantola? ¿Quiénes son los dueños?
2. ⭐ ¿Quién decide qué? Dibújame el organigrama de hoy.
   > Lo ideal: un organigrama con roles claros, quién responde ante quién y quién decide qué. → Estructura empresarial: quién hace qué y cómo.
3. ¿Cuántas personas trabajan? ¿Cuántas en planta, ventas, diseño y administración?
4. ¿Qué pasa en la planta de Santa Lucía y qué en el showroom?
5. ⭐ Si te vas una semana, ¿qué se detiene?
   > Lo ideal: que nada se detenga. Si todo pasa por él, la empresa necesita procesos escritos y decisiones delegadas. → plan Compound (SOPs de toda la empresa).

## 2 · Qué venden

1. ⭐ ¿Cuáles son sus líneas de producto? ¿Cuál vende más y cuál deja más?
   > Lo ideal: saber la ganancia de cada línea y empujar la que más deja, no la que más se vende. → Estructura financiera.
2. ¿Qué porcentaje es a la medida y qué porcentaje es estándar o de catálogo?
   > Lo ideal: una línea estándar que se venda sin diseñar desde cero cada vez. Escala más rápido que lo hecho a la medida.
3. ⭐ ¿Cuál es el ticket promedio por pedido? ¿Y el pedido más grande del último año?
4. ¿Qué incluye la venta? (diseño, entrega, instalación, garantía)
   > Lo ideal: paquetes claros (por ejemplo: mobiliario + instalación + mantenimiento) en vez de cotizar todo suelto. → Oferta, precios y paquetes (línea Growth).
5. ¿Qué producto o servicio quisieras vender más y hoy no se vende?

## 3 · Cómo se vende

1. ⭐ Cuéntame paso a paso cómo se vende: desde que alguien pregunta hasta que paga.
   > Lo ideal: un proceso de venta escrito, con etapas y un responsable en cada una. → Diagnóstico y estrategia comercial.
2. ¿Cuánto tarda en cerrarse una venta? ¿Y una de proyecto grande?
3. ¿Cuántas cotizaciones hacen al mes y cuántas se cierran?
   > Lo ideal: medir la tasa de cierre cada mes. Subirla es más barato que conseguir más prospectos.
4. ¿Quién vende? ¿Tienen vendedores con comisión?
   > Lo ideal: que el equipo de ventas tenga guiones y sepa cerrar sin el dueño. → Conversion OS (plan Accelerate).
5. ¿Participan en licitaciones? ¿Trabajan con distribuidores o representantes?
   > Lo ideal: uno o dos canales grandes (licitaciones, contratos marco, desarrolladoras) que traigan volumen recurrente. → Pilar 2, cuentas grandes (plan Accelerate).
6. ¿Cuántos clientes vuelven a comprar? ¿Cada cuánto?
   > Lo ideal: un sistema de recompra con clientes corporativos: renovación, ampliación de oficinas, mantenimiento. → Retención y recompra.
7. ¿Qué porcentaje de las ventas viene de 5 clientes? (concentración)
   > Lo ideal: que ningún cliente sea más del 20% de las ventas. Si lo es, perderlo es un riesgo serio.

## 4 · Exportación

1. ⭐ ¿Qué porcentaje de las ventas es exportación? ¿A qué países?
2. ¿Quiénes son esos compradores? (marcas, tiendas, mayoristas, maquila)
3. ¿Exportan con su marca o fabrican para la marca de otro?
   > Lo ideal: si fabrican para otros, la marca propia es la oportunidad de margen. Hay que medir si la planta la aguanta.
4. ¿Cómo consiguieron esos clientes? ¿Quieren más?
   > Lo ideal: prospección internacional con una lista de compradores y una secuencia de contacto en inglés. → Prospección B2B · Expansión a nuevo mercado.

## 5 · Orden y operación

1. ⭐ ¿Cómo entra un pedido y cómo llega hasta la entrega? ¿Quién toca cada paso?
   > Lo ideal: el proceso de pedido a entrega escrito paso a paso, con un responsable por etapa. → Estructura empresarial (los 3 procesos clave).
2. ⭐ ¿Cuánto tarda en producirse un pedido normal? ¿Y uno grande?
3. ¿Qué capacidad tiene la planta? ¿Al cuánto por ciento está hoy?
   > Lo ideal: saber la capacidad antes de traer más demanda. Si la planta está llena, primero se arregla la capacidad o se sube el precio, no se vende más.
4. ¿Dónde se atora siempre el proceso?
   > Lo ideal: cada atasco que se repite es una tarea para automatizar o un proceso para escribir. → Automatización de procesos.
5. ¿Tienen procesos escritos? ¿Usan algún sistema? (ERP, Excel, papel)
6. ¿Cómo controlan la calidad? ¿Cuántos reclamos o devoluciones hay?
   > Lo ideal: un checklist de calidad antes de cada entrega y un registro de reclamos para ver qué se repite.
7. ¿Entregan a tiempo? ¿Qué pasa cuando no?

## 6 · Ciclos

1. ⭐ ¿Cuáles son los meses fuertes y los meses flojos?
   > Lo ideal: preparar el contenido y la prospección dos meses antes de la temporada fuerte, y usar los meses flojos para cuentas grandes y exportación.
2. ¿Cuándo arman presupuesto sus clientes corporativos?
   > Lo ideal: estar frente a ellos antes de que cierren su presupuesto anual, no después.
3. ¿Hay ferias o temporadas que marquen el año? (aquí y para exportación)
4. ¿Cómo planifican la producción del mes? ¿Con pedidos o con proyección?

## 7 · Proveedores

1. ⭐ ¿Cuáles son sus materias primas principales? (madera, metal, telas, espuma, herrajes)
2. ¿Cuáles son nacionales y cuáles importadas? ¿De dónde?
3. ⭐ ¿Dependen de un solo proveedor para algo crítico?
   > Lo ideal: al menos dos proveedores para cada material crítico. Uno solo es un riesgo para las fechas de entrega.
4. ¿Cuánto tardan en llegar los materiales? ¿Pagan en dólares?
5. ¿Manejan inventario de materia prima o compran por pedido?
6. ¿Qué proveedor les ha fallado y qué pasó?

## 8 · Finanzas

> Si prefiere no dar números exactos, rangos sirven. Esto no sale de Inherent.

1. ⭐ ¿Cuánto facturan al mes o al año? ¿Cómo fue el año pasado contra este?
   > Lo ideal: con esto se ve en qué etapa está y qué plan le corresponde.
2. ⭐ ¿Qué margen deja cada línea de producto, aproximado?
   > Lo ideal: margen por línea y por pedido, actualizado cada mes. → Estructura financiera · Money OS (plan Compound).
3. ¿Cuáles son los costos fijos del mes? (planilla, renta, energía)
4. ¿Cuál es el punto de equilibrio: cuánto hay que vender para no perder?
   > Lo ideal: que lo sepa de memoria. Es el piso de cualquier meta.
5. ¿Cómo cobran? ¿Anticipo, crédito, a cuántos días? ¿Cuánto hay por cobrar hoy?
   > Lo ideal: anticipo de 50% para arrancar producción y cobro del resto contra entrega. Fabricar con dinero propio aprieta la caja.
6. ¿Cómo está el flujo de caja? ¿Han tenido meses apretados?
7. ¿Tienen deuda o financiamiento?
8. ¿Quién lleva la contabilidad? ¿Reciben reportes cada mes? ¿Los leen?
   > Lo ideal: una página al mes con ventas, margen, caja y cuentas por cobrar, que se lea en 5 minutos.
9. ¿Saben cuánto les cuesta conseguir un cliente nuevo?

## 9 · Metas y dónde se traba

1. ⭐ ¿Cuánto quieres facturar en 12 meses? ¿Y en 3 años?
   > Lo ideal: con esta meta se hace la ingeniería inversa: cuántos pedidos, cuántas cotizaciones y cuántos prospectos hacen falta.
2. ⭐ Si mañana llegaran el doble de pedidos, ¿los podrían entregar?
   > Lo ideal: si la respuesta es no, el problema no es marketing. Primero se arregla la operación.
3. ¿Qué te quita el sueño de la empresa?
4. ¿Qué han intentado para crecer y no funcionó?
5. ¿Qué harías si tuvieras más tiempo?

---

## Documentos a pedir

- [ ] Organigrama (aunque sea a mano)
- [ ] Lista de productos con precio y costo
- [ ] Ventas de los últimos 12 meses, por mes y por línea
- [ ] Lista de clientes principales y de exportación
- [ ] Lista de proveedores principales
- [ ] Estado de resultados del último año
- [ ] Cualquier proceso escrito que ya exista
`;

const SISTEMA = `> **Para:** el CEO de Cerantola · **Objetivo:** saber todo lo necesario para armarles su propio sistema operativo: una sola web donde vean ventas, pedidos, producción, compras, finanzas y equipo.
> **Alimenta:** ② Growth (\`gr-herramienta\`) · Operador. Las herramientas a medida entran en 🟨 Accelerate y Compound.

${CONTEXTO}
---

## 1 · Para qué lo quieren

1. ⭐ ¿Qué quieres poder ver en una pantalla cada mañana sin preguntarle a nadie?
   > Lo ideal: una pantalla de inicio con lo urgente del día: pedidos atrasados, cotizaciones sin respuesta, caja y cobros pendientes.
2. ⭐ ¿Qué preguntas le haces a tu equipo cada semana? (esas son las pantallas)
3. ¿Qué decisión tomas hoy a ciegas por no tener el dato a mano?
4. ¿Qué te ahorraría más tiempo a ti? ¿Y a tu equipo?
5. Si solo pudieras tener una pantalla, ¿cuál sería?
   > Lo ideal: arrancar por esa pantalla y sumar una nueva cada mes. → una herramienta por trimestre en Accelerate, una por mes en Compound.

## 2 · Quién lo usa

1. ⭐ ¿Quiénes lo usarían? Nombre del puesto y cuántas personas.
2. ¿Qué debe ver cada uno y qué no? (ej.: ventas no ve costos, planta no ve finanzas)
   > Lo ideal: un perfil por puesto. Cada quien entra con su correo y ve solo lo suyo.
3. ¿La gente de planta tiene computadora o solo celular?
   > Lo ideal: que planta lo use desde el celular, con botones grandes para marcar avances.
4. ¿Usan correo de Google o de Microsoft? (define cómo entra cada uno)
5. ¿Clientes o proveedores deberían ver algo? (estado de su pedido, órdenes de compra)
   > Lo ideal: un portal donde el cliente vea en qué va su pedido. Ahorra llamadas y da confianza.

## 3 · Lo que usan hoy

1. ⭐ ¿Qué programas usan hoy? Excel, sistema contable, ERP, WhatsApp, Drive, papel…
   > Lo ideal: conectar lo que ya funciona en vez de reemplazarlo todo. El sistema lee de ahí.
2. ¿Qué sistema usan para facturar? (FEL de la SAT)
3. ¿Qué de eso funciona bien y no quieren cambiar?
4. ¿Qué de eso odian?
   > Lo ideal: eso que odian es la primera pantalla a construir. Es donde se nota el cambio.
5. ¿Quién administra cada herramienta y quién tiene las contraseñas?
   > Lo ideal: las cuentas a nombre de la empresa, con un responsable y accesos guardados en un solo lugar.

## 4 · Ventas y clientes

1. ⭐ ¿Dónde está hoy la lista de clientes y prospectos?
   > Lo ideal: un CRM dentro del sistema, con la etapa de cada cliente. → CRM ligero + automatizaciones.
2. ¿Cómo se hace una cotización? ¿Quién la arma y con qué plantilla?
   > Lo ideal: un cotizador que arme la cotización con precios del catálogo y la descargue en PDF con la marca, en minutos.
3. ¿Qué etapas tiene una venta? (prospecto → cotizado → anticipo → en producción → entregado)
4. ¿Cómo dan seguimiento a una cotización que no contestan?
   > Lo ideal: un recordatorio automático a los 3 y a los 7 días. → Seguimiento automático de leads.
5. ¿Qué números de ventas quieres ver? (cotizado, cerrado, por vendedor, por línea)

## 5 · Pedidos y producción

1. ⭐ ¿Qué estados tiene un pedido desde que se firma hasta que se instala?
   > Lo ideal: un tablero con cada pedido en su estado y su fecha de entrega, visible para ventas y planta.
2. ⭐ Hoy, ¿cómo sabes en qué va un pedido y si va a llegar a tiempo?
   > Lo ideal: saberlo sin llamar a nadie. El sistema avisa solo cuando un pedido va atrasado.
3. ¿Usan órdenes de trabajo para planta? ¿Cómo se ven?
4. ¿Cómo se reparte el trabajo entre áreas de la planta? (corte, ensamble, tapicería, pintura, empaque)
5. ¿Qué alerta te gustaría recibir? (pedido atrasado, material faltante)
   > Lo ideal: alertas por correo o WhatsApp solo para lo que necesita una decisión. → Automatización de procesos.

## 6 · Inventario y compras

1. ⭐ ¿Llevan inventario de materia prima y producto terminado? ¿Dónde?
   > Lo ideal: inventario que se descuenta solo cuando un pedido entra a producción, con aviso de mínimo.
2. ¿Cómo se decide qué comprar y cuándo?
3. ¿Usan órdenes de compra? ¿Quién las aprueba?
   > Lo ideal: orden de compra con aprobación en un clic y su historial por proveedor.
4. ¿Qué datos guardan de cada proveedor? (precios, tiempos, contactos)

## 7 · Finanzas

1. ⭐ ¿Qué números quieres ver y cada cuánto? (ventas, margen, caja, cuentas por cobrar)
   > Lo ideal: un tablero financiero que se actualice solo desde la contabilidad o una hoja conectada. → Estructura financiera · Money OS (plan Compound).
2. ¿De dónde sale hoy cada número? ¿Quién lo arma?
3. ¿Quieres ver el margen por pedido o por línea?
   > Lo ideal: margen por pedido. Así se ve qué tipo de proyecto conviene aceptar.
4. ¿Qué no debe ver nadie más que tú?

## 8 · Equipo y tareas

1. ¿Cómo se asignan hoy las tareas y cómo sabes que se hicieron?
   > Lo ideal: tareas con responsable y fecha, en un tablero que cada quien ve desde su perfil.
2. ¿Quieres llevar asistencia, horas o metas por persona?
3. ¿Hay reuniones fijas? ¿Qué se revisa en cada una?
   > Lo ideal: que la reunión se haga mirando el sistema, no armando reportes antes.

## 9 · Conocimiento

1. ¿Hay procesos escritos, fichas técnicas o manuales?
   > Lo ideal: una biblioteca con procesos, fichas y videos cortos de cómo se hace cada cosa. → Biblioteca de conocimiento para IA.
2. ¿Dónde viven las fotos, planos y catálogos?
3. ¿Qué sabe solo una persona y se perdería si se va?
   > Lo ideal: documentar eso primero. Después, una IA del equipo que lo responda. → IA entrenada con la marca.

## 10 · Datos y prioridades

1. ⭐ ¿Qué datos ya tienen guardados que podamos cargar? (Excel, sistema contable)
2. ¿Hay información que no puede salir de la empresa?
   > Lo ideal: acceso solo con el correo de la empresa y permisos por puesto.
3. ⭐ Ordena del 1 al 5 qué quieres primero: ventas · pedidos y producción · compras e inventario · finanzas · equipo.
   > Lo ideal: construir en ese orden, una parte a la vez, y que cada parte se use antes de pasar a la siguiente.
4. ¿Para cuándo lo necesitas funcionando?

---

## Documentos a pedir

- [ ] Una cotización real
- [ ] Una orden de trabajo o de producción real
- [ ] Los Excel que usan hoy para ventas, pedidos, inventario o finanzas
- [ ] Un reporte que reciba el CEO hoy, si existe
- [ ] La lista de herramientas con quién administra cada una
- [ ] La lista de usuarios: puesto y qué debe ver cada uno
`;

export const CERANTOLA = {
  folder: { name: 'Cerantola', tone: 'oliva', desc: 'Onboarding de Cerantola: entrevistas y contexto.' },
  seed: 5, // sube cuando cambian las entrevistas: el botón las vuelve a cargar
  docs: [
    { title: 'Entrevista 1 — Marketing: visión, mercado y autoridad', kind: 'Entrevista', body: MARCA },
    { title: 'Entrevista 2 — La empresa por dentro', kind: 'Entrevista', body: EMPRESA },
    { title: 'Entrevista 3 — Su sistema operativo', kind: 'Entrevista', body: SISTEMA },
  ],
};
