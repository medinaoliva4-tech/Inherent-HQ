// Pruebas de Campaign Architect (Fase 3b): el módulo puro public/js/campanas.js (canales, briefs, montos, Gantt, entradas, IA), las reglas
// del servidor (api/_lib/campanas.js: v, scoper, montos solo para quien ve costos, nada se borra) y, con PGlite en memoria, su conducta.
// npm run test:marketing  (junto con test-marketing.mjs, test-marketing-ads.mjs y test-marketing-viral.mjs)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as C from '../public/js/campanas.js';

let ok = 0; const t = (n, f) => { const r = f(); if (r && typeof r.then === 'function') return r.then(() => { ok++; console.log('✓', n); }); ok++; console.log('✓', n); };
const leer = (rel) => fs.readFileSync(new URL('../' + rel, import.meta.url), 'utf8');
const puro = leer('public/js/campanas.js'), servidor = leer('api/_lib/campanas.js'), ui = leer('public/js/campanas-ui.js');
// El texto de una ruta: desde su on(...) hasta el siguiente on( (o el final del archivo).
const ruta = (src, metodo, patron) => { const ini = src.indexOf(`on('${metodo}', '${patron}'`); assert.ok(ini >= 0, `${metodo} ${patron}: no existe`); const sig = src.indexOf('\n  on(', ini + 10); return src.slice(ini, sig < 0 ? undefined : sig); };

// Una campaña completa de ejemplo (un evento con su plan y un brief).
const base = (o = {}) => C.limpiarCampana({ nombre: 'Gala', tipo: 'evento', ancla: '2026-11-28', frase: 'Que vengan a los 10 años', mbt: 'B · Que nos recomienden', se_nota: '+60 reservas', no_es: 'No es una fiesta abierta',
  evento: { objetivo: 'Vender la membresía', medicion: 'Asistentes' },
  canales: { 'primer-aviso': { instagram: { activo: true, fecha: '2026-11-07', pieza: 'Reel teaser', monto: 500 }, pauta: { activo: true, monto: 2500 } }, recordatorio: { whatsapp: { activo: true, pieza: 'Lista' } } },
  briefs: [{ fase: 'primer-aviso', canal: 'instagram', objetivo: 'Que se enteren', mensaje: 'Se vienen los 10 años', formato: 'reel', cta: 'Reserva por WhatsApp' }], ...o });

// ---------- limpiarCampana ----------
t('limpiarCampana: una campaña de antes sale con las 3 fases × 6 canales apagados y vacíos, sin briefs, resultados ni ligas', () => {
  const c = C.limpiarCampana({ nombre: 'Vieja', tipo: 'promocion', ancla: '2026-12-01' });
  assert.deepEqual(Object.keys(c.canales), C.FASES_C); assert.deepEqual(Object.keys(c.canales['primer-aviso']), C.CANALES_C);
  for (const f of C.FASES_C) for (const k of C.CANALES_C) assert.deepEqual(c.canales[f][k], { activo: false, fecha: '', pieza: '', monto: null });
  assert.deepEqual(c.briefs, []); assert.deepEqual(c.resultados, []); assert.equal(c.pauta_id, ''); assert.equal(c.entregable_ref, '');
  assert.deepEqual(C.FASES_C, ['primer-aviso', 'recordatorio', 'ultimo-empujon']); assert.deepEqual(C.CANALES_C, ['instagram', 'tiktok', 'pauta', 'whatsapp', 'email', 'evento']);
});
t('limpiarCampana: canales válidos (con alias y acentos) e inválidos (claves raras, fechas que no existen, montos malos)', () => {
  const c = C.limpiarCampana({ nombre: 'X', canales: { 'Primer aviso': { IG: { activo: true, fecha: '2026-11-07', pieza: '  Reel   teaser ', monto: 'Q1,500' }, correo: { activo: 'true', monto: '' }, radio: { activo: true } },
    'último empujón': { Instagram: { activo: true, fecha: '2026-02-30', monto: -5 } }, '__proto__': { instagram: { activo: true } }, nada: { instagram: { activo: true } }, recordatorio: 'roto' } });
  assert.deepEqual(c.canales['primer-aviso'].instagram, { activo: true, fecha: '2026-11-07', pieza: 'Reel teaser', monto: 1500 });
  assert.equal(c.canales['primer-aviso'].email.activo, true); assert.equal(c.canales['primer-aviso'].email.monto, null, 'monto vacío = null, no 0');
  assert.equal(c.canales['ultimo-empujon'].instagram.fecha, '', 'una fecha que no existe se descarta'); assert.equal(c.canales['ultimo-empujon'].instagram.monto, null, 'un monto negativo no es un monto');
  assert.deepEqual(Object.keys(c.canales), C.FASES_C, 'las claves raras no entran'); assert.ok(C.CANALES_C.every((k) => k in c.canales['primer-aviso']) && !('radio' in c.canales['primer-aviso']));
  assert.equal(C.limpiarCampana({ nombre: 'Y', canales: 'x' }).canales.recordatorio.tiktok.activo, false, 'un plan que no es objeto sale apagado');
  assert.equal(C.monto(0), 0, 'un cero escrito a propósito es un cero'); assert.equal(C.monto(null), null); assert.equal(C.monto(undefined), null); assert.equal(C.monto('abc'), null); assert.equal(C.monto(1e12), null); assert.equal(C.monto('12.345'), 12.35);
  assert.equal(C.limpiarCampana(null).nombre, '', 'null no rompe'); assert.equal(C.limpiarCampana('x').tipo, 'campana');
});
t('limpiarCampana: briefs válidos, sin fase o canal que no existen, sin texto, ids únicos y hasta 24', () => {
  const c = C.limpiarCampana({ nombre: 'X', briefs: [{ fase: 'Primer aviso', canal: 'IG', objetivo: ' Que  se enteren ', mensaje: 'M', formato: 'reel', cta: 'C', raro: 1 }, { fase: 'nada', canal: 'instagram', objetivo: 'z' }, { fase: 'recordatorio', canal: 'x', objetivo: 'z' },
    { fase: 'recordatorio', canal: 'tiktok' }, { fase: 'recordatorio', canal: 'tiktok', objetivo: 'a', id: 'mi id!' }, { fase: 'recordatorio', canal: 'tiktok', objetivo: 'b', id: 'mi id!' }, 'roto', null] });
  assert.deepEqual(c.briefs.map((b) => b.id), ['primer-aviso.instagram', 'miid', 'miid-2'], 'ids sin caracteres raros y sin repetirse');
  assert.deepEqual(c.briefs[0], { id: 'primer-aviso.instagram', fase: 'primer-aviso', canal: 'instagram', objetivo: 'Que se enteren', mensaje: 'M', formato: 'reel', cta: 'C' });
  const muchos = C.limpiarCampana({ nombre: 'X', briefs: Array.from({ length: 40 }, (_, i) => ({ fase: C.FASES_C[i % 3], canal: C.CANALES_C[i % 6], objetivo: `o${i}` })) });
  assert.equal(muchos.briefs.length, 24); assert.equal(C.MAX_BRIEFS, 24); assert.equal(new Set(muchos.briefs.map((b) => b.id)).size, 24);
});
t('limpiarCampana: resultados {en, metrica, valor, nota} y las ligas pauta_id y entregable_ref solo como ids', () => {
  const c = C.limpiarCampana({ nombre: 'X', resultados: [{ en: '2026-11-30', metrica: ' Reservas ', valor: 40, nota: 'fin de semana', x: 1 }, { metrica: '' }, { valor: '3' }, 'roto'], pauta_id: 'p-1.a', entregable_ref: '../../etc' });
  assert.deepEqual(c.resultados, [{ en: '2026-11-30', metrica: 'Reservas', valor: '40', nota: 'fin de semana' }]);
  assert.equal(c.pauta_id, 'p-1.a'); assert.equal(c.entregable_ref, '', 'un id con rutas no es un id');
  assert.equal(C.limpiarCampana({ nombre: 'X', resultados: Array.from({ length: 150 }, (_, i) => ({ metrica: `m${i}` })) }).resultados.length, 100);
});
t('limpiarCampana: lo de siempre sigue igual (tipo, fechas, evento) y lo desconocido no entra', () => {
  const e = C.limpiarCampana({ nombre: '  Cata ', tipo: 'Evento con cupo', ancla: '2026-11-28', hasta: '2026-11-01', evento: { cupo: '60' }, raro: 1, v: 9, id: 'x', _meta: {} });
  assert.equal(e.nombre, 'Cata'); assert.equal(e.tipo, 'evento'); assert.equal(e.hasta, '', 'hasta antes de la fecha no vale'); assert.equal(e.evento.cupo, 60);
  for (const k of ['raro', 'v', 'id', '_meta']) assert.ok(!(k in e), k);
  assert.deepEqual(Object.keys(C.limpiarCampana({ nombre: 'Y' })).slice(-5), ['canales', 'briefs', 'resultados', 'pauta_id', 'entregable_ref']);
});

