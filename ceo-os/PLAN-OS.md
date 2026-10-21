# The ultimate OS for Inherent — plan de esta sesión

**Visión:** construir marcas creativas, cool e interesantes —que se vean top of the top— y los sistemas que las hacen crecer.
**El OS no es una interfaz: es la forma de trabajar + las herramientas que hacen que se respete.**
**Base:** Inherent OS (Neon). No hay nada en Notion.

Esta sesión construye y consolida **dos espacios**: **Organization** y **App 01 · Marcas**.

---

## 1 · La forma del producto

```
INHERENT OS
├── ORGANIZATION                 cómo se maneja la empresa
│   ├── Hoy                      lo de hoy y lo que vence (de todo el OS)
│   ├── Proyectos                clientes · proyectos · tareas · deadlines · entregas
│   ├── Ventas                   CRM · flujo de atención y cierre · cotizaciones
│   ├── Servicios                paquetes (3 niveles) · catálogo · responsabilidades y SOPs
│   ├── Finanzas                 facturas por cobrar y por pagar · movimientos · margen · indicadores
│   └── Inherent                 visión y misión · equipo y roles · roadmap · library
│
└── APP 01 · MARCAS              cómo se crean marcas creativas
    └── Marca (una por cliente, más la marca personal privada)
        ├── Investigación        competencia · similares · ambiciosos · ganador · ICP
        ├── Ideas                por pilar y etapa (TOF/MOF/BOF)
        ├── Creación             guiones de reel y story con la voz de la marca
        ├── Formatos             plantillas: reel · story · ficha de referente
        ├── Design system        colores · tipografía · logo · grilla · componentes (→ Figma)
        ├── Video                ficha por video: assets · cortes · lógica · transiciones
        ├── Tech                 web viva · landings · herramientas a medida (con el design system)
        └── Calendario           agendar · publicar · archivar solo
```

- **Un interruptor arriba** cambia entre Organization y Marcas (como cambiar de app en un iPhone).
- **Buscador global (⌘K)** en todas las pantallas, en los dos espacios.
- **Claude** vive en un **chat lateral** disponible en todo el OS (motor: Inherent Terminal en la compu de cada persona).
- **Laya** es el ojo: juzga en cada puerta y deja su nota guardada.
- Lo que hoy está en «Control», «Mi marca» y «Contenido» se reacomoda aquí; **nada se borra**, solo cambia de casa.

---

## 2 · Reglas que valen en los dos espacios

1. Todo pertenece a algo: en Organization a un cliente o a Inherent; en App 01 a una marca. Nada flota.
2. Un solo lugar para cada cosa. Nunca duplicados.
3. Máximo 3 niveles: Espacio › Sección › Elemento (en App 01: Marca › Módulo › Elemento).
4. Estado visible en cada elemento. Contenido: Idea · En proceso · Listo · Publicado. Facturas: Borrador · Pendiente · Vencida · Pagada.
5. Plantillas para todo lo repetitivo. Nombres automáticos: `Marca – Formato – Tema` · `Cliente – Factura – Mes`.
6. Lo terminado se archiva solo.
7. Una acción principal por pantalla. Textos humanos. Se entiende en 10 segundos.
8. Cada dato dice de dónde sale y lleva ahí.

---

## 3 · Qué existe y qué falta

### Organization
| Sección | Ya existe | Falta |
|---|---|---|
| Hoy | Dashboard CEO (proyectos, % en día, reuniones, contenido) y Hoy del equipo | Unificar con lo que vence en Finanzas y Ventas |
| Proyectos | Clientes, página de proyecto (7 vistas), tareas, entregas | Ordenar navegación |
| Ventas | CRM con etapas, fuentes, quiz, cotizaciones | **Flujo de atención y cierre**: primer contacto en un minuto, guion, siguiente paso, Laya puntúa el lead |
| Servicios | Paquetes, catálogo, responsabilidades | Nada grande |
| Finanzas | Movimientos, margen por cliente, precios | **Facturas por cobrar y por pagar** (abajo) |
| Inherent | Equipo, vistas por rol, roadmap, library | **Visión y misión** como página; mover Library aquí |

### Facturas (lo nuevo grande de Organization)
- **Por cobrar:** se crean solas cada mes desde la cotización aceptada o el nivel del cliente.
- **Por pagar:** entran por la etiqueta «Facturas» de Gmail, reenvío o foto. Claude lee el PDF (`ap-processor`) y saca proveedor, NIT, monto y vencimiento.
- **Laya:** categoría, a qué cliente/proyecto pertenece, ¿duplicada?, ¿monto raro?, riesgo de atraso.
- **Cruce con el banco:** se sube el estado de cuenta (o Zapier) y se marcan solas las pagadas.
- **Recordatorios:** a quien debe (`invoice-chase` / secretaria por WhatsApp); a ti, en Hoy.
- **El contador** recibe el paquete del mes. La FEL la sigue emitiendo el contador.

