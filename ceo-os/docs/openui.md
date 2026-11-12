# OpenUI en el OS

El Chat dibuja interfaz cuando un párrafo no alcanza. El modelo escribe un bloque ` ```ui ` en **OpenUI Lang** y el OS lo
pinta con sus propios componentes, tokens `--ui-*` y tema claro/oscuro. Cada contenido pide su patrón: las tarjetas son
solo para decisiones.

- Código: `public/js/llm/genui.js` (catálogo y renderizador), `public/js/llm/acciones-os.js` (registro de acciones).
- Ejemplos visibles: `/openui-ejemplos.html` (fuente en `public/js/llm/genui-ejemplos.js`). Capturas en `docs/capturas-openui/`.
- Pruebas: `npm run test:openui` (`scripts/test-openui.mjs`).

## 1 · Qué es OpenUI y qué tomamos

`thesysdev/openui` (MIT, «The Open Standard for Generative UI», revisado el 2026-11-11):

| Pieza | Qué trae | Qué hacemos |
|---|---|---|
| `spec/language.md` (OpenUI Lang 1.1) | Gramática `nombre = Componente(args)`, streaming, `$estado`, `@acciones` (`@Run`, `@ToAssistant`, `@OpenUrl`), `Query/Mutation/Action` reservados | **Adoptado:** el lector `lang-core` 1.1.0 ya vive en `public/vendor`. **No adoptado:** `$estado`, `@acciones` ni `Query/Mutation` (un modelo no debe poder llamar URLs ni mutar datos). Ningún componente nuestro usa un nombre reservado. |
| `packages/react-ui` (~70 componentes) | Callout, Steps, Table, EditableTable, Tabs, Accordion, CheckBoxGroup, Charts (Bar, Line, Area, Pie, Radar, Heatmap, Scatter, Mini*), MetricIndicator, FollowUpBlock… | **Replicado en vanilla** lo que el OS necesita: Callout, Collapse (Accordion), Checklist (CheckBoxGroup), Timeline (Steps con estado), Table con barra, Heatmap, Chart (barras, línea, sparkline = Mini*), Gauge (RadialChart), Summary (OverviewCardBlock). Sin React ni librería de gráficas: CSS y SVG propios. |
| `packages/libraries/dashboard` (46 componentes) | Dashboard, CardRow, FilterBar, Section, charts, OverviewCardBlock, Table/Col | **Tomado como patrón:** «resumen arriba, detalle abajo» (Summary → Collapse) y filas de cifras (`Row`). Filtros y fechas no: el Chat responde una pregunta, no es un tablero. |
| Tema (`ThemeProvider`) | claro/oscuro con overrides | Nuestros tokens `--ui-*` ya siguen a `html[data-theme]`. |

Criterio de gráficas (skill `dataviz`): la forma primero; sin doble eje; una serie sin leyenda y 2–3 con leyenda y patrón de
línea (no solo color); matriz en **un solo tono** de claro a oscuro con el número escrito; texto en tinta, nunca del color
de la serie; tooltip nativo en cada marca y una tabla oculta para lectores de pantalla; estados (ok/atención/error) siempre
con su punto **y** texto, como `estado()` de `visual.js`. Movimiento: solo opacidad, nada con «reducir movimiento».

## 2 · El catálogo

| Patrón | Componentes |
|---|---|
| Cifras | `Summary(conclusión, [[label, valor]] máx 3)` · `Metric(label, valor, nota)` · `Gauge(label, valor, max, nota)` · `Row([...])` |
| Datos | `Table(columnas, filas, barra)` (barra en línea en esa columna; `Tag` en celdas) · `KeyValue([[k, v]])` · `Compare(columnas 2–3, filas, recomendada)` |
| Procesos | `Timeline([[texto, hecho/ahora/pendiente/bloqueado, fecha]])` · `Steps` · `Checklist(titulo, items)` (interactiva, se recuerda) |
| Cruces y tendencias | `Heatmap(filas, columnas, valores, nota)` · `Chart(barras/linea/sparkline, etiquetas, series, unidad)` |
| Avisos | `Callout(ok/atencion/error/info, titulo, texto)` · `Tag(texto, tono)` |
| Decisiones | `Decision(titulo, recomendación, motivo, Boton)` — Aprobar corre el Boton, Cambiar deja el pedido en la caja, Después se recuerda (y se deshace) · `Card` |
| Acciones | `Actions([Boton(label, accion, {args})])` |
| Herramientas | `Tool(id, slug, titulo)` · `Artifact(ref, titulo)` · `Guardar(destino, slug, {datos}, resumen)` |
| Conversación | `Question(texto, opciones)` · `Pedir(label, pedido)` · `Text` · `List` · `Stack` |

`PROMPT_GENUI` enseña: resumen primero, detalle plegado; el patrón por tipo de contenido; solo datos reales.

### Topes y seguridad

- **3 bloques** por respuesta (antes 1); del 4º en adelante queda como texto. 300 nodos, 12 KB de fuente y 80 KB de HTML por
  bloque; un bloque que se expande con referencias no se dibuja; uno malformado se ve como código al terminar.
- Todo lo que escribe el modelo se escapa; ningún componente pone enlaces, imágenes ni estilos del modelo (solo anchos y
  alturas en % calculados aquí).
- **Registro de acciones** (`acciones-os.js`): `abrirHerramienta`, `abrirEnChat`, `imprimir`, `crearTarea`, `copiar`, `pedir`,
  `guardarEnHerramienta`. Lista cerrada, argumentos limpiados (ids y slugs con `[a-z0-9-]`, textos con tope, sin `/` ni `@` al
  inicio). Nada corre solo; ninguna es irreversible: `crearTarea` abre el formulario de siempre; `imprimir` abre la hoja con
  su botón de PDF; `guardarEnHerramienta` solo **agrega** lo que la persona aprobó.
- Los botones del OS quedan apagados mientras el bloque se escribe. Checklist y Decision se recuerdan en este navegador por
  conversación y bloque (`localStorage gu.<sesión>.<bloque>.<nombre>`).

## 3 · Sugerencia sobre la caja del Chat

`public/js/sugerencia-chat.js`: tarjeta discreta encima del compositor (ícono, título, una línea, 1–2 acciones y «Ahora no»).
Solo propone. «Ahora no» se recuerda por persona y vuelve solo si cambia su **huella** (la fecha o la hora de la grabación).

- Motor: una regla de `avisos-reglas/*` agrega `sugerencia: { titulo, linea, icono, acciones }` a su aviso (`aviso()` en
  `base.js` la deja pasar). El Chat la toma de `GET /api/avisos` al abrir `#/chat` y cada 5 min.
- Ejemplo real: `avisos-reglas/sugerencias.js · pr-imprimir-hoja` — una grabación «Por grabar» de hoy a 2 días → «Te
  recomiendo imprimir la hoja de preproducción» → **Imprimir** abre el call sheet de esa jornada (Production Planner) listo
  para PDF. También sale en Avisos (urgencia baja).
- Se monta desde `chat-avisos-ui.js` (ya recibe `me` de `app.js`): no toca `screens/llm.js`; un observador la vuelve a poner
  cuando el Chat repinta la caja. Otro módulo puede proponer una con `sugerir()`.

## 4 · Estado vacío conversacional

`public/js/vacio-chat.js` · `vacioChat(el, { tema, preguntas, modo, slug, destino })`: «Esto aún no se ha creado. ¿Platicamos
para crearlo?», el avance por temas («0 de 3») y **Platicarlo en el Chat**, que abre el Chat del modo con un borrador y las
preguntas guía (`abrirEnChat` de `areas.js`).

**El regreso:** el borrador pide al agente cerrar con un `Checklist` de los temas y un `Guardar(destino, slug, {datos}, resumen)`.
La persona revisa y hace clic: `guardarEnDestino` valida los datos contra el contrato del destino (`DESTINOS`), lee lo que hay,
**agrega** y escribe por la API de la herramienta, marca los temas y avisa con el evento `os:dato`.

Ejemplo real: **Referencias de video** (Marcas · Referencias por pilar, `/api/content/refs`). Sin ninguna referencia, la
pestaña muestra el vacío (`screens/content.js`, 3 líneas). Destino `referencias-video`: solo links de Reels, TikToks o Shorts,
5 por pilar.

## 5 · Code y voz

- **Code:** el bloque `ui` se dibuja en cualquier modo (el renderizador no mira el modo). Lo que falta es que Claude Code lo
  sepa escribir: su sistema lo pone el puente, no el OS → **pendiente del puente** (agregar `PROMPT_GENUI_MIN` al sistema de
  la sesión).
- **Voz:** no se cambió. `PROMPT_VOZ` pide «sin tablas ni tarjetas» y la voz lee el texto del mensaje: agregar UI chocaría.
  `PROMPT_GENUI_MIN` queda listo para cuando `conversacion.js` lea en voz alta `sinUi(texto)` en vez del texto crudo.

## 6 · Pendiente (fuera de este PR)

- Las ocho vistas de Code se resuelven con `llm/mapa-trabajo.js` hacia herramientas nativas del OS. Donde todavía no hay
  equivalente (`adquisicion`, `dolores`), `Tool(id)` avisa que falta conectarlo; no abre un iframe vacío.
- Puente: `PROMPT_GENUI_MIN` en las sesiones de Code; la API de herramientas (nodos del hilo) como destino de `Guardar` para
  las herramientas de departamentos (`DESTINOS` en `vacio-chat.js`).
- `screens/content.js`: repintar Referencias al recibir `os:dato` (hoy se ve al volver a la pestaña).