// ---------- sinMontos y lo que protege los montos ----------
t('sinMontos quita cada monto (sin tocar el original), marca costs_hidden y esconde los resultados de gasto', () => {
  const c = base({ resultados: [{ metrica: 'Gasto de pauta', valor: 'Q2,000' }, { metrica: 'Inversión', valor: '1' }, { metrica: 'Reservas', valor: '40' }] });
  const s = C.sinMontos(c);
  for (const f of C.FASES_C) for (const k of C.CANALES_C) assert.equal(s.canales[f][k].monto, null);
  assert.equal(s.canales['primer-aviso'].instagram.activo, true); assert.equal(s.canales['primer-aviso'].instagram.pieza, 'Reel teaser'); assert.equal(s.costs_hidden, true);
  assert.deepEqual(s.resultados.map((r) => r.metrica), ['Reservas']);
  assert.equal(c.canales['primer-aviso'].pauta.monto, 2500, 'el original no cambia'); assert.equal(c.resultados.length, 3); assert.ok(!('costs_hidden' in c));
  assert.ok(!JSON.stringify(s).includes('2500') && !JSON.stringify(s).includes('1500') && !/Gasto/.test(JSON.stringify(s)));
  assert.equal(C.sinMontos(null), null); assert.equal(C.sinMontos({ nombre: 'X' }).costs_hidden, true, 'una campaña sin plan no se rompe');
});
t('canalesConMontos: el plan nuevo con los montos guardados (quien no ve costos no los escribe ni los borra)', () => {
  const actual = base().canales, nuevo = JSON.parse(JSON.stringify(actual)); nuevo['primer-aviso'].pauta.monto = 1; nuevo['primer-aviso'].tiktok = { activo: true, monto: 7 }; nuevo['primer-aviso'].instagram.pieza = 'Otra'; nuevo.recordatorio.whatsapp.monto = null;
  const r = C.canalesConMontos(actual, nuevo);
  assert.equal(r['primer-aviso'].pauta.monto, 2500); assert.equal(r['primer-aviso'].instagram.monto, 500); assert.equal(r['primer-aviso'].tiktok.monto, null, 'una celda nueva no trae montos');
  assert.equal(r['primer-aviso'].instagram.pieza, 'Otra', 'lo demás sí cambia'); assert.equal(r['primer-aviso'].tiktok.activo, true);
  assert.equal(C.canalesConMontos(undefined, nuevo)['primer-aviso'].pauta.monto, null, 'sin lo guardado, sin montos');
});
t('mezclarCanales: un parche de celdas deja las demás como estaban', () => {
  const actual = base().canales, r = C.mezclarCanales(actual, { 'último empujón': { 'WhatsApp': { activo: true, pieza: 'Lista' } }, 'primer-aviso': { instagram: { pieza: 'Nueva' }, correo: 'roto' }, nada: {} });
  assert.equal(r['ultimo-empujon'].whatsapp.activo, true); assert.equal(r['primer-aviso'].instagram.pieza, 'Nueva');
  assert.equal(r['primer-aviso'].instagram.activo, true, 'lo que el parche no dice se queda'); assert.equal(r['primer-aviso'].instagram.monto, 500); assert.equal(r['primer-aviso'].pauta.monto, 2500);
  assert.deepEqual(C.mezclarCanales(actual, null), C.mezclarCanales(actual, {}));
});
t('conservarPlan: poner al día una campaña (desde el Chat) no borra su plan, sus briefs ni sus ligas', () => {
  const cur = base({ pauta_id: 'p1', entregable_ref: 'e1' }), desdeChat = C.limpiarCampana({ nombre: 'Gala', frase: 'Otra frase' });
  const r = C.conservarPlan(cur, desdeChat);
  assert.equal(r.frase, 'Otra frase'); assert.equal(r.canales['primer-aviso'].pauta.monto, 2500); assert.equal(r.briefs.length, 1); assert.equal(r.pauta_id, 'p1'); assert.equal(r.entregable_ref, 'e1');
  const conPlan = C.conservarPlan(cur, C.limpiarCampana({ nombre: 'Gala', canales: { recordatorio: { email: { activo: true } } }, briefs: [{ fase: 'recordatorio', canal: 'email', objetivo: 'x' }], pauta_id: 'p9' }));
  assert.equal(conPlan.canales.recordatorio.email.activo, true); assert.equal(conPlan.canales['primer-aviso'].pauta.activo, false, 'si el cuerpo trae plan, ese es el plan'); assert.equal(conPlan.briefs.length, 1); assert.equal(conPlan.pauta_id, 'p9');
});
t('resultadosAlGuardar: solo se agregan (lo guardado se queda, lo nuevo entra con la hora de ahora)', () => {
  const ya = [{ en: '2026-11-01T10:00:00.000Z', metrica: 'Reservas', valor: '12', nota: '' }, { en: '2026-11-02T10:00:00.000Z', metrica: 'Gasto', valor: 'Q10', nota: '' }];
  const ahora = '2026-11-30T12:00:00.000Z';
  assert.deepEqual(C.resultadosAlGuardar(ya, [], ahora), ya, 'mandar una lista vacía no borra');
  assert.deepEqual(C.resultadosAlGuardar(ya, [ya[0]], ahora), ya, 'mandar solo uno no borra los otros');
  const r = C.resultadosAlGuardar(ya, [ya[0], { en: '1999', metrica: 'Asistentes', valor: 38 }], ahora);
  assert.equal(r.length, 3); assert.deepEqual(r[2], { en: ahora, metrica: 'Asistentes', valor: '38', nota: '' }, 'la hora la pone el servidor');
  assert.equal(C.resultadosAlGuardar(undefined, [{ metrica: 'A' }], ahora).length, 1);
  assert.equal(C.resultadosAlGuardar(Array.from({ length: 100 }, (_, i) => ({ en: 'x', metrica: `m${i}` })), [{ metrica: 'nuevo' }], ahora).length, 100, 'el tope no se pasa');
});
t('totalMontos suma las celdas encendidas; sin ningún monto es null, nunca 0', () => {
  assert.equal(C.totalMontos(base()), 3000);
  assert.equal(C.totalMontos(base({ canales: { 'primer-aviso': { instagram: { activo: true } } } })), null);
  const apagada = base(); apagada.canales['primer-aviso'].pauta.activo = false; assert.equal(C.totalMontos(apagada), 500, 'una celda apagada no suma');
  assert.equal(C.totalMontos({}), null);
});