### App 01 · Marcas
| Módulo | Ya existe | Falta |
|---|---|---|
| Investigación | Research en 5 niveles, inspo por plataforma | Ficha de ICP, ficha de referente como plantilla, Laya filtra |
| Ideas | Ideas por estado | Por pilar y etapa, «Convertir en guion» |
| Creación | — | **Todo**: editor de guion desde plantilla + contexto de marca + Claude |
| Formatos | Piezas sueltas en skills | **Plantillas editables** de reel y story |
| Design system | Marca → Asociaciones (moodboard, tono) | **Sistema completo** + sync con Figma (figwright) |
| Video | — | **Ficha de video**: assets, cortes, lógica, transiciones con vista previa |
| Calendario | Calendario de contenido | Estados, agendar desde guion, archivado |

### Lo que comparten
| Pieza | Falta |
|---|---|
| Interruptor de espacios + buscador global | Todo |
| Modelo de elemento (estado, nombre, archivo) | Todo |
| **Laya** como herramienta `juzgar()` del conector | Todo (necesita acceso a su API) |
| **Inherent Terminal + chat** | Todo (instalador de un comando, chat, permisos, contexto, «Ver terminal») |

### Ads Studio (App 01 · Marca › Ads) — variaciones para lanzar pauta
**Qué hace:** de una pieza que funcionó (o de un guion), saca variaciones listas para pautar en Meta y Google, y las deja esperando tu OK.

**Front end (lo que ves):**
- Por marca, un tablero «Ads»: arriba la **pieza madre**; abajo sus **variaciones** como tiles.
- Cada variación: gancho, copy, formato (9:16 · 4:5 · 1:1 · 1.91:1), plataforma, la nota de Laya y su estado: Borrador → Aprobada por CEO → Lanzada → Ganadora / Quemada.
- **Google Ads:** se arma el anuncio de búsqueda con sus límites (15 títulos de 30 caracteres, 4 descripciones de 90) y el contador en vivo.
- **Meta:** texto principal, título y CTA por variación.
- **Publicar en bulk:** seleccionas varias variaciones o piezas y las programas todas de una vez en el calendario (Zernio carga en lote); también para orgánico.
- Una acción principal: **«Crear variaciones»**. Y un solo botón final: **«Lanzar»**, que solo se enciende con tu OK.

**Back end (lo que corre detrás):**
- Colección `ad_variants` (marca, pieza madre, plataforma, formato, textos, assets, nota de Laya, estado, resultados).
- **Generación:** Claude escribe ganchos y copys con la voz de la marca (skill `ad-creativos`); las piezas visuales se adaptan de formato y se generan variantes con flujos propios corridos por Claude/Codex con la cuenta de cada persona (sin fal ni Runway); ElevenLabs opcional para voz en off.
- **Laya** califica cada variación antes de pasar a tu revisión.
- **Lanzar:** con tu OK, la campaña se crea por **AdWhispr** (Meta, Google, TikTok) y queda registrada en Campañas del puesto de Ads. Nada se lanza solo.
- **Resultados:** Windsor trae rendimiento por variación; Laya marca ganadoras y quemadas; la ganadora vuelve a Investigación como «contenido ganador».

## 7 · Nuestro stack por área

| Área | Nuestro stack |
|---|---|
| Motor de agentes | Claude Code (cada persona) + Inherent Terminal · Vercel |
| Contexto compartido | Repo (método y skills) · Inherent OS (operación) · Library |
| Herramientas internas | Claude Code construye sobre el OS |
| Contenido a escala | Claude/Codex con la cuenta de cada persona · Figma (figwright) · ElevenLabs (opcional) |
| CMO con IA | Apify (investigación) · Laya (juicio) · Windsor (métricas) · AdWhispr (pauta) |
| Conocimiento de la empresa | Inherent MCP · Gmail · Drive · Wispr Flow |
| Automatizar lo repetitivo | Skills del repo · recetas del OS · Zapier |
| Agente de la empresa | Secretaria (00-account) en WhatsApp + chat de Claude en el OS |
| Publicar | Zernio (incluye carga en lote) |
| Dinero | Recurrente (cobros) · banco · contador |

