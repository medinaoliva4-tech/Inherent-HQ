# Reglas de diseño del CEO y referencias (para quien construya la UI)

> Quien construya una pantalla de Inherent OS lee esto primero. Son reglas del CEO, no sugerencias.

## Las reglas

1. **Visual, no informativa.** Gráficos, anillos, barras, embudos, curvas, tarjetas y botones. Una pantalla que solo muestra texto y listas «no sirve».
2. **Interactiva.** Cada elemento se puede tocar: abre, edita, agrega, aprueba. Nada de pantallas de solo lectura.
3. **El dashboard cabe en UNA vista.** Sin scroll en 1440×900 ni en 390×844. Lo que no cabe se agrupa o se mueve a «Más detalle».
4. **Producto, no formulario.** Al diseñar se miran productos y Apple (Liquid Glass, jerarquía, espacio, microinteracciones). «Lo nuevo no está así.»
5. **Adaptable con límite claro.** Cada persona arma su agente, su vista, su flujo; el límite (qué lee, qué puede pedir, qué pide aprobación, tope de costo) está siempre a la vista y no se cambia.
6. **Studio es una herramienta dentro de su área** (Marketing / Producción en «Áreas»), no una puerta aparte.
7. **Pocas páginas, organismo vivo.** Lo que interrumpe se quita; lo que se usa junto vive junto.
8. **Sin inventar datos.** Sin dato: «Sin datos», nunca un 0 inventado. El puntaje, el embudo y la curva salen de cálculos, no de adornos.
9. **Tokens del OS:** `--ui-*`, `--fs-*`, `--r-*` (`npm run lint:css`). Nada de colores sueltos. Diálogos solo con `ui.js` (`dialog()`).

## Referencias (lo que el CEO mostró)

- **«Build workflow with AI» (Kendo):** diálogo oscuro, título + subtítulo de qué fuentes usa, un mensaje del asistente, **3 sugerencias en filas**, caja de texto grande «Describe el disparador, las condiciones…», «Enter para enviar · Shift + Enter nueva línea», y al pie «Crea un borrador. Revísalo, pruébalo y publícalo cuando estés listo.» → ya aplicado en «Construir con IA» (`screens/sistemas.js`).
- **Agentes (Valar Agents OS):** barra lateral con secciones por área; columna «Agents N» con buscador y filtro de áreas, botón «New agent», un **Operator** arriba y cada agente con su avatar de color, área y última acción; el panel principal «New agent» con **«Start from scratch»** y **plantillas por área** (Sales 4, Marketing 6, Fulfillment 4) en tarjetas con: avatar, nombre, área, qué hace en 2 líneas y «Needs / Uses» (integraciones). → ya aplicado como catálogo + «Mis agentes».
- **Revenue / leads:** el embudo, el anillo de puntaje y el panel lateral de edición (`screens/revenue.js`).
- **Hoy:** el tablero de 6 fichas (`screens/tablero.js`).

## Cómo se ve bien (criterios de aceptación de una pantalla)

- Un gráfico o un objeto visual por cada dato importante; el texto es la etiqueta, no el contenido.
- Un foco primario por pantalla (un botón negro), el resto secundario.
- Estados: vacío (qué hacer), cargando, error con salida. Teclado y lector de pantalla (aria-label en gráficos).
- Probada en navegador a 1440×900 y 390×844, claro y oscuro, sin errores de consola.