// ---------- revisarCampana: blueprint y briefs ----------
t('revisarCampana avisa si no hay un brief (aunque el blueprint esté completo) y si el blueprint está incompleto', () => {
  const completa = C.limpiarCampana({ nombre: 'Gala', tipo: 'evento', ancla: '2026-11-28', frase: 'F', mbt: 'B', se_nota: 'x', no_es: 'y', evento: { objetivo: 'o', medicion: 'm' } });
  const sin = C.revisarCampana(completa, '2026-10-26');
  assert.deepEqual(sin, ['Sin brief creativo: Creative no tiene qué recibir (un brief por cada celda activa del plan de canales)']);
  assert.deepEqual(C.revisarCampana(base(), '2026-10-26'), [], 'blueprint completo, celda activa y un brief: no le falta nada');
  const sinBp = C.revisarCampana(C.limpiarCampana({ nombre: 'X', tipo: 'apertura', ancla: '2026-12-03', frase: 'F' }), '2026-10-26');
  assert.ok(sinBp.some((x) => /^Blueprint incompleto \(la MUST BE TRUE, en qué se nota, qué NO es\)/.test(x)) && sinBp.some((x) => /^Sin brief creativo/.test(x)));
  assert.ok(C.revisarCampana(C.limpiarCampana({ nombre: 'Z' }), '2026-10-26').some((x) => /^Blueprint incompleto \(.*la fecha\)/.test(x)), 'sin fecha también es un blueprint incompleto');
  // un brief de una celda apagada, o sin objetivo ni mensaje, no cuenta
  const apagada = base(); apagada.canales['primer-aviso'].instagram.activo = false;
  assert.ok(C.revisarCampana(apagada, '2026-10-26').some((x) => /^Sin brief creativo/.test(x)));
  const solo = base({ briefs: [{ fase: 'primer-aviso', canal: 'instagram', formato: 'reel' }] });
  assert.ok(C.revisarCampana(solo, '2026-10-26').some((x) => /^Sin brief creativo/.test(x)), 'un brief que solo trae el formato no es un brief');
  // lo de siempre sigue avisando lo suyo
  assert.ok(C.revisarCampana(C.limpiarCampana({ nombre: 'Y', tipo: 'apertura', ancla: '2026-12-03' }), '2026-10-26').some((x) => /ciclo anterior/.test(x)));
  assert.ok(C.blueprintFaltas({ frase: 'a' }).length === 4 && C.blueprintFaltas(base()).length === 0);
});