### Tools y MCP Market
- **La regla de origen se mantiene: todo bajo un techo = Inherent OS.** El conector de Inherent es el techo de los datos.
- **MCP Market** (un MCP propio que junta tools y skills) sirve para otra cosa: **instalar de un golpe** en la compu de cada persona los conectores externos (Apify, fal, ElevenLabs…) y las skills. En vez de 10 instalaciones, una.
- **Cuidado:** las llaves de esas herramientas quedarían en un tercero. Se decide herramienta por herramienta.
- En el OS, una pantalla **Tools** (en Inherent) lista qué está conectado, qué falta y para qué sirve cada una.

## 8 · El stack: qué integramos y qué no
De la lista «AI stack para construir un negocio desde cero» (todo menos Higgsfield):

| Para qué | Herramienta | Decisión |
|---|---|---|
| Motor de agentes | Claude Code + Vercel | **Ya está** |
| Contexto compartido | Repo + Inherent OS + Library | **Ya está** (no Notion ni Obsidian: serían dos fuentes de verdad) |
| Herramientas internas | Claude Code | **Ya está** (Cursor/Codex no suman) |
| Contenido a escala | fal · Runway | **No**: lo hacemos con flujos propios en Claude/Codex con la cuenta de cada persona |
| CMO con IA (investigación) | **Apify** | **Ya está**, falta reautorizar |
| Conocimiento de la empresa | MCPs · Gmail · **Wispr Flow** | Gmail ya; **Wispr Flow** para dictar en vez de escribir (ideal para el chat) |
| Base de datos | Neon (ya) | Supabase no suma |
| Asistente personal | Poke | Opcional, fuera del OS |
| Halos · Monid | — | Revisar qué hacen antes de decidir |

---

## 4 · Fases de esta sesión

| Fase | Qué se entrega | Para qué |
|---|---|---|
| **0 · Método + harness** | Página de Principios · criterios de aceptación por entregable · auditoría de skills contra la lista de marketing (¿cumplen de verdad?) · skills nuevas: estructura de reel y de story, referidos, product management, SEO/GEO, funnels, podcast como TOF · todo pasa por tu OK antes de escribirse | Que la app haga cumplir un método completo |
| **1 · Estructura** | Interruptor Organization / Marcas, navegación reacomodada, buscador global, modelo de elemento | Que todo tenga su casa |
| **2 · Organization** | Facturas por cobrar/pagar con Gmail y banco · flujo de atención y cierre en Ventas · página de Visión y misión · Hoy unificado · **Workspaces por rol rehechos: cortos, sin info suelta, solo lo que ese rol hace hoy** | Manejar la empresa rápido |
| **3 · Laya** | Herramienta `juzgar()`, preguntas por puerta editables, notas guardadas; conectado a Facturas, Ventas e Investigación | El criterio del sistema |
| **4 · Marcas: entender** | Investigación con ICP y fichas · **scraping automático** (cada semana el servidor jala los posts de los referentes de cada marca con Apify, sin prompt) · **Laya analiza cada post** contra la marca (¿sirve?, ¿por qué funciona?) · página reordenada: arriba lo que funciona, abajo la biblioteca · Ideas por pilar y etapa · candado del brief de comunicación | Que nada se cree sin entender |
| **5 · Marcas: crear** | Formatos · Creación de guiones · Design system + Figma · Ficha de video · **Ads Studio** (variaciones + lanzar con OK) · **Tech** (web viva, landings, herramientas, auditoría SEO/GEO con claude-seo) | Crear con la voz y el look de la marca |
| **6 · Marcas: publicar + Claude** | Calendario con estados y archivo · assets de Drive · Inherent Terminal + chat lateral · Laya y ojo visual locales · **walkthrough de conexión** · **videos «Cómo se usa»** | Operar sin salir del OS |
| **7 · Pulido Apple** | Etiqueta «Facturas» en Gmail (Claude registra las facturas de proveedores) · Textos, vacíos que enseñan, móvil, modo noche, prueba con una persona no técnica | Que se entienda en 10 segundos |

Hecho fuera de fase: la letra pasó de 42dot Sans a **Inter** (42dot no trae tildes y la «ó» salía en otra letra).

Cada fase se prueba (suites + capturas) y se une a main antes de la siguiente.

---

## 5 · Dependencias tuyas
- **Laya:** es código abierto y no necesita llave; sí necesita dónde correr (ver § Laya).
- **Apify:** volver a autorizarlo en claude.ai, y poner su llave (API token) en Vercel para el scraping automático de Investigación.
- **Gmail:** la etiqueta «Facturas» la creo yo en la Fase 7 (aprobado).
- **Banco:** decir qué banco usas y si exporta CSV.
- **Cuentas de generación:** cada persona conecta su propia cuenta en su terminal.

