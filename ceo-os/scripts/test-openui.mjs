// OpenUI del OS: el catálogo ampliado (llm/genui.js), el registro de acciones (llm/acciones-os.js), la sugerencia sobre la caja
// (sugerencia-chat.js + avisos-reglas/sugerencias.js), el vacío conversacional (vacio-chat.js) y la herramienta montable.
// Puro: sin navegador ni red. Uso: node scripts/test-openui.mjs
import assert from 'node:assert/strict';
import { partirUi, uiHtml, PROMPT_GENUI, ESQUEMA_UI, COMPONENTES, MAX_BLOQUES, tonoUi } from '../public/js/llm/genui.js';
import { createStreamingParser } from '../public/vendor/openui-lang-core-1.1.0.min.js';
import { validarAccion, NOMBRES_ACCIONES } from '../public/js/llm/acciones-os.js';
import { normalizarSugerencia, sugerenciaHtml, sugerenciasDeAvisos, descartar } from '../public/js/sugerencia-chat.js';
import { SUGERENCIAS } from '../public/js/avisos-reglas/sugerencias.js';
import { REGLAS } from '../public/js/avisos-reglas/index.js';
import { personaDe, correr } from '../public/js/avisos-reglas/base.js';
import { vacioChatHtml, borradorVacio, limpiarGuardado, VACIOS, DESTINOS, avance } from '../public/js/vacio-chat.js';
import { definirMontable, pasosConEstado, vistaHtml, srcEmbebido, REFERENCIAS_VIDEO } from '../public/js/herramienta-montable.js';
import { EJEMPLOS } from '../public/js/llm/genui-ejemplos.js';

let n = 0;
const t = (nombre, fn) => { fn(); n++; console.log('✓', nombre); };
const nada = () => null;
const ui = (src, o = {}) => uiHtml(src, createStreamingParser, { final: true, leer: nada, sesion: 'test', ...o });
// Ninguna etiqueta ni atributo peligroso SIN escapar (el texto escapado «onerror=alert» es inofensivo).
const sinPeligro = (h) => { assert.doesNotMatch(h, /<script|<img|<a\s|<iframe|href=|\son[a-z]+="|="javascript:/i); };