// ---------- briefsPara y lo que se manda a Creative ----------
t('briefsPara: lista para Creative (celdas activas con objetivo o mensaje, en orden de lectura, con fecha y pieza, sin montos)', () => {
  const c = base({ briefs: [
    { fase: 'recordatorio', canal: 'whatsapp', objetivo: 'Recordar', mensaje: 'Faltan 7 días', cta: 'Responde' },
    { fase: 'primer-aviso', canal: 'pauta', mensaje: 'Alcance' }, { fase: 'primer-aviso', canal: 'instagram', objetivo: 'Que se enteren', formato: 'reel' },
    { fase: 'primer-aviso', canal: 'tiktok', objetivo: 'apagada' }, { fase: 'ultimo-empujon', canal: 'email', formato: 'solo formato' }] });
  const b = C.briefsPara(c);
  assert.deepEqual(b.map((x) => x.id), ['primer-aviso.instagram', 'primer-aviso.pauta', 'recordatorio.whatsapp'], 'orden de fase y de canal; la apagada y la vacía no van');
  assert.deepEqual(b[0], { id: 'primer-aviso.instagram', fase: 'primer-aviso', canal: 'instagram', fecha: '2026-11-07', pieza: 'Reel teaser', objetivo: 'Que se enteren', mensaje: '', formato: 'reel', cta: '' });
  assert.equal(b[2].fecha, '2026-11-21', 'sin fecha en la celda toma la de su fase (anticipación)'); assert.equal(b[2].pieza, 'Lista');
  assert.ok(!JSON.stringify(b).includes('monto') && !JSON.stringify(b).includes('2500'));
  assert.deepEqual(C.briefsPara({}), []); assert.deepEqual(C.briefsPara(null), []);
});
t('faltaParaCreative pide blueprint, un canal y un brief; contenidoParaCreative lleva la campaña y sus briefs, sin montos ni ligas', () => {
  assert.deepEqual(C.faltaParaCreative(base()), []);
  assert.deepEqual(C.faltaParaCreative(C.limpiarCampana({ nombre: 'X' })).length, 3);
  const sinCanal = base({ canales: {} }); const f = C.faltaParaCreative(sinCanal); assert.ok(f.some((x) => /canal/.test(x)) && f.some((x) => /brief/.test(x)) && !f.some((x) => /blueprint/.test(x)));
  assert.ok(C.faltaParaCreative(base({ mbt: '' })).some((x) => /^el blueprint \(la MUST BE TRUE\)/.test(x)));
  const k = { ...base({ pauta_id: 'p1', entregable_ref: 'e1' }), id: 'nao--gala' }, cont = C.contenidoParaCreative(k);
  assert.deepEqual(Object.keys(cont), ['campana']); assert.deepEqual(Object.keys(cont.campana), ['id', 'nombre', 'frase', 'mbt', 'briefs']);
  assert.equal(cont.campana.id, 'nao--gala'); assert.equal(cont.campana.briefs.length, 1);
  assert.ok(!/monto|2500|pauta_id|p1|entregable_ref/.test(JSON.stringify(cont)));
  assert.equal(C.resumenPlan(base()), '3 canales · 1 brief'); assert.equal(C.resumenPlan({}), '0 canales · 0 briefs');
});

// ---------- La anticipación como Gantt ----------
t('ganttDe: una barra por fase entre sus fechas, posiciones en % y null si no hay fecha o no avisa con anticipación', () => {
  const g = C.ganttDe(base());
  assert.equal(g.desde, '2026-11-07'); assert.equal(g.hasta, '2026-11-28'); assert.equal(g.dias, 21);
  assert.deepEqual(g.filas.map((f) => [f.fase, f.ini, f.fin]), [['primer-aviso', '2026-11-07', '2026-11-21'], ['recordatorio', '2026-11-21', '2026-11-26'], ['ultimo-empujon', '2026-11-26', '2026-11-28']]);
  assert.deepEqual(g.filas.map((f) => f.izq), [0, 66.7, 90.5]); assert.deepEqual(g.filas.map((f) => f.ancho), [66.7, 23.8, 9.5]);
  assert.ok(g.filas.every((f) => f.izq + f.ancho <= 100.05)); assert.equal(g.ancla.pos, 100); assert.equal(g.filas[2].pasos.length, 2, 'el empujón y «el día»');
  assert.equal(C.ganttDe(C.limpiarCampana({ nombre: 'X', tipo: 'campana', ancla: '2026-12-01' })), null, 'una campaña del ciclo no avisa'); assert.equal(C.ganttDe(C.limpiarCampana({ nombre: 'X', tipo: 'evento' })), null, 'sin fecha, sin anticipación');
  const p = C.ganttDe(C.limpiarCampana({ nombre: 'P', tipo: 'promocion', ancla: '2026-11-27', hasta: '2026-11-30' })); assert.equal(p.hasta, '2026-11-30'); assert.equal(p.filas.at(-1).fin, '2026-11-30');
  assert.equal(C.fechaDeFase(base(), 'recordatorio'), '2026-11-21'); assert.equal(C.fechaDeFase(base(), 'ultimo-empujon'), '2026-11-26'); assert.equal(C.fechaDeFase(C.limpiarCampana({ nombre: 'X' }), 'primer-aviso'), '');
});