## 6 · Fuera de esta sesión
App 02 (consulting), Google Ads/CAC, referidos, SEO/GEO, funnels, podcast. Siguen en el método (skills) y entran después como módulos.

## 9 · El harness de Inherent (lo que más importa)
Un **harness** es el marco que hace que cualquier agente —o persona— trabaje dentro de las reglas de la empresa. Tiene tres capas:

| Capa | Qué es | Dónde vive hoy | Qué falta |
|---|---|---|---|
| **Principios** | Quiénes somos, qué prometemos, qué nunca hacemos | `CLAUDE.md` · `inherent/01-IDENTIDAD.md` · `03-OFERTA.md` | Una página corta «Principios» que cualquier agente lea primero |
| **Procedimientos** | Cómo se hace cada cosa | WORKFLOWs de cada agente · skills · SOPs · Responsabilidades del OS | Ligar cada tarea del OS a su SOP y su skill (ya empezó) |
| **Criterios de aceptación** | Cuándo algo está **bien hecho** | Disperso en checklists de skills | **Una ficha por entregable** (guion, reel, story, diseño, anuncio, factura): qué debe cumplir para pasar |

**Cómo lo hace cumplir el OS:**
1. El chat de Claude **siempre** arranca con principios + el procedimiento del paso + los criterios del entregable.
2. Ningún elemento cambia a «Listo» sin pasar sus **criterios de aceptación**: Laya los revisa rápido y el humano da el visto final.
3. Cada rechazo deja el porqué, y eso afina los criterios con el tiempo.

## 10 · Laya (en lugar de Jev)
**Qué es:** un motor de decisiones de código abierto (Apache 2.0). Responde preguntas fijas —elegir opción, dar puntaje, sí/no con probabilidad— en ~33 ms, en 100+ idiomas, incluido español. Trae servidor HTTP y servidor MCP.
**Dónde corre: decidido — en la compu de cada persona**, dentro de Inherent Terminal, junto al filtro visual (CLIP/SigLIP). Gratis y privado. (Opciones evaluadas: no cabe en Vercel por PyTorch, ~400M parámetros.)
- **En la compu de cada persona**, dentro de Inherent Terminal (se instala con el mismo comando). Gratis, privado; depende de que la compu esté prendida.
- **En un servidor pequeño** (una sola instancia para todos), y el OS lo llama por HTTP. Siempre disponible; tiene un costo mensual de servidor.
**Límite real:** Laya lee **texto**. Para juzgar algo visual, Claude primero describe la imagen o el video y Laya decide sobre esa descripción.
**Se puede entrenar** con nuestras propias decisiones (lo que tú aprobaste y rechazaste) para que piense como Inherent.

## 11 · Juicio visual
Laya no ve. El ojo visual va bajo la misma herramienta `juzgar()`:
- **Filtro rápido** (CLIP/SigLIP, local): ¿se parece a la marca? (contra moodboard y design system) · ¿se ve de calidad? (puntaje estético). Para filtrar cientos de referentes o variaciones.
- **Juicio fino:** Claude viendo la imagen o los fotogramas, contra los criterios de aceptación del entregable.
- **Laya:** todo lo de texto (ganchos, copys, leads, facturas, mensajes).

## 12 · Onboarding: walkthrough de conexión + videos tuyos
**El primer día de cada persona, el OS la lleva de la mano (pantalla a pantalla, estilo iPhone nuevo):**
1. **Bienvenida:** quién eres en Inherent y qué vas a ver (su puesto y para qué).
2. **Instalar Inherent Terminal:** botón «Copiar comando», un video corto de cómo pegarlo, y el OS **detecta solo** cuando ya quedó instalado (✓ verde).
3. **Entrar a Claude:** abre el login; ✓ cuando Claude responde desde el chat.
4. **Laya y el ojo visual:** se descargan solos; ✓ cuando hacen su primera prueba.
5. **Conectar sus cuentas:** Google (Drive y Calendar) y lo que su puesto necesite; cada una con ✓.
6. **Prueba final:** una tarea de ejemplo de punta a punta («crea una idea para la marca de prueba»).
Se puede pausar y retomar; el OS recuerda en qué paso iba. Si algo falla, dice qué hacer en una frase y ofrece pedir ayuda al COO.

**Tus videos dentro del OS:**
- Cada sección tiene un botón **«Cómo se usa»** que abre **tu video** explicando esa parte (y su SOP debajo).
- Los grabas cuando quieras; los subes en **Inherent › Onboarding** y eliges a qué sección y a qué puesto van.
- El OS lleva la cuenta de **qué videos vio cada persona** y lo muestra en su perfil y en Equipo.
- Para la primera semana, un **recorrido por puesto**: la lista de videos que esa persona debe ver, en orden.

