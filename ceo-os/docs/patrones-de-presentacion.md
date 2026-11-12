# Patrones de presentación

Las tarjetas **no** son la única forma de mostrar información. Cada contenido pide su patrón.

**Regla:** tarjeta = objeto que **se elige, se arrastra, se abre o se cita** (un lead en el kanban, el plan a elegir, el paquete abierto, el resultado de un agente). Todo lo demás es tabla, lista, formulario, timeline o documento.

Componentes: `public/js/tabla.js` · `public/js/lista.js` · `public/js/cifras.js`. Estilos: `public/tablas.css` (prefijos `tdn-`, `lsd-`, `cfr-`, `vpp-`). Pruebas: `npm run test:tablas` (y `-- --navegador` con el OS local corriendo).

## Contenido → patrón → cuándo sí tarjeta

| Contenido | Patrón | Cuándo sí tarjeta |
|---|---|---|
| Datos tabulares: movimientos, facturas, cotizaciones, leads, costos, fuentes | **Tabla densa** (`tabla()`) | Nunca para la fila. Si el objeto se arrastra entre etapas, su vista kanban sí es de tarjetas |
| Listas: tareas, entregables, pasos, seguimientos, por cobrar | **Lista de una línea** (`listaHtml()`): estado · título · dueño · fecha, agrupada | Nunca |
| Métricas (KPI) | **Fila de cifras** (`cifrasHtml()`): cifra grande + delta + sparkline, un solo contenedor | Nunca una tarjeta por número |
| Comparaciones (paquetes, planes) | **Tabla comparativa** ordenable, columnas lado a lado | Una tarjeta por opción solo si son 2–4 y se elige una |
| Procesos (fases, etapas) | **Timeline** (`ol.vpp-tl`) | Nunca |
| Formularios y documentos (cotización, reparto) | **Sección sin marco** (`section.vpp-sec`) + `vpp-forma` / `vpp-aside` | Nunca |
| El objeto abierto o elegido (el paquete, el plan) | Tarjeta | Sí: es lo que se cita y se cotiza |
| Kanban de leads | Tarjetas | Sí: se arrastran |

## Tabla densa

Filas de 34 px, cabecera fija al desplazar, columnas ordenables (`aria-sort`), números a la derecha, foco de teclado (flechas, Inicio/Fin, Re Pág/Av Pág, Enter abre, Espacio elige), acciones por fila al pasar el mouse o con foco, grupos con encabezado, fila de totales, vacío con `vacio()` y carga con filas fantasma. En el cel (≤ 700 px) cada fila se apila: el título arriba y el resto como «etiqueta · valor»; el orden se elige con un select. Sin scroll horizontal.

```js
import { tabla } from '../tabla.js';

mount(b, html`<div id="tMov"></div>`);
const t = tabla($('#tMov', b), {
  etiqueta: `Movimientos de ${mes}`,            // el <caption> que lee el lector de pantalla
  filas: lista, orden: { k: 'date', dir: 'desc' },
  cols: [
    { k: 'concept', t: 'Concepto', orden: true, celda: (e) => html`<b>${e.concept}</b>` }, // la primera columna es el th scope="row"
    { k: 'date', t: 'Fecha', orden: true, celda: (e) => fdate(e.date) },
    { k: 'client', t: 'Cliente', orden: true, movil: 'oculta' },                         // no sale en el cel
    { k: 'amount', t: 'Monto', num: true, orden: (e) => firmado(e), celda: (e) => Q(e.amount) },
  ],
  abrir: (e) => verMovimiento(e.id),            // fila clicable (clic o Enter)
  acciones: (e) => [{ t: 'Editar', ico: 'edit', fn: () => editar(e) }],
  pie: (fs) => [html`<b>Neto</b>`, '', '', Q(neto(fs))],
  vacio: { icono: 'inbox', titulo: 'Sin movimientos este mes', linea: 'Registra un ingreso o un gasto.' },
  // grupo: (f) => f.source,                    // filas agrupadas bajo un encabezado
  // seleccion: { alCambiar(ids, filas) {} },   // solo si la pantalla ya tenía selección múltiple
  // cargando: true,                            // mientras llegan los datos
});
t.pintar({ filas: nuevas });                    // repinta sin perder orden, selección ni foco
```