// ---------- Entradas de otras herramientas ----------
t('campanaDeEntrada: la campaña sale prellenada con la oferta y el mensaje de la versión de origen; sin eso, vacía', () => {
  const o = { tool: 'offer-architect', titulo: 'Offer Architect', version: 2, contenido: { empujar: { oferta: 'Membresía anual', mensaje: 'Una cata al mes, sin filas' } } };
  const e = C.campanaDeEntrada(o);
  assert.equal(e.nombre, 'Membresía anual'); assert.equal(e.frase, 'Una cata al mes, sin filas'); assert.equal(e.notas, 'Oferta que se empuja: Membresía anual · Su mensaje: Una cata al mes, sin filas · Viene de «Offer Architect v2»');
  assert.equal(C.campanaDeEntrada({ titulo: 'Diana', version: 1, contenido: {} }).nombre, ''); assert.equal(C.campanaDeEntrada(null).frase, '');
  assert.equal(C.campanaDeEntrada({ contenido: { empujar: { oferta: 'x'.repeat(300), mensaje: 'y'.repeat(900) } } }).nombre.length, 60);
  assert.match(C.resumenEntrada(o), /^Entrada aprobada · Offer Architect v2: se empuja «Membresía anual», mensaje: Una cata/); assert.equal(C.resumenEntrada({ contenido: {} }), '');
  const c = C.limpiarCampana({ ...C.campanaDeEntrada(o), tipo: 'lanzamiento', ancla: '2026-12-10', entregable_ref: 'ent1' });
  assert.equal(c.nombre, 'Membresía anual'); assert.equal(c.entregable_ref, 'ent1'); assert.ok(c.notas.includes('Viene de'));
});