**Video en miniatura (walkthrough de verdad):**
- El video se abre como **ventanita flotante** en una esquina (tipo picture-in-picture) y **sigue contigo** mientras navegas y haces lo que explica.
- Se arrastra a cualquier esquina, se agranda, se pausa y se minimiza a una burbuja con tu cara.
- **Marcas de tiempo que señalan la pantalla:** al subir el video marcas «0:12 → botón Crear», y en ese segundo el OS **resalta ese botón** con un brillo suave. El video y la app van sincronizados.
- **Pasos con check:** debajo del video, los pasos de esa parte; se marcan solos cuando la persona hace la acción en la app.

## 13 · Claude edita los videos con el look de cada marca (Fase 5 · Video)
Referencia: reel de @joshuablatch — «cualquiera puede hacer que Claude edite sus videos; lo difícil es que cada edición se vea exactamente como tu marca».
- **Kit de edición por marca** (parte del design system): tipografía y estilo de subtítulos, colores, transiciones permitidas, intro/outro, lower thirds, ritmo de cortes, música y nivel de voz, reglas de encuadre y safe zones. Se guarda como datos, no como adjetivos.
- **Plantillas de edición** reutilizables por formato (reel de gancho, testimonio, detrás de cámaras, anuncio) construidas con herramientas de código (ffmpeg / Remotion) que Claude corre en la terminal de cada persona.
- **Flujo:** la ficha de video (assets, cortes, lógica, transiciones) + el kit de la marca → Claude arma el corte → el ojo visual y Claude con visión lo revisan contra los criterios → tú apruebas → derivadas y variaciones para Ads Studio.
- Se apoya en las skills `ve-armado`, `ve-marca`, `ve-derivadas` y `ve-export`.

## 14 · Tech (Marca › Tech) — web viva y herramientas a medida
Referencia: reel de @mattxwebb — «tu web no debería ser estática».
- **Web viva:** la web de cada marca se construye con Claude **desde su design system** (colores, tipografía, componentes) y se publica en Vercel. No es estática: **se alimenta del OS**. Lo que se publica en redes, los casos, testimonios, ofertas y eventos aparecen solos; Claude la actualiza cuando cambia algo de la marca.
- **Landings** para funnels y para Ads Studio (una por campaña), con su formulario conectado a una **fuente de leads** del CRM.
- **Búsqueda y IA (SEO/GEO):** la web se escribe para que Google y los asistentes de IA la entiendan (skill `mk-busqueda`; sin SEO técnico, como dice el manual).
- **Auditoría SEO/GEO de la web con claude-seo** (`AgriciDaniel/claude-seo`, plugin de Claude Code, licencia MIT): técnico, schema, GEO, local y tienda en línea. Corre en la compu como el chat de Estrategia y el resultado va a Marca › Tech. Es una auditoría aparte de la web: no cambia `mk-busqueda` ni el manual de ③ Marketing. Se instala (y entra a `INSTALAR.md`) al llegar a esta fase.
- **Herramientas a medida para el negocio** del cliente (CRM ligero, paneles, automatizaciones): skill `gr-herramienta`, construidas con Claude.
- **En el OS:** por marca, la lista de sus sitios y herramientas con su link, estado (En construcción · En vivo), última actualización y de qué datos del OS se alimenta.
- Va en la **Fase 5** (crear), después del design system, porque nace de él.

## 15 · Los 5 niveles de consciencia (propuesta, falta OK para el manual)
Referencia: reel de @mate.jimenez — las 5 fases por las que pasa una persona desde que no te conoce hasta que compra (Eugene Schwartz): **inconsciente · consciente del problema · consciente de la solución · consciente del producto · listo para comprar**.
- **En el método:** cada pieza lleva, además de TOF/MOF/BOF, su **nivel de consciencia**. El nivel decide el tipo de gancho y de mensaje (al inconsciente le hablas de su vida; al consciente del producto, de por qué tú).
- Skills que tocaría: `mk-calendario` y `mk-pilares` (columna y mezcla), `cr-brief` y `cr-hook-copy` (gancho por nivel), `cr-estructura-reel` (esqueleto por nivel), `gr-funnel` (qué nivel cubre cada paso).
- **En App 01:** campo «Nivel de consciencia» en Ideas y Creación; la mezcla del mes muestra si falta algún nivel. Laya puede verificar que el gancho corresponda al nivel declarado.