- Lo interactivo dentro de una celda (`<a>`, botones con `data-act`, inputs) hace lo suyo y no abre la fila: así se conservan los manejadores `acts()` de cada pantalla.
- Acciones que ya existían como botones con `data-act`: se ponen en una columna `{ clase: 'tdn-a', celda: () => html`<span class="tdn-ab-in">…</span>` }` y aparecen al pasar el mouse.
- Una tabla editable (inputs en las celdas) usa el marcado a mano dentro de `<div class="tdn">` con `<caption class="tdn-sr">`, `th scope` y `data-l` en cada `td` para el cel.

## Lista de una línea

```js
import { listaHtml } from '../lista.js';

listaHtml({
  etiqueta: 'Seguimientos',
  grupos: [{ t: 'Vencido', items: vencidos }, { t: 'Para hoy', items: hoy }],
  renglon: (l) => ({ estado: { tono: 'caido', texto: 'Vencido' }, titulo: l.name, sub: l.next_step, dueno: 'Ventas', fecha: 'venció 9 nov', fechaTono: 'late', act: 'lead', id: l.id }),
  max: 30,
  vacio: { titulo: 'Nada vencido', linea: 'Los seguimientos con fecha aparecen aquí.' },
});
```

El renglón con `act` es un botón que dispara el `data-act` de la pantalla; `extra` (un monto, un chip) va al final, fuera del botón. Tonos del punto: `vivo`, `medio`, `caido`, `info`, `off` (siempre con texto además del color).

## Fila de cifras

```js
import { cifrasHtml } from '../cifras.js';

cifrasHtml([
  { t: 'Entró', v: Q(rev), delta: { v: 12, texto: 'vs. mes anterior' }, serie: ultimos6 },
  { t: 'Salió', v: Q(cost), delta: { v: 4, bueno: 'baja' } },   // en costos, subir es malo
  { t: 'Margen', v: '69%', tono: 'ok', nota: '27 movimientos' },
], { etiqueta: 'Finanzas de nov' });                              // clase: 'cfr-s' para la versión chica
```

## Sección sin marco

```html
<section class="vpp-sec">
  <div class="vpp-h"><h2>Te deben</h2><span class="vpp-n">Q32,340 · 3</span><span class="vpp-sp"></span><button class="sm wslink">Ver todo ›</button></div>
  <details class="vpp-ayuda"><summary>Cómo se calcula</summary>La ayuda larga va plegada.</details>
  …
</section>
<div class="vpp-cols" style="--vpp-c:2">…dos o tres secciones lado a lado…</div>
<div class="vpp-forma"><section class="vpp-sec">formulario</section><aside class="vpp-aside">resumen fijo</aside></div>
```

Texto: títulos cortos, la ayuda en `title` o en «ver detalle» plegado; español de tú, sin «por favor» ni «exitosamente».

## Lo migrado

| Pantalla | Antes | Ahora | Tarjetas que quedan |
|---|---|---|---|
| Finanzas | 23 `.card` | Resumen: fila de cifras + barras + listas (Te deben, Por pagar, Banco) + secciones. Movimientos, Costos, Especialistas, Rentabilidad, Costo declarado y Personas: tabla densa. Precios y Pagos: formulario con tablas editables | 0 |
| Ventas | 19 `.card` | Resumen: cifras + lista agrupada. Lista de leads, Prospectos (agrupados por fuente), Fuentes y Cotizaciones: tabla densa. Meta y Buscar: secciones. Cotización: documento + resumen al lado | 0 (el kanban de leads sigue con tarjetas: se arrastran) |
| Paquetes | 17 `.card` | Fases: timeline. Qué recibe, descripción, precio y escenario: secciones con cifras. «Los 108»: tabla comparativa ordenable. Equipo: tabla editable. La lista para elegir paquete: sin caja | 2 (el paquete abierto: el que se cotiza) |

Capturas antes/después (día y noche en 1440, día en 390): `docs/capturas-tablas/` (`antes-*` sale de `main`, `despues-*` de esta rama, con los mismos datos de prueba en la base local).

Sigue: `work.js`, `content.js`, `strategy.js`, `clients.js`.