// ---------- La IA ----------
t('pedidoCampana: pide el bloque campana y los criterios, trae la campaña y la anticipación, y nunca lleva montos ni costos', () => {
  const c = base({ pauta_id: 'p1' }), p = C.pedidoCampana(c, { leads: 'Captura por WhatsApp, meta interna de 40', entradas: [{ tool: 'offer-architect', titulo: 'Offer Architect', version: 2, contenido: { empujar: { oferta: 'Membresía', mensaje: 'Una cata al mes' } } }] });
  const texto = [p.intro, ...p.cuerpo, ...p.salida, ...p.extra].join('\n');
  assert.ok(p.salida.some((l) => l === '```campana') && p.salida.some((l) => l === '```criterios'), 'termina pidiendo los dos bloques');
  assert.equal(C.BLOQUE, 'campana'); assert.match(texto, /«Gala»/); assert.match(texto, /Anticipación fijada: Primer aviso 2026-11-07 · Recordatorio 2026-11-21/);
  assert.match(texto, /Entrada aprobada · Offer Architect v2/); assert.match(texto, /Lo que pide Strategy de leads \(borrador\): Captura por WhatsApp/);
  assert.match(texto, /SIN montos/); assert.match(texto, /No se escribe en Meta, Google ni TikTok/); assert.match(texto, /tarea para ⑩ Ads/);
  assert.ok(!/2500|\b500\b|monto":/i.test(texto.replace(/SIN montos: los pone quien ve presupuestos/, '')), 'ni el monto de las celdas ni un campo monto en el ejemplo');
  assert.ok(!/06-ECONOMIA|costos de Inherent/.test(texto) || /Nunca/.test(texto));
  assert.ok(p.cuerpo.join('\n').length + p.salida.join('\n').length < 2600, 'cabe en el pedido (< 4 900 con reglas y contexto)');
  assert.match(C.pedidoCampana(C.limpiarCampana({ nombre: 'Vacía' })).cuerpo[0], /⚠️ SIN DATOS/, 'lo que falta se dice, no se inventa');
});
t('fusionarPropuesta: lo que contesta la IA entra sin tocar montos ni fechas, y los briefs se reemplazan por celda', () => {
  const actual = { ...base(), id: 'nao--gala', v: 4 };
  const prop = C.limpiarCampana({ nombre: 'Gala', tipo: 'promocion', ancla: '2030-01-01', frase: 'Frase nueva', mbt: '', se_nota: 'Más reservas',
    canales: { 'primer-aviso': { instagram: { activo: true, fecha: '2026-11-08', pieza: 'Reel nuevo', monto: 99999 }, email: { activo: true, pieza: 'Invitación' } }, 'ultimo-empujon': { whatsapp: { activo: true, pieza: 'Aviso final' } } },
    briefs: [{ fase: 'primer-aviso', canal: 'instagram', objetivo: 'Nuevo objetivo' }, { fase: 'ultimo-empujon', canal: 'whatsapp', mensaje: 'Último día' }] });
  const r = C.fusionarPropuesta(actual, prop);
  assert.equal(r.id, 'nao--gala'); assert.equal(r.v, 4, 'lo del servidor se conserva'); assert.equal(r.nombre, 'Gala'); assert.equal(r.tipo, 'evento'); assert.equal(r.ancla, '2026-11-28', 'la fecha de la campaña no la cambia la IA');
  assert.equal(r.frase, 'Frase nueva'); assert.equal(r.mbt, 'B · Que nos recomienden', 'lo que la IA deja vacío no borra lo que había'); assert.equal(r.se_nota, 'Más reservas');
  assert.equal(r.canales['primer-aviso'].instagram.monto, 500, 'el monto 99999 de la IA no entra'); assert.equal(r.canales['primer-aviso'].instagram.pieza, 'Reel nuevo'); assert.equal(r.canales['primer-aviso'].pauta.monto, 2500, 'el monto guardado de la celda que la propuesta apagó sigue ahí');
  assert.equal(r.canales['primer-aviso'].pauta.activo, false); assert.equal(r.canales['ultimo-empujon'].whatsapp.fecha, '2026-11-26', 'una celda sin fecha toma la de su fase');
  assert.deepEqual(r.briefs.map((b) => [b.id, b.objetivo || b.mensaje]), [['primer-aviso.instagram', 'Nuevo objetivo'], ['ultimo-empujon.whatsapp', 'Último día']]);
  const soloCanales = C.fusionarPropuesta(actual, prop, { blueprint: false });
  assert.equal(soloCanales.frase, 'Que vengan a los 10 años'); assert.equal(soloCanales.se_nota, '+60 reservas'); assert.equal(soloCanales.canales['primer-aviso'].instagram.pieza, 'Reel nuevo');
  const conservado = C.fusionarPropuesta(actual, C.limpiarCampana({ nombre: 'Gala', canales: { recordatorio: { email: { activo: true } } }, briefs: [{ fase: 'recordatorio', canal: 'email', objetivo: 'x' }] }));
  assert.ok(conservado.briefs.some((b) => b.id === 'primer-aviso.instagram') && conservado.briefs.some((b) => b.id === 'recordatorio.email'), 'el brief de una celda que la propuesta no toca se queda');
  const sinFecha = C.fusionarPropuesta(C.limpiarCampana({ nombre: 'Z' }), C.limpiarCampana({ nombre: 'Z', ancla: '2026-12-12', hasta: '2026-12-20' })); assert.equal(sinFecha.ancla, '2026-12-12', 'si la campaña no tenía fecha, la de la IA entra');
});

// ---------- El módulo es puro y compatible con lo de siempre ----------
t('campanas.js sigue puro (sin imports: modos.js lo importa y un ciclo rompería la carga) y conserva sus funciones de antes', () => {
  assert.ok(!/^\s*import\b/m.test(puro), 'sin imports'); assert.ok(!/\b(document|window|fetch|localStorage)\b/.test(puro.replace(/\/\/.*$/gm, '')), 'sin DOM ni red');
  for (const k of ['COLL_C', 'TIPOS_C', 'ESTADOS_C', 'tipoDe', 'limpiarCampana', 'anticipacion', 'revisarCampana', 'campanasDelMes', 'revisarMes', 'proximaFecha', 'leerCampana', 'idCampana']) assert.ok(k in C, k);
  assert.equal(C.COLL_C, 'mk_campaigns'); assert.equal(C.idCampana('nao', 'Apertura Cayalá!'), 'nao--apertura-cayala');
  assert.equal(C.leerCampana({ tipo: 'evento' }), null); assert.equal(C.leerCampana({ nombre: 'Z', canales: { 'primer-aviso': { ig: { activo: true } } } }).canales['primer-aviso'].instagram.activo, true, 'el bloque ```campana``` del Chat ya lee el plan');
  assert.equal(C.campanasDelMes([base()], '2026-11').length, 1);
});

// ---------- El servidor: las reglas están donde deben estar ----------
t('Servidor: PUT y POST llevan la v que se leyó, aplican scoper, quitan montos a quien no ve costos y conservan los guardados', () => {
  assert.match(servidor, /async function abre\([\s\S]*?guard\(req, res, 'content', \{ write \}\)[\s\S]*?scoper\(u\)[\s\S]*?sc\.client\(slug\)/);
  assert.match(servidor, /const vDe = \(b, cur\) => \(b\?\.v != null/);
  const put = ruta(servidor, 'PUT', 'campanas/:slug/:id'), post = ruta(servidor, 'POST', 'campanas/:slug'), get = ruta(servidor, 'GET', 'campanas/:slug');
  for (const r of [put, post]) { assert.match(r, /abre\(req, res, true\)/); assert.match(r, /vDe\(b, cur\)/); assert.match(r, /!seesCosts\(u\)/); assert.match(r, /canalesConMontos\(/); assert.match(r, /resultadosAlGuardar\(/); assert.match(r, /CONFLICTO/); assert.match(r, /salida\(u, out\)/); assert.match(r, /ligasMal\(/); }
  assert.match(get, /campanasDe\(slug, u\)/); assert.match(get, /costos: seesCosts\(u\)/); assert.match(servidor, /const salida = \(u, c\) => \(seesCosts\(u\) \? c : sinMontos\(c\)\)/);
  assert.match(put, /mezclarCanales\(cur\.canales, b\.canales\)/); assert.match(post, /conservarPlan\(cur, c\)/); assert.match(put, /SIN_ESTRATEGIA/); assert.match(post, /SIN_ESTRATEGIA/);
  assert.match(servidor, /export const campanasDe = async \(slug, u\) =>/);
});
t('Servidor: nada se borra (se archiva), nada de upsert ni { client: true }, y las ligas se revisan contra la base', () => {
  assert.ok(!/\bdb\.remove\(|\bupsert\(|client: true|on\('DELETE'/.test(servidor));
  assert.match(servidor, /async function ligasMal\(slug, c, cur\)[\s\S]*?db\.get\('campaigns', c\.pauta_id\)[\s\S]*?client_slug[\s\S]*?db\.get\('deliverables', c\.entregable_ref\)[\s\S]*?campaign-architect/);
  assert.match(servidor, /import \{ guard, scoper, edits, seesCosts \} from '\.\/access\.js'/);
});
t('Interfaz: sin raw() sobre texto de modelo o de persona, sin escribir en plataformas de anuncios ni en la pauta, y solo rutas que ya existen', () => {
  const codigo = ui.replace(/\/\/.*$/gm, '');
  for (const m of codigo.matchAll(/raw\(([^)]*)\)/g)) assert.ok(/^(`maxlength="\$\{o\.max\}"`|'disabled'|'checked'|'selected'|'min="0" step="1"'|at)$/.test(m[1].trim()), `raw(${m[1]}) no es literal propio`);
  assert.ok(!/windsor|adwhispr|ads\/(report|accounts|competitors)/i.test(ui), 'ni Windsor ni AdWhispr: nunca se escribe en una plataforma de anuncios');
  assert.match(ui, /col\('campaigns'\)\.list\(\)/); assert.ok(!/col\('campaigns'\)\.(save|create|remove)/.test(ui), 'la colección de pauta solo se lee');
  const rutas = new Set([...ui.matchAll(/api\(`([a-z-]+)[/?`]/g)].map((m) => m[1]).concat([...ui.matchAll(/api\('([a-z-]+)'/g)].map((m) => m[1])));
  assert.deepEqual([...rutas].sort(), ['campanas', 'entregables', 'estrategia']);
  assert.match(ui, /body: \{ \.\.\.limpiarCampana\(W\), v: W\.v \}/, 'guardar manda la v que se leyó'); assert.match(ui, /method: 'PUT', body: \{ estado: e, v: c\.v \}/);
  assert.match(ui, /tool: 'creative-direction-lab', client_slug: slug, titulo: `Dirección creativa · \$\{S\.W\.nombre\}`, contenido: contenidoParaCreative\(S\.W\)/);
  assert.match(ui, /rutaHerramienta\('creative', slug, 'creative-direction-lab'\)/); assert.match(ui, /herramientaDe\('campaign-architect'\)/); assert.match(ui, /correrIA\(me, \{ tool, ctx/); assert.match(ui, /leerTarjetas\(txt\)/);
  assert.match(ui, /veEstrategia\(me\)/, 'el borrador de leads solo se pide a quien ve Estrategia'); assert.match(ui, /data-k="monto"/); assert.match(ui, /\$\{costos \? \(ed \?/, 'el monto solo se pinta si ves costos');
  assert.match(ui, /export async function campanasUI\(el, \{ me, b, alive, resto = \[\] \} = \{\}\)/);
});

// ---------- El servidor: su conducta con PGlite en memoria (no toca .devdb ni la red) ----------
let pglite = true; try { await import('@electric-sql/pglite'); } catch { pglite = false; }
if (!pglite) console.log('· (omitida) conducta del servidor: sin PGlite instalado');
else await t('Conducta del servidor: montos solo para quien ve costos, v vieja = 409, parche de celdas, resultados que solo se agregan, ligas de otra marca = 400, archivar no borra', async () => {
  process.env.LOCAL_DB = 'memory://'; process.env.SESSION_SECRET = 'x'.repeat(40); process.env.ADMIN_EMAILS = 'ceo@inherentglobal.com'; delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.VERCEL;
  const db = await import('../api/_lib/db.js'), session = await import('../api/_lib/session.js'), { rutas } = await import('../api/_lib/campanas.js'), { vivaId } = await import('../public/js/estrategia-viva.js');
  const rs = []; rutas((m, p, h) => rs.push([m, p.split('/'), h]));
  const cookie = (email) => { let c; session.issue({ headers: { 'user-agent': 'ua' } }, { getHeader: () => undefined, setHeader: (_, v) => { c = String(v).split(';')[0]; } }, { email }); return c; };
  async function call(email, method, path, body) {
    const partes = path.split('/'); let h, params = {};
    for (const [m, pat, f] of rs) { if (m !== method || pat.length !== partes.length) continue; const p = {}; if (pat.every((s, i) => (s.startsWith(':') ? ((p[s.slice(1)] = partes[i]), true) : s === partes[i]))) { h = f; params = p; break; } }
    assert.ok(h, `sin ruta ${method} ${path}`);
    let status = 200, out; const res = { getHeader: () => undefined, setHeader() {}, status(n) { status = n; return res; }, json(o) { out = o; return res; } };
    await h({ method, params, query: {}, body, headers: { cookie: cookie(email), 'user-agent': 'ua', 'x-ceoos': '1', host: 'x' } }, res);
    return { status, ...out };
  }
  const CEO = 'ceo@inherentglobal.com', ANA = 'ana@inherentglobal.com', COO = 'coo@inherentglobal.com', SIN = 'resumen@inherentglobal.com';
  await db.create('team', { name: 'CEO', role: 'ceo', active: true }, 'x', CEO); await db.create('team', { name: 'Ana', role: 'team', roles: ['content'], active: true }, 'x', ANA);
  await db.create('team', { name: 'COO', role: 'coo', roles: ['coo', 'content'], active: true }, 'x', COO); await db.create('team', { name: 'Sin', role: 'team', roles: [], active: true }, 'x', SIN);
  await db.create('campaigns', { name: 'Pauta nov', client_slug: 'nao' }, 'x', 'p1'); await db.create('campaigns', { name: 'Otra', client_slug: 'otra' }, 'x', 'p2');
  await db.create('deliverables', { tool: 'campaign-architect', client_slug: 'nao', ws: 'marketing', estado: 'Borrador' }, 'x', 'e1'); await db.create('deliverables', { tool: 'offer-architect', client_slug: 'nao', ws: 'strategy' }, 'x', 'e2');
  let r = await call(CEO, 'POST', 'campanas/nao', { nombre: 'Gala', tipo: 'evento', ancla: '2026-12-12' }); assert.equal(r.status, 409); assert.equal(r.code, 'SIN_ESTRATEGIA');
  await db.create('strategy', { aprobado: { por: 'ceo', en: 'hoy' } }, 'x', vivaId('nao'));
  r = await call(CEO, 'POST', 'campanas/nao', { nombre: 'Gala', tipo: 'evento', ancla: '2026-12-12', frase: 'F', pauta_id: 'p1', entregable_ref: 'e1', canales: { 'primer-aviso': { instagram: { activo: true, pieza: 'Reel', monto: 500 }, pauta: { activo: true, monto: 2500 } } }, briefs: [{ fase: 'primer-aviso', canal: 'instagram', objetivo: 'o' }] });
  assert.equal(r.status, 200); assert.equal(r.nueva, true); const id = r.campana.id; assert.equal(r.campana.canales['primer-aviso'].pauta.monto, 2500);
  assert.equal((await call(CEO, 'PUT', `campanas/nao/${id}`, { pauta_id: 'p2', v: 1 })).status, 400, 'la pauta de otra marca no se liga');
  assert.equal((await call(CEO, 'PUT', `campanas/nao/${id}`, { entregable_ref: 'e2', v: 1 })).status, 400, 'ni un entregable de otra herramienta');
  assert.equal((await call(SIN, 'GET', 'campanas/nao')).status, 403, 'sin Contenido no entra');
  // quien no ve costos
  r = await call(ANA, 'GET', 'campanas/nao'); assert.equal(r.puede.costos, false); const vista = r.campanas[0];
  assert.equal(vista.canales['primer-aviso'].pauta.monto, null); assert.equal(vista.costs_hidden, true); assert.ok(!JSON.stringify(r).includes('2500'));
  const nuevo = JSON.parse(JSON.stringify(vista.canales)); nuevo['primer-aviso'].instagram.pieza = 'Reel teaser'; nuevo['primer-aviso'].instagram.monto = 999999; nuevo['primer-aviso'].tiktok = { activo: true, monto: 7 };
  r = await call(ANA, 'PUT', `campanas/nao/${id}`, { canales: nuevo, v: vista.v }); assert.equal(r.status, 200); assert.equal(r.campana.canales['primer-aviso'].instagram.monto, null);
  const g1 = await db.get('mk_campaigns', id); assert.equal(g1.canales['primer-aviso'].instagram.monto, 500); assert.equal(g1.canales['primer-aviso'].pauta.monto, 2500); assert.equal(g1.canales['primer-aviso'].tiktok.monto, null); assert.equal(g1.canales['primer-aviso'].instagram.pieza, 'Reel teaser');
  assert.equal((await call(ANA, 'POST', 'campanas/nao', { nombre: 'Nueva de Ana', canales: { recordatorio: { email: { activo: true, monto: 50 } } } })).campana.canales.recordatorio.email.monto, null, 'quien no ve costos no los escribe al crear');
  r = await call(COO, 'GET', 'campanas/nao'); assert.equal(r.puede.costos, true); assert.equal(r.campanas.find((c) => c.id === id).canales['primer-aviso'].pauta.monto, 2500);
  // la v
  r = await call(ANA, 'PUT', `campanas/nao/${id}`, { frase: 'Otra', v: vista.v }); assert.equal(r.status, 409); assert.equal(r.code, 'CONFLICTO');
  // un parche de celdas
  r = await call(CEO, 'PUT', `campanas/nao/${id}`, { canales: { 'ultimo-empujon': { whatsapp: { activo: true, pieza: 'Lista' } } }, v: (await db.get('mk_campaigns', id)).v });
  assert.equal(r.campana.canales['primer-aviso'].pauta.monto, 2500); assert.equal(r.campana.canales['ultimo-empujon'].whatsapp.pieza, 'Lista');
  // resultados: solo se agregan; el gasto es de quien ve costos
  r = await call(CEO, 'PUT', `campanas/nao/${id}`, { resultados: [{ metrica: 'Gasto de pauta', valor: 'Q2,000' }, { metrica: 'Reservas', valor: '40' }], v: (await db.get('mk_campaigns', id)).v }); assert.equal(r.campana.resultados.length, 2);
  const ra = (await call(ANA, 'GET', 'campanas/nao')).campanas.find((c) => c.id === id); assert.deepEqual(ra.resultados.map((x) => x.metrica), ['Reservas']);
  await call(ANA, 'PUT', `campanas/nao/${id}`, { resultados: [...ra.resultados, { metrica: 'Asistentes', valor: '38' }], v: ra.v }); assert.deepEqual((await db.get('mk_campaigns', id)).resultados.map((x) => x.metrica), ['Gasto de pauta', 'Reservas', 'Asistentes']);
  await call(CEO, 'PUT', `campanas/nao/${id}`, { resultados: [], v: (await db.get('mk_campaigns', id)).v }); assert.equal((await db.get('mk_campaigns', id)).resultados.length, 3, 'una lista vacía no borra el aprendizaje');
  // poner al día por POST (el Chat) no borra el plan
  r = await call(CEO, 'POST', 'campanas/nao', { nombre: 'Gala', tipo: 'evento', ancla: '2026-12-12', frase: 'Frase nueva' }); assert.equal(r.nueva, false); assert.equal(r.campana.frase, 'Frase nueva');
  assert.equal(r.campana.canales['primer-aviso'].pauta.monto, 2500); assert.equal(r.campana.briefs.length, 1); assert.equal(r.campana.pauta_id, 'p1'); assert.equal(r.campana.entregable_ref, 'e1');
  // sin estrategia: cambiar es 409, archivar no pide nada y no borra
  await db.update('strategy', vivaId('nao'), { aprobado: null }, (await db.get('strategy', vivaId('nao'))).v, 'x');
  const v4 = (await db.get('mk_campaigns', id)).v;
  r = await call(CEO, 'PUT', `campanas/nao/${id}`, { frase: 'x', v: v4 }); assert.equal(r.status, 409); assert.equal(r.code, 'SIN_ESTRATEGIA');
  r = await call(CEO, 'PUT', `campanas/nao/${id}`, { estado: 'Archivada', v: v4 }); assert.equal(r.status, 200); assert.equal(r.campana.estado, 'Archivada'); assert.equal(r.campana.briefs.length, 1);
  assert.ok((await call(CEO, 'GET', 'campanas/nao')).campanas.some((c) => c.id === id), 'archivada sigue ahí'); assert.equal((await call(CEO, 'GET', 'campanas/personal')).status, 400, 'la marca personal no entra');
});

console.log(`\n${ok} pruebas de Campaign Architect pasaron`);
if (pglite) process.exit(0); // PGlite deja el proceso abierto