// ----- El catálogo -----
t('el catálogo tiene los componentes pedidos y ninguno usa un nombre reservado de OpenUI', () => {
  for (const c of ['Summary', 'Decision', 'Checklist', 'Callout', 'Actions', 'Collapse', 'KeyValue', 'Compare', 'Timeline', 'Table', 'Heatmap', 'Chart', 'Gauge', 'Tool', 'Artifact', 'Guardar', 'Tag', 'Row']) assert.ok(COMPONENTES.includes(c), c);
  for (const r of ['Query', 'Mutation', 'Action']) assert.ok(!COMPONENTES.includes(r), r);
});
t('CodeFile y CodeReview se dibujan con el parser OpenUI y tratan rutas y hallazgos como datos', () => {
  const src = 'root = Stack([f, r])\nf = CodeFile("src/app.ts", "Abre el archivo")\nr = CodeReview("Revisado", [["src/app.ts", "alto", "Corregir el error"]], "Volver a probar")\n';
  const parsed = createStreamingParser(ESQUEMA_UI, 'Stack').set(src, true);
  assert.deepEqual(parsed.meta.errors, []);
  const h = ui(src);
  assert.match(h, /data-a="code-archivo" data-ruta="src\/app\.ts"/);
  assert.match(h, /gu-review[\s\S]*Corregir el error[\s\S]*Volver a probar/);
  assert.equal(ui('root = Stack([f])\nf = CodeFile("../secret")\n').includes('gu-code-file'), false);
  sinPeligro(h);
});
t('cada ejemplo visible se lee sin errores y se dibuja', () => {
  assert.ok(EJEMPLOS.length >= 14);
  for (const e of EJEMPLOS) {
    const r = createStreamingParser(ESQUEMA_UI, 'Stack').set(e.src, true);
    assert.deepEqual(r.meta.errors, [], e.titulo); assert.deepEqual(r.meta.unresolved, [], e.titulo);
    const h = ui(e.src); assert.match(h, /^<div class="gu">/, e.titulo); assert.doesNotMatch(h, /gu-src/, e.titulo); sinPeligro(h);
  }
});
t('el ejemplo del prompt se dibuja y el prompt cabe', () => {
  const ej = /```ui\n([\s\S]*?)```/.exec(PROMPT_GENUI)[1];
  const r = createStreamingParser(ESQUEMA_UI, 'Stack').set(ej, true); assert.deepEqual(r.meta.errors, []); assert.deepEqual(r.meta.unresolved, []);
  const h = ui(ej); assert.match(h, /gu-sum/); assert.match(h, /gu-dec/); assert.match(h, /gu-col/); assert.match(h, /gu-bar/);
  assert.ok(PROMPT_GENUI.length < 4200, `${PROMPT_GENUI.length}`);
  assert.match(PROMPT_GENUI, /Resumen primero, detalle plegado/);
});
t('Summary: la conclusión y hasta 3 cifras (también de Metric)', () => {
  const h = ui('root = Stack([s])\ns = Summary("Va bien", [["A", "1"], ["B", "2"], ["C", "3"], ["D", "4"]])\n');
  assert.equal((h.match(/<dt>/g) || []).length, 3); assert.match(h, /<p>Va bien<\/p>/);
  assert.match(ui('root = Stack([s])\ns = Summary("x", [m])\nm = Metric("Ventas", "Q1")\n'), /<dt>Ventas<\/dt><dd>Q1<\/dd>/);
});
t('Callout y Tag usan los tonos de estado() y siempre llevan texto', () => {
  assert.equal(tonoUi('atencion'), 'amb'); assert.equal(tonoUi('error'), 'bad'); assert.equal(tonoUi('morado'), '');
  const h = ui('root = Stack([c, g])\nc = Callout("error", "Falla", "detalle")\ng = Tag("quemado", "error")\n');
  assert.match(h, /gu-callout gu-t-bad" role="alert"/); assert.match(h, /vz-p-caido/); assert.match(h, /quemado/);
  assert.match(ui('root = Stack([c])\nc = Callout("nada", "x")\n'), /gu-t-info/);
});
t('Table: barra en línea en la columna numérica y Tag en una celda', () => {
  const h = ui('root = Stack([t])\nt = Table(["Hook", "Vistas", "Estado"], [["A", 1000, Tag("quemado", "error")], ["B", 500, "ok"]], "Vistas")\n');
  assert.match(h, /gu-bar"><i style="width:100%"/); assert.match(h, /width:50%/); assert.match(h, /gu-tag gu-t-bad/);
  assert.match(ui('root = Stack([t])\nt = Table(["a"], [["<b>x</b>"]], "nope")\n'), /&lt;b&gt;x/);
});
t('Compare marca la recomendada; KeyValue; Timeline con estados', () => {
  const c = ui('root = Stack([c])\nc = Compare(["", "A", "B"], [["Precio", "1", "2"]], "B")\n'); assert.match(c, /Recomendada/); assert.match(c, /<td class="gu-rec">2<\/td>/);
  assert.match(ui('root = Stack([k])\nk = KeyValue([["Llamado", "7:00"]])\n'), /<dt>Llamado<\/dt><dd>7:00<\/dd>/);
  const tl = ui('root = Stack([x])\nx = Timeline([["Guion", "hecho", "3 nov"], ["Grabar", "ahora"], "Montar", ["Pauta", "bloqueado"]])\n');
  for (const e of ['hecho', 'ahora', 'pendiente', 'bloqueado']) assert.match(tl, new RegExp(`gu-tl-${e}`)); assert.match(tl, /En curso/); assert.match(tl, /3 nov/);
});
t('Checklist: marca, cuenta el avance y recuerda lo guardado', () => {
  const src = 'root = Stack([c])\nc = Checklist("Set", ["Baterías", ["Permisos", true], "Luces"])\n';
  const h = ui(src); assert.match(h, /1 de 3/); assert.equal((h.match(/checked/g) || []).length, 1); assert.match(h, /data-gu-k="test\.[a-z0-9]+\.c"/);
  const g = ui(src, { leer: () => [0, 2] }); assert.match(g, /2 de 3/);
  assert.match(uiHtml(src, createStreamingParser, { final: false, leer: nada, sesion: 's' }), /disabled/, 'mientras se escribe no se marca');
});
t('Collapse, Heatmap (tabla accesible, 5 escalones), Chart (barras, línea, sparkline) y Gauge', () => {
  assert.match(ui('root = Stack([c])\nc = Collapse("Ver detalle", [t])\nt = Text("x")\n'), /<details class="gu-col"><summary>Ver detalle/);
  const hm = ui('root = Stack([h])\nh = Heatmap(["Educa", "Vende"], ["Humor", "Miedo"], [[0, 10], [5, null]], "vistas")\n');
  assert.match(hm, /<th scope="row">Educa/); assert.match(hm, /gu-h1/); assert.match(hm, /gu-h5/); assert.match(hm, /gu-h0" title="[^"]*">—/); assert.match(hm, /title="Vende × Miedo: —"/);
  const b = ui('root = Stack([c])\nc = Chart("barras", ["L", "M"], [["Orgánico", [1, 2]], ["Pauta", [2, 4]]], "k")\n');
  assert.match(b, /gu-ley/); assert.match(b, /height:50%/); assert.match(b, /class="sr-only"/); assert.match(b, /title="L: Orgánico 1 · Pauta 2 k"/);
  const l = ui('root = Stack([c])\nc = Chart("linea", ["a", "b", "c"], [3, 1, 2])\n'); assert.match(l, /<polyline class="gu-l1"/); assert.doesNotMatch(l, /gu-ley/, 'una serie no lleva leyenda');
  assert.match(ui('root = Stack([c])\nc = Chart("sparkline", null, [1, 5, 3])\n'), /gu-spark" role="img"/);
  assert.match(ui('root = Stack([g])\ng = Gauge("Horas", 30, 40, "del techo")\n'), /aria-valuenow="30"[\s\S]*stroke-dasharray="75 100"/);
  assert.equal(ui('root = Stack([g])\ng = Gauge("x", "nada")\n').includes('gu-gauge'), false);
});
t('Decision: Aprobar corre su Boton por el registro, y recuerda Después', () => {
  const src = 'root = Stack([d])\nd = Decision("Mover pauta", "Pasar Q1,000", "rinde más", b)\nb = Boton("Crear la tarea", "crearTarea", {titulo: "Mover pauta"})\n';
  const h = ui(src); assert.match(h, /data-gu-acc-dec="crearTarea"/); assert.match(h, /Crear la tarea/); assert.match(h, /data-gu-dec="cambiar"/); assert.match(h, /data-gu-dec="despues"/);
  assert.match(ui(src, { leer: () => 'despues' }), /data-estado="despues"/);
  assert.match(ui('root = Stack([d])\nd = Decision("x", "y", null, b)\nb = Boton("Borrar", "borrarTodo", {})\n'), />Aprobar</, 'una acción que no existe no pasa');
});
t('Actions, Tool, Artifact y Guardar solo dibujan acciones del registro, con sus argumentos limpios', () => {
  const h = ui('root = Stack([a])\na = Actions([b1, b2, b3])\nb1 = Boton("Abrir", "abrirHerramienta", {id: "production-planner", slug: "akai"})\nb2 = Boton("Mal", "fetch", {url: "https://x"})\nb3 = Boton("Copiar", "copiar", {texto: "hola"})\n');
  assert.match(h, /data-gu-acc="abrirHerramienta" data-gu-args="\{&quot;id&quot;:&quot;production-planner&quot;,&quot;slug&quot;:&quot;akai&quot;\}"/);
  assert.doesNotMatch(h, /fetch/); assert.match(h, /data-gu-acc="copiar"/);
  assert.match(ui('root = Stack([x])\nx = Tool("shot-list-builder", "akai", "Shot List")\n'), /Herramienta[\s\S]*Shot List[\s\S]*abrirHerramienta/);
  assert.match(ui('root = Stack([x])\nx = Artifact("herramienta:pre", "Hoja")\n'), /&quot;id&quot;:&quot;pre&quot;/);
  assert.equal(ui('root = Stack([x])\nx = Tool("../../etc", "akai")\n').includes('gu-tool'), false);
  const g = ui('root = Stack([g])\ng = Guardar("referencias-video", "akai", {videos: {Humor: ["https://www.instagram.com/reel/abc"]}}, "1 video")\n');
  assert.match(g, /data-gu-acc="guardarEnHerramienta"/); assert.match(g, /Ver lo que se guarda/);
});
t('lo que escribe el modelo es dato: se escapa en todos los componentes', () => {
  const x = '\\"><img src=x onerror=alert(1)>';
  const src = ['root = Stack([a, b, c, d, e, f, g, h, i, j])', `a = Summary("${x}", [["${x}", "${x}"]])`, `b = Callout("ok", "${x}", "${x}")`, `c = Timeline([["${x}", "hecho", "${x}"]])`,
    `d = Checklist("${x}", ["${x}"])`, `e = Heatmap(["${x}"], ["${x}"], [[1]], "${x}")`, `f = Chart("barras", ["${x}"], [["${x}", [1]]], "${x}")`, `g = Decision("${x}", "${x}", "${x}")`,
    `h = Compare(["", "${x}"], [["${x}", "${x}"]], "${x}")`, `i = Actions([Boton("${x}", "pedir", {texto: "/nuevo ${x}"})])`, `j = Guardar("referencias-video", "akai", {videos: {"${x}": ["${x}"]}})`].join('\n');
  const h = ui(src + '\n'); sinPeligro(h); assert.match(h, /&lt;img/); assert.doesNotMatch(h, /&quot;texto&quot;:&quot;\/nuevo/);
});
t('topes: hasta 3 bloques por respuesta; lo demás queda como texto', () => {
  const b = '```ui\nroot = Stack([])\n```\n';
  const p = partirUi(`a\n${b}${b}${b}${b}z`);
  assert.equal(p.filter((x) => x.tipo === 'ui').length, MAX_BLOQUES); assert.equal(p.at(-1).tipo, 'md'); assert.match(p.at(-1).t, /```ui/); assert.match(p.at(-1).t, /z$/);
});
t('topes: un bloque que se expande sin fin, uno enorme o uno malformado no se dibujan', () => {
  const lineas = ['root = Stack([a0, a0])']; for (let i = 0; i < 16; i++) lineas.push(`a${i} = Stack([a${i + 1}, a${i + 1}])`); lineas.push('a16 = Text("x")');
  assert.match(ui(lineas.join('\n') + '\n'), /gu-src/);
  assert.match(ui('root = Stack([x])\n' + 'x = Text("' + 'y'.repeat(13000) + '")\n'), /gu-src/);
  assert.match(ui('root = Stack([c\nc = Chart(\n'), /gu-src/, 'malformado: se ve como texto al terminar');
  assert.equal(uiHtml('root = Stack([c\nc = Chart(\n', createStreamingParser, { leer: nada }), '', 'mientras llega no se ve el código');
  assert.ok(ui('root = Stack([' + Array.from({ length: 900 }, () => 'Tag("x")').join(',') + '])\n').length < 80000);
  assert.ok(ui('root = Stack([h])\nh = Heatmap([' + Array.from({ length: 50 }, (_, i) => `"f${i}"`).join(',') + '], ["a"], [[1]])\n').split('<tr>').length <= 14, 'la matriz tiene tope de filas');
});

// ----- El registro de acciones -----
t('acciones: lista cerrada y argumentos limpios', () => {
  assert.deepEqual(NOMBRES_ACCIONES.sort(), ['abrirEnChat', 'abrirHerramienta', 'copiar', 'crearTarea', 'guardarEnHerramienta', 'imprimir', 'pedir'].sort());
  assert.equal(validarAccion('eval', {}), null); assert.equal(validarAccion('abrirHerramienta', { id: '../x' }), null);
  assert.deepEqual(validarAccion('ABRIRHERRAMIENTA', { id: 'Production-Planner', slug: 'AKAI ' }), { nombre: 'abrirHerramienta', args: { id: 'production-planner', slug: 'akai' } });
  assert.deepEqual(validarAccion('abrirEnChat', { modo: 'root', borrador: '@Strategy hola' }).args, { modo: '', slug: '', borrador: 'Strategy hola' });
  assert.equal(validarAccion('imprimir', { tipo: 'call-sheet', jornada: 'a b<' }), null);
  assert.deepEqual(validarAccion('imprimir', { tipo: 'call-sheet', jornada: 'sh-1', slug: 'akai' }).args, { tipo: 'call-sheet', jornada: 'sh-1', slug: 'akai' });
  assert.equal(validarAccion('crearTarea', {}), null); assert.equal(validarAccion('pedir', { texto: '/' }), null);
  assert.equal(validarAccion('guardarEnHerramienta', { destino: 'x', datos: 'no' }), null);
});

// ----- La sugerencia sobre la caja -----
const SUG = { id: 'pr-imprimir-hoja:sh1', titulo: 'Te recomiendo imprimir la hoja de preproducción', linea: 'AKAI graba mañana', icono: 'printer', huella: 'h1',
  acciones: [{ label: 'Imprimir', accion: 'imprimir', args: { tipo: 'call-sheet', jornada: 'sh1', slug: 'akai' } }, { label: 'Abrir', accion: 'abrirHerramienta', args: { id: 'production-planner', slug: 'akai' } }, { label: 'Otra', accion: 'copiar' }] };
t('sugerencia: 1–2 acciones del registro, «Ahora no» siempre, escapada', () => {
  const s = normalizarSugerencia(SUG); assert.equal(s.acciones.length, 2); assert.equal(s.acciones[0].nombre, 'imprimir');
  const h = sugerenciaHtml(SUG); assert.match(h, /class="sg-b sg-pri" data-gu-acc="imprimir"/); assert.match(h, /data-sg-no="pr-imprimir-hoja:sh1">Ahora no/); assert.match(h, /role="status"/);
  assert.equal(sugerenciaHtml({ ...SUG, acciones: [{ label: 'x', accion: 'borrar' }] }), '', 'sin acción posible no se muestra');
  sinPeligro(sugerenciaHtml({ ...SUG, titulo: '<img src=x onerror=1>', linea: '"><script>' }));
});
t('sugerencia: el descarte se recuerda y vuelve si cambia la huella', () => {
  const items = [{ clave: 'pr-imprimir-hoja:sh1', huella: 'h1', sugerencia: SUG }, { clave: 'otro', titulo: 'sin sugerencia' }];
  assert.equal(sugerenciasDeAvisos(items).length, 1);
  const d = descartar({}, normalizarSugerencia({ ...SUG, huella: 'h1' }));
  assert.equal(sugerenciasDeAvisos(items, d).length, 0);
  assert.equal(sugerenciasDeAvisos([{ ...items[0], huella: 'h2' }], d).length, 1, 'cambió la grabación: vuelve');
});
t('regla pr-imprimir-hoja: una grabación de hoy a 2 días emite la sugerencia de imprimir', () => {
  assert.ok(REGLAS.some((r) => r.id === 'pr-imprimir-hoja'));
  const CEO = personaDe({ email: 'ceo@x.com', role: 'ceo' });
  const d = { clientes: [{ slug: 'akai', nombre: 'AKAI' }], content: [
    { id: 'sh1', kind: 'shoot', profile: 'akai', title: 'Jornada 1', status: 'Por grabar', date: '2026-11-12', time: '07:00' },
    { id: 'sh2', kind: 'shoot', profile: 'akai', status: 'Por grabar', date: '2026-11-20' },
    { id: 'sh3', kind: 'shoot', profile: 'akai', status: 'Grabado', date: '2026-11-11' },
    { id: 'sh4', kind: 'shoot', profile: 'akai', status: 'Por grabar', date: '2026-11-11', archivado: true }] };
  const r = correr(SUGERENCIAS, d, CEO, '2026-11-11'); assert.deepEqual(r.errores, []);
  assert.equal(r.items.length, 1); const a = r.items[0];
  assert.equal(a.urgencia, 'baja'); assert.match(a.sugerencia.linea, /AKAI graba mañana a las 07:00/);
  const s = sugerenciasDeAvisos(r.items)[0]; assert.equal(s.titulo, 'Te recomiendo imprimir la hoja de preproducción'); assert.deepEqual(s.acciones[0].args, { tipo: 'call-sheet', jornada: 'sh1', slug: 'akai' });
  const nadie = personaDe({ email: 'x@x.com', role: 'team', areas: ['work'] }); assert.equal(correr(SUGERENCIAS, d, nadie, '2026-11-11').items.length, 0, 'sin Marcas no la ve');
});

// ----- El vacío conversacional -----
t('vacío: dice que no se ha creado, muestra el avance y abre el Chat con el borrador', () => {
  const o = { ...VACIOS['referencias-video'], slug: 'akai' };
  const h = vacioChatHtml(o); assert.match(h, /Esto aún no se ha creado\. ¿Platicamos para crearlo\?/); assert.match(h, /0 de 3 temas/); assert.match(h, /data-gu-acc="abrirEnChat"/);
  assert.match(vacioChatHtml({ ...o, hechos: 2 }), /2 de 3/); assert.equal(avance(9, 3), '3 de 3');
  const b = borradorVacio(o); assert.match(b, /1\. ¿Qué pilares/); assert.match(b, /Guardar\("referencias-video", "akai"/); assert.doesNotMatch(b, /^[/@]/);
  const args = JSON.parse(/data-gu-args="([^"]*)"/.exec(h)[1].replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
  assert.ok(validarAccion('abrirEnChat', args), 'el botón pasa el registro'); assert.equal(args.modo, 'produccion');
  sinPeligro(vacioChatHtml({ tema: '<img src=x>', preguntas: ['"><script>'] }));
});
t('vacío: el regreso solo guarda datos del contrato del destino y agrega sin borrar', () => {
  assert.equal(limpiarGuardado({ destino: 'nope', slug: 'akai', datos: {} }), null);
  assert.equal(limpiarGuardado({ destino: 'referencias-video', slug: '../x', datos: {} }), null);
  const g = limpiarGuardado({ destino: 'referencias-video', slug: 'akai', datos: { videos: { Humor: ['https://www.instagram.com/reel/abc', 'javascript:alert(1)', 'https://evil.com/x'], Vacío: [] } } });
  assert.deepEqual(g.datos, { videos: { Humor: ['https://www.instagram.com/reel/abc'] } });
  const u = DESTINOS['referencias-video'].unir({ videos: { Humor: ['https://www.instagram.com/reel/old'], Otro: ['https://www.tiktok.com/@a/video/1'] } }, g.datos);
  assert.deepEqual(u.videos.Humor, ['https://www.instagram.com/reel/old', 'https://www.instagram.com/reel/abc']); assert.ok(u.videos.Otro, 'no borra lo que había');
});

// ----- La herramienta montable -----
t('montable: un dato, dos vistas; pasos con estado; las de code-os van por iframe ?embed=1', () => {
  const dato = { videos: { Humor: ['a', 'b'] }, result: { Humor: { similar: [1] } }, breakdown: {} };
  const ps = pasosConEstado(REFERENCIAS_VIDEO, dato); assert.deepEqual(ps.map((p) => p.estado), ['hecho', 'hecho', 'hecho', 'ahora']);
  assert.deepEqual(pasosConEstado(REFERENCIAS_VIDEO, {}).map((p) => p.estado), ['ahora', 'pendiente', 'pendiente', 'pendiente']);
  const area = vistaHtml(REFERENCIAS_VIDEO, dato, { modo: 'area' }), art = vistaHtml(REFERENCIAS_VIDEO, dato, { modo: 'artefacto' });
  assert.match(area, /gu-tl/); assert.match(area, /2 de 5/); assert.doesNotMatch(art, /gu-tl/); assert.match(art, /2 de 5/);
  assert.ok(REFERENCIAS_VIDEO.vacio({ videos: {} })); assert.equal(REFERENCIAS_VIDEO.vacioChat.preguntas.length, 3);
  const pre = definirMontable({ id: 'pre', nombre: 'Hoja de preproducción', origen: 'code-os' });
  assert.equal(srcEmbebido('pre', { slug: 'akai' }), 'https://code.inherentglobal.com/?embed=1&herramienta=pre&cliente=akai');
  assert.match(vistaHtml(pre, null, { slug: 'akai' }), /<iframe class="hm-frame" src="https:\/\/code\.inherentglobal\.com\/\?embed=1&amp;herramienta=pre/);
  assert.throws(() => definirMontable({ id: '<x>' }));
});

console.log(`\n${n} pruebas de OpenUI pasaron`);
