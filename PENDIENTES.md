# Pendientes

> **Esto NO es manual.** Es la lista de lo que falta decidir, construir, probar o medir.
> Cuando un pendiente se cierra, **se borra de acá y la regla entra al manual** (`inherent/` o
> `CLAUDE.md`) con la aprobación del CEO.

---

## ❓ 1 · Decisiones del CEO

| # | Decisión | Contexto |
|---|---|---|
| 1 | **La métrica de crecimiento medible que se reporta en Brand Growth** | Sin promesa de resultado: se mide y se reporta |
| 2 | **¿Qué argumento vende el salto de Brand Growth a Growth Partnership?** | Se vende con el diagnóstico del cuello, no con el catálogo |
| 3 | **Especialistas por área** *(eventos, networking y PR, talent production, talent marketing)* | No tienen rubro en el costo fijo ni persona asignada |
| 4 | **¿Cuál de las tres auditorías cubre corporate structure?** | Hoy dice solo «la auditoría» |
| 5 | **Reposición gratis en las garantías** | El costo se calculó con la economía anterior: recalcular con los costos de los 3 niveles o descartar |
| 6 | **El margen de rodaje de cada ficha** | Las horas contratadas son tiempo de cámara; ④ Producción usa márgenes de referencia (60-90 / 30-45 / 45 min) mientras no se decida |
| 7 | **`CLAUDE.md` dice «sin servidores ni hosting»** | El VPS ya corre `00-account` y va a correr la corrida programada de ⑥ Community. **`ceo-os/` va a Vercel (autorizado por el CEO):** la regla de CLAUDE.md ya lo contempla |
| 8 | **La recompensa de referidos** | Para quien refiere *(cliente o tercero)*: qué, cuánto, para quién y cuándo se entrega. Sin esto los referidos de `st-adquisicion` no se activan *(Construir #13)* |

---

## 🔨 2 · Construir

| # | Qué | Por qué |
|---|---|---|
| 1 | **Editor de video para ④ Producción (Post)** | Probar FilmCraft 2 días *(respaldo: Twick, licencia por confirmar)*; multiplicar con ffmpeg y un endpoint `video.derive` con cola. Figma sigue por Figwright desde la Mac; Chromium en el VPS solo si no hace falta entregar contraseñas |
| 2 | **Operación automatizada** | Programar, publicar y reportar sin humano; el operador supervisa más cuentas |
| 3 | **Pipeline de herramientas** | Plantillas y despliegue automatizado para que la tecnología de Growth Partnership quepa en el rubro Operador |
| 4 | **Sistema de contenido crudo del cliente** | Más video sin pasarse del monto de Grabación |
| 5 | **Match automático de mentores** | Strategy busca por industria, etapa y presupuesto en las plataformas de mentores. Falta el login |
| 6 | **Cobro internacional** | Stripe, Wise o equivalente, con factura deducible para el cliente |
| 7 | **Inherent OS · fases 5 a 7** (`ceo-os/`) | El plan y el orden están en `ceo-os/PLAN-OS.md` § 4. Hechas: 0 a 4 |
| 8 | **CEO OS: desplegar** | Conectar la base de datos (Neon) en Vercel, crear el cliente OAuth de Google y cargar las variables. Pasos en `ceo-os/README.md` |
| 9 | **CEO OS: costos por hora de cada rol** | Solo Producción tiene tarifa en el manual (Q150/h). Sin las demás no hay costo ni precio sugerido en el catálogo |
| 10 | **Cerantola: pasar lo básico a Figma** | Colores, fuentes y logos de `clients/cerantola/02-marca/sistema-visual.md` a la página «Cerantola». Lo complejo de la marca se diseña ahí |
| 11 | **Cerantola: mejorar con IA las fotos del PDF** | Vienen en baja resolución. Se retocan con Higgsfield según las reglas de § Imagen |
| 12 | **Cerantola: crear su perfil de Google Maps** | No existe, y al buscar «Cerantola» aparece Cerantola S.p.A. de Italia. Con su nombre, fotos de proyectos y reseñas de clientes. Ver `clients/cerantola/99-referencias/investigacion/referentes-por-canal.md` § Google |
| 13 | **Sistema de referidos: la plataforma** | Los referidos están en `st-adquisicion` §4. Falta la recompensa *(Decisiones #8)* y elegir la plataforma externa que ocupa el slot, probada en una cuenta real antes de anotarla en `inherent/05-OPERACION.md` |
| 14 | **Revisar las skills a conciencia** | Se aplican como están en los agentes del servidor: tienen método, pero solo algunas dicen qué decide la persona. Hay que revisarlas en una parte del proceso y sumar «Lo que decide la persona» |
| 15 | **Validar el criterio por comparación y avanzar a experimentos** | La auditoría y la primera función Elo/Bayes viven en `ceo-os/docs/auditoria-criterio-comparacion.md` y en Creative Performance Analyzer. Falta probarla con una marca real, instrumentar objetivos y exposición, hacer A/B aleatorio y solo entonces evaluar bandits/Glicko. No atribuir impacto causal al ranking de preferencias. |

---

## 🧪 3 · Probar contra una cuenta real

> **Regla:** lo `⬜` en «Capacidades reales» se ofrece avisando que es primera implementación.
> Cuando se prueba, pasa a `✅` en `06-ECONOMIA.md`.

| # | Qué | Respalda |
|---|---|---|
| 1 | **Zernio:** publicar y responder con una cuenta real, y su precio con 15-20 cuentas. ✅ Conectado; leer cuentas, comentarios y DMs ya está probado, también desde el VPS | «Presencia todos los días» y community management |
| 2 | **⑥ Community en vivo con NAO y Akai:** una semana en modo borrador, después envío activo. Corre con Claude Code y el plan de la empresa en el VPS; si el plan no alcanza, una API de IA | Community en cada nivel |
| 3 | **⑦ Posting con Zernio en una cuenta real:** programar, publicar y reintentar las fallidas | La publicación de todos los niveles |
| 4 | **Scraping:** probar los actores que faltan. ✅ Cuenta, MCP y `apify/facebook-ads-scraper` ya están probados | El radar de ③ Marketing y Creative, ① Strategy y las garantías |
| 5 | **Pauta:** Meta, TikTok, Google Search y Performance Max | ⑧ Ads y «Que te encuentren en Google» |
| 6 | **AdWhispr:** guardar la marca | Que `find_competitors` sirva sin preguntar cada vez |
| 7 | **Plugin `claude-ads`** | Auditoría y monitoreo de cuentas |
| 8 | **Automatización de mensajes y WhatsApp** | «Nadie se queda sin respuesta» |
| 9 | **Herramienta a medida e IA propia** | Growth Partnership |
| 10 | **Vetting de creadores con el scraper de Instagram** | Alianzas con creadores |
| 11 | **`ffmpeg` local:** reencuadre y análisis de video | `pr-post` y `leer-video.py` de `mc-radar` |
| 12 | **Un mes completo al volumen de una ficha real** | Que el volumen sea capacidad probada |
| 13 | **Captura de leads:** comenta-y-te-mando con Zernio `comment_automations_*` y prospección con Apify *(Maps y LinkedIn)* contra una cuenta real | `st-adquisicion` §3 y el auto-DM de ⑥ Community |

### Las garantías — no se publican hasta cerrar los cuatro

| # | Bloqueo |
|---|---|
| 1 | Probar los 4 actores de scraping de las garantías contra una cuenta real |
| 2 | Medir la línea base de cada cliente |
| 3 | Instalar atribución *(CAPI + GA4)* en al menos un cliente |
| 4 | Correr un ciclo completo con la redirección del día 20 |

---

## 📏 4 · Medir

| # | Qué | Para qué |
|---|---|---|
| 1 | **Las horas reales de cada rol por ficha** *(COO, operador, editor, fotografía, producción)* | Confirmar que cada monto fijo alcanza y cuántas cuentas aguanta cada rol |
| 2 | **Las horas del CEO con la nueva asignación de tareas** | Capacidad: cuántas cuentas entran |
| 3 | **El onboarding de cada nivel** *(tareas y horas)* | Brand Foundation, Brand Growth y Growth Partnership |
| 4 | **Instrumentar a cada cliente** *(ventas antes y después, atribución)* | El primer caso medido del múltiplo y del performance fee |
| 5 | **Las tasas reales de los clientes** | Sin eso no se compromete ninguna garantía |

---

## 🌐 5 · Mercados

| # | Qué |
|---|---|
| 1 | **Investigar precios reales de México y Miami** y definir sus factores de alcance *(ver «Definir para los 3 niveles»)* |

> Lo de la web *(tarjetas, idiomas, industrias, casos)* vive en el repo de la web.

---

## 🎓 6 · Mentores

| # | Qué |
|---|---|
| 1 | Mapear mentores para **Cafeterías** y **Clubes y comunidades** |
| 2 | Confirmar cuántas sesiones 1:1 incluye The Apparel Mentor *($39/mes)* |
| 3 | Verificar que el mentor de Zesty Paws *(mascotas, $720)* corresponda a suplementos |
| 4 | Recalcular el uso real del especialista y la membresía prorrateada con el rubro «auditoría con el mentor» |

---

## 👥 7 · Equipo

| # | Qué |
|---|---|
| 1 | **Firmar con cada persona el monto fijo por rubro** de la ficha |
| 2 | **Entra un operador de agentes** al pasar de 3 clientes; el COO queda solo como COO |
| 3 | **Directores por sistema**, cuando el volumen lo pida: Growth, Conversión, Operaciones y CFO fraccional *(opcional — no se promete)* |

---

## 🧹 8 · Limpieza del repo

| # | Qué |
|---|---|
| 1 | **`agents/`: quitar advertencias y estados** con el mismo criterio que `inherent/` |
| 2 | **`agents/00-account/`: que hable como Nicole, la secretaria**, y escale al COO |
| 3 | **Borrar las ramas viejas de GitHub:** solo quedan `main` y `rodrigo-medina` |
| 4 | `/inherent` no aparece en la Mac del COO: probar `git ls-remote origin main` y trabajar sobre `main` |
| 5 | **Onboarding de Akai, NAO y Cerantola:** los folders existen, vacíos, en `clients/` |
| 7 | **En el VPS, `~/inherent-hq` es un clon viejo sin acceso** | El que se usa es `~/inherent-hq-src`. Renombrar el viejo para que nadie lo use por error |

---

## 🌐 Web «Hablemos» y respuesta en un minuto

- La web **no muestra precio**; lleva a «Hablemos». Hay que quitar los precios «desde» de las tarjetas en el repo de la web y poner el botón «Hablemos» en el hero, en cada nivel y en el diagnóstico.
- «Respuesta en un minuto»: hoy no hay una línea de WhatsApp dedicada conectada con Claude que conteste y cree el lead en el CRM. Hasta que exista, la promesa no se publica.
- Quién contesta fuera de horario y qué dice la primera respuesta.
- Guion de la primera conversación: entender el caso, mostrar lo que está en juego y dar el precio con el alcance delante.

## 🧩 Definir para los 3 niveles

> **El manual ya no lleva números por plan.** Cada punto de esta lista se decide con el CEO y, cuando se cierra, entra al manual (`inherent/06-ECONOMIA.md`, `03-OFERTA.md`). **No se inventan cifras:** las del esquema anterior están arriba solo como referencia.

| # | Qué definir | Contexto |
|---|---|---|
| 1 | **Factores de cada nivel** *(el baseline ya está: $1,200 · $2,400 · $4,200)* | Cuánto suma cada factor sobre el baseline: canales, producción, ubicaciones, integración, responsabilidad de ejecución. Qué volumen incluye cada baseline |
| 1b | **Catálogo** | Falta un servicio de identidad visual, verbal y dirección creativa con su costo. Y cuánto cuesta un servicio que se repite cada mes |
| 2 | **Precio base y factores de cada área** *(las 12 del catálogo)* | Sirve para armar propuestas con solo las áreas necesarias |
| 3 | **Factores de alcance por mercado** *(Guatemala, México, Miami)* | Reemplazan la tabla de precios por plan de `04-MERCADO.md` |
| 4 | **Costo por rubro y por rol** | Grabación, fotografía, edición, operador, herramientas / IA, especialista, auditorías y buffer: montos reales para fichas de los 3 niveles. Incluye si la tarifa de fotografía sigue en Q300 por sesión |
| 5 | **Margen objetivo** | Un margen objetivo al cotizar *(y un piso)*, calculado sobre costos reales de la ficha |
| 6 | **Ficha de oferta de cada módulo** | Resultado, entregables exactos, frecuencia y volumen, rondas de revisión, qué aporta el cliente, qué queda fuera, plazo, responsables, métricas, precio base y factores. Para los 3 niveles y para los módulos extra *(los extras ya no llevan precio de lista)* |
| 7 | **El fee de rendimiento** | Porcentaje, base de cálculo y reglas de atribución limpia, solo en Growth Partnership. El manual dice «un porcentaje fijado en la ficha» |
| 8 | **Política de mentores** | Cadencia, horas y entrega del experto de industria en Growth Partnership; techo por sesión y rubro de especialista *(hoy solo se conserva el límite de $180 por sesión; arriba va como add-on facturado)* |
| 9 | **Migración de los clientes actuales** *(nao, cerantola, akai)* a un nivel | Hoy conservan su plan en `clients/`. Decidir a qué nivel pasa cada uno, redactar su ficha de alcance y mover su `00-onboarding/plan-contratado.md`. **No se asume el plan de ninguno: sale de su folder** |
| 10 | **Precio «desde» visible en la web** | Las tres tarjetas del brief llevan «desde»; falta el monto |
| 11 | **Objetivo de crecimiento medible que se reporta** *(sin garantía de resultado)* | Reemplaza las metas Nx por plan |
| 12 | **Umbrales para calificar al cliente por nivel** | Hoy se calculan con los números reales de cada propuesta; decidir si se fija un criterio de facturación mínima |
| 13 | **Volumen de investigación (scraping) por ficha** | Cuántos contenidos por plataforma según la ficha |

## 🧩 Definir para las skills nuevas

> Las skills ya corren sin estas cifras: donde falta una, se declara y no se inventa. Cuando el CEO
> decide un punto, entra a la skill y se borra de aquí.

| # | Skill | Qué definir |
|---|---|---|
| 1 | `mc-campanas-piezas` | La duración objetivo de reel por canal · **¿una «story» de la ficha es un frame o una secuencia?** y cuántos frames como máximo · si se quiere un porcentaje de arranque por nivel de conciencia en la mezcla |
| 2 | `mc-radar` | La ventana de recencia del orgánico, en días · la alternativa gratuita u open source a Apify *(costo cero o casi, respetando términos de uso)* |
| 3 | `st-adquisicion` | La recompensa de referidos *(Decisiones #8)* · cuántos toques tiene por defecto la secuencia de seguimiento |
| 4 | `st-producto-icp` | La regla guía por producto de Inherent *(p. ej. «el cliente factura ~10× el precio»)* · cada cuánto se revisa el producto |
| 5 | `mc-pilares-angulos` | Si los tres ángulos por defecto *(jóvenes, millennials, mayores)* se quedan o cambian por cliente |

## 🧱 Reestructura de agentes *(simple: 1 orquestador + 4 skills por área)*

| # | Qué | Por qué |
|---|---|---|
| 1 | **Migrar las referencias de `ceo-os/` a los agentes nuevos** | Rutas a `agents/02-growth`, `04-creative`, `07-video-editing`, `10-ads-management`, a skills borradas (`cr-hook-copy`, `mk-campana`, `mk-loop`, `ad-optimizacion`, `cr-fuentes`) y a `hormozi-brain/references` *(las citas de Estrategia y sus pruebas)*. Lista completa en el PR de la reestructura |
| 2 | **Migrar las referencias de `clients/`** | Los `CLAUDE.md` y `CONTEXTO.md` de cada cliente y de `_plantilla` nombran las áreas y números viejos, `plan-de-contenido.csv` y los `aprendizaje-*.md` |
| 4 | **El hilo en Inherent OS** | Nodos con id, estado, fuente y `viene_de`, avisos cuando cambia un nodo, índice de grafo (graphify) y la tarjeta de decisión en chat, herramienta y portal |
| 5 | **Las herramientas como artefactos** | Perfil del cliente ideal · calculadora de adquisición *(outbound e inbound, calibrada con Zernio)* · dolores, deseos e historia · radar · tablero pilares × ángulos · campañas · hoja de jornada imprimible · editor de video simple |
| 6 | **Probar la corrida programada de ⑥ Community con los nombres nuevos** | `cm-ficha`, `cm-escalado` y `cm-envio` se juntaron en `community`, `cm-triage` y `cm-respuesta`; el cron del VPS llama `/community` |
| 7 | **Correr un cliente de punta a punta con las áreas nuevas** | Del producto al reel de prueba y su validación en `resultados` |
| 8 | **Radar de tecnología** | Que el sistema se mantenga al día de MCPs, open source y tendencias |
| 9 | **Cuenta de OpenAI por API a nombre de Inherent para `gd-assets`** | La llave va en la variable `OPENAI_API_KEY` de cada máquina que diseña *(y del VPS si corre ahí)*, nunca en el repo ni en el chat. Falta probar un lote real con PNG transparente y anotarlo en «Capacidades reales» de `inherent/06-ECONOMIA.md`, y fijar un techo de gasto por cliente al mes |

---

## 📚 Referencia: economía del esquema anterior (4 planes)

> **No es vigente.** Son las cifras, tablas y textos del esquema de 4 planes *(Marketing, Marketing Pro, Accelerate, Compound)*, copiados tal cual antes de salir del manual. Los 3 niveles nuevos no los reutilizan: sirven solo como referencia para definir los números de los niveles *(ver «Definir para los 3 niveles»)*. Cada bloque dice de qué archivo viene. Equivalencia solo para leer datos viejos: Marketing y Marketing Pro → Brand Growth · Accelerate y Compound → Growth Partnership.

#### 06-ECONOMIA.md · §1 El principio (precios, precio por pieza, mezcla de costo, márgenes)

> ## 1 · El principio
>
> **Vendemos dos cosas distintas, y se dicen distinto.**
>
> ```
> 🔷 MARKETING   promete ATENCIÓN      compite con agencias
> 🟨 GROWTH      promete FACTURACIÓN   compite con consultoría y CMO fraccional
> ```
>
> ```
> 🔷 MARKETING      $950     Q7,315      arrancando → visible
> 🔷 MARKETING PRO  $1,450   Q11,165     visible → presencia sostenida
> 🟨 ACCELERATE     $2,500   Q19,250     estancado → escalando
> 🟨 COMPOUND       $4,200   Q32,340     escalando → autónomo
> ```
>
> **La línea Growth recorre los 3 pilares de su división.** Accelerate **ejecuta** · Compound
> **sistematiza**. **La línea Marketing no activa pilares** — ejecuta atención. Ver `03-OFERTA.md`.
>
> > **El volumen nos separa del mercado. La profundidad separa los planes entre sí.**
>
> 🔑 **El salto de Marketing Pro a Accelerate no compra piezas — compra sistemas.** Los dos
> entregan 145. Accelerate toca oferta, precio, conversión y canales.
>
> ### 💀 La estrategia de precio: matarlos con valor, no cobrar más
>
> **No competimos por precio alto. Competimos entregando una cantidad absurda de valor al precio
> que el mercado ya acepta.**
>
> | | Mercado | **🔷 Inherent MARKETING** |
> |---|---|---|
> | Precio | Q3,000 | **Q7,315** |
> | Piezas al mes | 16 | **86** |
> | **Precio por pieza** | Q188 | **Q85** |
> | Estrategia | ❌ | ✅ |
> | Inteligencia de competencia | ❌ | ✅ |
> | Pauta | a veces | ✅ |
>
> 👉 **5.4x el volumen. 55% más barato por pieza. Y trae estrategia, inteligencia y pauta.**
>
> ### La ventaja de costo está en la mezcla
>
> **El costo de 🔷 Marketing, por rubro:**
>
> | Rubro | Q | % del costo |
> |---|---|---|
> | Grabación | Q450 | **27%** |
> | Operador de agentes | Q350 | **21%** |
> | Fotografía | Q300 | **18%** |
> | Edición de video | Q200 | **12%** |
> | Buffer | Q215 | 13% |
> | **Herramientas / IA** | **Q150** | **9%** |
> | **TOTAL** | **Q1,665** | 100% |
>
> **Casi el 80% del costo es humano; la IA es el 9%.** Bajar el precio no sale del ahorro de IA —
> saldría de bajarle el pago a la gente, y eso no se hace.
>
> **La palanca real es la mezcla: menos grabación, mucho más contenido sobre el mismo material.**
> Por eso 🔷 Marketing corre con **3 h de grabación** y entrega **86 piezas**: 13 videos y 73
> piezas que salen de plantillas y del material ya grabado.
>
> 🔑 **No existe un plan debajo de Marketing.** Esas 3 horas más la sesión de foto son el piso de
> costo; abajo de ahí no hay producto que entregar.
>
> ### 🧮 Los cuatro objetivos a la vez
>
> > **Costos bajos · Valor enorme · Precio justo · Márgenes muy buenos.**
> > Cierran **no bajando el precio — con el costo fijo por plan.**
>
> | Objetivo | Cómo se cumple |
> |---|---|
> | **Costos bajos** | Costo fijo por plan, por rubro. Ningún rubro se pasa de su monto |
> | **Valor enorme** | 3x a 5x el volumen del mercado al mismo precio |
> | **Precio justo** | Dentro del rango que el mercado ya acepta |
> | **Márgenes muy buenos** | **77% · 77% · 70% · 73%** — fijos, no dependen del número de clientes |
>
> ### ⚡ Lo que solo se puede hacer con agentes
>
> > **El argumento de venta.** Una agencia no lo ofrece porque cada ítem le costaría contratar a
> > alguien.
>
> | | Qué es | Por qué importa |
> |---|---|---|
> | **Volumen que no se sostiene a mano** | 86 a 204 piezas al mes | La marca pasa de aparecer 3 veces por semana a estar presente todos los días |
> | **Una grabación, muchas piezas** | Cortes, reencuadres y derivados del mismo material | El costo de producción se divide entre todas las piezas |
> | **Clonar el anuncio que le funciona a la competencia** | Su anuncio más longevo, en nuestra versión | El competidor ya pagó por descubrir qué funciona |
> | **Hasta 50 variantes de creativo por campaña** | La agencia corre 3. Nosotros corremos 50 y el algoritmo elige | Menor costo por resultado |
> | **Una IA entrenada con la marca** | El equipo del cliente le pregunta y responde con su voz, su oferta y sus datos | El conocimiento deja de vivir en la cabeza del fundador |
> | **Radar de competencia semanal** | Qué anuncios lanzaron, cuáles sostienen, qué cambiaron | La agencia avisa el día 30. Nosotros el martes |
> | **Herramientas a medida** | CRM ligero, panel, portal, automatizaciones | Pasamos de proveedor de marketing a partner técnico |
>
> ---
>

#### 06-ECONOMIA.md · §2 Los costos por plan — fijos

> ## 2 · 📐 Los costos por plan — fijos
>
> > **El costo de cada plan es fijo, por cuenta y por rubro.** No es estimación ni promedio: **es
> > el monto que cada cuenta paga a cada rubro, y no se pasa.** Si una cuenta consume más, se
> > cotiza extra o sube de plan. **Nunca se absorbe.**
>
> | Rubro | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
> |---|---|---|---|---|
> | **Precio** | Q7,315 *($950)* | Q11,165 *($1,450)* | Q19,250 *($2,500)* | Q32,340 *($4,200)* |
> | Grabación | Q450 *(3 h · Q150/h)* | Q560 *(4 h · Q140/h)* | Q780 *(6 h · Q130/h)* | Q960 *(8 h · Q120/h)* |
> | Fotografía | Q300 | Q300 | Q300 | Q300 |
> | Edición de video | Q200 | Q500 | Q700 | Q1,000 |
> | Operador de agentes | Q350 | Q550 | Q900 | Q1,400 |
> | Herramientas / IA | Q150 | Q200 | Q300 | Q500 |
> | Especialista *(auditoría con el mentor)* | — | — | Q1,000 | Q2,000 |
> | Auditoría conta *(números)* | — | — | Q600 | Q900 |
> | Auditoría admin *(SOPs)* | — | — | Q600 | Q900 |
> | Buffer | Q215 | Q445 | Q520 | Q840 |
> | **COSTO** | **Q1,665** | **Q2,555** | **Q5,700** | **Q8,800** |
> | **UTILIDAD** | **Q5,650** | **Q8,610** | **Q13,550** | **Q23,540** |
> | **MARGEN** | **77%** | **77%** | **70%** | **73%** |
> | *Costo por pieza* | *Q19* | *Q18* | *Q39* | *Q43* |
>
> ### Qué cubre cada rubro
>
> | Rubro | Qué paga | Planes |
> |---|---|---|
> | **Grabación** | Las horas de grabación del plan. **La tarifa por hora baja cuando suben las horas** | Los cuatro |
> | **Fotografía** | La sesión de fotos del mes | Los cuatro |
> | **Edición de video** | Los videos planificados y sus derivados | Los cuatro |
> | **Operador de agentes** | Correr los agentes, los estáticos, la programación y la herramienta a medida | Los cuatro |
> | **Herramientas / IA** | El aporte de la cuenta a la IA, el scraping y las tools del plan | Los cuatro |
> | **Especialista** | La auditoría que hace el mentor de la industria | 🟨 Growth |
> | **Auditoría conta** | La revisión de los números | 🟨 Growth |
> | **Auditoría admin** | La revisión de los SOPs y la estructura | 🟨 Growth |
> | **Buffer** | El colchón para imprevistos: regrabar, una revisión extra, una pieza que se cae | Los cuatro |
>
> 🔑 **El CEO y el COO no son rubro.** Cobran de la utilidad; sus horas son **capacidad**, no costo.
>
> ### El margen no cambia con el número de clientes
>
> **Con 1, 5 o 20 clientes, cada plan deja el mismo margen.** Lo que crece con cada cliente es la
> utilidad absoluta, no el porcentaje.
>
> ### Por qué Growth deja menos % pero mucha más utilidad
>
> **De Marketing a Compound el costo se multiplica por 5.3 y el precio por 4.4.** El margen baja
> de 77% a 73%, **pero la utilidad por cliente se multiplica por 4.2** *(Q5,650 → Q23,540)*.
>
> **Lo que encarece Growth es el criterio de afuera:** especialista y auditorías suman **Q2,200**
> en Accelerate y **Q3,800** en Compound. **No hay 4x de producción detrás** — lo que se cobra es
> la decisión.
>
> ---
>

#### 06-ECONOMIA.md · §3 Herramientas / IA — aportes por plan y piso mensual

> ## 3 · 🔧 Herramientas / IA — cómo se pagan
>
> **Dos tipos de costo:**
>
> | Herramienta | Cómo se cobra | Al mes |
> |---|---|---|
> | **IA** *(Claude)* | **Una sola factura para la empresa.** Sirve para casi cualquier número de clientes | **Q1,500** |
> | **Scraping** *(Apify)* | **Por uso:** crece con cada cliente | **~Q4.70** 🔷 · **~Q9.40** 🟨 por cliente *(US$0.61 / US$1.22 a Q7.70)* |
>
> **El rubro Herramientas / IA de cada cuenta es su aporte** *(Q150 · Q200 · Q300 · Q500)*.
>
> **La tabla se calcula con el escenario caro —todas las cuentas en 🟨 Growth, Q9.40 cada una—** para
> que el número nunca quede corto.
>
> | Clientes | Hay que pagar | Aportan las cuentas | Resultado |
> |---|---|---|---|
> | **3** | ~Q1,528 | ~Q780 | La diferencia sale de la utilidad |
> | **5** | ~Q1,547 | ~Q1,300 | La diferencia sale de la utilidad |
> | **~7** | ~Q1,566 | ~Q1,820 | **Se cubre solo** |
> | **10** | ~Q1,594 | ~Q2,600 | Sobra |
>
> 🆓 **Y hasta 4-5 clientes el scraping no se paga:** los US$5 mensuales gratis de Apify son **por
> organización** y cubren esa cantidad de cuentas. El costo de arriba es el que aparece al pasarlos.
>
> 🔑 **Con menos de ~7 clientes, lo que falta sale de la utilidad** — no del buffer. La IA es un
> costo de empresa.
>
> ### El piso mensual de la empresa
>
> ```
> CEO                  Q2,400
> IA                   Q1,500
> Scraping             Q   47    ← 5 cuentas 🟨 a Q9.40
> ─────────────────────────────
> Piso mensual         Q3,947
> ```
>
> **Un solo cliente Marketing ya lo cubre** *(Q5,650 de utilidad)*.
>
> ---
>

#### 06-ECONOMIA.md · §4 Los paquetes y el volumen

> ## 4 · Los paquetes y el volumen
>
> | | 🔷 **MARKETING** | 🔷 **MARKETING PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
> |---|---|---|---|---|
> | **Precio / mes** | **Q7,315** *($950)* | **Q11,165** *($1,450)* | **Q19,250** *($2,500)* | **Q32,340** *($4,200)* |
> | **Unidad** | 1 marca | 1 marca | 1 marca | 1 marca |
> | **Qué promete** | Atención | Atención sostenida | **Facturación** | **Facturación sin el dueño** |
> | **Qué hacemos** | Que lo vean y lo entiendan | Que lo sostenga sin quedarse sin qué decir | **Rediseñamos la máquina** | **Construimos la máquina que se sostiene sola** |
> | **Qué incluye** | Marca · Mensaje · Contenido · Pauta · Community básico | + Video · Google · Creadores · Community diario | + Oferta · Conversión · Canales · SOPs · Tech · Mentor · WhatsApp a medida | + Operación · Estructura · Money OS · IA propia |
> | **Performance fee** | No aplica | No aplica | ✅ Incluido | ✅ Incluido |
>
> **Y `Tailor Made`** — multi-locación, regulatorio, integraciones, proyectos por hito. Precio según alcance.
>
> 🔑 **La unidad es 1 marca, no 1 cuenta de Instagram.** Los paquetes corren en varios canales.
> Marcas o locaciones adicionales son add-on.
>
> ### 📦 El volumen — la tabla que gana la venta
>
> | | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** | *Mercado Q3,000* |
> |---|---|---|---|---|---|
> | **Videos planificados** *(20 min c/u)* | 9 | 12 | 18 | 24 | *~4* |
> | **Videos derivados** *(mínimo 1:2)* | 4 | 6 | 9 | 12 | *0* |
> | **TOTAL videos — mínimo** | **13** | **18** | **27** | **36** | *~4* |
> | *TOTAL videos — tope (1:1)* | *18* | *24* | *36* | *48* | *—* |
> | **Estáticos y carruseles** | 43 | 72 | 63 | 88 | *~8* |
> | **Stories** | 30 | 55 | 55 | 80 | *~8* |
> | **TOTAL piezas/mes** | **86** | **145** | **145** | **204** | ***16*** |
> | | | | | | |
> | Grabación | **3 h** · 1 sesión | **4 h** · 2 sesiones | **6 h** · 2 sesiones | **8 h** · 3 sesiones | — |
> | Variantes de creativo por campaña | hasta 20 | hasta 30 | hasta 35 | hasta 50 | *0* |
> | Revisiones por pieza | 1 | 2 | 2 | 3 | *1* |
>
> > 🔑 **La regla de los 20 minutos.** Un video planificado se graba en **20 minutos si se graba
> > por SETUP y no por pieza.** Cada uno deja 5-7 escenas; las de apoyo se recombinan en derivados.
> >
> > **Se promete el MÍNIMO (1 derivado por cada 2 planificados).** El tope (1:1) es techo, no
> > promesa: se entrega solo si el material lo permite.
>
> 🔑 **El video es el 11-15% de las piezas y la mayor parte del costo de producción.** Lo demás
> sale de plantillas y del material ya grabado.
>
> ### El precio por pieza
>
> | | Precio | Piezas | **Q/pieza** |
> |---|---|---|---|
> | *Mercado* | *Q3,000* | *16* | ***Q188*** |
> | 🔷 **MARKETING** | Q7,315 | 86 | **Q85** |
> | 🔷 **MARKETING PRO** | Q11,165 | 145 | **Q77** |
> | 🟨 ACCELERATE | Q19,250 | 145 | Q133 |
> | 🟨 COMPOUND | Q32,340 | 204 | Q159 |
>
> **Qué incluye cada plan, las cuatro tarjetas publicadas y los pilares × divisiones × planes
> están en `03-OFERTA.md`.** Acá viven el techo de volumen, las capacidades y la economía.
>
> ---
>

#### 06-ECONOMIA.md · §5 La estrategia de bundle

> ## 5 · 🎯 La estrategia de bundle
>
> ### A · Dentro de la línea Marketing, el bundle sí es descuento
>
> **Marketing → Marketing Pro cuesta Q3,850 más.** Comprar lo mismo suelto, a precio de Extras:
>
> | Lo que agrega | À la carte |
> |---|---|
> | +28 estáticos y carruseles | Q1,680 |
> | +6 videos para pauta | Q1,500 |
> | +2 h de producción | Q500 |
> | Gestión de Google Ads | Q2,500 |
> | **TOTAL suelto** | **Q6,180** |
> | **En el bundle** | **Q3,850** |
>
> 👉 **38% menos** — sin contar stories, creadores ni community, que no se venden sueltos.
>
> **Por qué se puede:** el costo fijo de Pro es solo **Q890 más** que el de Marketing.
>
> ### B · El salto a Growth NO es descuento — es acceso
>
> **Marketing Pro → Accelerate cuesta Q8,085 más, y entrega las mismas 145 piezas.** Nada de lo
> que agrega se vende à la carte, a propósito:
>
> | Lo que agrega | Por qué no se vende suelto |
> |---|---|
> | La oferta y el precio rediseñados | **No es un entregable, es criterio.** Sin conocer el negocio adentro, no se puede |
> | Canales grandes abiertos | Necesita material de ventas, outreach y seguimiento — eso es Conversion OS |
> | Que nadie se pierda | Requiere la atribución y el embudo montados antes |
> | SOPs de crecimiento | Solo se documenta lo que ya se vio funcionar |
> | La auditoría del especialista de la industria | La membresía es de Inherent y sirve a todos los clientes de esa industria |
>
> > 🔑 *«No estás comprando más contenido — estás comprando que ese contenido se cobre.»*
>
> ### C · Qué pasa con el margen en cada salto
>
> | Salto | Precio + | Costo + | **Utilidad +** | Margen del salto |
> |---|---|---|---|---|
> | Marketing → Pro | +Q3,850 | +Q890 | **+Q2,960** | 77% |
> | **Pro → Accelerate** | **+Q8,085** | **+Q3,145** | **+Q4,940** | 61% |
> | Accelerate → Compound | +Q13,090 | +Q3,100 | **+Q9,990** | 76% |
>
> 👉 **Cada salto suma utilidad.** Por eso el movimiento comercial es **subir a los clientes que ya
> están, no sumar clientes nuevos.**
>
> 🔑 **Pro → Accelerate es el salto de menor margen** porque ahí entran el especialista y las dos
> auditorías. **Igual suma casi Q5,000 de utilidad por cliente.**
>
> ### D · El dolor que dispara el upsell
>
> | Plan | El dolor que aparece a los 3-6 meses |
> |---|---|
> | 🔷 **MARKETING** | *«Ya me ven, pero no doy abasto con el contenido / quiero video en serio»* → **Pro** |
> | 🔷 **MARKETING PRO** | *«Llegan mensajes y no se cierran»* → **Accelerate** |
> | 🟨 **ACCELERATE** | *«Funciona, pero todo pasa por mí»* → **Compound** |
>
> 🔑 **El upsell se vende con el diagnóstico, no con el catálogo.**
>
> ### E · La regla de diagnóstico
>
> | Si el negocio… | Va a |
> |---|---|
> | No lo conocen, y convierte bien lo poco que llega | 🔷 **MARKETING** |
> | Ya lo conocen, y solo quiere sostener presencia | 🔷 **MARKETING PRO** |
> | **Tiene tráfico y no lo cobra** | 🟨 **ACCELERATE** |
> | Funciona y depende del dueño | 🟨 **COMPOUND** |
>
> 🔑 **Si la empresa es el estorbo, más demanda empeora el problema.** Se arregla la capacidad
> primero, aunque la venta fácil sea más pauta.
>
> **Si el cliente se queda en Marketing, ganamos igual:** deja 77% con 1 cliente o con 20. Es el
> plan que gana la cuenta, y la cuenta se sube cuando aparece el dolor.
>
> ### F · Lo que NO se desagrega
>
> | | |
> |---|---|
> | **La estrategia** | Los cuatro planes la incluyen. Cambia la profundidad, no la existencia |
> | **La marca** | No se vende un logo suelto |
> | **Los pilares de Growth** | No se vende «solo el Pilar 2». Crecer exige algo íntegro |
> | **La atribución** | No es un extra: es el requisito del performance fee |
>
> 🔑 **Lo que no se vende suelto es una capa disfrazada de crecimiento.** La línea Marketing vende
> atención **y lo dice en la tarjeta.**
>
> ---
>

#### 06-ECONOMIA.md · §6 El performance fee, el múltiplo y la facturación mínima por plan

> ## 6 · 💸 El performance fee
>
> > **Ganamos de hacerles dinero.** El fee base cubre la operación. **La utilidad de verdad sale
> > del crecimiento que producimos.**
>
> **Fee: 10% de las ventas atribuidas directamente a nuestro trabajo. Solo en la línea Growth.**
> **Tiene costo marginal Q0:** no agrega producción, ni horas, ni IA. Cada quetzal de fee es
> utilidad.
>
> | Fee mensual | Ventas atribuidas que lo producen | Margen de 🟨 Accelerate | Margen de 🟨 Compound |
> |---|---|---|---|
> | Q0 *(solo base)* | — | **70%** | **73%** |
> | Q1,500 | Q15,000 / mes | **73%** | **74%** |
> | **Q3,000** | **Q30,000 / mes** | **74%** | **75%** |
> | Q5,000 | Q50,000 / mes | **76%** | **76%** |
> | Q8,000 | Q80,000 / mes | **79%** | **78%** |
>
> > **Q30,000 al mes de ventas atribuidas es un objetivo modesto** para un negocio que factura
> > Q257,000+, que es el piso desde el que Accelerate tiene sentido.
>
> ### Las reglas del fee
>
> | | |
> |---|---|
> | **Qué cuenta** | Ventas que produjimos directamente — pauta, embudo, campaña, contenido rastreable |
> | **Qué NO cuenta** | Tráfico orgánico preexistente, referidos del cliente, ventas de su fuerza comercial |
> | **Cómo se mide** | Meta CAPI + GA4 + enlaces y códigos rastreables |
> | **Requisito** | **Sin atribución limpia no hay fee.** Por eso no existe en la línea Marketing: no incluye Conversion OS |
> | **Se cobra** | El mes siguiente, sobre lo efectivamente vendido |
>
> ### El múltiplo
>
> **El múltiplo es modelo, no evidencia.**
>
> **Supuestos:** 2 meses de arranque sin lift · el lift sube lineal hasta su techo en el mes 12 ·
> margen del cliente 30%.
>
> | | Toca | Techo a 12 m | En «x» | **+25% llega en** |
> |---|---|---|---|---|
> | 🔷 **MARKETING** | atención | +30% | **1.3x** | mes 11 |
> | 🔷 **MARKETING PRO** | atención + volumen | +45% | **1.45x** | mes 8 |
> | 🟨 **ACCELERATE** | oferta + conversión + canales | +70% | **1.7x** | mes 6 |
> | 🟨 **COMPOUND** | todo + que corra sin el dueño | +100% | **2x** | mes 5 |
>
> 🔑 El mismo +25% tarda **el doble** en la línea Marketing.
>
> ### Desde qué facturación tiene sentido cada plan
>
> | | Cuesta / mes | Se paga solo con | **Factura al menos** |
> |---|---|---|---|
> | **MARKETING** | Q7,315 | Q24,383 de venta nueva | **Q98,000** |
> | **MARKETING PRO** | Q11,165 | Q37,217 | **Q149,000** |
> | **ACCELERATE** | Q19,250 | Q64,167 | **Q257,000** |
> | **COMPOUND** | Q32,340 | Q107,800 | **Q431,000** |
>
> 🔑 **Es filtro de calificación, no solo argumento de precio.** Decirle a un cliente *«este plan
> todavía no es para ti»* vende el siguiente mejor que cualquier otra cosa.
>
> ---
>

#### 06-ECONOMIA.md · §7 Scraping — la cuenta por plan

> ### Cuánto cuesta — la cuenta
>
> **La investigación se hace por plataforma del cliente**, con el volumen que fija el plan contratado:
> **50 contenidos** por plataforma en 🔷 Marketing y Mkt Pro, **100** en 🟨 Accelerate y Compound.
> Mitad competencia, mitad referencias. Precios del **plan Free**, por cada 1,000.
>
> ```
> 🔷 MARKETING · MKT PRO  —  50 contenidos × 3 plataformas
>      anuncios     50 × $5.80 / 1,000  =  $0.29
>      TikTok       50 × $3.70 / 1,000  =  $0.185
>      Instagram    50 × $2.70 / 1,000  =  $0.135
>                                         ───────
>                                          $0.61  por cliente al mes
>
> 🟨 ACCELERATE · COMPOUND — 100 contenidos × 3 plataformas
>                                          $1.22  por cliente al mes
> ```
>
> 🔑 **Es el costo real, no el tope.** El tope de US$5 por cliente es **límite de seguridad**: si una
> cuenta se le acerca, algo se está pidiendo mal.
>
> 🆓 **Los US$5 gratis de Apify son por organización, no por cliente.** Alcanzan para **~4 cuentas de
> 🟨 Growth** *(a $1.22)* o **~8 de 🔷 Marketing** *(a $0.61)*; **se planifica con 4-5.** Pasado eso,
> hace falta plan pago.
>
> | Regla | Qué dice |
> |---|---|
> | **Tope por cliente** | **$5 al mes — límite de seguridad**, no presupuesto. El gasto real es menos de $1.30. Si se acerca al tope, se revisa qué se está pidiendo |
> | **YouTube** | Solo con pregunta concreta. Es el que más rápido se come el presupuesto |
> | **Nada «por si acaso»** | Cada corrida responde una pregunta del workflow |
> | **Solo datos públicos** | No se usan cuentas del cliente ni se guardan datos personales que no hagan falta |
> | **Si un actor falla** | Se busca otro en el store el mismo día. No se bloquea la entrega |
> | **Topes en los tres actores** | **Siempre** `resultsLimit` y `maxTotalChargeUsd`. Cobran por contenido: un run sin freno se come el tope del cliente |
> | **Volumen por ciclo** | **Por plataforma del cliente**, según el plan: 50 · 50 · 100 · 100. Las plataformas salen de `plan-por-canal.md` de ③ Marketing |
> | **Lectura profunda** | Se scrapean todos; **solo 10-15 pasan** a disección. Scrapear es barato, leer a fondo no |
> | **Las dos capas** | **Competencia solo Guatemala** (`country=GT`); **referencias ganadoras** de países parecidos, con la lista fija de `cr-fuentes`. **No se mezclan en el mismo archivo** |
>
> ---
>

#### 06-ECONOMIA.md · §8 Contra el mercado (dónde caía cada plan)

> ## 8 · Contra el mercado
>
> > **El costo de entregar una cuenta es el mismo desde cualquier mercado — lo único que cambia
> > es el precio.** Ver `04-MERCADO.md`.
>
> ### 🔷 La línea Marketing — contra agencias
>
> | Rango del mercado | Piezas típicas | Dónde caemos |
> |---|---|---|
> | Básico Q1,000 - 3,000 | ~16 | — |
> | Intermedio Q3,000 - 6,000 | ~25 | — |
> | **Avanzado / 360° Q6,000 - 8,000+** | ~40 | **🔷 MARKETING Q7,315 · 86 piezas** |
> | *(arriba del techo del mercado)* | — | **🔷 MARKETING PRO Q11,165 · 145 piezas** |
>
> **Marketing entra en el techo de lo que cobra una agencia, con 2 a 5 veces su volumen.**
>
> | | Ellos | Nosotros |
> |---|---|---|
> | Mismo precio | 16-40 piezas | **86 piezas** |
> | Mismo precio | Sin estrategia | **Estrategia completa** |
> | Mismo precio | Sin inteligencia de competencia | **Radar mensual** |
> | Mismo precio | Pauta a veces | **Meta + TikTok** |
>
> ### 🟨 La línea Growth — contra consultoría
>
> | CMO fraccional | Rango |
> |---|---|
> | Etapa temprana | **$3,000 – $5,000 / mes** |
> | Sweet spot | **$8,000 – $12,000 / mes** |
> | Por hora | $200 – $500 |
>
> | | Precio | Contra el mercado |
> |---|---|---|
> | 🟨 **ACCELERATE** | **$2,500** | Debajo del piso de consultoría |
> | 🟨 **COMPOUND** | **$4,200** | En el piso, **con la ejecución incluida** |
>
> 🔑 **Un CMO fraccional entrega criterio y nada más. Nosotros entregamos criterio + piezas +
> pauta + tecnología.** Y como un precio debajo del piso también señala junior, el discurso de
> Growth **nunca** es *«somos más baratos»* — es *«decidimos y ejecutamos.»*
>
> ---
>

#### 06-ECONOMIA.md · §9 Reglas, escalera de precio y extras con precio

> ## 9 · Reglas y extras
>
> ### Reglas
>
> | | |
> |---|---|
> | **Unidad** | 1 paquete = 1 marca. Marca o locación adicional = add-on |
> | **Inversión publicitaria** | **Nunca incluida.** La pone el cliente, aparte. Sin ad spend no hay pauta |
> | **Modelos, props y locaciones** | No incluidos |
> | **Grabación** | Techo duro: las horas del paquete. No escala con agentes |
> | **Sesiones de grabación** | Según el paquete. **No se acumulan** de un mes a otro |
> | **Piezas** | El volumen del paquete es máximo mensual. No se acumula |
> | **Herramienta a medida** | El CEO define el alcance **antes** de empezar. Si no cabe en el rubro Operador, se cotiza como extra |
> | **Fuera de brief o calendario aprobado** | Se cotiza extra. **No se absorbe** |
> | **Lo que no está en Capacidades reales** | **No se promete.** Ni en la venta, ni por un agente |
>
> ### La escalera de precio
>
> | Situación | Precio |
> |---|---|
> | **Todo cliente** | Precio de lista, sin excepción |
>
> **El gatillo para subir precios otra vez:**
>
> | # | Condición |
> |---|---|
> | 1 | **3 casos con números medidos**, publicables |
> | 2 | **Capacidad al 80%** |
> | 3 | **Un mes corrido** al volumen prometido, sin quemar al equipo |
>
> ### Extras
>
> | Extra | Precio |
> |---|---|
> | Marca o locación adicional | +60% del paquete |
> | Cuenta de red social adicional | Q1,500 |
> | Hora extra de producción | Q250 |
> | Reel extra simple | Q175 |
> | Reel extra para pauta | Q250 |
> | Paquete de 20 estáticos extra | Q1,200 |
> | Auditoría de cuenta | Q750 |
> | Campaña puntual | Q3,500 |
> | Branding básico | Q4,500 |
> | Cobertura de evento | Q3,500 |
> | Herramienta a medida adicional | Desde Q6,000 |
> | Setup de embudo de WhatsApp | Q8,000 |
> | Dashboard en vivo *(build)* | Q6,000 |
> | IA propia del cliente *(build)* | Q12,000 |
> | Gestión de Google Ads | Q2,500 / mes |
> | Radar de competencia semanal | Q750 / mes |
> | Sesión de dirección extra | Q1,000 |
>
> 🔑 **Estos precios sostienen la tabla à la carte del bundle.** Si cambia uno, se recalcula el
> ahorro de los saltos.
>
> ---
>

#### 06-ECONOMIA.md · §10 La parte pública (precios, piezas y metas por plan)

> ## 10 · 🌐 La parte pública
>
> > **Esto es lo único de este archivo que puede salir.** El texto exacto de las cuatro tarjetas
> > está en `03-OFERTA.md` — esa es la fuente.
>
> | | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
> |---|---|---|---|---|
> | **Precio / mes** | **$950** | **$1,450** | **$2,500** | **$4,200** |
> | **Qué promete** | Atención | Atención sostenida | **Facturación** | **Facturación sin el dueño** |
> | **Para quién** | No te conocen | Te conocen y quieres sostenerlo | **Llega gente y se pierde** | Funciona, pero todo pasa por ti |
> | **Piezas / mes** | **86** | **145** | **145** | **204** |
> | **Meta a 12 meses** | 1.3x | 1.45x | 1.7x | 2x |
> | **Performance fee** | — | — | ✅ Incluido | ✅ Incluido |
>
> **Y `TAILOR MADE`** — multi-locación, regulatorio, integraciones o proyectos por hito. *Precio
> según alcance.*
>
> ### ⛔ Lo que nunca está incluido
>
> - **Inversión publicitaria** — la pone el cliente, aparte
> - Modelos, props y locaciones

#### 05-OPERACION.md · §6 Lo que cuesta cada rol (por plan)

> ## 6 · Lo que cuesta cada rol
>
> > **Cada cuenta paga un monto fijo a cada rubro, según su plan.** No es estimación: **es el
> > techo.** El detalle económico completo está en `06-ECONOMIA.md`.
>
> | Rubro | 🔷 Marketing | 🔷 Pro | 🟨 Accelerate | 🟨 Compound |
> |---|---|---|---|---|
> | **Grabación** | Q450 *(3 h · Q150/h)* | Q560 *(4 h · Q140/h)* | Q780 *(6 h · Q130/h)* | Q960 *(8 h · Q120/h)* |
> | **Fotografía** | Q300 *(1 h)* | Q300 *(1 h)* | Q300 *(1 h)* | Q300 *(1 h)* |
> | **Edición de video** | Q200 | Q500 | Q700 | Q1,000 |
> | **Operador de agentes** | Q350 | Q550 | Q900 | Q1,400 |
> | **Herramientas / IA** | Q150 | Q200 | Q300 | Q500 |
> | **Especialista** *(auditoría con el mentor)* | — | — | Q1,000 | Q2,000 |
> | **Auditoría conta** | — | — | Q600 | Q900 |
> | **Auditoría admin** *(SOPs)* | — | — | Q600 | Q900 |
> | **Buffer** | Q215 | Q445 | Q520 | Q840 |
> | **COSTO** | **Q1,665** | **Q2,555** | **Q5,700** | **Q8,800** |
>
> ### Lo que entrega cada rol, por plan
>
> | Rol | 🔷 Marketing | 🔷 Pro | 🟨 Accelerate | 🟨 Compound |
> |---|---|---|---|---|
> | **Producción** | 1 sesión · 3 h | 2 sesiones · 4 h | 2 sesiones · 6 h | 3 sesiones · 8 h |
> | **Fotografía** | 1 sesión | 1 sesión | 1 sesión | 1 sesión |
> | **Editor de video** | 9 planificados + 4 derivados | 12 + 6 | 18 + 9 | 24 + 12 |
> | **Operador** *(estáticos y carruseles)* | 43 | 72 | 63 | 88 |
> | **Operador** *(stories y recortes)* | 30 | 55 | 55 | 80 |
>
> ### Las reglas del costo
>
> | Regla | Qué dice |
> |---|---|
> | **El costo es fijo por plan y por rubro** | No se estima, no se promedia, no se pasa. **No cambia con el número de clientes** |
> | **La tarifa baja con las horas** | A más horas por cuenta, menor tarifa por hora — más volumen para la persona |
> | **La producción no se baja recortando horas** | Si el monto no alcanza, **se cambia la mezcla** *(más derivados, contenido crudo del cliente)* **o se cotiza extra** |
> | **Una cuenta que consume más** | Se cotiza extra o sube de plan. **Nunca se absorbe** |
> | **CEO y COO no son rubro** | Cobran de la utilidad. Sus horas son capacidad |
> | **El buffer es el colchón** | Cubre los imprevistos: regrabar, una revisión extra, una pieza que se cae |
>
> ### El acuerdo con cada persona
>
> > **Se firma una vez, con los montos por plan escritos. No se renegocia en cada cliente nuevo.**
>
> | Cláusula | Qué dice |
> |---|---|
> | **Monto por cuenta** | El de su rubro, según el plan de cada cuenta. **Es fijo** |
> | **Qué incluye** | Lo que el plan promete de ese rubro — ni más, ni menos |
> | **Si una cuenta pide más** | Se cotiza extra al cliente o se sube de plan |
> | **Revisión** | Solo si cambia la tabla de costos del plan. **No por volumen** |
>
> ---
>

#### 05-OPERACION.md · §3 Pipeline: la columna «Corre en» por plan

> | # | Etapa | Recibe | Entrega | Corre en |
> |---|---|---|---|---|
> | **00** | **Account** | El cliente | La relación diaria. **El único que le habla** | Todos |
> | **01** | **Strategy** | La información cruda del negocio | Comprensión del negocio + estrategia + un brief por área | Todos · ligera en 🔷 · completa en 🟨 |
> | **01.2** | **Branding** | La estrategia | Guía de marca: territorio, voz, sistema visual, activos | Todos |
> | **02** | **Growth** | La estrategia | Oferta, canales grandes, upsells, conversión y números | Solo 🟨 |
> | **03** | **Marketing** | Estrategia y marca | Plan del ciclo: campañas, pilares, canales y calendario de slots | Todos |
> | **04** | **Creative** | El plan del ciclo | Ideas listas para producir: hook, copy, escenas y layout | Todos |
> | **05** | **Production** | Las ideas aprobadas | Material grabado y fotografiado | Todos |
> | **06** | **Graphic Design** | Ideas, marca y material | Estáticos, carruseles y stories | Todos |
> | **07** | **Video Editing** | El material grabado | Reels y todas sus derivadas | Todos |
> | **08** | **Community** | Lo publicado y lo que entra | Comentarios y mensajes atendidos | Todos · básico en 🔷 Marketing |
> | **09** | **Posting** | Lo aprobado | Contenido programado o publicado | Todos |
> | **10** | **Ads** | Lo apto para pauta | Campañas activas y su reporte | Todos |
> | **↻** | **Strategy** | La analítica del mes | El ajuste de estrategia que entra al ciclo siguiente | Todos |

#### 05-OPERACION.md · §5 Quién hace qué (columna «Dónde» por línea y plan)

> ## 5 · Quién hace qué
>
> > 🔷 = línea Marketing *(Marketing y Pro)* · 🟨 = línea Growth *(Accelerate y Compound)*
>
> ### Cliente
>
> | Tarea | Rol | Dónde |
> |---|---|---|
> | **Reunión del día 1** | **CEO** | Todos |
> | **Comunicación diaria** | **Secretaria** → escala al **COO**. Al CEO solo le llega precio, alcance o estrategia | Todos |
> | **Presentar las piezas del día 20** | **COO** en 🔷 · **CEO** en 🟨 | Todos |
> | **Sesión de dirección** | **CEO** | 🟨 Accelerate mensual · Compound quincenal |
>
> ### Estrategia
>
> | Tarea | Rol | Dónde |
> |---|---|---|
> | Estrategia inicial y revisión del 20 | Agentes ① Strategy → **CEO aprueba** | Todos |
> | Ajuste de la estrategia | **CEO** | Todos |
> | **Aprobar ideas y calendario** | **CEO** | Todos |
> | Replanteo trimestral | **CEO** | 🟨 Compound |
>
> ### Oferta y conversión
>
> | Tarea | Rol | Dónde |
> |---|---|---|
> | Rediseño de oferta, paquetes y precio | ② Growth + **CEO** | 🟨 |
> | Abrir canales grandes | ② Growth + **CEO** | 🟨 |
> | Upsells y escalera de ticket | ② Growth · Operador | 🟨 |
> | Embudos, auto-DM, atribución y pruebas A/B | Agentes · Operador | 🟨 |
> | Entrenamiento de closing | **CEO** | 🟨 |
>
> ### Producción y contenido
>
> | Tarea | Rol | Dónde |
> |---|---|---|
> | **Coordinar producción, fotografía y edición** | **COO** | Todos |
> | Grabar | **Producción** | Todos |
> | Fotografiar | **Fotografía** | Todos |
> | Editar los videos y sus derivadas | **Editor de video** | Todos |
> | Estáticos, carruseles y stories | **Operador** con ⑥A Diseño gráfico | Todos |
> | Correr Creatividad, Branding, Diseño, Posting y Community | **Operador** | Todos |
> | **QA final** | Agentes *(`br-guardian`)* → **COO** | Todos |
>
> ### Publicación, comunidad y pauta
>
> | Tarea | Rol | Dónde |
> |---|---|---|
> | Programar y publicar | **Operador** con ⑨ Posting | Todos |
> | **Comentarios y mensajes** | **Operador:** una vez al mes configura el agente con la información del cliente, y el agente queda atendiendo. Escalera en `03-OFERTA.md` → «Community management» | Todos |
> | **Agente de WhatsApp a medida** | **CEO** define el alcance → **Operador** lo construye | 🟨 |
> | Pauta | **Operador** con ⑩ Ads · **CEO** aprueba plan y presupuesto | Todos |
>
> ### Tecnología
>
> | Tarea | Rol | Dónde |
> |---|---|---|
> | **Herramienta a medida** | **CEO** define el alcance → **Operador** la construye | 🟨 Accelerate 1 al trimestre · Compound 1 al mes |
> | **IA propia del cliente** | **CEO** define el alcance → **Operador** la construye | 🟨 Compound |
> | Landings, microsites y automatización de procesos | Agentes · Operador | 🟨 |
>
> ### Operación y auditoría
>
> | Tarea | Rol | Dónde |
> |---|---|---|
> | **Auditoría** *(negocio, números y SOPs)* | **Especialista** | 🟨 Accelerate trimestral · Compound mensual |
> | Decidir qué se implementa de la auditoría | **CEO + COO** | 🟨 |
> | SOPs de crecimiento, mapa de experiencia y LTV, documentación y entrenamiento | **COO** con agentes | 🟨 |
> | SOPs de empresa · Money OS | **CEO** | 🟨 Compound |
> | Corporate structure | **Especialista** *(auditoría)* | 🟨 Compound |
>
> ### Medición
>
> | Tarea | Rol | Dónde |
> |---|---|---|
> | Reporte mensual | Agentes · Operador | Todos |
> | Dashboard en vivo | Agentes · Operador | 🟨 |
>
> ---
>

#### 04-MERCADO.md · Cómo se elige el paquete y propósito de cada paquete

> ## Cómo se elige el paquete
>
> **Dos ejes deciden. Los dos se preguntan en el diagnóstico.**
>
> ### Eje 1 · En qué momento está el negocio
>
> *(Los tramos son los del diagnóstico de la web)*
>
> | Momento | Facturación / mes | Paquete |
> |---|---|---|
> | Aún no vendo | — | **Todavía no.** Primero producto y oferta |
> | **Construyendo** | $2k – $10k | 🔷 **Marketing** |
> | **Creciendo** | $10k – $50k | 🔷 Marketing Pro → 🟨 **Accelerate** |
> | **Escalando** | $50k – $100k | 🟨 **Accelerate** → 🟨 Compound |
> | **Consolidada** | $100k+ | 🟨 **Compound** |
>
> ### Eje 2 · Dónde se traba el crecimiento
>
> | El cuello está en… | Paquete | Verbo |
> |---|---|---|
> | **Nadie lo conoce.** Hay producto, no hay demanda | 🔷 **Marketing** | **ENCENDER** |
> | **Llega gente pero se pierde.** Hay demanda, no hay conversión | 🟨 **Accelerate** | **ACELERAR** |
> | **Funciona, pero todo depende de alguien.** Hay conversión, no hay sistema | 🟨 **Compound** | **COMPONER** |
>
> > 🔑 **Manda el eje 2.** Un negocio de $100k que nadie conoce va a Marketing, no a Compound.
> > **El dinero dice cuánto puede pagar. El cuello dice qué necesita.**
>
> ---
>
> ## El propósito de cada paquete
>
> ```
> 🔷 MARKETING — ENCENDER
>    Empezar el motor. Atraer, crear nombre y hacer las asociaciones correctas.
>    Mejora el MENSAJE, no la oferta.
>
> 🟨 ACCELERATE — ACELERAR
>    Crecer mucho más. Lead magnets, embudos, influencers, canales nuevos
>    y tecnología que quita fricción.
>
> 🟨 COMPOUND — COMPONER
>    Que cada mes construya sobre el anterior. Retención, LTV, sistemas propios
>    y autonomía real del cliente.
> ```
>
> ---

#### 04-MERCADO.md · El punto de partida · Guatemala (precio, costo y margen por plan)

> ### El punto de partida · Guatemala
>
> | | 🔷 Marketing | 🔷 Mkt Pro | 🟨 Accelerate | 🟨 Compound |
> |---|---|---|---|---|
> | **Precio** | $950 | $1,450 | $2,500 | $4,200 |
> | **Costo fijo por cuenta** | Q1,665 | Q2,555 | Q5,700 | Q8,800 |
> | **Margen** | **77%** | **77%** | **70%** | **73%** |
>
> **El costo no sube al cambiar de mercado.** Ver `06-ECONOMIA.md` → «Los costos por plan — fijos».
>

#### 04-MERCADO.md · La política del mentor y el margen final por plan

> ## La política — qué se absorbe y qué no
>
> | Plan | Qué incluye | Techo por sesión | **Rubro Especialista / mes** |
> |---|---|---|---|
> | 🔷 **Marketing** | **No lleva mentor ni especialista** | — | — |
> | 🔷 **Marketing Pro** | **No lleva mentor ni especialista** | — | — |
> | 🟨 **Accelerate** | Comunidad + **1 sesión por trimestre** · auditoría con el mentor | **$144** | **Q1,000** |
> | 🟨 **Compound** | Comunidad + **1 sesión al mes** · auditoría con el mentor | **$180** | **Q2,000** |
>
> *La membresía prorrateada, la auditoría y las sesiones salen del rubro Especialista. Las sesiones
> no usadas se acumulan dentro del trimestre.*
>
> Lo que sobra del rubro cubre un mentor un poco más caro o una segunda sesión puntual —
> **nunca uno arriba de $180.**
>
> > 🔑 **El mentor es exclusivo de la línea Growth.** Es el diferenciador que la justifica, y
> > meterlo en la línea Marketing rompería el margen del plan barato sin agregar lo que vende:
> > **en Marketing no hay estrategia que acompañar.**
>
> ### El margen final, con el mentor adentro
>
> | Plan | Precio | Costo fijo total | De eso, Especialista | **Margen** |
> |---|---|---|---|---|
> | 🔷 **Marketing** | Q7,315 | Q1,665 | — | **77%** |
> | 🔷 **Marketing Pro** | Q11,165 | Q2,555 | — | **77%** |
> | 🟨 **Accelerate** | Q19,250 | Q5,700 | Q1,000 | **70%** |
> | 🟨 **Compound** | Q32,340 | Q8,800 | Q2,000 | **73%** |
>
> > **Los cuatro quedan entre 70% y 77%, fijos.** El piso del modelo es **60%**: un plan que
> > baje de ahí con el especialista adentro está mal preciado. Ver `06-ECONOMIA.md`.
>

#### 04-MERCADO.md · Industria 06 Retail (fila con el número de estáticos)

> ## 06 · Retail
>
> | | |
> |---|---|
> | **Cómo gana** | Volumen de unidades, temporada, rotación de inventario |
> | **Dónde se traba** | Cada producto necesita contenido y **no hay capacidad de producirlo** |
>
> | | Qué hace acá |
> |---|---|
> | 🔷 **Marketing** | 🔥 **Acá el volumen es la ventaja decisiva.** **La sesión de foto del mes se planifica por colección** — 43 estáticos al mes cubren una colección entera |
> | 🟨 **Accelerate** | Catálogo en Meta y **Performance Max**. Recuperación de carrito. Influencers con código |
> | 🟨 **Compound** | Recompra y LTV. Dashboard de rotación conectado a la pauta |
>

#### 07-COMUNICACION.md · §3 La promesa anterior (titular y categoría)

> # 3 · La promesa
>
> ## El titular
>
> > # Aumentamos tus ventas construyendo el sistema que las sostiene.
>
> **Alternativas del mismo territorio:**
> - *Crecemos tu marca. Y arreglamos lo que impide que crezca.*
> - *No hacemos contenido. Hacemos que tu negocio crezca.*
>
> ## La categoría
>
> > ## Growth Partner
>
> **No somos agencia. No somos consultoría.**
>
> | | Qué hace | Dónde termina |
> |---|---|---|
> | Una **agencia** | Piezas | En el post |
> | Una **consultoría** | Un diagnóstico | En la recomendación |
> | **Inherent** | **Opera el crecimiento** | **En la venta** |
>
> > **La agencia hace piezas. La consultoría hace diagnósticos.
> > Nosotros hacemos que el negocio crezca — y nos quedamos adentro hasta que pasa.**
>
> ## La definición que cierra
>
> > **Inherent** · /ɪnˈhɪərənt/
> > *Que existe como parte natural, permanente e inseparable de algo.*
> >
> > **Tenemos todo lo que es inherente al crecimiento de tu negocio.**
> > **No un pedazo. Todo. Y lo operamos nosotros.**
>
> ---

#### 07-COMUNICACION.md · Hero con las tres señales de prueba

> ## Sección 1 · HERO
>
> **Objetivo emocional:** que en 3 segundos piense *«esto es para mí»*.
>
> ```
> Aumentamos tus ventas construyendo el sistema que las sostiene.
>
> Un solo equipo para tu marca, tu contenido, tu publicidad,
> tu tecnología y tus números.
>
> [ Ver en cuál estoy ]    [ Agenda 30 min ]
> ```
>
> **Debajo, tres señales de prueba:** `+42% leads calificados` · `3.1x retorno en adquisición` ·
> `−28% costo por lead en 90 días`
>
> ---

#### 07-COMUNICACION.md · Sección 5: los planes, precios, piezas y metas Nx de la web

> ## Sección 5 · LOS PLANES
>
> > **El texto oficial de las cuatro tarjetas está en `03-OFERTA.md`.** El repo no puede prometer
> > menos, más ni distinto que lo publicado.
>
> ### 🧭 Cómo se muestran cuatro planes sin abrumar
>
> **No se ponen cuatro tarjetas en fila.** Cuatro opciones lado a lado paralizan al que decide.
>
> **Se usa un toggle de dos opciones arriba de las tarjetas:**
>
> ```
> ┌──────────────────────────┬──────────────────────────┐
> │   Solo quiero marketing  │  Quiero crecer en serio  │
> └──────────────────────────┴──────────────────────────┘
>           ↓ 2 tarjetas               ↓ 2 tarjetas
>    MARKETING · MARKETING PRO   ACCELERATE · COMPOUND
> ```
>
> | Por qué funciona | |
> |---|---|
> | **Nunca ve más de dos precios a la vez** | Comparar dos es decidir. Comparar cuatro es postergar |
> | **El toggle hace la pregunta de calificación** | *«¿quieres marketing o quieres crecer?»* — él se clasifica solo |
> | **Separa el salto de precio** | $1,450 y $2,500 nunca se ven juntos, así que el salto no asusta |
> | **Deja el upsell abierto** | El que entra por marketing ya sabe que existe el otro lado |
>
> **Por defecto se abre en `Quiero crecer en serio`.** Es la línea que más utilidad deja por cuenta,
> y el que solo quiere marketing igual va a buscar su opción.
>
> **Debajo del toggle, una línea que une las dos:**
> > *Todos incluyen marca, contenido y campañas. Lo que cambia es qué tan adentro entramos.*
>
> ---
>
> ### 🔷 MARKETING · $950/mes — *Para el negocio que está arrancando*
> > *«Quiero que mi marca se vea como la imagino y que la gente sepa que existo.»*
>
> - Tu marca construida en serio: identidad, voz y una forma de verse que te dé orgullo
> - Tu mensaje claro, para que quien te lea te entienda y te quiera
> - Presencia todos los días, hecha por gente talentosa
> - Campañas donde está tu gente, en Meta y TikTok
> - Un reporte al mes de qué funcionó y qué sigue
>
> **→ Dejas de ser invisible.**
> **→ Apuntamos a 1.3x tu facturación en 12 meses.**
>
> ---
>
> ### 🔷 MARKETING PRO · $1,450/mes — *Para el negocio establecido que solo quiere marketing*
> > *«Ya me conocen. Quiero sostener presencia en serio y no quedarme sin qué publicar.»*
>
> - **Todo lo de Marketing**
> - El doble de video
> - Campañas en Meta, TikTok y Google
> - **Alianzas con creadores y marcas que ya tienen a tu audiencia**
> - Alguien cuidando tus comentarios y mensajes todos los días
> - Dos revisiones por pieza
>
> **→ Tu marca deja de depender de que a alguien se le ocurra qué subir.**
> **→ Apuntamos a 1.45x tu facturación en 12 meses.**
>
> ---
>
> ### 🟨 ACCELERATE · $2,500/mes — *Para el negocio que necesita más de lo que ya le funcionó*
> > *«Ya funciona, pero llegué a un techo y no quiero romper lo que me sirve.»*
>
> **Aquí no venimos a que te conozcan más. Venimos a que vendas más.**
>
> - **Todo lo de Marketing Pro**
> - **Tu oferta y tu precio rediseñados: qué vendes, en qué paquetes y por cuánto**
> - Abrimos los canales grandes: eventos, mayoreo y corporativos
> - Subimos tu ticket: combos, versiones, membresías y recompra
> - Nadie que te escribe se queda sin respuesta
> - Que te encuentren en Google y que tu equipo sepa cerrar
> - **Encontramos qué te funciona de verdad y lo volvemos repetible**
> - **Herramientas hechas para ti, una nueva cada trimestre**
> - **Un especialista de tu industria cada trimestre**
>
> **→ Lo que te funcionaba una vez ahora se repite, y ya no depende de que estés tú.**
> **→ Apuntamos a 1.7x tu facturación en 12 meses.**
>
> ---
>
> ### 🟨 COMPOUND · $4,200/mes — *Para el negocio que necesita que todo corra sin él*
> > *«Quiero que esto crezca sin que yo esté en todo, y que al final del mes quede dinero.»*
>
> **El freno ya no es el mercado: eres tú, tu equipo y tus números.**
>
> - **Todo lo de Accelerate, al máximo**
> - **Tu operación más liviana: una herramienta nueva cada mes**
> - Estructura corporativa: organigrama, qué puestos necesitas y quién decide qué
> - SOPs de toda la empresa: cómo funciona cada área y cómo entra alguien nuevo, sin depender de ti
> - Tus números claros: qué producto te deja y cuál te quita
> - Que el crecimiento se sostenga solo: referidos, comunidad y recompra
> - **Tu propia IA, entrenada con tu marca y tus datos**
> - **Un especialista de tu industria cada mes**
>
> **→ Te puedes ir una semana y la empresa factura igual, y cierra el mes mejor.**
> **→ Apuntamos a 2x tu facturación en 12 meses.**
>
> ---
>
> ### 📈 La línea del múltiplo — cómo se escribe
>
> **Va al final de cada tarjeta, en una sola línea, después del resultado.**
>
> | ❌ Nunca | ✅ Siempre |
> |---|---|
> | *«Multiplicamos tu facturación por 2»* | **«Apuntamos a 2x tu facturación en 12 meses»** |
> | *«Garantizamos 10x»* | **«Apuntamos a»** — es la meta contra la que trabajamos |
> | *«ROI del 670%»* | **Nada de porcentajes técnicos en la tarjeta** |
>
> > 🔑 **«Apuntamos a» no es decoración legal — es la verdad:** es la meta contra la que trabajamos.
> > **Decir «garantizamos» sin evidencia rompe la regla de `evidencia o etiqueta` y la credibilidad
> > el día que no pase.**
>
> **Lo técnico —desde qué facturación tiene sentido cada plan— va en la llamada, nunca en la web.**
> Ver `03-OFERTA.md` → «Para la llamada».
>
> ### Y una quinta, más discreta
> **TAILOR MADE** — *Para lo que no cabe en un molde.* Multi-locación, regulatorio, integraciones
> o proyectos por hito. **Precio según alcance.**
>
> > 🔑 **Precios siempre en USD.** **Nunca decir «Guatemala» como alcance.**
> > **Nunca mostrar costos, márgenes ni cantidad de piezas en la web.**
>
> ---
>
> ### 🔒 Qué NO puede cambiar sin recalcular la economía
>
> | Línea publicada | Qué toca |
> |---|---|
> | *«un especialista cada trimestre / cada mes»* | **La cadencia de mentores.** Solo línea Growth — ver `04-MERCADO.md` |
> | *«una herramienta nueva cada trimestre / cada mes»* · *«tu propia IA»* | **El build de tecnología.** El CEO define el alcance y el operador de agentes la construye. Sale del rubro Operador |
> | *«tus números claros»* | **Money OS.** Lo entrega el CEO con Strategy, no un CFO contratado |
> | *«estructura corporativa»* | **La cubre la auditoría** |
> | *«SOPs de toda la empresa»* | **El especialista audita, el CEO y el COO coordinan, el COO implementa con agentes** |
> | *«que te encuentren en Google»* | **Es pauta de búsqueda y contenido guiado por keywords.** Nunca posicionamiento orgánico, auditoría técnica ni link building |
> | *«presencia todos los días»* | **86 · 145 · 145 · 204 piezas.** El techo real es la grabación |
> | *«comentarios y mensajes» · «comunidad»* | **⑧ Community Management.** El operador de agentes hace cada mes el setup del agente con la info del cliente, y queda corriendo |
> | *«tu oferta y tu precio rediseñados»* | **Solo Growth.** Marketing trabaja el mensaje, no la oferta |
> | *«apuntamos a Nx»* | **El modelo del múltiplo.** Ver `06-ECONOMIA.md` → «El múltiplo» |
>
> ---

#### inherent/inherent-social-media y inherent/administracion

> **`inherent-social-media/00-onboarding/plan-contratado.md`** *(antes)*: Plan 🔷 **Marketing Pro** · Línea 🔷 Marketing · Piezas al mes 145 · Lo operan CEO y COO. «El techo de entrega es el de Marketing Pro en `inherent/06-ECONOMIA.md`.»
>
> **`inherent-social-media/README.md`** *(antes)*: `| **Plan** | 🔷 **Marketing Pro** — 145 piezas al mes |`
>
> **`inherent-social-media/CLAUDE.md`** *(antes)*: «**Plan Marketing Pro:** de la línea Growth solo lleva `07-oferta-y-ventas/ofertas-a-empujar.md`.»
>
> **`administracion/crm/README.md`** *(antes)*: `plan_de_interes` = Marketing · Marketing Pro · Accelerate · Compound · Tailor Made · `valor_mensual_usd` = El precio del plan: 950 · 1450 · 2500 · 4200 · lo cotizado
>
> **`administracion/shared/currency-and-locale.md`** *(antes)*: ejemplo de monto `Q7,315.00` / `GTQ 7,315.00`

#### PENDIENTES.md · filas que citaban planes *(antes de reescribirlas)*

> | 1 | **La métrica de crecimiento medible de la línea Marketing** | El slot ya está en `CLAUDE.md` y `03-OFERTA` |
> | 2 | **¿Qué argumento vende el salto Pro → Accelerate?** | Con los costos nuevos es el salto de menor margen (61%); suma ~Q4,940 de utilidad |
> | 6 | **Bloque «Lo básico vs. el valor único» de Marketing Pro** | `01-IDENTIDAD` lo tiene para Marketing, Accelerate y Compound, no para Pro |
> | 7 | **El margen de rodaje de cada plan** | Las horas contratadas son tiempo de cámara; ⑤ usa márgenes de referencia (60-90 / 30-45 / 45 min) mientras no se decida |
> | 2 | **⑧ en vivo con NAO y Akai:** una semana en modo borrador, después envío activo. Corre con Claude Code y el plan de la empresa en el VPS; si el plan no alcanza, una API de IA | Community en los cuatro planes |
> | 3 | **⑨ Posting con Zernio en una cuenta real:** programar, publicar y reintentar las fallidas | La publicación de todos los niveles |
> | 9 | **Herramienta a medida e IA propia** | Accelerate y Compound |
> | 12 | **Un mes completo al volumen prometido** *(86 / 145 / 145 / 204)* | Que el volumen sea capacidad probada |
> | 1 | **Las horas reales de cada rol por plan** *(COO, operador, editor, fotografía, producción)* | Confirmar que cada monto fijo alcanza y cuántas cuentas aguanta cada rol |
> | 3 | **El onboarding de Accelerate y Compound** *(tareas y horas)* | Hoy solo Marketing y Pro tienen desglose |
> | 1 | **Firmar con cada persona el monto fijo por plan** de su rubro |

#### Texto viejo suelto de otras zonas *(CLAUDE.md, agents/, ceo-os y demás; verbatim)*

##### Fuente: `old-zona-A1.md`

# Zona A1 — economía del esquema anterior (4 planes), VERBATIM

## CLAUDE.md líneas 139-306 (techo comercial, planes, economía, costos fijos)
```
## El techo comercial

**`inherent/06-ECONOMIA.md`** define qué se puede entregar según el plan contratado: cuántas
piezas, qué canales, qué capas entran y cuántas revisiones. **Es restricción dura para todos los
agentes.** Se lee antes de prometer nada.

### Dos líneas, cuatro planes

```
🔷 MARKETING      $950     86 piezas    arrancando → visible
🔷 MARKETING PRO  $1,450   145 piezas   visible → presencia sostenida
🟨 ACCELERATE     $2,500   145 piezas   estancado → escalando
🟨 COMPOUND       $4,200   204 piezas   escalando → autónomo
```

**Más `Tailor Made`** — multi-locación, regulatorio, integraciones, proyectos por hito.
**Un Tailor Made no se cuestiona:** en el onboarding se define **qué incluye y su pipeline** —qué
departamentos corren, en qué orden y a qué nivel— y los agentes lo siguen.

🔑 **El eje es qué promete cada línea, no cuánto entrega:**
**🔷 Marketing promete ATENCIÓN** *(compite con agencias)* · **🟨 Growth promete FACTURACIÓN**
*(compite con consultoría y CMO fraccional)*.

🔑 **Marketing Pro y Accelerate entregan las mismas 145 piezas, a propósito.**
El salto **no compra contenido — compra sistemas**: oferta, precio, conversión, canales y SOPs.
**Venderlo como «más piezas» es venderlo mal.**

🔷 **La línea Marketing apunta a un crecimiento medible:** *(métrica — slot)*

🚀 **Somos un acelerador de marcas. Cada plan es un BOOST distinto, no más volumen del anterior.**
**Accelerate NO es «que te conozcan más».** Ese comprador ya se siente estancado y **teme romper
lo que le funciona.**

**Dos divisiones — el eje es cómo se decide la compra, no quién compra:**

```
🔵 LOW TICKET    volumen      oferta · big sales · upsells
🟣 HIGH TICKET   precisión    oferta · cuentas grandes · expansión
```

**Los pilares no cambian — son la metodología. Cambia el verbo:**
Accelerate **ejecuta** · Compound **sistematiza**. **La línea Marketing no activa pilares** —
ejecuta atención. Ver `inherent/03-OFERTA.md`.

### Los cuatro sistemas

```
GROWTH OS       de dónde sale el crecimiento  →  los 3 pilares de cada división
CONVERSION OS   que ese crecimiento se cobre
OPERATIONS OS   que la empresa lo aguante
MONEY OS        que quede utilidad
```

**Una agencia solo trabaja el primero.** Por eso sus clientes crecen y se rompen.

| | 🔷 MARKETING | 🔷 MKT PRO | 🟨 ACCELERATE | 🟨 COMPOUND |
|---|---|---|---|---|
| **Ejecución de marketing** | ✅ | ✅ Mayor volumen | ✅ | ✅ Máximo |
| **Growth OS** | — | — | Los 3 ejecutando | Los 3 sistematizados |
| **Conversion OS** | — | — | ✅ | ✅ |
| **Operations OS** | — | — | SOPs **de crecimiento** | SOPs **de empresa** |
| **Money OS** | — | — | — | ✅ |

🔑 **Un sistema entra cuando el negocio tiene con qué alimentarlo.** Conversion no entra en la
línea Marketing porque **antes no hay nada que perder**; Operations porque **no se puede
documentar un proceso que todavía no funcionó**; Money porque **sin transacciones el margen por
línea es teoría.** **Meterlo antes es cobrar por algo que no se puede usar.** Ver
`inherent/02-METODO.md`.

**Seis capacidades bajo un techo:** 📣 Marketing · 🎨 Creative · 🎬 Production · 🏷️ Branding ·
🔧 Tech · 📊 Consulting. **Strategy debe conocer las seis** para decidir qué activar.

🎓 **La red de especialistas es el diferenciador que más pesa.**
**Por industria** *(externos — MentorCruise · GrowthMentor · MentorPass)*: gente que ya creció su
marca ahí y responde *«¿qué harías si esta fuera tu empresa?»*. **El mentor hace la auditoría.**
**Por área** *(nuestros)*: corporate structure, eventos, networking y PR, talent production,
talent marketing. **Red, no nómina.**
🔑 **Tres reglas lo hacen rentable:** **el mentor es exclusivo de la línea Growth** — meterlo en
Marketing rompe el margen del plan barato · **trimestral en Accelerate**, mensual en Compound ·
**la membresía se paga anual y es de Inherent** *(sirve a todos los clientes de esa industria,
−41% de costo)*. **Arriba de $180/sesión no se absorbe: va como add-on facturado al cliente.**
Ver `inherent/04-MERCADO.md`.

## Lo que entrega cada línea

**El texto de las cuatro tarjetas y qué respalda cada línea están en `inherent/03-OFERTA.md`.**
**La web vive en su propio repo.**

«Tus números claros» lo entrega **Money OS** con el CEO y Strategy.
**Corporate structure** lo cubre la auditoría del especialista.

---

💚 **Un emprendedor no contrata sistemas. Contrata a alguien que cuide lo que construyó.**
**No industrializamos empresas: les damos alma, propósito y facturación.**
**Se le habla de lo que DESEA, no de lo que la industria dice que necesita.** Ver `inherent/03-OFERTA.md`.

🚫 **No vendemos servicios. Vendemos resultado.** *"Te damos SOPs"* ❌ ·
*"Te puedes ir una semana y la empresa factura igual"* ✅
**El volumen y las herramientas son la EVIDENCIA de que podemos — nunca la oferta.**

🔑 **El precio se justifica por cuántos sistemas activamos y qué tan adentro entramos.**
**Nunca por volumen de entregables.**

🔑 **La etapa no es mérito, es realidad:** lo que el cliente puede pagar dice en qué etapa está,
y la etapa dice qué necesita.

🔑 **Si la empresa es el estorbo, más demanda empeora el problema:** se arregla la capacidad
primero, aunque la venta fácil sea más pauta.

### La economía

**La estrategia de precio es matarlos con valor, no cobrar más.** Los precios están **dentro del
rango que el mercado ya acepta**, con 3x a 5x el volumen de su tramo.

🌐 **Guatemala es dónde arrancamos, no el techo.** Los costos se pagan en quetzales y no cambian
al cambiar de mercado; **lo único que cambia es el precio.** Ver `inherent/04-MERCADO.md`.
El plan de entrada da **86 piezas a Q7,315 (Q85/pieza)** contra las ~16 de un paquete de Q3,000
**(Q188/pieza)**.

**El volumen nos separa del mercado. La profundidad separa las líneas entre sí.**

**Dentro de Marketing el bundle sí es descuento** *(38% menos que comprar suelto)*.
**El salto a Growth NO es descuento — es acceso:** nada de lo que agrega se vende à la carte.
**El movimiento comercial es subir a los clientes que ya están, no sumar clientes nuevos.**

**Ganamos de hacerles dinero.** El fee base cubre la operación; **la utilidad de verdad sale del
performance fee — 10% de las ventas atribuidas, con costo marginal Q0.** Cada quetzal de fee es
utilidad pura. **Sin atribución limpia no hay fee — y por eso no existe en la línea Marketing.**

**Los cuatro objetivos a la vez: costos bajos · valor enorme · precio justo · márgenes
altísimos.** Cierran **no bajando el precio, con el costo fijo.**

🔒 **El costo de cada plan es FIJO, por cuenta y por rubro — no es estimación.**

```
              GRABAC.  FOTO   EDICIÓN  OPERADOR  HERRAM.  ESPECIAL.  AUDIT.   BUFFER   COSTO    MARGEN
🔷 MARKETING   Q450    Q300    Q200     Q350      Q150       —         —      Q215    Q1,665    77%
🔷 MKT PRO     Q560    Q300    Q500     Q550      Q200       —         —      Q445    Q2,555    77%
🟨 ACCELERATE  Q780    Q300    Q700     Q900      Q300     Q1,000    Q1,200   Q520    Q5,700    70%
🟨 COMPOUND    Q960    Q300   Q1,000   Q1,400     Q500     Q2,000    Q1,800   Q840    Q8,800    73%
```

**El margen no cambia con el número de clientes.** Si una cuenta consume más, se cotiza extra o
sube de plan — **nunca se absorbe.** Ver `inherent/06-ECONOMIA.md` → «Los costos por plan — fijos».
🔑 **El CEO y el COO no son rubro:** cobran de la utilidad. Sus horas son **capacidad**, no costo.

🔑 **Cada cuenta paga a cada rubro el monto fijo de su plan.** Se firma una vez con cada
persona y no se renegocia por cliente. Ver `inherent/05-OPERACION.md` → «Lo que cuesta cada rol».

🔑 **La producción no se baja recortando horas** — eso es bajarle el precio a la persona por el
mismo trabajo. Si el monto no alcanza, **se cambia la mezcla** *(más derivados, contenido crudo
del cliente)* **o se cotiza extra.**

🔑 **Esto exige agentes que trabajen entre autónomos y dirigidos:** que levanten excepciones, no
preguntas. **Si el agente pregunta todo, no ahorra nada.**

🔑 **No se vende una capa suelta DISFRAZADA DE CRECIMIENTO.** Crecer exige algo íntegro.
**La línea Marketing vende atención y lo dice en la tarjeta** — el cliente sabe qué compró.
Lo prohibido es cobrar contenido o pauta prometiendo facturación.

🔑 **Los cuatro planes incluyen estrategia.** Cambia la profundidad, no la existencia.
**Pero solo Growth toca la OFERTA.** Marketing trabaja el **mensaje** —cómo se cuenta lo que ya
vende—; Growth trabaja **qué vende, en qué paquetes y a qué precio.**
**En la línea Marketing, ② Growth corre ligero:** elige cuáles de las ofertas que ya existen se
empujan, para que la pauta sepa qué pautar. No cambia la oferta.
**Confundirlos es regalar el trabajo caro dentro del plan barato.**

```

## inherent/README.md líneas 26-40 (modelo en una pantalla)
```
              CONVERSION OS   que se cobre
              OPERATIONS OS   que la empresa lo aguante
              MONEY OS        que quede utilidad
                    │
OFERTA     🔷 MARKETING      $950    atención     arrancando → visible
           🔷 MARKETING PRO  $1,450  atención     visible → sostenido
           🟨 ACCELERATE     $2,500  facturación  estancado → escalando
           🟨 COMPOUND       $4,200  facturación  escalando → autónomo
                    │
DIVISIONES    LOW TICKET    volumen      oferta · big sales · upsells
              HIGH TICKET   precisión    oferta · cuentas grandes · expansión
```

## Las tres reglas que no se rompen

```

## inherent/01-IDENTIDAD.md líneas 110-139 y 143-246 (dos líneas, básico vs único, precios)
```
## Dos líneas, cuatro niveles

```
🔷 MARKETING — ENCENDER
   Marca · Mensaje · Contenido · Pauta

🔷 MARKETING PRO — SOSTENER
   Marketing + Video · Google · Creadores · Community

🟨 ACCELERATE — ACELERAR
   Marketing Pro + Oferta · Conversión · Canales grandes · SOPs · Tecnología

🟨 COMPOUND — COMPONER
   Accelerate + Operación · Estructura · Money OS · IA propia
```

🔑 **El eje es qué promete cada línea:**
**🔷 Marketing promete ATENCIÓN. 🟨 Growth promete FACTURACIÓN.**

**El nivel se elige por dónde está trabado el negocio:**

| El cuello | Nivel |
|---|---|
| **No me conocen** — hay producto, no hay demanda | 🔷 **Marketing** |
| **Me conocen y quiero sostenerlo** — hay demanda, falta constancia | 🔷 **Marketing Pro** |
| **Llega gente y se pierde** — hay demanda, no hay conversión | 🟨 **Accelerate** |
| **Funciona pero todo depende de alguien** — hay conversión, no hay sistema | 🟨 **Compound** |

🔑 **Marketing Pro y Accelerate entregan las mismas 145 piezas.** El salto no es volumen:
es que Accelerate toca **la oferta, el precio y la conversión.**
# 💎 Lo básico vs. el valor único

> **Esta es la sección que gana la venta.** Lo básico lo da cualquiera.
> Lo de la derecha **no lo da nadie más en Guatemala.**

---

## 🔷 MARKETING — $950/mes *(Q7,315)*

### Lo básico *(lo que da cualquier agencia)*
- Manejo de redes sociales
- Diseño de piezas y copy
- Calendario mensual
- Un reporte a fin de mes
- ~16 piezas

### 💎 El valor único de Inherent

| | Por qué nadie más lo da |
|---|---|
| **86 piezas al mes, no 16** | Porque grabamos por setup y multiplicamos el material con sistema. A ellos les costaría 4 personas |
| **Estrategia con ingeniería inversa** desde la meta financiera hasta la pieza | Porque la mayoría arranca en el calendario, no en el número |
| **Regla 70/20/10** — el 70% del contenido sale de lo que **ya funcionó** en la categoría | Porque requiere inteligencia de competencia corriendo todo el mes |
| **Radar de competencia** — qué anuncios lanzaron y cuáles sostienen | Porque su reporte es del día 30. El nuestro es del martes |
| **1 grabación → muchas piezas** | Porque grabamos por setup y cada escena se reusa en derivados |
| **Mapa de aliados** y gestión de asociaciones | Porque crecer no es solo pautar: es pararse al lado de quien ya tiene la audiencia |
| **Mensaje y posicionamiento trabajados de verdad** | Porque una agencia recibe el brief y ejecuta. Nosotros decidimos qué decir |

🔑 **En Marketing se trabaja el MENSAJE, no la oferta.** Qué vende, en qué paquetes y a qué
precio **solo lo toca la línea Growth.** Confundirlos regala el trabajo caro dentro del plan barato.

---

## 🟨 ACCELERATE — $2,500/mes *(Q19,250)*

### Lo básico *(lo que da cualquier agencia "con pauta")*
- Campañas en Meta
- Un reporte de resultados
- Contenido reciclado del orgánico para pautar
- 3 a 5 variantes por campaña

### 💎 El valor único de Inherent

| | Por qué nadie más lo da |
|---|---|
| **🔧 Tecnología a la medida** — CRM ligero, panel, portal, automatizaciones | **Nadie en Guatemala construye software para sus clientes de marketing** |
| **Contenido creado PARA ads**, no reciclado del orgánico | Porque producir creativo específico a volumen solo es viable con agentes |
| **Hasta 35 variantes por campaña** | Porque el algoritmo necesita volumen para encontrar al ganador. Ellos entregan 3 |
| **Clonar el anuncio más longevo del competidor** | Porque él ya pagó por descubrir qué funciona. Nosotros arrancamos donde él terminó |
| **Que te encuentren en Google** — pauta de búsqueda y contenido guiado por keywords | Porque el volumen de contenido lo hace posible sin equipo aparte |
| **Closing** — estructura de cierre, objeciones y seguimiento, con entrenamiento al equipo | Porque una agencia entrega leads y se lava las manos |
| **Lead magnets y lista propia** | Porque dejás de alquilarle la audiencia a Instagram |
| **Influencers elegidos por afinidad con el ICP**, no por alcance | Porque medimos su audiencia real con datos, no con el conteo de seguidores |
| **Embudos de WhatsApp** con flujos y entrenamiento | Porque en Guatemala la venta se cierra ahí, y casi nadie lo estructura |
| **Atribución limpia** — del anuncio a la venta | Porque sin esto nadie sabe qué quetzal funcionó |

---

## 🟨 COMPOUND — $4,200/mes *(Q32,340)*

### Lo básico
**No existe.** Ninguna agencia guatemalteca ofrece este nivel.
Lo más cercano es una consultoría que **entrega un documento y se va.**

### 💎 El valor único de Inherent

| | Qué significa |
|---|---|
| **🔁 Sistemas de demanda** | La demanda deja de comprarse cada mes. Referidos, comunidad, recompra y contenido que sigue trayendo gente meses después |
| **📦 Fulfillment** | Mapeamos cómo entrega el negocio, encontramos dónde se rompe y lo automatizamos. **Porque crecer con una entrega rota destruye la marca** |
| **👥 Talento** | Perfiles de puesto, SOPs, onboarding y documentación. **Para que el equipo del cliente pueda sostener lo que construimos** |
| **🏛️ Estructura corporativa** | Organigrama, qué puestos necesita y quién decide qué. **La cubre la auditoría** |
| **🤖 IA propia del cliente** | Entrenada con su marca, su oferta y sus datos. El conocimiento sale de la cabeza del fundador |
| **🔧 Una herramienta a medida por mes** | No por trimestre |
| **📊 Atribución completa de punta a punta** | Del primer impacto a la venta |

> **Compound es el único paquete cuyo objetivo declarado es que nos necesiten menos.**
> Principio #08: *"una empresa debe depender cada vez menos de su fundador."*
> Compound hace que además dependa menos de nosotros.

🔑 **Nada se promete si no está en «Capacidades reales» de `06-ECONOMIA.md`.**
Sin MCP no hay acción, y sin acción no hay promesa.

---

## Los precios

| | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Precio / mes** | **$950** | **$1,450** | **$2,500** | **$4,200** |
| | *Q7,315* | *Q11,165* | *Q19,250* | *Q32,340* |
| Piezas / mes | 86 | 145 | 145 | 204 |
| **Q por pieza** | **Q85** | **Q77** | *Q133* | *Q159* |
| *Mercado GT* | *Q188 por pieza* | | | |
| **Meta a 12 meses** | 1.3x | 1.45x | 1.7x | 2x |
| Performance fee | ⬜ | ⬜ | ✅ Incluido | ✅ Incluido |

**Y `Tailor Made`** — multi-locación, regulatorio, integraciones o proyectos por hito.
Precio según alcance.

> 💀 **Marketing está dentro del rango que el mercado ya acepta, con 5.4x el volumen de su tramo.
> Para igualarlo tendrían que contratar cuatro personas y cobrar lo mismo.**

---
```

## inherent/02-METODO.md líneas 316-346 (qué entra en cada nivel) y reglas del mentor 232-244
```
| **Creative** | Campañas · conceptos · eventos culturales · activaciones |
| **Production** | Films · video · fotografía · contenido |
| **Branding** | Identidad · guidelines · packaging · sistema visual · tono |
| **Tech** | Herramientas a medida · CRM · portales · automatización · webs |
| **Consulting** | SOPs · estructura corporativa · finanzas · procesos · talento |

---

# La red de especialistas

**El diferenciador que más pesa y el que menos se ve.**

La mayoría de las agencias aplica la misma receta a un restaurante, a una clínica y a una
|---|---|---|
| **Marca** | No tiene pregunta propia: **es cómo se expresa la oferta.** Atraviesa los cuatro | Growth pilar 1 · Conversion *(el camino)* · Money *(sostiene el precio)* |
| **Experiencia** | No es un sistema: **es el resultado de que tres funcionen juntos** | Growth *(la oferta)* + Conversion *(el camino)* + Operations *(la entrega)* |
| **Producto** | Está dentro de la oferta — *producto, lugar y experiencia* | Growth pilar 1 |
| **Talento** | Es una condición para que la empresa aguante | Operations |
| **Contenido y pauta** | Son **el cómo**, no el qué | Growth · Conversion |

🔑 **Si algo de esto llega a pedir su propio equipo y sus propias reuniones, ahí se convierte en
sistema.**

---

# Qué entra en cada nivel

| | 🔷 **MARKETING** $950 | 🔷 **MKT PRO** $1,450 | 🟨 **ACCELERATE** $2,500 | 🟨 **COMPOUND** $4,200 |
|---|---|---|---|---|
| **Qué promete** | Atención | Atención sostenida | **Facturación** | **Facturación sin el dueño** |
| **Diagnóstico** | ✅ | ✅ | ✅ Profundo | ✅ + trimestral |
| **Growth OS** | ⬜ | ⬜ | **Los 3 pilares, ejecutando** | **Los 3, sistematizados** |
| **Conversion OS** | ⬜ | ⬜ | ✅ | ✅ |
| **Operations OS** | ⬜ | ⬜ | Parcial *(SOPs de crecimiento)* | ✅ Completo *(SOPs de empresa)* |
| **Money OS** | ⬜ | ⬜ | ⬜ | ✅ |
| | | | | |
| **Capacidades** | Marketing · Creative · Branding · Production | Las mismas, con mayor volumen | + Tech · Consulting | **Las seis, a fondo** |
| **Especialistas** | ⬜ | ⬜ | Mentor de industria, trimestral | **Mentor mensual + toda la red** |
| **Somos** | Tu equipo de marketing | Tu equipo creativo completo | Tu operating partner | **Tu socio operador** |

**Por qué la línea Marketing no lleva los sistemas:** un negocio que arranca no tiene un problema
de capacidad — tiene un problema de existencia. Meterse en sus finanzas hoy sería cobrarle por
algo que todavía no necesita.

```

## inherent/03-OFERTA.md COMPLETO (577 líneas)
```
# Oferta — Qué vendemos

> **Dos líneas, cuatro planes.** Qué promete cada uno, qué entrega y qué lo respalda.

**Contenido:**
- Las dos líneas — el eje
- Los cuatro planes, lado a lado
- Las cuatro tarjetas · texto de web
- El múltiplo
- Qué respalda cada línea publicada
- 🛡️ Las garantías
- 🔒 Uso interno — cómo se activa la metodología por plan
- Cómo se habla de esto · cómo se mueve un cliente entre planes

---

# Las dos líneas

> **Somos un acelerador de marcas.**
> Cada plan no es «más de lo mismo con más volumen». **Cada plan es un boost distinto**, porque
> el freno es distinto en cada etapa.

**Un emprendedor no contrata sistemas. Contrata a alguien que cuide lo que construyó.**
**No industrializamos empresas. Les damos alma, propósito — y facturación.**

## El eje: qué promete cada línea

```
🔷 MARKETING   promete ATENCIÓN      compite con agencias
               Que te vean, te entiendan y te quieran.

🟨 GROWTH      promete FACTURACIÓN   compite con consultoría y CMO fraccional
               Que eso se convierta en dinero, y que no dependa de ti.
```

| | 🔷 **Línea Marketing** | 🟨 **Línea Growth** |
|---|---|---|
| **Qué promete** | Atención y demanda | **Facturación** |
| **Qué toca** | Marca, mensaje, contenido, pauta | + **oferta, precio, conversión, canales, operación** |
| **Contra quién compite** | Agencias de marketing | Consultoría · CMO fraccional |
| **Crecimiento** | Apunta a crecimiento medible | ✅ **Promete % de crecimiento** |
| **Sistemas operativos activos** | ⬜ Ninguno | ✅ Growth · Conversion · Operations · Money |

🔷 **La línea Marketing apunta a un crecimiento medible:** *(métrica — slot)*

El mismo +25% de crecimiento llega **al mes 11 en Marketing y al mes 5 en Compound**:
no es más esfuerzo, es que Growth toca la cadena completa.

**Lo que no se vende es una capa suelta disfrazada de crecimiento.** La línea Marketing vende
atención **y lo dice en la tarjeta.** El cliente sabe qué compró.

---

# Los cuatro planes, lado a lado

| | 🔷 **MARKETING** | 🔷 **MARKETING PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Precio / mes** | **$950** | **$1,450** | **$2,500** | **$4,200** |
| **Para quién** | El que está arrancando | El establecido que solo quiere marketing | El que necesita más de lo que ya le funcionó | El que necesita que todo corra sin él |
| **El boost** | Existir | Sostener presencia en serio | **Escalar sin romperlo** | **Que crezca sin ti** |
| **Meta a 12 meses** | **1.3x** | **1.45x** | **1.7x** | **2x** |
| | | | | |
| **Piezas / mes** *(mínimo)* | **86** | **145** | **145** | **204** |
| **Videos** *(mínimo — tope)* | **13 — 18** | **18 — 24** | **27 — 36** | **36 — 48** |
| Estáticos y carruseles | 43 | 72 | 63 | 88 |
| Stories | 30 | 55 | 55 | 80 |
| Horas de grabación | **3 h** | 4 h | 6 h | 8 h |
| Revisiones por pieza | 1 | 2 | 2 | 3 |
| | | | | |
| Marca e identidad | ✅ | ✅ | ✅ | ✅ |
| Mensaje y ángulos | ✅ | ✅ | ✅ | ✅ |
| Campañas | Meta · TikTok | + Google | + los que apliquen | + los que apliquen |
| Alianzas con creadores | ⬜ | ✅ | ✅ | ✅ |
| Community management | ✅ **Básico** | ✅ Todos los días | ✅ + WhatsApp a medida | ✅ + WhatsApp a medida |
| | | | | |
| **Tu oferta y tu precio** | ⬜ | ⬜ | ✅ **Rediseñados** | ✅ Sistematizados |
| **Ventas grandes** | ⬜ | ⬜ | ✅ **Abiertas** | ✅ Canal permanente |
| **Subir el ticket** | ⬜ | ⬜ | ✅ | ✅ Automatizado |
| **Que nadie se pierda** | ⬜ | ⬜ | ✅ | ✅ |
| **SOPs** | ⬜ | ⬜ | **De crecimiento** | **De empresa** |
| Herramientas a tu medida | ⬜ | ⬜ | 1 / trimestre | **1 / mes** |
| Estructura corporativa | ⬜ | ⬜ | ⬜ | ✅ |
| Tus números y márgenes | ⬜ | ⬜ | ⬜ | ✅ |
| Tu propia IA | ⬜ | ⬜ | ⬜ | ✅ |
| **Especialista de tu industria** | ⬜ | ⬜ | **Trimestral** | **Mensual** |
| | | | | |
| **Somos** | Tu equipo de marketing | Tu equipo creativo completo | **Tu acelerador** | **Tu socio operador** |

**Y `TAILOR MADE`** — multi-locación, regulatorio, integraciones, proyectos por hito.
Precio según alcance.

### 🔑 La regla de los 20 minutos

Un video planificado se graba en **20 minutos — si se graba por SETUP y no por pieza.** Cada uno
deja 5-7 escenas; las de apoyo se recombinan en derivados.

- **El rango es honestidad, no flojera:** material muy scripted no se recombina y cae al
  **mínimo (1 derivado por cada 2 planificados)**; material suelto llega al **tope (1:1)**.
- **Se promete el MÍNIMO.** El tope es techo, no promesa: se entrega solo si el material lo permite.

### 🔑 Marketing Pro y Accelerate entregan las mismas 145 piezas

**A propósito.** El salto de $1,450 a $2,500 **no compra más contenido — compra sistemas**:
tu oferta rediseñada, los canales grandes abiertos, el seguimiento que no se pierde, los SOPs
y el especialista de tu industria.

**Venderlo como «más piezas» es venderlo mal**, y el cliente lo nota.

### La etapa no es mérito, es realidad

**Lo que puedes pagar dice en qué etapa estás.** Y la etapa dice qué necesitas.

Un negocio que arranca **no necesita SOPs para un equipo de cincuenta personas.** Necesita que lo
conozcan. **Darle eso hoy sería cobrarle por algo que no va a usar.**

---

> # 🌐 LAS CUATRO TARJETAS · TEXTO DE WEB
>
> **Esto es lo que va publicado, palabra por palabra.**
>
> 🔒 **Regla dura:** el repo no puede prometer **menos**, **más** ni **distinto** que esto.
> Si algo interno contradice una línea de acá, **gana la web** y se corrige el repo.
> Si una línea de acá no tiene capacidad detrás, **se arregla la capacidad — no se borra la línea.**

---

## 🔷 MARKETING · $950 / mes
### *Para el negocio que está arrancando*

> *«Quiero que mi marca se vea como la imagino y que la gente sepa que existo.»*

| # | Lo que dice la tarjeta |
|---|---|
| 1 | **Tu marca construida en serio: identidad, voz y una forma de verse que te dé orgullo** |
| 2 | **Tu mensaje claro, para que quien te lea te entienda y te quiera** |
| 3 | **Presencia todos los días: 86 piezas al mes, hechas por gente talentosa** |
| 4 | **Campañas donde está tu gente, en Meta y TikTok** |
| 5 | **Respuesta a tus comentarios y mensajes** |
| 6 | **Un reporte al mes de qué funcionó y qué sigue** |

> **Dejas de ser invisible.**
> **Apuntamos a 1.3x tu facturación en 12 meses.**

---

## 🔷 MARKETING PRO · $1,450 / mes
### *Para el negocio establecido que solo quiere marketing*

> *«Ya me conocen. Quiero sostener presencia en serio y no quedarme sin qué publicar.»*

| # | Lo que dice la tarjeta |
|---|---|
| 1 | **Todo lo de Marketing** |
| 2 | **145 piezas al mes, con el doble de video** |
| 3 | **Campañas en Meta, TikTok y Google** |
| 4 | **Alianzas con creadores y marcas que ya tienen a tu audiencia** |
| 5 | **Alguien cuidando tus comentarios y mensajes todos los días** |
| 6 | **Dos revisiones por pieza** |

> **Tu marca deja de depender de que a alguien se le ocurra qué subir.**
> **Apuntamos a 1.45x tu facturación en 12 meses.**

---

## 🟨 ACCELERATE · $2,500 / mes
### *Para el negocio que necesita más de lo que ya le funcionó*

> *«Ya funciona, pero llegué a un techo y no quiero romper lo que me sirve.»*

**Aquí no venimos a que te conozcan más. Venimos a que vendas más.**

| # | Lo que dice la tarjeta |
|---|---|
| 1 | **Todo lo de Marketing Pro** |
| 2 | **Tu oferta y tu precio rediseñados: qué vendes, en qué paquetes y por cuánto** |
| 3 | **Abrimos los canales grandes: eventos, mayoreo y corporativos** |
| 4 | **Subimos tu ticket: combos, versiones, membresías y recompra** |
| 5 | **Nadie que te escribe se queda sin respuesta** |
| 6 | **Que te encuentren en Google y que tu equipo sepa cerrar** |
| 7 | **Encontramos qué te funciona de verdad y lo volvemos repetible** |
| 8 | **Herramientas hechas para ti, una nueva cada trimestre** |
| 9 | **Un especialista de tu industria cada trimestre** |

> **Lo que te funcionaba una vez ahora se repite, y ya no depende de que estés tú.**
> **Apuntamos a 1.7x tu facturación en 12 meses.**

---

## 🟨 COMPOUND · $4,200 / mes
### *Para el negocio que necesita que todo corra sin él*

> *«Quiero que esto crezca sin que yo esté en todo, y que al final del mes quede dinero.»*

**El freno ya no es el mercado: eres tú, tu equipo y tus números.**

| # | Lo que dice la tarjeta |
|---|---|
| 1 | **Todo lo de Accelerate, al máximo: 204 piezas al mes** |
| 2 | **Tu operación más liviana: una herramienta nueva cada mes** |
| 3 | **Estructura corporativa: organigrama, qué puestos necesitas y quién decide qué** |
| 4 | **SOPs de toda la empresa: cómo funciona cada área y cómo entra alguien nuevo, sin depender de ti** |
| 5 | **Tus números claros: qué producto te deja y cuál te quita** |
| 6 | **Que el crecimiento se sostenga solo: referidos, comunidad y recompra** |
| 7 | **Tu propia IA, entrenada con tu marca y tus datos** |
| 8 | **Un especialista de tu industria cada mes** |

> **Te puedes ir una semana y la empresa factura igual, y cierra el mes mejor.**
> **Apuntamos a 2x tu facturación en 12 meses.**

---

# 📈 El múltiplo — cómo se dice y cómo se sostiene

El múltiplo es el modelo, no un resultado prometido. Ver `06-ECONOMIA.md` → «El múltiplo».

| | Toca | **Techo a 12 meses** | En «x» |
|---|---|---|---|
| 🔷 **MARKETING** | atención | +30% | **1.3x** |
| 🔷 **MARKETING PRO** | atención + volumen | +45% | **1.45x** |
| 🟨 **ACCELERATE** | oferta + conversión + canales | +70% | **1.7x** |
| 🟨 **COMPOUND** | todo + que corra sin el dueño | +100% | **2x** |

**En la web va solo el «x». El resto es conversación de llamada.**

## Para la llamada — desde qué facturación tiene sentido cada plan

| | Cuesta / mes | **Se paga solo con** | Factura al menos |
|---|---|---|---|
| **MARKETING** | Q7,315 | Q24,383 de venta nueva | **Q98,000** |
| **MARKETING PRO** | Q11,165 | Q37,217 | **Q149,000** |
| **ACCELERATE** | Q19,250 | Q64,167 | **Q257,000** |
| **COMPOUND** | Q32,340 | Q107,800 | **Q431,000** |

*Supuesto: margen del cliente 30%, el plan se paga con 25% de crecimiento.*

> 🔑 **Decirle a un cliente «este plan todavía no es para ti» vende el siguiente mejor que
> cualquier argumento.** Y es la regla de la etapa aplicada en vivo.

---

# 💬 Community management — la escalera

**Los cuatro planes atienden comentarios y mensajes. Cambia la profundidad.**

| | 🔷 Marketing | 🔷 Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| **Responder comentarios y mensajes** | ✅ **Básico:** una IA contesta lo simple *(horarios, ubicación, precios publicados, links)* | ✅ **Todos los días**, todas las redes | ✅ | ✅ |
| **Pasar al interesado al WhatsApp del cliente** | ✅ | ✅ | ✅ | ✅ |
| **Moderar y dar seguimiento** *(quién preguntó y qué)* | — | ✅ | ✅ | ✅ |
| **Auto-DM por palabra clave y embudo de WhatsApp** | — | — | ✅ | ✅ |
| **Agente de WhatsApp a medida** *(entrenado con la marca: responde, califica, agenda)* | — | — | ✅ | ✅ |

🔑 **Lo simple se contesta en todos los planes. Lo complejo sube por la escalera.**

---

# ✅ Qué respalda cada línea publicada

> **Regla: si está en la web, tiene que tener acción detrás.** Esta tabla es el control.
> Las herramientas se nombran por su función; cuál es la actual está en la tabla de slots de
> `05-OPERACION.md`. Lo que cada una puede hacer hoy está en `06-ECONOMIA.md` → «Capacidades reales».

## 🔷 Marketing

| Línea publicada | Con qué se entrega |
|---|---|
| Tu marca construida en serio | ②B Branding |
| Tu mensaje claro | ③ Marketing · `mk-mensaje` + ②B Branding `br-voz` |
| Presencia todos los días — **86 piezas** | ④ Creatividad · ⑥A Diseño gráfico · ⑦ Video Editing + ⑨ Posting · herramienta de publicación |
| Campañas en Meta y TikTok | ⑩ Ads Management · herramienta de pauta |
| Respuesta a tus comentarios y mensajes | ⑧ Community Management — nivel básico: la bandeja de mensajes + una IA que contesta lo simple. Lo complejo se pasa al WhatsApp del cliente |
| Reporte al mes | ③ Marketing `mk-loop` + ⑩ Ads `ad-loop` |

## 🔷 Marketing Pro — *todo lo de Marketing, más:*

| Línea publicada | Con qué se entrega |
|---|---|
| 145 piezas, doble de video | ⑤ Producción 4 h + ⑦ Video Editing |
| Campañas de Google | ⑩ Ads Management · herramienta de pauta *(búsqueda y Performance Max)* |
| Alianzas con creadores | Herramienta de scraping · vetting por engagement real |
| Comentarios y mensajes todos los días | ⑧ Community Management — el operador de agentes hace el setup mensual del agente con la info del cliente, y queda corriendo. Todas las redes, con moderación y seguimiento de quién preguntó |
| Dos revisiones por pieza | ⑥A Diseño gráfico `gd-composicion` + ②B Branding `br-guardian` → QA final del COO |

## 🟨 Accelerate — *todo lo de Marketing Pro, más:*

| Línea publicada | Con qué se entrega |
|---|---|
| Tu oferta y tu precio rediseñados | ② Growth · `gr-oferta` · **Pilar 1 ejecutando** |
| Abrimos los canales grandes | ② Growth · `gr-canales-grandes` · **Pilar 2 ejecutando** |
| Subimos tu ticket | ② Growth · `gr-upsells` · **Pilar 3** |
| Nadie se queda sin respuesta | ② Growth `gr-conversion` + auto-DM por palabra clave, embudo de WhatsApp y **agente de WhatsApp a medida**, entrenado con la marca: responde, califica y agenda |
| Que te encuentren en Google | Pauta de búsqueda + contenido guiado por keywords |
| Que tu equipo sepa cerrar | Guiones y entrenamiento de closing — **Conversion OS** · el CEO |
| Lo volvemos repetible | **SOPs de crecimiento** — la auditoría levanta, el CEO y el COO coordinan, el COO implementa con agentes |
| Una herramienta cada trimestre | ② Growth `gr-herramienta` — el CEO define el alcance, el operador de agentes la construye *(rubro Operador)* |
| Especialista cada trimestre | Red de mentores — el mentor de la industria hace la auditoría · rubro Especialista · techo **$144** por sesión |

## 🟨 Compound — *todo lo de Accelerate, más:*

| Línea publicada | Con qué se entrega |
|---|---|
| 204 piezas | ⑤ Producción 8 h + ⑥A Diseño gráfico + ⑦ Video Editing |
| Una herramienta cada **mes** | ② Growth `gr-herramienta` — el CEO define el alcance, el operador de agentes la construye *(rubro Operador)* |
| Estructura corporativa | La cubre la auditoría · el CEO y el COO coordinan lo que sale de ahí |
| SOPs de toda la empresa | **Operations OS completo** — la auditoría levanta, el CEO y el COO coordinan, el COO implementa con agentes *(documentación y entrenamiento)* |
| Tus números claros | ② Growth `gr-numeros` · **Money OS** — el CEO con Strategy |
| Crecimiento que se sostiene solo | ⑧ Community Management + automatización |
| Tu propia IA | Construida sobre el folder del cliente — el CEO define el alcance, el operador de agentes la construye *(rubro Operador)* |
| Especialista mensual | Red de mentores — el mentor de la industria hace la auditoría · rubro Especialista · techo **$180** por sesión |

> 🔑 **«Tus números claros» no es un CFO contratado.** Lo entrega **Money OS** con el CEO y
> Strategy. **No se promete una persona — se promete el número.**

---

# 🛡️ Las garantías — qué se compromete y con qué se sostiene

> **El principio:** no se garantiza un resultado que no controlamos.
> **Se garantiza lo que la ingeniería inversa vuelve CALCULABLE y el volumen vuelve REPETIBLE.**

## La cadena que lo hace posible

```
Meta financiera
  ÷ ticket promedio      =  ventas necesarias
  ÷ tasa de cierre       =  leads necesarios
  ÷ clic a lead          =  clics necesarios
  ÷ CTR                  =  impresiones necesarias
  ÷ alcance por pieza    =  PIEZAS y PRESUPUESTO necesarios
```

**Cada división es una tasa.** Si se conocen las tasas, el resultado deja de ser esperanza y
pasa a ser aritmética. **Lo que es aritmética se puede comprometer.**
**Sin las tasas medidas del cliente, la garantía es una apuesta — y no se compromete.**

---

## 🛡️ GARANTÍA 1 · Que el contenido funcione

### Cómo se enuncia
> **Si a mitad de ciclo el contenido no está llegando al umbral, el resto del ciclo se
> reemplaza por lo que sí está funcionando — sin costo adicional.**

### El umbral, definido
**`la mediana de engagement de la propia cuenta en los últimos 90 días`**

**Nunca un número absoluto.** Un post con 10,000 vistas no dice nada sin su base.
**Un outlier solo existe contra su propia mediana.**

### El mecanismo

| Paso | Qué pasa | Con qué |
|---|---|---|
| **1 · Línea base** | Se mide la mediana de la cuenta **antes de empezar** | Herramienta de scraping · engagement del perfil |
| **2 · El 70% probado** | El 70% del ciclo sale de patrones **que ya pagan** en la categoría | Herramienta de scraping · biblioteca de anuncios de Meta → **ads de 30+ días** |
| **3 · La revisión del 20** | Se lee pieza por pieza contra el umbral | Herramienta de scraping · posts de la cuenta |
| **4 · La redirección** | Lo que queda del ciclo **se reemplaza por variantes del patrón que ganó** | ④ Creatividad `cr-loop` → ③ Marketing `mk-calendario` |

### 🔑 Por qué esta garantía cuesta Q0

**No se reponen piezas: se redirige el volumen que todavía no se produjo.**
Al día 20 queda ~1/3 del ciclo sin producir. **Esas piezas ya están presupuestadas** — lo
único que cambia es **qué** se produce con ellas.

**Una garantía de «reposición gratis» costaría margen.** Esta cuesta cero, y solo es posible
porque tenemos volumen y una revisión a mitad de ciclo.

### Qué la rompe
🛑 **Una cuenta sin 90 días de historia.** Sin línea base no hay umbral, y sin umbral no hay
garantía. **Se vende sin esta garantía y se dice.**

---

## 🛡️ GARANTÍA 2 · Alcance

### Cómo se enuncia
> **X personas nuevas alcanzadas dentro del público definido, al mes.**

### 🔑 El alcance no se espera: se compra

**Es la única de las tres que es una compra, no un resultado.** Con presupuesto, el alcance
es aritmética: `presupuesto ÷ CPM × 1,000`.

| Lo que hace falta | Con qué |
|---|---|
| **El CPM real de la categoría** *(no el promedio global)* | Herramienta de scraping · biblioteca de anuncios con detalle → **reach y demografía de los ads de la competencia** |
| Ejecutar la compra | ⑩ Ads Management · herramienta de pauta |
| Que el público sea el correcto | ⑩ Ads `ad-estructura` |

### La cláusula que protege el margen
**El compromiso se escribe a un CPM declarado.**
> *«X personas a un CPM de hasta Q__. Si la plataforma sube más de 25%, se ajusta el número
> o el presupuesto — y se avisa antes, no después.»*

### Engagement — se compromete como RANGO, no como número
**No se compra.** Se predice con el benchmark de la categoría y se expresa así:
> *«entre X% y Y%, que es el rango de tu categoría medido este trimestre.»*

### Qué la rompe
🛑 **Sin presupuesto de pauta no hay garantía de alcance.** La inversión publicitaria
**nunca** está incluida — es del cliente, aparte.

---

## 🛡️ GARANTÍA 3 · Ventas

### Cómo se enuncia
> **Ventas atribuidas a nuestro trabajo, con un piso declarado.**

### 🔑 El performance fee ES la garantía

**No hace falta inventar una penalidad: ya está en el modelo.**
Cobramos **10% de las ventas atribuidas**. Si no hay ventas, **no hay fee.**

| | |
|---|---|
| **Quien lo paga** | El cliente, solo sobre lo que **efectivamente vendió** |
| **Nuestro riesgo** | Ingreso, no costo. **Una garantía que no puede hundir el margen** |
| **Qué alinea** | Ganamos de hacerles dinero, literalmente |

### Por qué solo existe en la línea 🟨 Growth

**Para comprometer ventas hay que controlar las tres palancas:**

| Palanca | Quién | Entra desde |
|---|---|---|
| **La oferta** — qué se vende y a qué precio | ② Growth `gr-oferta` | 🟨 Accelerate |
| **La conversión** — que lo que llega se cobre | ② Growth `gr-conversion` | 🟨 Accelerate |
| **La atribución** — saber cuál venta fue nuestra | ⑩ Ads `ad-atribucion` | 🟨 Accelerate |

🛑 **La línea 🔷 Marketing no toca ninguna de las tres.** Por eso **no promete ventas** —
y por eso tampoco tiene performance fee. **Es la misma razón.**

### Qué la rompe
🛑 **Atribución instalada DESPUÉS del primer gasto.** Lo que no se midió desde el día 1
no es atribuible, y lo que no es atribuible no se cobra ni se promete.

---

# 📊 La escalera de garantías = la escalera de precios

| Plan | Garantiza |
|---|---|
| 🔷 **MARKETING** | Volumen y proceso · **que el contenido funcione** |
| 🔷 **MARKETING PRO** | + **alcance** *(con presupuesto de pauta)* |
| 🟨 **ACCELERATE** | + **ventas atribuidas** con piso declarado |
| 🟨 **COMPOUND** | + que se sostenga **sin el dueño** |

> 🔑 **Esto es lo que justifica el salto de precio mejor que cualquier lista de entregables.**
> **No compra más piezas: compra una promesa más grande.**

---

# 🚦 El pre-flight de la garantía — las tres condiciones

**Antes de comprometer nada, las tres se verifican. Si falta una, se vende SIN esa garantía
y se dice en la propuesta.**

| # | Condición | Si falta |
|---|---|---|
| **1** | **90 días de historia de la cuenta** | ⛔ Sin garantía de contenido. Se ofrece medirla el primer mes y comprometerla desde el segundo |
| **2** | **Presupuesto de pauta aprobado por escrito** | ⛔ Sin garantía de alcance |
| **3** | **Atribución instalada antes del primer gasto** | ⛔ Sin garantía de ventas ni performance fee |

**Una garantía sin su condición verificada no es una garantía: es una deuda.**

---

# Lo que NUNCA se garantiza

| | Por qué |
|---|---|
| ❌ **Un número de seguidores** | Es la métrica que menos correlaciona con negocio |
| ❌ **Un múltiplo del negocio** *(«10x»)* | El múltiplo es meta, no resultado |
| ❌ **Ventas en la línea 🔷 Marketing** | No tocamos oferta, conversión ni atribución |

---

# 🔒 Uso interno — cómo se activa la metodología por plan

> **Los pilares no cambian. Son nuestra metodología.**
> **Lo que cambia es el verbo:** Growth **ejecuta** en Accelerate y **sistematiza** en Compound.
> **La línea Marketing no activa pilares** — ejecuta atención.

## Los sistemas operativos

| | 🔷 **MARKETING** | 🔷 **MARKETING PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Ejecución de marketing** | ✅ | ✅ Mayor volumen | ✅ | ✅ Máximo |
| **Growth OS** | ⬜ | ⬜ | **Los 3 pilares, ejecutando** | Los 3, sistematizados |
| **Conversion OS** | ⬜ | ⬜ | ✅ Completo | ✅ |
| **Operations OS** | ⬜ | ⬜ | **SOPs de crecimiento** | ✅ **SOPs de empresa** |
| **Money OS** | ⬜ | ⬜ | ⬜ | ✅ |

🔑 **Un sistema entra cuando el negocio tiene con qué alimentarlo.** Conversion no entra en la
línea Marketing porque **antes no hay nada que perder**; Operations porque **no se puede
documentar un proceso que todavía no funcionó**; Money porque **sin transacciones el margen por
línea es teoría.** **Meterlo antes es cobrar por algo que no se puede usar.**

## Los pilares · Low Ticket

| Pilar | 🔷 **Marketing / Pro** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|
| **1 · Better your Offer** | ⬜ *Solo el mensaje, no la oferta* | **Escalarla** — más ángulos y canales sin romper lo que ya vende | **Sistematizarla** — que se replique en nuevas sedes o líneas |
| **2 · Big sales** | ⬜ | **Abrir y vender** uno o dos | **Volverlos canal permanente**, con proceso y equipo |
| **3 · Upsells** | ⬜ | **Diseñar y lanzar** | **Sistema operando solo** |

## Los pilares · High Ticket

| Pilar | 🔷 **Marketing / Pro** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|
| **1 · Better your Offer** | ⬜ *Solo el mensaje, no el empaque* | **Empaquetar y construir autoridad** sobre esa oferta | **Que la autoridad sea del sistema**, no solo del fundador |
| **2 · Cuentas grandes** | ⬜ | **Diseñar y cerrar** retainers y contratos anuales | **Acuerdos marco · licitaciones · white label** |
| **3 · Expansión** | ⬜ | **Cross-sell y renovación** | **Programa de referidos y expansión sistemático** |

> 🔑 **La diferencia entre «mensaje» y «oferta».**
> **Mensaje** es cómo se cuenta lo que ya vendes — eso lo hace la línea Marketing.
> **Oferta** es qué vendes, en qué paquetes y a qué precio — eso solo lo toca Growth.
> **Confundirlos es regalar el trabajo caro dentro del plan barato.**

### 🔑 La diferencia de SOPs entre Accelerate y Compound

| | Qué documenta | Para qué |
|---|---|---|
| **Accelerate** | **Cómo repetimos lo que ya funciona** — el proceso de venta que sí cierra, la campaña que sí rindió | **Para poder hacerlo diez veces** |
| **Compound** | **Cómo funciona la empresa sin el fundador** — decisiones, criterios, puestos, entrega | **Para que no dependa de él** |

**No es el mismo trabajo. Uno escala lo que funciona; el otro libera al dueño.**

### Capacidades y mentores

| | 🔷 Marketing | 🔷 Marketing Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| **Capacidades** | Marketing · Creative · Branding | + Production | + Tech · Consulting | **Las seis** |
| **Mentor** | ⬜ | ⬜ | 1/trimestre · techo **$144** | **1/mes** · techo **$180** |

**El mentor es el diferenciador de la línea Growth.** No entra en Marketing: ahí no hay
estrategia que acompañar, y meterlo rompe el margen del plan barato.

🔑 **Arriba del techo, el mentor va como add-on facturado al cliente, con margen.** No se absorbe
nunca. **Y la membresía de comunidad se paga anual y es de Inherent** — sirve a todos los clientes
de esa industria. Ver `04-MERCADO.md`.

---

# Cómo se habla de esto

| ❌ Nunca decir | ✅ Decir |
|---|---|
| "Integramos tus sistemas operativos" | **"No vas a estar solo en esto"** |
| "Implementación de CRM" | **"Nadie que te escriba se queda sin respuesta"** |
| "Documentación de SOPs" | **"Lo que te funcionó una vez, ahora se repite"** |
| "Análisis de unit economics" | **"Sabes cuál producto te deja y cuál te quita"** |
| "86 piezas de contenido al mes" | **"Presencia todos los días, hecha por gente talentosa"** |
| "Optimización de estructura corporativa" | **"Ahorras donde se puede ahorrar"** |
| "Estrategia de comunidad" | **"Gente que te sigue porque le importas"** |
| "Rediseño de pricing" | **"Qué vendes, en qué paquetes y por cuánto"** |

**Se le habla al emprendedor de lo que desea, no de lo que la industria dice que necesita.**
**Los sistemas son cómo lo cumplimos. No qué le vendemos.**

---

# 🔄 Cómo se mueve un cliente entre planes

| Movimiento | Qué lo dispara |
|---|---|
| **Marketing → Marketing Pro** | Se quedó sin volumen o quiere video en serio. **Sigue sin necesitar sistemas.** |
| **Marketing Pro → Accelerate** | **Hay tráfico y no se cobra.** Llegan mensajes, se pierden; la oferta no cierra. |
| **Accelerate → Compound** | Funciona, pero todo pasa por el dueño. |

🔑 **El movimiento comercial es subir a los clientes que ya están, no sumar clientes nuevos.**
Ver `06-ECONOMIA.md` → «La estrategia de bundle».

**El salto de Marketing Pro a Accelerate se vende con el diagnóstico, no con el catálogo:**
*«estás pagando por atención que no se está cobrando.»*
```

## inherent/02-METODO.md (corrección de rangos): reglas del mentor 261-275 y «Qué entra en cada nivel» 328-351
```
**El mentor de la industria hace la auditoría** de la línea Growth.

### Las reglas que lo hacen rentable

| | |
|---|---|
| **1** | **El mentor es exclusivo de la línea Growth.** En la línea Marketing no existe |
| **2** | **Trimestral en Accelerate, mensual en Compound** |
| **3** | **La membresía se paga anual y es de Inherent** — sirve a todos los clientes de esa industria |
| **4** | **Arriba de $180 la sesión va como add-on facturado al cliente.** Nunca se absorbe |

**Causando que la estrategia sea realista desde el día uno, y no una teoría bonita que se cae
al mes.**

## Especialistas por área — *nuestra red*
# Qué entra en cada nivel

| | 🔷 **MARKETING** $950 | 🔷 **MKT PRO** $1,450 | 🟨 **ACCELERATE** $2,500 | 🟨 **COMPOUND** $4,200 |
|---|---|---|---|---|
| **Qué promete** | Atención | Atención sostenida | **Facturación** | **Facturación sin el dueño** |
| **Diagnóstico** | ✅ | ✅ | ✅ Profundo | ✅ + trimestral |
| **Growth OS** | ⬜ | ⬜ | **Los 3 pilares, ejecutando** | **Los 3, sistematizados** |
| **Conversion OS** | ⬜ | ⬜ | ✅ | ✅ |
| **Operations OS** | ⬜ | ⬜ | Parcial *(SOPs de crecimiento)* | ✅ Completo *(SOPs de empresa)* |
| **Money OS** | ⬜ | ⬜ | ⬜ | ✅ |
| | | | | |
| **Capacidades** | Marketing · Creative · Branding · Production | Las mismas, con mayor volumen | + Tech · Consulting | **Las seis, a fondo** |
| **Especialistas** | ⬜ | ⬜ | Mentor de industria, trimestral | **Mentor mensual + toda la red** |
| **Somos** | Tu equipo de marketing | Tu equipo creativo completo | Tu operating partner | **Tu socio operador** |

**Por qué la línea Marketing no lleva los sistemas:** un negocio que arranca no tiene un problema
de capacidad — tiene un problema de existencia. Meterse en sus finanzas hoy sería cobrarle por
algo que todavía no necesita.

**Por qué Compound cuesta más:** tocamos tu equipo y tus números. Eso no lo carga una
herramienta — lo carga una cabeza.

---

```

##### Fuente: `old-zona-B1.md`

# Referencia verbatim — zona B1 (strategy, branding, growth, marketing)

## agents/01-strategy/README.md — «Qué entrega según el plan»
| | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
| **Qué promete el plan** | Atención | Atención sostenida | **Facturación** | **Facturación sin el dueño** |
| **Verbo** | los pilares no corren · Growth ligero | los pilares no corren · Growth ligero | **Ejecuta** | **Sistematiza** |
| **Briefs que entrega** | Branding · Marketing · Creative · Growth (ligero) | + Producción | Growth completo · + Tecnología | + Sistemas · estructura corporativa |
(Sin cifras de precio en este archivo.)

## agents/01-strategy/brain/WORKFLOW.md §0 — tabla por plan (verbatim)
| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
| **Profundidad de la estrategia** | Ligera | Ligera | **Completa** | **Completa + trimestral** |
| **Revisión del 20** | Ligera | Ligera | Completa | Completa |
| **Toca la OFERTA** | Solo el mensaje | Solo el mensaje | Sí | Sí |
| **Brief de ② Growth al cerrar** | Ligero | Ligero | Completo | Completo |
| **SOPs** | — | — | De crecimiento | De toda la empresa |
| **Money OS** | — | — | — | Sí |
| **Contenidos a investigar** (por cada Red de plan-contratado.md — mitad competencia GT, mitad referencias) | **50** | **50** | **100** | **100** |
| **Piezas del ciclo que habilita** | **86** | **145** | **145** | **204** |
Frase vieja: «Los números salen de inherent/06-ECONOMIA.md → «📦 El volumen» y la profundidad de inherent/05-OPERACION.md → «ONBOARDING»».
Frase vieja: «La ingeniería inversa se corre en los cuatro planes. En 🔷 cierra en alcance y piezas; en 🟨 cierra en facturación porque hay atribución que lo sostenga.»

## agents/01-strategy/brain/skills/methodology/SKILL.md — A.3 «El paquete es el límite que ya está firmado» (verbatim)
| | 🔷 **Marketing** Q7,315 | 🔷 **Pro** Q11,165 | 🟨 **Accelerate** Q19,250 | 🟨 **Compound** Q32,340 |
| Piezas/mes | **86** | **145** | **145** | **204** |
| Horas de producción | 3h · 1 sesión | 4h · 2 sesiones | 6h · 2 sesiones | 8h · 3 sesiones |
| Canales de pauta | Meta · TikTok | + Google Search · PMax | + los que apliquen | + los que apliquen |
| Variantes de creativo | hasta 20 | hasta 30 | hasta 35 | hasta 50 |
| Oferta y precio | solo el mensaje | solo el mensaje | Sí | Sí |
| Sistemas activos | Ninguno | Ninguno | Growth · Conversion · Operations (parcial) | Los cuatro |
| Conversión y tecnología | No | No | Sí | Sí |
| Retención y autonomía del cliente | No | No | Parcial | Sí |
| **Meta de crecimiento a 12 m** | 1.3x | 1.45x | 1.7x | 2x |
| Objetivo del plan | Acelerar la máquina que hay | Rediseñar la máquina | Que la máquina se sostenga sola |  (nota: esta fila tenía 3 celdas para 4 columnas en el original)
A.0 vieja: Marketing = «No lo conocen»/Existir · Marketing Pro = «Lo conocen y quiere sostenerlo»/Sostener presencia en serio · Accelerate = «Está estancado»/Escalar lo que ya funciona · Compound = «Todo depende del fundador»/Que crezca sin él.

## agents/01-strategy/brain/skills/context/SKILL.md — A.0 (verbatim)
| Plan | El boost | Verbo de los pilares | Sistemas que se activan |
| 🔷 **MARKETING** $950 | Existir | no corren | Ninguno |
| 🔷 **MARKETING PRO** $1,450 | Sostener presencia en serio | no corren | Ninguno |
| 🟨 **ACCELERATE** $2,500 | Escalar lo que ya funciona, sin perderlo | Ejecuta | Growth · Conversion · Operations (parcial) |
| 🟨 **COMPOUND** $4,200 | Que crezca sin el fundador | Sistematiza | Los cuatro |
Fila «Performance fee»: «¿Opcional o incluido?»; fila «Marcas o cuentas»: «1 paquete = 1 marca. Si hay más, son add-on».

## agents/01-strategy/brain/skills/reverse-engineering/SKILL.md (verbatim)
«el volumen por plataforma lo fija el plan contratado — **50** en 🔷 Marketing y Pro, **100** en 🟨 Accelerate y Compound. Mitad competencia, mitad referencias.»

## agents/01.2-branding/brain/WORKFLOW.md §0 (verbatim)
| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
| **El peso del departamento** | Acá se construye la marca | Se extiende | Se evoluciona | Se sistematiza |
| **Identidad, voz y sistema visual** | Completo | + formatos nuevos | Se mantiene y se extiende | Se documenta para que lo use cualquiera |
| **Activos distintivos** | 3 a 5 | + activos para pauta | + activos para pauta | + guía operable por terceros |
| **Autoridad** (high ticket) | — | Empaquetada | Construida | Del sistema, no del fundador |
| **Revisiones por pieza** (br-guardian) | **1** | 2 | 2 | 3 |
| **Piezas que valida por ciclo** | **86** | **145** | **145** | **204** |
Nota vieja: «con 1 revisión, la primera devolución es la única».
br-brief §4: Marketing «Se construye la marca completa» / Pro «Se extiende» / Accelerate «Se evoluciona» (+ variantes para ⑩ Ads) / Compound «Se sistematiza» (+ manual para que lo use un tercero); Activos 3 a 5 | 3 a 5 | + activos para pauta | + guía operable por terceros.
br-activos: «publicar 204 piezas al mes no construye nada» y «No alcanza para sostener la variedad de un ciclo de 204 piezas» (fila 1-2 activos).

## agents/02-growth/brain/WORKFLOW.md §0 (verbatim)
| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
| **Verbo** | Ligero | Ligero | **Ejecuta** | **Sistematiza** |
| Pilar 1 · Oferta | Elige qué ofertas se empujan | idem | Escalarla / autoridad | Sistematizarla |
| Pilar 2 · Canales grandes | — | — | Abrir y vender | Canal permanente |
| Pilar 3 · Upsells | — | — | Diseñar y lanzar | Operando solo |
| Conversion OS | — | — | Que nadie se pierda · closing | + referidos y comunidad |
| Captura de leads (Capa 1B) | — | — | Una receta principal | Principal + apoyo |
| Operations OS | — | — | SOPs de crecimiento | SOPs de empresa |
| Money OS | — | — | — | Margen por línea · CAC · LTV |
| **Herramienta a medida** | — | — | **1 por trimestre** | **1 por mes** |
| **Especialista de industria** | — | — | Trimestral · techo **$144** | Mensual · techo **$180** |
Frase vieja: «El especialista es exclusivo de la línea 🟨. Arriba de $180 por sesión el especialista NO se absorbe: va como add-on facturado al cliente.» (la regla de los $180 se conserva en el manual nuevo)

## agents/02-growth/brain/skills/growth/SKILL.md §2 (verbatim)
gr-herramienta: Marketing/Pro ⛔ · Accelerate ✅ 1/trimestre · Compound ✅ 1/mes. gr-numeros: solo Compound.
## agents/02-growth/brain/skills/README.md: gr-herramienta «🟨 A 1/trim · 🟨 C 1/mes»; «A y C» = Accelerate y Compound.

## Promesas publicadas viejas citadas en skills de ② Growth (verbatim)
gr-herramienta: «Herramientas hechas para ti, una nueva cada trimestre» (Accelerate) · «Tu operación más liviana: una herramienta nueva cada mes» (Compound). Cadencia: Accelerate 1 por trimestre · Compound 1 por mes.
gr-numeros: «Tus números claros: qué producto te deja y cuál te quita.» (Compound)
gr-conversion: «Nadie que te escribe se queda sin respuesta.» (Accelerate)

## agents/02-growth/brain/skills/gr-encargo/SKILL.md §3b «¿El cliente califica para su plan?» (verbatim)
| Plan | Factura al menos |
| 🔷 Marketing | **Q98,000** / mes |
| 🔷 Marketing Pro | **Q149,000** |
| 🟨 Accelerate | **Q257,000** |
| 🟨 Compound | **Q431,000** |
*Supuesto: margen del cliente 30%, el plan se paga con 25% de crecimiento. Ver inherent/03-OFERTA.md → «Desde qué facturación tiene sentido cada plan».*
Ejemplo: «Factura Q21,600/mes. El piso de Accelerate es Q257,000.» · «El plan cuesta casi lo que factura. No se va a pagar solo.» · «Bajar a Marketing Pro, o declarar que el cliente acepta el riesgo.»
Tabla §3: Herramienta ⛔ | 1/trimestre | 1/mes · Money OS ⛔ | ⬜ | ✅

## agents/03-marketing/brain/WORKFLOW.md §0 (verbatim)
| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
| **Slots por ciclo** | **86** | **145** | **145** | **204** |
| **Campañas por ciclo** | **1** | **2** | **2** | **2** |
| **Horas de grabación** | 3 h | 4 h | 6 h | 8 h |
| **Videos planificados** (20 min c/u) | 9 | 12 | **18** | 24 |
| **Derivados — mínimo** (1:2) | 4 | 6 | 9 | 12 |
| **TOTAL videos — mínimo** | **13** | **18** | **27** | **36** |
| Derivados — tope (1:1) | 9 | 12 | 18 | 24 |
| **Estáticos y carruseles** | 43 | 72 | **63** | 88 |
| **Stories** | 30 | 55 | 55 | 80 |
| **Canales** | Donde esté la audiencia | + Google y alianzas | + los que apliquen | + canal permanente |
| **Revisiones por pieza** | **1** | 2 | 2 | 3 |
Notas viejas: «Marketing Pro y Accelerate piden las mismas 145 piezas. La diferencia no es volumen: en Accelerate el calendario se arma contra una oferta rediseñada por ② Growth.» · «Accelerate no es "Pro con más piezas": 50% más video (18 planificados contra 12) y menos estáticos (63 contra 72). La mezcla cambia a propósito — copiar la fila de Pro es un error.» · «Arriba de Compound sube el volumen, pero el techo real sigue siendo lo que se puede grabar.»

## agents/03-marketing/brain/skills/mk-encargo/SKILL.md §2: misma tabla de slots/horas/videos/derivados/estáticos/stories/revisiones que WORKFLOW §0 (valores idénticos, ya guardados arriba).

## agents/03-marketing/brain/skills/mk-calendario/SKILL.md — client-getting por plan (verbatim)
| Plan | `captura` admite | % de los slots de video corto del ciclo |
| 🔷 Marketing | directo | **20%** |
| 🔷 Marketing Pro | directo | **25%** |
| 🟨 Accelerate | La receta de gr-captura | **30%** |
| 🟨 Compound | La receta de gr-captura | **30%** |

## agents/03-marketing/brain/skills/mk-pilares/SKILL.md (verbatim)
Cuántos pilares: Marketing **3** · Marketing Pro **3-4** · Accelerate **3-4** · Compound **4-5**.
§6B: Mix de arranque TOF·MOF·BOF = 50·30·20 en los cuatro planes (se conserva como método). Client-getting (% de slots de video corto): 20% | 25% | 30% | 30%. CTA: directo | directo | Receta de gr-captura | Receta de gr-captura.
Frase: «`Community` solo si hay clientes que atender — En 🔷 Marketing normalmente es 0%».

##### Fuente: `old-zona-B2.md`

# Cifras viejas borradas — zona B2 (verbatim)

## agents/00-account/brain/WORKFLOW.md (§0 tabla y frase)
| Qué puede informar | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Piezas del mes** | **86** | **145** | **145** | **204** |
| **Revisiones por pieza** | **1** | 2 | 2 | 3 |
| **Comentarios y mensajes** | ✅ Básico | ✅ Todos los días | ✅ + WhatsApp a medida | ✅ + WhatsApp a medida |
| **Campañas de Google** | ⛔ No incluido | ✅ | ✅ | ✅ |
| **Oferta y precio** | ⛔ No se tocan | ⛔ No se tocan | ✅ Rediseñados | ✅ Sistematizados |
| **Herramienta a medida** | ⛔ | ⛔ | Una por trimestre | **Una por mes** |
| **Especialista de industria** | ⛔ | ⛔ | Cada trimestre | **Cada mes** |

- ⚠️ **🟨 Accelerate entrega las mismas 145 piezas que 🔷 Pro.** Si el cliente pregunta por qué
  paga más, la respuesta es **qué sistemas se le activan** —oferta, conversión, canales grandes—
  **nunca el volumen** (`inherent/03-OFERTA.md` → «🔑 Marketing Pro y Accelerate entregan las
  mismas 145 piezas»).
| *«¿cuánto les cuesta producir esto?»* | **«Eso es cocina nuestra. Lo que importa es que por lo que pagas recibes 86 piezas al mes, y eso no lo iguala nadie acá.»** |


## agents/04-creative/brain/WORKFLOW.md (sección «## 0 · El plan contratado — cuánto y a qué profundidad»)

## 0 · El plan contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer el plan del cliente.** Lo anota ① Strategy al arrancar en
`clients/<cliente>/00-onboarding/plan-contratado.md`:
🔷 **Marketing** · 🔷 **Marketing Pro** · 🟨 **Accelerate** · 🟨 **Compound** · ⬜ **Tailor Made**.

- 🛑 **Sin plan anotado, el departamento no arranca:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo, no una sugerencia.** Entregar de más rompe el margen; entregar de menos
  rompe la promesa publicada (`inherent/03-OFERTA.md` → «🌐 Las cuatro tarjetas»).
- Los números salen de `inherent/06-ECONOMIA.md` → «📦 El volumen» y `inherent/05-OPERACION.md` →
  «El desglose por tarea». La profundidad, de `inherent/03-OFERTA.md` → «🔒 Uso interno».
  **Si cambian allá, cambian acá** — esta tabla no manda sobre ellos.

| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Contenidos a investigar** *(por plataforma del cliente — mitad competencia GT, mitad referencias)* | **50** | **50** | **100** | **100** |
| **BIG IDEAS del mes** *(una por campaña de ③ Marketing)* | **1** | **2** | **2** | **2** |
| **Conceptos del ciclo** *(videos planificados ÷ 3)* | 3 | 4 | 6 | 8 |
| **Videos planificados** a idear *(20 min de grabación c/u)* | 9 | 12 | **18** | 24 |
| **Videos derivados** *(mínimo 1:2 — los ejecuta ⑦ Video Editing)* | 4 | 6 | 9 | 12 |
| **Estáticos y carruseles** | 43 | 72 | **63** | 88 |
| **Stories** | 30 | 55 | 55 | 80 |
| **Filas de `plan-de-contenido.csv`** | **86** | **145** | **145** | **204** |
| **Variantes de creativo por campaña** | hasta 20 | hasta 30 | hasta 35 | hasta 50 |
| **Revisiones por pieza** | **1** | 2 | 2 | 3 |
| **Qué empuja el contenido** | El **mensaje** — cómo se cuenta lo que ya vende | Igual, con más volumen | + **oferta rediseñada**, canales grandes, subir el ticket, contenido guiado por keywords | + **recompra, referidos y comunidad** |

**Cómo se lee:**

- 🔑 **Una campaña, una BIG IDEA.** El número sale de las campañas que encargó ③ Marketing
  (`agents/03-marketing/brain/WORKFLOW.md` → §0). **Dos campañas son dos ideas distintas, no una
  estirada en dos.**
- **Cada pieza es una fila con su `id`**, también las derivadas y las stories. Las derivadas las
  ejecuta ⑦ Video Editing, pero Creative las marca en la fila del video que las origina. Las stories
  se pueden idear como **series repetibles** —un formato, muchas piezas— y cada una sigue siendo su
  fila.
- ⚠️ **🟨 Accelerate no es «Pro con más piezas».** Entrega las **mismas 145**, pero con **50% más
  video** *(18 planificados contra 12)* y **menos estáticos** *(63 contra 72)*. La mezcla cambia a
  propósito: **copiar la fila de Pro es un error.**
- 🛑 **En la línea 🔷 Marketing, Creative trabaja el MENSAJE, nunca la OFERTA.** Qué vende el cliente,
  en qué paquetes y a qué precio **solo se toca desde 🟨 Accelerate** (`inherent/03-OFERTA.md` →
  «🔒 Uso interno»). **Confundirlos es regalar el trabajo caro dentro del plan barato.**
- **Las variantes de creativo se definen acá y se ejecutan afuera.** Creative declara en su entregable
  **qué se varía** —gancho, texto en pantalla, formato—; ⑥A Diseño gráfico y ⑦ Video Editing las producen, y
  ⑩ Ads las sube. 🛑 **Salen de material ya grabado: una variante nunca pide grabación extra.**
- 🛑 **Si el calendario de ③ Marketing pide más piezas que el plan, no se idean de más:** se declara
  la diferencia y se devuelve a ③ Marketing. Recortar es decisión de alcance, no de Creative.
- ⛔ **No hay segundo idioma en ningún plan.** No existe herramienta de doblaje — ver
  `agents/07-video-editing/brain/skills/ve-derivadas/SKILL.md` → «5 · El segundo idioma».

### ⬜ Tailor Made — se sigue su pipeline

Se define en el onboarding, en `clients/<cliente>/00-onboarding/plan-contratado.md`, con dos
secciones: **Qué incluye** y **Su pipeline** —qué departamentos corren, en qué orden, qué entrega
cada uno y a qué nivel—. **El departamento sigue ese pipeline** igual que un plan estándar: no lo
bloquea por no ser un plan de lista ni lo cuestiona por precio.

- **Lo que el pipeline declara para ④ Creatividad es el techo del ciclo.**
- 🛑 **Si ④ Creatividad no está en su pipeline, no corre para ese cliente.**
- **Cambia el pipeline, nunca el método:** la trazabilidad y las devoluciones son iguales en todos
  los planes.

---



## agents/04-creative/brain/WORKFLOW.md (frase)
Plan: [🔷 Marketing / 🔷 Mkt Pro / 🟨 Accelerate / 🟨 Compound / ⬜ Tailor Made] · piezas del ciclo: [n] de [techo del plan]

## agents/04-creative/brain/WORKFLOW.md (frase)
Sin plan no hay idea.

## agents/04-creative/brain/skills/cr-fuentes/SKILL.md (frase)
según las
  Redes de su plan contratado, con tres actores de Apify —anuncios, Instagram y TikTok— y volumen fijado
  por el plan contratado.

## agents/04-creative/brain/skills/cr-fuentes/SKILL.md (frase)
**Por plataforma, y según el plan contratado:**

| | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Contenidos a investigar, por plataforma** | **50** | **50** | **100** | **100** |

**Se reparte en partes iguales entre los 5 niveles** *(ver abajo)*: con 50 por plataforma son
**10 por nivel**; con 100, **20 por nivel**. En un cliente de 🔷 Marketing con tres plataformas son
150 contenidos: 10 por nivel en cada plataforma.

## agents/04-creative/brain/skills/cr-adaptacion/SKILL.md (frase)
En 🔷 `captura = directo`: el CTA

## agents/04-creative/brain/skills/creatividad/SKILL.md (frase)
Plan: [🔷 Marketing / 🔷 Mkt Pro / 🟨 Accelerate / 🟨 Compound / ⬜ Tailor Made] · piezas del ciclo: [n] de [techo del plan]

## agents/04-creative/brain/skills/cr-adaptacion/SKILL.md (frase)
**Las mismas del plan.**

## agents/04-creative/brain/skills/cr-fuentes/SKILL.md (frase)
**El del plan contratado, por plataforma** *(50 / 50 / 100 / 100)*.

## agents/04-creative/brain/skills/cr-fuentes/SKILL.md (frase)
plan del cliente: [plan]

## agents/04-creative/brain/skills/cr-fuentes/SKILL.md (frase)
de las Redes del `plan-contratado.md`]

## agents/04-creative/brain/skills/cr-fuentes/SKILL.md (frase)
según las **Redes** del `plan-contratado.md`

## agents/04-creative/brain/skills/creatividad/SKILL.md (frase)
pipeline del ⬜ Tailor Made del cliente ya lo declare.

## agents/04-creative/brain/skills/creatividad/SKILL.md (frase)
cabe en el plan contratado** (§0 del `WORKFLOW.md`): ni de más ni de menos — y si es ⬜ Tailor Made, en lo que declara **su pipeline**

## agents/04-creative/brain/skills/cr-fuentes/SKILL.md (frase)
es el del plan contratado *(50 / 50 / 100 / 100)*,

## agents/04-creative/brain/skills/cr-fuentes/SKILL.md (frase)
las **Redes** de

## agents/05-production/brain/WORKFLOW.md §0 completo

## 0 · El plan contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer el plan del cliente.** Lo anota ① Strategy al arrancar en
`clients/<cliente>/00-onboarding/plan-contratado.md`:
🔷 **Marketing** · 🔷 **Marketing Pro** · 🟨 **Accelerate** · 🟨 **Compound** · ⬜ **Tailor Made**.

- 🛑 **Sin plan anotado, el departamento no arranca:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo, no una sugerencia.** Entregar de más rompe el margen; entregar de menos
  rompe la promesa publicada (`inherent/03-OFERTA.md` → «🌐 Las cuatro tarjetas»).
- Los números salen de `inherent/06-ECONOMIA.md` → «📦 El volumen» y `inherent/05-OPERACION.md` →
  «El desglose por tarea». **Si cambian allá, cambian acá** — esta tabla no manda sobre ellos.

| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Horas de grabación** | **3 h** | **4 h** | **6 h** | **8 h** |
| **Sesiones (jornadas) por mes** | **1** | **2** | **2** | **3** |
| **Sesión de fotógrafo** | 1 h | 1 h | 1 h | 1 h |
| **Videos planificados** a capturar *(20 min c/u)* | 9 | 12 | **18** | 24 |
| **Material base** para estáticos y carruseles | para 43 | para 72 | para 63 | para 88 |

**Cómo se lee:**

- **Las horas y sesiones del plan son el techo de realidad de la Capa 0.** Si la capacidad que
  declara el cliente es menor, **manda la menor.** Lo que no entre es **decisión de alcance**: va a
  ③ Marketing con números, no se devuelve a ④ Creatividad.
- 🔑 **La regla de los 20 minutos.** Un video planificado se graba en 20 minutos **si se graba por
  SETUP y no por pieza.** Cada uno deja 5-7 escenas, y las de apoyo se recombinan en derivados.
  **Agrupar por setup no es una optimización: es lo que hace que las horas alcancen.**
- ⚠️ **🟨 Accelerate es la jornada más apretada.** Captura **50% más video que Pro** *(18 contra 12)*
  en las **mismas 2 sesiones**. La consolidación de la Capa 2 ahí no es opcional.

#### Los márgenes de rodaje — referencia

**Las horas contratadas son exactamente el tiempo de cámara, sin un minuto de margen.** A 20 minutos
por video planificado, los cuatro planes dan justo:

| | 🔷 Marketing | 🔷 Mkt Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| Videos × 20 min | 9 × 20 = **3 h** | 12 × 20 = **4 h** | 18 × 20 = **6 h** | 24 × 20 = **8 h** |
| Horas contratadas | 3 h | 4 h | 6 h | 8 h |
| **Margen que queda** | **0** | **0** | **0** | **0** |

Los márgenes de la Capa 5 —**montaje inicial 60-90 min · cambio de setup de luz 30-45 min · cambio
de locación 60 min + traslado · desmontaje 45 min**— son **referencia**, no bloqueo. **No caben en
ninguna de las cuatro columnas**, y en 🔷 Marketing se comen la jornada entera antes de grabar la
primera toma.

🛑 **Por eso se declaran los márgenes que se usan como ajuste marcado en `plan-de-rodaje.md` — nunca
en silencio, y nunca asumiendo que el día alcanza.**

#### Lo que el plan NO cubre

- 🛑 **Nunca graba el cliente.** Las horas de grabación son el piso de costo de cada plan
  (`inherent/06-ECONOMIA.md` → «📦 El volumen»).
- **Modelos, props y locaciones son costo del cliente, aparte** (`inherent/06-ECONOMIA.md` → «⛔ Lo
  que nunca está incluido»). `presupuesto.md` separa siempre **lo que cubre el plan** de **lo que
  paga el cliente**.
- **Una locación adicional es add-on, no parte del plan** (`inherent/06-ECONOMIA.md` → «Extras»).

### ⬜ Tailor Made — se sigue su pipeline

Se define en el onboarding, en `clients/<cliente>/00-onboarding/plan-contratado.md`, con dos
secciones: **Qué incluye** y **Su pipeline** —qué departamentos corren, en qué orden, qué entrega
cada uno y a qué nivel—. **El departamento sigue ese pipeline** igual que un plan estándar: no lo
bloquea por no ser un plan de lista ni lo cuestiona por precio.

- **Lo que el pipeline declara para ⑤ Producción —horas, sesiones, videos— es el techo del ciclo.**
- 🛑 **Si ⑤ Producción no está en su pipeline, no corre para ese cliente.**
- **Cambia el pipeline, nunca el método:** la trazabilidad y las devoluciones son iguales en todos
  los planes.


## agents/06-graphic-design/README.md (original, «**Los estáticos»)

**Los estáticos, carruseles y stories del ciclo.** Es el grueso del volumen:
**73 · 127 · 118 · 168 piezas al mes** según el plan —
🔷 Marketing · 🔷 Marketing Pro · 🟨 Accelerate · 🟨 Compound.

| | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| Estáticos y carruseles | 43 | 72 | **63** | 88 |
| Stories | 30 | 55 | 55 | 80 |
| **TOTAL** | **73** | **127** | **118** | **168** |

⚠️ **🟨 Accelerate entrega MENOS estáticos que 🔷 Pro** *(63 contra 72)*: las mismas 145 piezas del
plan se reparten con más video. **La mezcla cambia a propósito.**

> Fuente: `inherent/06-ECONOMIA.md` → «📦 El volumen» y `inherent/05-OPERACION.md` → «El desglose
> por tarea», filas 15 y 16. **Si cambian allá, cambian acá.**



## agents/06-graphic-design/brain/WORKFLOW.md (original, «## 0 · El plan contratado»)

## 0 · El plan contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer el plan del cliente.** Lo anota ① Strategy al arrancar en
`clients/<cliente>/00-onboarding/plan-contratado.md`:
🔷 **Marketing** · 🔷 **Marketing Pro** · 🟨 **Accelerate** · 🟨 **Compound** · ⬜ **Tailor Made**.

- 🛑 **Sin plan anotado, el departamento no arranca:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo, no una sugerencia.** Entregar de más rompe el margen; entregar de menos
  rompe la promesa publicada (`inherent/03-OFERTA.md` → «🌐 Las cuatro tarjetas»).
- Los números salen de `inherent/06-ECONOMIA.md` → «📦 El volumen» y `inherent/05-OPERACION.md` →
  «El desglose por tarea». **Si cambian allá, cambian acá** — esta tabla no manda sobre ellos.

| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Estáticos y carruseles** | **43** | **72** | **63** | **88** |
| **Stories** | 30 | 55 | 55 | 80 |
| **Total de piezas** | **73** | **127** | **118** | **168** |
| **Revisiones por pieza** | **1** | 2 | 2 | 3 |

**Cómo se lee:**

- ⚠️ **🟨 Accelerate baja a 63 estáticos A PROPÓSITO — no es un error de tabla.** Entrega **menos
  estáticos que 🔷 Pro** *(63 contra 72)* porque la mezcla se corre hacia video: **18 videos
  planificados contra 12.** El total del plan sigue siendo 145 piezas; lo que cambia es de qué están
  hechas. 🛑 **Copiar el reparto de Pro es un error**, y «corregir» el 63 hacia arriba rompe el
  margen de Producción.
- 🔑 **168 es el techo real del departamento**, el de 🟨 Compound — y **no se diseñan una por una.**
  Se arma el sistema de plantillas del ciclo y se llenan: **se prueba el molde, no las piezas.**
  Sin ese molde el volumen no es viable.
- 🔴 **⑥A Diseño gráfico no tiene MCP: hoy el volumen pasa entero por el operador de agentes.** Sus horas son el techo de capacidad,
  no el plan. Si el ciclo no entra, **se declara antes de empezar a componer**, no a mitad.
- 🛑 **Si llegan más piezas que el techo del plan, las de más no se componen:** se declara la
  diferencia y se devuelve a ③ Marketing. Recortar es decisión de alcance, no de ⑥A Diseño gráfico.
- **Las variantes de creativo de pauta no cuentan acá.** Las 20/30/35/50 existen para ⑩ Ads, salen
  de material ya compuesto y **no entran a este total.**

### ⬜ Tailor Made — se sigue su pipeline

Se define en el onboarding, en `plan-contratado.md`, con dos secciones: **Qué incluye** y **Su
pipeline** —qué departamentos corren, en qué orden, qué entrega cada uno y a qué nivel—. **⑥A Diseño gráfico lee
de ahí cuántos estáticos, carruseles y stories le tocan** y trabaja con esos números igual que con
un plan estándar.

- **El pipeline se sigue, no se cuestiona:** no se bloquea por no ser un plan de lista ni se
  discute por precio.
- 🛑 **Si ⑥A Diseño gráfico no está en su pipeline, no corre para ese cliente.**
- **Cambia el volumen, nunca el método:** la trazabilidad, las devoluciones y la auto-revisión son
  iguales en todos los planes.
- **Arriba de 🟨 Compound sube el volumen**, pero el techo real son **las horas del operador de agentes y las
  plantillas**: más piezas sin plantilla nueva es ejecución que no existe.



## agents/06-graphic-design/brain/skills/gd-recepcion/SKILL.md (original, «## 4 · El techo»)

## 4 · El techo

| | 🔷 Marketing | 🔷 Mkt Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| Estáticos y carruseles | 43 | 72 | 63 | 88 |
| Stories | 30 | 55 | 55 | 80 |
| **Total de ⑥A Diseño gráfico** | **73** | **127** | **118** | **168** |
| Revisiones por pieza | 1 | 2 | 2 | 3 |

⬜ **Tailor Made:** el techo son los estáticos, carruseles y stories que declara **Su pipeline** en
`plan-contratado.md`.

🛑 **Si el Excel pide más, se declara y se devuelve a ③ Marketing.**



## agents/06-graphic-design/brain/skills/graphic-design/SKILL.md (frase)
con la **línea `Plan:`** completa

## agents/06-graphic-design/brain/skills/graphic-design/SKILL.md (frase)
- [ ] ⚠️ Si el plan es 🟨 Accelerate, se respetaron los **63 estáticos** — menos que 🔷 Pro, **a propósito**


## agents/06-graphic-design/brain/entregables/entregas-diseno.md (frase)
| | Techo del plan | Entregado |

## agents/07-video-editing/brain/WORKFLOW.md (original, «## 0 · El plan contratado»)

## 0 · El plan contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer el plan del cliente.** Lo anota ① Strategy al arrancar en
`clients/<cliente>/00-onboarding/plan-contratado.md`:
🔷 **Marketing** · 🔷 **Marketing Pro** · 🟨 **Accelerate** · 🟨 **Compound** · ⬜ **Tailor Made**.

- 🛑 **Sin plan anotado, el departamento no arranca:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo, no una sugerencia.** Entregar de más rompe el margen; entregar de menos
  rompe la promesa publicada (`inherent/03-OFERTA.md` → «🌐 Las cuatro tarjetas»).
- Los números salen de `inherent/06-ECONOMIA.md` → «📦 El volumen» y `inherent/05-OPERACION.md` →
  «El desglose por tarea». **Si cambian allá, cambian acá** — esta tabla no manda sobre ellos.

| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Videos planificados** *(20 min c/u)* | **9** | **12** | **18** | **24** |
| **Derivados — mínimo** *(1:2)* | **4** | **6** | **9** | **12** |
| **TOTAL videos — mínimo** | **13** | **18** | **27** | **36** |
| *Derivados — tope (1:1)* | *9* | *12* | *18* | *24* |
| *TOTAL videos — tope* | *18* | *24* | *36* | *48* |
| **Revisiones por pieza** | **1** | 2 | 2 | 3 |

**Cómo se lee:**

- 🔑 **La regla de los 20 minutos.** Un video planificado se graba en **20 minutos — si se graba por
  SETUP y no por pieza.** Cada uno deja 5-7 escenas; las de apoyo se recombinan en derivados.
- **El rango no es flojera, es honestidad:** si el material salió muy scripted las escenas no se
  reusan y cae al **mínimo (1 derivado por cada 2 planificados)**. Si salió suelto llega al
  **tope (1:1)**. ⚠️ **Se promete el MÍNIMO. El tope es techo, no promesa** — y solo se entrega si
  el material lo permite **y** el operador tiene las horas.
- ⚠️ **🟨 Accelerate monta 50% más video que 🔷 Pro** *(18 planificados contra 12)* con el mismo
  total de 145 piezas del plan. **Copiar el reparto de Pro es un error.**
- 🔑 **Acá está la eficiencia del modelo:** ⑤ Producción cuesta horas humanas; ⑦ Video Editing multiplica ese
  material **dentro del mismo monto de Producción.** Por eso el mínimo 1:2 es piso, no aspiración.
- 🔑 **⑦ Video Editing edita con Claude Code y el motor (`motor/README.md`); el editor de video dirige y aprueba.**
  El techo de capacidad es el material rodado y las horas de revisión del editor, no el plan.
- 🛑 **Una derivada nunca pide grabación extra.** Sale de material ya rodado. Si para llegar al
  número haría falta volver a grabar, **el número está mal, no el rodaje.**
- ⛔ **No hay segundo idioma en ningún plan.** No existe herramienta de doblaje — ver
  `skills/ve-derivadas/SKILL.md` → «5 · El segundo idioma».

### ⬜ Tailor Made — se sigue su pipeline

Se define en el onboarding, en `plan-contratado.md`, con dos secciones: **Qué incluye** y **Su
pipeline** —qué departamentos corren, en qué orden, qué entrega cada uno y a qué nivel—. **⑦ Video Editing lee
de ahí cuántos videos planificados, derivados y revisiones le tocan** y trabaja con esos números
igual que con un plan estándar.

- **El pipeline se sigue, no se cuestiona:** no se bloquea por no ser un plan de lista ni se
  discute por precio.
- 🛑 **Si ⑦ Video Editing no está en su pipeline, no corre para ese cliente.**
- **Cambia el volumen, nunca el método:** la trazabilidad, las devoluciones y la auto-revisión son
  iguales en todos los planes.
- **Arriba de 🟨 Compound el techo es el material rodado**, no el plan: más derivadas de las que el
  rodaje aguanta es volumen que no existe.



## agents/07-video-editing/brain/skills/ve-loop/SKILL.md (original, «| Plan | Lo esperado |»)

| Plan | Lo esperado |
|---|---|
| 🔷 Marketing | **13 mínimo ÷ 3 h — tope 18** |
| 🔷 Marketing Pro | **18 mínimo ÷ 4 h — tope 24** |
| 🟨 Accelerate | **27 mínimo ÷ 6 h — tope 36** |
| 🟨 Compound | **36 mínimo ÷ 8 h — tope 48** |



## agents/07-video-editing/brain/skills/ve-recepcion/SKILL.md (original, «**Se verifica contra el plan contratado»)

**Se verifica contra el plan contratado antes de empezar:**

| | 🔷 Marketing | 🔷 Mkt Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| Horas de grabación | 3h | 4h | 6h | 8h |
| Videos planificados *(20 min c/u)* | 9 | 12 | 18 | 24 |
| Derivados — **mínimo** *(1:2)* | 4 | 6 | 9 | 12 |
| **TOTAL videos — mínimo** | **13** | **18** | **27** | **36** |
| *Derivados — tope (1:1)* | *9* | *12* | *18* | *24* |
| **Total** | **10** | **16** | **20** | **24** |

⬜ **Tailor Made:** el techo son los videos planificados y derivados que declara **Su pipeline** en
`plan-contratado.md`.



## agents/07-video-editing/brain/skills/ve-derivadas/SKILL.md (frase)
Las **4 · 6 · 9 · 12** piezas derivadas del ciclo *(mínimo 1:2

## agents/07-video-editing/brain/skills/ve-derivadas/SKILL.md (frase)
**Las derivadas del plan se reparten

## agents/07-video-editing/brain/skills/README.md (frase)
Las 4 · 6 · 9 · 12 derivadas

## agents/07-video-editing/brain/skills/ve-loop/SKILL.md (frase)
contra lo esperado del plan

## agents/07-video-editing/brain/entregables/aprendizaje-de-video.md (frase)
Esperado del plan

## agents/09-posting/brain/WORKFLOW.md (original, «## 0 · El plan contratado»)

## 0 · El plan contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer el plan del cliente.** Lo anota ① Strategy al arrancar en
`clients/<cliente>/00-onboarding/plan-contratado.md`:
🔷 **Marketing** · 🔷 **Marketing Pro** · 🟨 **Accelerate** · 🟨 **Compound** · ⬜ **Tailor Made**.

- 🛑 **Sin plan anotado, el departamento no arranca:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo, no una sugerencia.** Entregar de más rompe el margen; entregar de menos
  rompe la promesa publicada (`inherent/03-OFERTA.md` → «🌐 Las cuatro tarjetas»).
- Los números salen de `inherent/06-ECONOMIA.md` → «📦 El volumen» y `inherent/05-OPERACION.md` →
  «El desglose por tarea». **Si cambian allá, cambian acá** — esta tabla no manda sobre ellos.

| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Publicaciones del ciclo** | **86** | **145** | **145** | **204** |
| de las cuales **videos** *(mínimo)* | 13 | 18 | **27** | 36 |
| de las cuales **estáticos y carruseles** | 43 | 72 | **63** | 88 |
| de las cuales **stories** | 30 | 55 | 55 | 80 |
| **Revisiones por pieza** | **1** | 2 | 2 | 3 |
| **Conversación después de publicar** *(es de ⑧ Community, no de acá)* | ⛔ No incluida | ✅ | ✅ | ✅ |

**Cómo se lee:**

- **Posting programa TODAS las piezas del ciclo, stories incluidas.** El número de la primera
  fila es el total del plan: no hay piezas del ciclo que se queden sin programar.
- **Si la herramienta no programa stories, no se descartan:** se entregan en una **lista aparte para
  subir a mano**, con su fecha y su hora, y se declara en el handoff. 🛑 **Una story que no se pudo
  programar sigue siendo una pieza entregada del plan.**
- 🛑 **Las variantes de creativo de pauta NO van a orgánico.** Las 20/30/35/50 variantes existen para
  ⑩ Ads y **no cuentan como publicaciones** ni entran al calendario del ciclo. Programarlas infla el
  volumen con piezas que el cliente nunca pidió ver en su feed.
- ⚠️ **🟨 Accelerate publica lo mismo que Pro, con otra mezcla:** las mismas 145, pero **27 videos
  contra 18** y **63 estáticos contra 72**. **Copiar el reparto de Pro es un error.**
- **Posting no contesta.** Deja la pieza publicada; lo que pasa en comentarios y DMs es de
  ⑧ Community Management — y **no está incluido en 🔷 Marketing.**
- ⛔ **No hay segundo idioma en ningún plan:** un caption por pieza
  (`agents/07-video-editing/brain/skills/ve-derivadas/SKILL.md` → «5 · El segundo idioma»).
- 🛑 **Si llegan más piezas que el techo del plan, las de más no se programan:** se escalan al CEO —
  es alcance.

> 🟡 **La herramienta de publicación está en prueba.** Esta sección define **cuánto** se publica, no
> **con qué**. El resto de este WORKFLOW y las skills `po-*` nombran la herramienta vigente.

### ⬜ Tailor Made — el acuerdo especial

Se define en el onboarding, en `clients/<cliente>/00-onboarding/plan-contratado.md`, con dos
secciones: **Qué incluye** y **Su pipeline** — qué departamentos corren, en qué orden, qué entrega
cada uno y a qué nivel.

- **Posting sigue ese pipeline.** No se bloquea por no ser un plan de lista ni se cuestiona por precio.
- 🛑 **Si Posting no está en su pipeline, no corre para ese cliente.**
- **Cambia el pipeline y qué se verifica, nunca el método:** la trazabilidad, las devoluciones y la
  auto-revisión antes de programar son iguales en todos los planes.
- **Arriba de 🟨 Compound sube el volumen**, pero más publicaciones exigen más archivos terminados de
  ⑥A Diseño gráfico y ⑦ Video Editing: **sin ellos no hay calendario.**



## agents/08-community-management/brain/WORKFLOW.md (original, «**Lo primero de cada corrida: leer el plan»)

**Lo primero de cada corrida: leer el plan del cliente** en
`clients/<cliente>/00-onboarding/plan-contratado.md`.

- 🛑 **Sin plan anotado, ⑧ Community no corre para ese cliente:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo.** Lo que el plan no incluye no se hace aunque sea fácil.
- ⬜ **Tailor Made: manda Su pipeline** del `plan-contratado.md`, sin cuestionarlo. Si ⑧ Community no está,
  no corre para ese cliente; si está, prende el nivel que declara —**«Básico» es la columna
  🔷 Marketing**—.

| Qué hace ⑧ Community | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Contesta lo simple** *(horarios, ubicación, menú o catálogo, precios publicados, links)* | ✅ | ✅ | ✅ | ✅ |
| **Pasa lo complejo al WhatsApp del cliente** | ✅ | ✅ | ✅ | ✅ |
| **Redes que atiende** | Las **Redes** del `plan-contratado.md` *(o las del plan por canal de ③ Marketing, si existe)* | **Todas las del cliente, todos los días** | Todas | Todas |
| **Modera** *(oculta spam y abuso)* | — | ✅ | ✅ | ✅ |
| **Seguimiento** *(quién preguntó qué, avisos al COO, `seguimiento/`)* | — | ✅ | ✅ | ✅ |
| **Auto-DM por palabra clave y embudo de WhatsApp** | — | — | ✅ | ✅ |
| **Agente de WhatsApp a medida** | — | — | ✅ *(se construye en `05-comunidad/whatsapp/`)* | ✅ |

**Cómo se lee:**

- **En 🔷 Marketing, un evento, una reserva o una queja = darle al usuario el WhatsApp correcto del
  cliente, y listo.** No se registra ni se avisa: eso es seguimiento, y empieza en Pro.
- **Desde Pro, además se registra y se avisa al COO.**
- **El auto-DM por palabra clave es una automatización de Zernio** que corre sola, sin la corrida.
  Se arma solo en 🟨, cuando ③ Marketing o ④ Creatividad piden una palabra clave para una pieza.



## agents/08-community-management/README.md (original, «**Atiende los comentarios»)

**Atiende los comentarios y mensajes de las redes del cliente.** Corre en los cuatro planes; lo
que cambia es la profundidad.

| | 🔷 Marketing | 🔷 Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|---|
| **Responder comentarios y mensajes** | ✅ **Básico:** una IA contesta lo simple | ✅ Todos los días, todas las redes | ✅ | ✅ |
| **Pasar al interesado al WhatsApp del cliente** | ✅ | ✅ | ✅ | ✅ |
| **Moderar y dar seguimiento** | — | ✅ | ✅ | ✅ |
| **Auto-DM y embudo de WhatsApp** | — | — | ✅ | ✅ |
| **Agente de WhatsApp a medida** | — | — | ✅ | ✅ |



## agents/08-community-management/README.md (frase)
o al plan siguiente.

## agents/08-community-management/README.md (frase)
→ «Community management».

## cm-escalado/SKILL.md (frase)
  🔷 Marketing escalar es darle al usuario el WhatsApp correcto del cliente; con seguimiento, además se
  registra y se avisa al COO.

## cm-escalado/SKILL.md (frase)
La caja de `cm-triage` · el plan ·

## cm-escalado/SKILL.md (frase)
| Caja | 🔷 Marketing | 🔷 Pro en adelante |

## cm-ficha/SKILL.md (frase)
según la tabla de `WORKFLOW.md` → «0 · El plan
contratado». **Sin plan: BLOQUEADO.** No se asume Marketing «por mientras».

## cm-ficha/SKILL.md (frase)
## 1 · El plan

Se lee el plan y

## cm-ficha/SKILL.md (frase)
plan contratado, ficha

## community/SKILL.md (frase)
según la escalera del plan contratado.

## community/SKILL.md (frase)
Plan: [🔷 Mkt / 🔷 Pro / 🟨 Accel / 🟨 Comp / ⬜ Tailor Made: nivel de Su pipeline]

## README.md (frase)
Auto-DM por palabra clave *(🟨)*

## agents/10-ads-management/brain/WORKFLOW.md (original, «## 0 · El plan contratado»)

## 0 · El plan contratado — cuánto y a qué profundidad

**Lo primero de cada ciclo: leer el plan del cliente.** Lo anota ① Strategy al arrancar en
`clients/<cliente>/00-onboarding/plan-contratado.md`:
🔷 **Marketing** · 🔷 **Marketing Pro** · 🟨 **Accelerate** · 🟨 **Compound** · ⬜ **Tailor Made**.

- 🛑 **Sin plan anotado, el departamento no arranca:** `BLOQUEADO — falta el plan contratado`.
- 🛑 **El plan es el techo, no una sugerencia.** Entregar de más rompe el margen; entregar de menos
  rompe la promesa publicada (`inherent/03-OFERTA.md` → «🌐 Las cuatro tarjetas»).
- Los números salen de `inherent/06-ECONOMIA.md` → «📦 El volumen» y los canales de
  `inherent/05-OPERACION.md` → «10 · ADS MANAGEMENT». **Si cambian allá, cambian acá** — esta tabla
  no manda sobre ellos.

| Qué cambia | 🔷 **MARKETING** | 🔷 **MKT PRO** | 🟨 **ACCELERATE** | 🟨 **COMPOUND** |
|---|---|---|---|---|
| **Meta y TikTok** | ✅ | ✅ | ✅ | ✅ |
| **Google Search y Performance Max** | ⬜ | ✅ Solo búsqueda | ✅ Canal completo | ✅ Canal completo |
| **Variantes de creativo por campaña** | hasta **20** | hasta **30** | hasta **35** | hasta **50** |
| **Optimización** | Mensual | Mensual | Por ángulo, continua | Continua + presupuesto sistematizado |
| **Experimentos controlados** | ⬜ | ⬜ | 🟡 | ✅ |
| **Tracking antes de gastar** | **Pixel de Meta** | **Pixel de Meta** | Atribución completa — CAPI + GA4 | Atribución completa — CAPI + GA4 |
| **Atribución para el performance fee** | ⛔ **No aplica** | ⛔ **No aplica** | ✅ | ✅ |

**Cómo se lee:**

- 🛑 **La inversión publicitaria la pone el cliente, aparte — nunca sale del plan.**
  `inherent/06-ECONOMIA.md` → «⛔ Lo que nunca está incluido». **El plan solo pone techo al TRABAJO:**
  cuántas campañas se arman, cuántas variantes se montan y cada cuánto se optimiza.
  ⚠️ **Un presupuesto de pauta más grande no sube el plan, y un plan más caro no pone más dinero en
  la cuenta.** Confundirlos hace prometer resultados con dinero que nadie puso.
- 🛑 **El presupuesto de pauta lo aprueba el CEO antes de cada lanzamiento** (§2). Sin monto aprobado
  no se lanza, por más que el plan incluya el canal.
- ⚠️ **«Que te encuentren en Google» entra desde 🔷 Marketing Pro**, y es **pauta de búsqueda**, no
  posicionamiento orgánico, ni auditoría técnica, ni link building.
- 🟨 **En Accelerate y Compound Google Ads es un canal de la estructura** *(Search y Performance Max)*
  con **el mismo gate del CEO**: entra en el GATE 1 y su presupuesto, que sale del total aprobado,
  solo se mueve con el GATE 2.
- 🔷 **En la línea Marketing, antes de gastar basta el pixel de Meta instalado.**
  🛑 **El performance fee NO existe ahí:** requiere atribución limpia (CAPI + GA4), que es parte de
  Conversion OS y **solo entra desde 🟨 Accelerate.** Si alguien pide fee sobre un plan 🔷, **se
  levanta como excepción.**
- **Las variantes salen de material ya producido.** ④ Creatividad declara qué se varía,
  ⑥A Diseño gráfico y ⑦ Video Editing las montan, ⑩ Ads las sube. 🛑 **Una variante nunca pide
  grabación extra**, y **no cuenta como publicación**: no entra al calendario orgánico del ciclo.

### ⬜ Tailor Made — se sigue su pipeline

Se define en el onboarding, en `clients/<cliente>/00-onboarding/plan-contratado.md`, con dos
secciones: **Qué incluye** y **Su pipeline** —qué departamentos corren, en qué orden, qué entrega
cada uno y a qué nivel—. **⑩ Ads sigue ese pipeline** *(canales, variantes, cadencia de
optimización)*: no lo bloquea por no ser un plan de lista ni lo cuestiona por precio.

- 🛑 **Si ⑩ Ads no está en su pipeline, no corre para ese cliente.**
- 🛑 **La atribución no se agrega como add-on de pauta:** sin Conversion OS en su pipeline no hay fee.
- **El método es el mismo:** lo que cambia es el pipeline y qué se verifica. **El gate del CEO antes
  de gastar es igual en todos los planes** — pautar es acción destructiva en todos.



## agents/10-ads-management/brain/WORKFLOW.md (frase)
## 3 · Qué se activa según el plan

## agents/10-ads-management/brain/WORKFLOW.md (frase)
El plan solo pone techo al
**trabajo**

## agents/10-ads-management/brain/WORKFLOW.md (frase)
🔷 `clients/<cliente>/07-oferta-y-ventas/ofertas-a-empujar.md` · 🟨 § La oferta de `motor-de-crecimiento.md` · ⬜ lo

## agents/10-ads-management/brain/WORKFLOW.md (frase)
🔷 el pixel de Meta · 🟨 CAPI + GA4

## skills/ad-atribucion/SKILL.md (frase)
🔷 **En Marketing y Marketing Pro no hay fee:** antes de gastar basta el pixel de Meta. **La
atribución limpia (CAPI + GA4) y el performance fee son de 🟨 Accelerate y Compound.**

## skills/ad-atribucion/SKILL.md (frase)
- 🔷 **En Marketing y Marketing Pro** se calcula solo si el cliente comparte sus ventas, y **no es base de ningún cobro**.

## skills/README.md (frase)
🟨 **Google Ads en Accelerate y Compound pasa por los mismos dos gates**

## skills/ad-creativos/SKILL.md (frase)
| 🔷 Marketing | 🔷 Mkt Pro | 🟨 Accelerate | 🟨 Compound |
|---|---|---|---|
| hasta **20** | hasta **30** | hasta **35** | hasta **50** |


## skills/ad-creativos/SKILL.md (frase)
dentro del techo** — no se pauta

## skills/ad-estructura/SKILL.md (frase)
## 4 · Google — qué entra según el plan

| Plan | Qué entra |
|---|---|
| 🔷 **Marketing** | ⛔ |
| 🔷 **Marketing Pro** | **Pauta de búsqueda** — lo que respalda la promesa publicada *«que te encuentren en Google»* |
| 🟨 **Accelerate** · 🟨 **Compound** | **Google Ads como canal de la estructura:** Search y Performance Max, con keywords propias y de la competencia |


## skills/ad-estructura/SKILL.md (frase)
🟨 **En Accelerate y Compound Google corre con el mismo gate

## skills/ad-estructura/SKILL.md (frase)
no sabe qué plan tiene el cliente.

## skills/ad-estructura/SKILL.md (frase)
- [ ] Google según el plan: 🔷 Pro solo **búsqueda** · 🟨 Search y PMax, **dentro del presupuesto aprobado** y con sus gates

## skills/ad-lanzamiento/SKILL.md (frase)
**El tracking del plan funciona** — 🔷 pixel de Meta · 🟨 CAPI + GA4

## skills/ad-encargo/SKILL.md (frase)
tracking del plan esté puesto (en la línea Marketing, el pixel de Meta; en Accelerate y
  Compound, CAPI + GA4)

## skills/ad-encargo/SKILL.md (frase)
— 🔷 `clients/<cliente>/07-oferta-y-ventas/ofertas-a-empujar.md` · 🟨 § La oferta de `motor-de-crecimiento.md` ·

## skills/ad-encargo/SKILL.md (frase)
| ¿Está el tracking del plan? 🔷 **el pixel de Meta** · 🟨 **CAPI + GA4** |

## skills/ad-encargo/SKILL.md (frase)
| 🟨 **Si va Google Ads:**

## skills/ad-encargo/SKILL.md (frase)
### Google Ads en 🟨 Accelerate y Compound

**Google Ads es un canal más del plan de pauta, con las mismas reglas:**

## skills/ad-encargo/SKILL.md (frase)
- 🔷 **En Marketing Pro solo entra la pauta de búsqueda** de la promesa publicada *(ver `ad-estructura` § 4)*.

## skills/ad-encargo/SKILL.md (frase)
| **E · El tracking** | 🔷 pixel de Meta · 🟨 CAPI + GA4 *(y

## skills/ad-encargo/SKILL.md (frase)
**tracking del plan está puesto** antes de gastar — 🔷 pixel de Meta · 🟨 CAPI + GA4

## skills/ad-encargo/SKILL.md (frase)
- [ ] 🟨 Si va Google Ads:

## skills/ads/SKILL.md (frase)
— 🔷 `clients/<cliente>/07-oferta-y-ventas/ofertas-a-empujar.md` · 🟨 § La oferta de `motor-de-crecimiento.md` · ⬜ lo

## skills/ads/SKILL.md (frase)
define canales y variantes

## entregables/plan-de-pauta.md (frase)
De ② Growth — 🔷 `ofertas-a-empujar.md` · 🟨 § La oferta

## entregables/plan-de-pauta.md (frase)
🔷 Pixel de Meta · 🟨 CAPI + GA4

## agents/04-creative/brain/skills/cr-fuentes/SKILL.md (frase)
(10 o 20 por plataforma, según el plan)

## agents/05-production/brain/WORKFLOW.md (frase)
**La hora de fotógrafo existe en los cuatro planes** *(§ 0)*.

## agents/07-video-editing/brain/skills/video-editing/SKILL.md (frase)
las **Redes** del `plan-contratado.md`

## agents/09-posting/brain/skills/po-carga/SKILL.md (frase)
pieza entregada del plan.

## agents/_router/skills/inherent/SKILL.md (frase)
| **Algo que el plan del cliente no incluye** | 🛑 **Se bloquea.** El plan es el techo.

## Modo conversación del Chat
- Probarlo con micrófono real en la Mac, Chrome y un iPhone.
- La voz usa el plan gratis de Gemini: Google puede usar lo hablado para mejorar sus productos. Decidir si se pasa al plan de pago antes de hablar de datos de clientes.

