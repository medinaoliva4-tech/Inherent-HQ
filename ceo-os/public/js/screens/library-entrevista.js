// El formato de entrevista de Inherent: la plantilla con la que arranca toda «Entrevista» nueva en la Library.
// Temas numerados (## N · Tema), preguntas numeradas con su caja de respuesta, ⭐ para las que no pueden faltar
// y «   > Lo ideal:» debajo como guía. Al final se pide el diagnóstico con Claude.
export const ENTREVISTA = (m = 'la marca') => `> **Para:** el CEO de ${m} · **Objetivo:** entender su visión, su criterio y su mercado para construir el posicionamiento, el contenido de autoridad y la dirección comercial.
> **Alimenta:** ① Strategy (contexto → WIN, MUST BE TRUE, UNFAIR, GO GET) · ②B Branding · ③ Marketing · ⑩ Ads.
> **Si solo hay 30 minutos:** haz las 8 preguntas con ⭐.

## Lo que ya sabemos

- **Empresa:** qué hace, en una línea. [fuente: link]
- **Dónde está:** ciudad, sedes o planta. [fuente: link]
- **Dato clave:** algo público que cambie la conversación (años, clientes, exportación). [fuente: link]
- **Plan contratado:** ⚠️ SIN DATOS — se define al cerrar el onboarding.

## Cómo usarlo

1. Graba la llamada. Dura entre 60 y 90 minutos.
2. Escribe su respuesta en la caja debajo de cada pregunta. Se guarda sola.
3. Las preguntas con ⭐ son las que no se pueden quedar sin respuesta.
4. **Lo ideal** es para ti, no se lee en voz alta: dice hacia dónde guiarlo y con qué servicio.
5. Si no sabe algo, escribe \`⚠️ SIN DATOS\`.
6. Al terminar, aprieta **Pedir diagnóstico** arriba: Claude te devuelve lo fuerte, las brechas, lo que falta saber y qué le recomendamos.

---

## 1 · Visión y posicionamiento

1. ⭐ ¿Qué quieres que el mercado piense de ${m} que hoy todavía no piensa?
   > Lo ideal: la distancia entre cómo los ven hoy y cómo quieren que los vean. Esa distancia es el trabajo del posicionamiento.
2. ¿Qué quieres que piense un cliente cuando escucha «${m}»?
   > Lo ideal: una sola idea, no una lista. Si dice cinco cosas, hay que elegir una.
3. ¿Qué percepción del mercado quieres cambiar?
   > Lo ideal: esa percepción es el enemigo del mensaje. → ②B Branding (territorio).
4. ¿Qué hace tu industria que te parece incorrecto o que podría hacerse mejor?
5. ¿Sobre qué temas debería ${m} tener opinión propia, aunque no todos estén de acuerdo?
   > Lo ideal: una postura propia diferencia más que un catálogo. Es la base del contenido de autoridad.
6. ¿Qué tendría que pasar para que ${m} sea una marca reconocida y respetada en su mercado?

## 2 · Oportunidades de mercado

1. ⭐ ¿Qué está cambiando en tu mercado y cómo afecta a tus clientes?
   > Lo ideal: un cambio del mercado que la marca resuelva mejor que otros es el ángulo de toda la campaña.
2. ¿Qué problemas de tus clientes están siendo ignorados o mal resueltos por la competencia?
3. ¿Qué industrias o tipos de cliente tienen más potencial para ${m}? ¿Por qué?
   > Lo ideal: uno o dos segmentos para ganar primero. Hablarle a todos es no hablarle a nadie.
4. ¿Qué oportunidad ves que la competencia todavía no está aprovechando?
   > Lo ideal: ahí suele estar el GO GET de la estrategia: lo que hay que ir a buscar.
5. ¿Qué tendencias importan de verdad a tus clientes, y cuáles son solo ruido?
6. ¿Qué tendría que entender un cliente para darse cuenta de que necesita a ${m}?
   > Lo ideal: eso que tiene que entender es el mensaje educativo del contenido.

## 3 · El criterio del CEO

1. ⭐ ¿Qué problemas de tus clientes entienden ustedes mejor que la competencia?
   > Lo ideal: ese conocimiento es la autoridad de la marca. Se cuenta en el contenido, no solo en la venta.
2. ¿Qué hace que un cliente quede verdaderamente bien atendido en tu industria?
3. ¿Cuáles son los errores más comunes que cometen tus clientes antes de llegar a ustedes?
   > Lo ideal: cada error es una pieza de contenido que educa y genera confianza.
4. ¿Qué has aprendido de tu negocio que la mayoría de las personas no sabe?
5. ¿Qué prácticas de tu industria te parecen anticuadas? ¿Qué debería reemplazarlas?
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
6. ¿Qué conversación te gustaría provocar entre tus clientes?
7. ¿Qué conocimiento tiene ${m} que todavía no está comunicando?
   > Lo ideal: mostrar cómo se hace vende más que mostrar el resultado. → Jornada de rodaje (según el alcance de la ficha de oferta).
8. ¿En qué temas quieren educar al mercado y en cuáles quieren ser reconocidos como expertos?

## 5 · Dirección comercial

1. ⭐ ¿Qué tipo de cliente quieren atraer más en los próximos meses?
   > Lo ideal: un cliente ideal (ICP) concreto: tipo de cliente, tamaño y quién decide.
2. ¿Qué clientes no quieren atraer, aunque tengan presupuesto?
   > Lo ideal: el cliente que NO queremos se filtra desde el mensaje. Ahorra tiempo de ventas y protege el margen.
3. ¿Qué productos o soluciones quieren impulsar? ¿Por qué esos?
   > Lo ideal: un producto héroe que protagonice la comunicación. Elegir qué ofertas se empujan es ② Growth.
4. ⭐ ¿Qué tendría que entender un cliente antes de considerar a ${m}?
   > Lo ideal: eso se le enseña antes de la reunión, con contenido y casos. Así llega a la reunión medio convencido.
5. ¿Qué dudas o ideas equivocadas hacen que un cliente no valore lo que hacen?
   > Lo ideal: cada objeción tiene su pieza de contenido que la responde antes de que la digan.
6. ¿Qué quieres que haga una persona después de descubrir la marca? (seguirlos · visitarlos · pedir cotización · agendar una reunión · comprar)
   > Lo ideal: una sola acción principal. Todo el contenido y la pauta empujan hacia ahí.

## 6 · Diferenciación y confianza

1. ⭐ ¿Qué pueden demostrar en público que otras empresas solo prometen?
   > Lo ideal: la ventaja injusta con su prueba. Ese es el UNFAIR de la estrategia.
2. ¿Qué resultados, procesos o proyectos merecen mostrarse en público?
3. ¿Qué pruebas necesita ver el mercado para confiar en ustedes? (casos, clientes conocidos, años, garantía)
   > Lo ideal: cada promesa con su prueba. Sin prueba, la promesa no se publica.
4. ¿Cómo evitan parecer uno más de su industria?
   > Lo ideal: hacer lo opuesto a lo que hace toda la categoría. Eso es salir del código saturado.
5. ¿Qué de su forma de trabajar es difícil de copiar?
6. ¿Qué tipo de afirmaciones o estilo de marketing nunca representarían a ${m}?

## 7 · El resultado

1. ⭐ Si la estrategia de contenido funcionara perfecto los próximos 6 meses, ¿qué habría cambiado en el negocio?
   > Lo ideal: un cambio medible (más ventas, otro tipo de cliente, un mercado nuevo). Ese es el WIN y se acuerda hoy.

## 8 · Para arrancar

1. ¿Quién aprueba el contenido y en cuánto tiempo responde?
   > Lo ideal: una sola persona, con respuesta en 48 horas o menos.
2. ¿Quién puede ser la cara de la marca? ¿Tú?
   > Lo ideal: una cara real genera confianza. Una persona se sigue; un logo no.
3. ¿Dónde podemos grabar? ¿Qué días?
4. ¿Cuánto podrían invertir al mes en anuncios? (va aparte del plan)
   > Lo ideal: un monto fijo cada mes. Sin presupuesto no hay pauta.
5. ¿Qué fechas importantes vienen? (lanzamientos, temporadas, aniversario)

---

## Para pedir al final

- [ ] Fotos y videos que ya tengan (link de Drive)
- [ ] Catálogo o lista de productos y manual de marca si existe
- [ ] Contactos de 3 clientes felices que acepten una llamada corta
- [ ] Accesos a redes, web y cuentas de anuncios
`;
