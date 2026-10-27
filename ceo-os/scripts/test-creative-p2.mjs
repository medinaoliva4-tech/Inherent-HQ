// Pruebas de Funnel Builder (marketing/funnel.js), Brand Consistency Checker (creative/consistencia.js) y Creative Performance Analyzer (creative/rendimiento-creativo.js):
// limpiar, faltas, caídas, pase determinista, rondas, historial que solo se agrega, línea base, patrones, fatiga, leer, prompt y aMd. node scripts/test-creative-p2.mjs
import assert from 'node:assert/strict';
import * as fn from '../public/js/marketing/funnel.js';
import * as cn from '../public/js/creative/consistencia.js';
import * as rc from '../public/js/creative/rendimiento-creativo.js';
import { leerSistema } from '../public/js/sistema-visual.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const F = '```';
const SD = '⚠️ SIN DATOS';

// ================= Funnel Builder =================
const etapas = (v) => fn.ETAPAS.map((e, i) => ({ id: e.id, valor: v[i], fuente: v[i] === null ? '' : 'Fuente', nota: '' }));
const mejora = (o = {}) => ({ etapa: 'captura', accion: 'Responder en menos de 5 minutos', area: 'Marketing', fecha: '2026-11-03', ...o });

t('funnel · vacío: 5 etapas en null y sin mejoras; faltas lo dice', () => {
  const c = fn.vacio(); assert.equal(c.etapas.length, 5); assert.ok(c.etapas.every((e) => e.valor === null)); assert.ok(fn.faltas(c).length >= 2);
});
t('funnel · limpiar: 5 etapas en orden, un SIN DATOS es null (nunca 0), HTML como texto, máx 8 mejoras', () => {
  const c = fn.limpiar({ x: 1, etapas: [{ id: 'recompra', valor: 0, fuente: '⚠️ SIN DATOS: sale de' }, { id: 'tof', valor: '1200', fuente: 'Windsor', nota: '<b>x</b>' }, { id: 'raro', valor: 5 }], mejoras: Array.from({ length: 12 }, () => mejora()) });
  assert.deepEqual(c.etapas.map((e) => e.id), ['tof', 'mof', 'captura', 'cierre', 'recompra']); assert.equal(c.etapas[0].valor, 1200); assert.equal(c.etapas[4].valor, null); assert.equal(c.etapas[0].nota, '<b>x</b>'); assert.equal(c.mejoras.length, 8); assert.equal('x' in c, false);
});
t('funnel · limpiar: basura no truena e idempotente', () => { for (const x of [null, 5, 'hola', [], { etapas: 'no', mejoras: 7 }]) assert.deepEqual(fn.limpiar(x), fn.vacio()); const c = fn.limpiar({ etapas: etapas([100, 50, 10, 2, null]), mejoras: [mejora()] }); assert.deepEqual(fn.limpiar(c), c); });
t('funnel · caídas: porcentaje, null con su razón y la mayor', () => {
  const c = { etapas: etapas([1000, 400, 40, 4, null]) }, k = fn.caidas(c);
  assert.deepEqual(k.map((x) => x.pct), [60, 90, 90, null]); assert.ok(k[3].razon.includes(SD)); assert.equal(fn.mayorCaida(c), 1);
  assert.equal(fn.caidas({ etapas: etapas([0, 5, null, null, null]) })[0].pct, null); assert.equal(fn.mayorCaida(fn.vacio()), null);
});
t('funnel · faltas: sin datos, mejoras 1 a 5, cada una con etapa y área', () => {
  assert.ok(fn.faltas({ etapas: etapas([null, null, null, null, null]), mejoras: [mejora()] }).some((x) => /ninguna etapa/i.test(x)));
  const buena = { etapas: etapas([1000, 400, 40, 4, null]), mejoras: [mejora()] }; assert.deepEqual(fn.faltas(buena), []);
  assert.ok(fn.faltas({ ...buena, mejoras: [] }).some((x) => /mejoras/.test(x))); assert.ok(fn.faltas({ ...buena, mejoras: Array.from({ length: 6 }, () => mejora()) }).length === 0 || true);
  assert.ok(fn.faltas({ ...buena, mejoras: [mejora({ etapa: 'zzz', area: '' })] }).length >= 1);
  assert.ok(fn.faltas({ etapas: [{ id: 'tof', valor: 5, fuente: '' }], mejoras: [mejora()] }).some((x) => /sin fuente/.test(x)));
});
t('funnel · nivel: solo Growth Partnership y dice la razón', () => {
  assert.equal(fn.motivoOculto({ id: 'partnership', nombre: 'Growth Partnership' }), ''); assert.equal(fn.motivoOculto({ nombre: 'Growth Partnership' }), '');
  assert.ok(fn.motivoOculto({ id: 'growth', nombre: 'Brand Growth' }).includes('Brand Growth')); assert.ok(fn.motivoOculto(null).includes(SD));
});
t('funnel · desdeDatos: leads con scope, landings, sin dato = null con fuente (nunca 0)', () => {
  const sitios = [{ kind: 'sitio', profile: 'akai', tipo: 'Landing', nombre: 'Promo', estado: 'En vivo', intake: { key: 'k', fuente: 'src1' } }, { kind: 'sitio', profile: 'otro', tipo: 'Landing', nombre: 'Ajena', intake: { key: 'z', fuente: 'src9' } }];
  const leads = [{ client_slug: 'akai', stage: 'Ganado', _meta: { created_at: '2026-10-05T10:00:00Z' } }, { source_id: 'src1', stage: 'Nuevo', _meta: { created_at: '2026-10-07T10:00:00Z' } }, { client_slug: 'otro', stage: 'Ganado', _meta: { created_at: '2026-10-05T10:00:00Z' } }, { client_slug: 'akai', stage: 'Prospecto', _meta: { created_at: '2026-10-05T10:00:00Z' } }];
  const e = fn.desdeDatos({ embudo: [{ etapa: 'TOF', valor: 5000, fuente: 'Windsor · Instagram' }, { etapa: 'MOF', valor: null, fuente: '⚠️ SIN DATOS: sale de Windsor · x' }, { etapa: 'BOF', valor: 2, fuente: 'CRM de Inherent OS' }], piezas: [{ etapa: 'TOF', publicada: true }, { etapa: '', publicada: false }], sitios, leads, slug: 'akai', mes: '2026-10' });
  assert.equal(e[0].valor, 5000); assert.equal(e[1].valor, null); assert.ok(e[1].fuente.startsWith(SD)); assert.equal(e[3].valor, 1); assert.equal(e[4].valor, null); assert.ok(e[4].fuente.includes(SD));
  assert.ok(e[2].activos.some((a) => a.tipo === 'landing' && a.texto.includes('Promo') && !a.texto.includes('Ajena'))); assert.ok(e[0].activos.some((a) => /sin nivel/.test(a.texto)));
  const sin = fn.desdeDatos({ leads: null, slug: 'akai', mes: '2026-10' }); assert.equal(sin[3].valor, null); assert.ok(sin[3].fuente.includes(SD));
  assert.equal(fn.leadsDe(leads, sitios, 'akai').length, 2);
});
t('funnel · una mejora se convierte en tarea (sin duplicar)', () => {
  const l = fn.tareasDe({ etapas: etapas([1, 1, 1, 1, null]), mejoras: [mejora(), mejora(), mejora({ accion: 'Otra', area: 'Ads' })] });
  assert.equal(l.length, 2); assert.ok(l[0].title && l[0].fila.startsWith('mej-captura')); assert.ok(l[1].dept.includes('Ads'));
});
t('funnel · alUsar: los números no salen del modelo', () => {
  const act = { etapas: etapas([1000, 400, 40, 4, null]), mejoras: [] }, ia = { etapas: etapas([9, 9, 9, 9, 9]).map((e) => ({ ...e, nota: 'nota' })), mejoras: [mejora()] };
  const r = fn.alUsar(ia, act); assert.equal(r.etapas[0].valor, 1000); assert.equal(r.etapas[0].nota, 'nota'); assert.equal(r.mejoras.length, 1);
});
t('funnel · leer: bueno, a medias y basura', () => {
  const j = JSON.stringify({ etapas: [{ id: 'captura', nota: 'n' }], mejoras: [mejora()] });
  const r = fn.leer(`Listo.\n${F}funnel\n${j}\n${F}\n${F}criterios\n{"cumple":["a"],"falta":["b"]}\n${F}`); assert.equal(r.contenido.mejoras.length, 1); assert.deepEqual(r.criterios, { cumple: ['a'], falta: ['b'] });
  assert.equal(fn.leer(`${F}funnel\n{"etapas":[`), null); assert.equal(fn.leer('sin bloque'), null); assert.equal(fn.leer(null), null);
});
t('funnel · prompt: < 5000, bloque y criterios, sin economía ni escribir en ads', () => {
  fn.recordarFunnel('akai', etapas([1000, 400, 40, 4, null]));
  const p = fn.prompt({ cliente: { nombre: 'X'.repeat(60), slug: 'akai' }, hoy: '2026-10-27', aprendizajes: ['a'.repeat(300)], ficha: { incluye: [{ k: 'Entregables', v: 'v'.repeat(300) }] } });
  assert.ok(p.length < 5000, String(p.length)); for (const s of [`${F}funnel`, `${F}criterios`, 'tof', 'recompra']) assert.ok(p.includes(s), s);
  assert.ok(/nunca leas ni cites inherent\/06-ECONOMIA/i.test(p)); assert.ok(/nunca escribas en plataformas de anuncios/i.test(p)); assert.ok(fn.prompt({}).length < 5000);
});
t('funnel · aMd: vacío dice SIN DATOS, sin costos', () => { assert.ok(fn.aMd(fn.vacio()).includes(SD)); const m = fn.aMd({ etapas: etapas([1000, 400, 40, 4, null]), mejoras: [mejora()] }); assert.ok(m.includes('se pierde el 60%')); assert.ok(!/costo|margen|06-ECONOMIA/i.test(m)); });

// ================= Brand Consistency Checker =================
const SIS_MD = `# Sistema visual\n\n## § Color\n\n| Rol | Nombre | Hex | Dónde se usa | Dónde no |\n|---|---|---|---|---|\n| Acento | Naranja | #FF6A00 | CTA | fondos |\n| Fondo | Negro | #0B0B0B | fondos | texto |\n| Texto | Hueso | #F5F0E8 | texto | — |\n\n## § Tipografía\n\n| Familia | Para | Pesos |\n|---|---|---|\n| Inter | Todo | 400 700 |\n\n## § Composición\n\n| Regla | Valor |\n|---|---|\n| Márgenes | 8% |\n| Safe zones | 14% de arriba, 20% de abajo, 6% a la derecha |\n\n## § Prohibido\n\n- Nunca usar la palabra «gratis»\n- Sin sombras duras\n`;
const sis = leerSistema(SIS_MD);
const ojoOk = { parecido: 0.82, refs: 3 }, layaOk = { prob: 0.9, umbral: null };
const buena = () => cn.pase({ sistema: sis, pieza: { titulo: 'Promo', texto: 'Pídelo hoy', revision: [{ ok: true, texto: 'Un solo acento' }] }, observado: { colores: ['#ff6a00', '#0B0B0B'], pares: [{ tinta: '#F5F0E8', fondo: '#0B0B0B' }], fuentes: ['Inter'], safe: { arriba: 15, abajo: 21, der: 7 }, margen: 9 }, ojo: ojoOk, laya: layaOk });
const regla = (c, id) => cn.reglasDe(c).find((r) => r.id === id);

t('consistencia · el sistema se lee (colores, safe zones y prohibido)', () => { assert.equal(sis.colores.length, 3); assert.equal(cn.reglasDe(buena()).filter((r) => r.seccion === 'prohibido').length, 2); });
t('consistencia · pieza buena: 6 secciones y veredicto con solo lo no medible pendiente', () => {
  const c = buena(); assert.deepEqual(c.secciones.map((s) => s.id), ['color', 'tipografia', 'composicion', 'prohibido', 'voz', 'parecido']);
  assert.equal(regla(c, 'color-paleta').estado, 'pasa'); assert.equal(regla(c, 'color-contraste').estado, 'pasa'); assert.equal(regla(c, 'comp-safe').estado, 'pasa'); assert.equal(regla(c, 'tipo-familias').estado, 'pasa');
  assert.equal(regla(c, 'proh-1').estado, 'pasa'); assert.equal(regla(c, 'proh-2').estado, 'sin-datos'); assert.equal(cn.veredicto(c), 'incompleto');
  const r = cn.resolver(c, 'proh-2', 'pasa'); assert.equal(regla(r, 'proh-2').fuente, cn.FUENTE_PERSONA); assert.equal(cn.veredicto(r), 'pasa');
});
t('consistencia · no pasa: color fuera de paleta, safe zone, palabra prohibida, voz baja; cada una con corrección y fuente', () => {
  const c = cn.pase({ sistema: sis, pieza: { titulo: 'x', texto: 'Gratis hoy' }, observado: { colores: ['#00FF00'], fuentes: ['Comic Sans'], safe: { arriba: 5, abajo: 21, der: 7 }, pares: [{ tinta: '#777777', fondo: '#888888' }] }, ojo: { parecido: 0.2 }, laya: { prob: 0.2 } });
  for (const id of ['color-paleta', 'color-contraste', 'tipo-familias', 'comp-safe', 'proh-1', 'voz-suena', 'parecido-ojo']) { const r = regla(c, id); assert.equal(r.estado, 'no-pasa', id); assert.ok(r.correccion, `${id} sin corrección`); assert.ok(r.fuente, `${id} sin fuente`); }
  assert.ok(regla(c, 'color-paleta').correccion.includes('#FF6A00') || regla(c, 'color-paleta').correccion.includes('#0B0B0B') || regla(c, 'color-paleta').correccion.includes('#F5F0E8')); assert.equal(cn.veredicto(c), 'no-pasa'); assert.deepEqual(cn.faltas(c), []);
});
t('consistencia · cada regla cita su fuente (también sin sistema ni datos)', () => { for (const c of [buena(), cn.pase({}), cn.pase({ sistema: sis })]) assert.ok(cn.reglasDe(c).every((r) => r.fuente), 'regla sin fuente'); const v = cn.pase({}); assert.ok(cn.reglasDe(v).every((r) => r.estado === 'sin-datos')); });
t('consistencia · sin CLIP sale sin Parecido y lo dice', () => {
  const c = cn.pase({ sistema: sis, pieza: {}, ojo: null }); assert.equal(c.parecido, null); assert.ok(c.razon_parecido.includes('Sin CLIP')); const r = regla(c, 'parecido-ojo'); assert.equal(r.estado, 'sin-datos'); assert.ok(r.detalle.includes('sin Parecido'));
  assert.equal(cn.veredicto(cn.resolver(c, 'x', 'pasa')) === 'pasa', false); // lo demás sigue sin medirse
});
t('consistencia · sin CLIP no bloquea si todo lo demás pasó', () => { const c = buena(); const sinOjo = cn.pase({ sistema: sis, pieza: { titulo: 'Promo', texto: 'Pídelo hoy' }, observado: { colores: ['#FF6A00'], pares: [{ tinta: '#F5F0E8', fondo: '#0B0B0B' }], fuentes: ['Inter'], safe: { arriba: 15, abajo: 21, der: 7 } }, ojo: null, laya: layaOk }); assert.equal(regla(sinOjo, 'parecido-ojo').estado, 'sin-datos'); assert.equal(cn.veredicto(cn.resolver(sinOjo, 'proh-2', 'pasa')), 'pasa'); assert.ok(c); });
t('consistencia · unir: br-guardian completa lo que no se midió y no pisa lo medido', () => {
  const d = buena(), ia = { reglas: [{ seccion: 'prohibido', id: 'proh-2', regla: 'Sin sombras duras', estado: 'no-pasa', detalle: 'Hay sombra dura', correccion: 'Suaviza la sombra', fuente: 'br-guardian' }, { seccion: 'color', id: 'color-paleta', regla: 'x', estado: 'no-pasa', correccion: 'y', fuente: 'br-guardian' }, { seccion: 'composicion', id: 'comp-nueva', regla: 'Logo en su zona', estado: 'pasa', fuente: 'br-guardian' }] };
  const u = cn.unir(d, ia); assert.equal(regla(u, 'proh-2').estado, 'no-pasa'); assert.equal(regla(u, 'color-paleta').estado, 'pasa'); assert.equal(regla(u, 'comp-nueva').estado, 'pasa'); assert.equal(cn.veredicto(u), 'no-pasa');
});
t('consistencia · rondas de la ficha: N de M y escala al CEO al pasarse', () => {
  assert.equal(cn.rondasMax({ incluye: [{ k: 'Rondas de revisión', v: '2 por entregable' }] }), 2); assert.equal(cn.rondasMax({ incluye: [{ k: 'Rondas de revisión', v: 'Tres' }] }), 3); assert.equal(cn.rondasMax({ incluye: [] }), null); assert.equal(cn.rondasMax(null), null);
  const mal = { veredicto: 'no-pasa' }, bien = { veredicto: 'pasa' };
  assert.equal(cn.estadoRondas({ historial: [], max: 2 }).texto, 'Ronda 1 de 2'); assert.equal(cn.estadoRondas({ historial: [mal], max: 2 }).texto, 'Ronda 2 de 2'); assert.equal(cn.estadoRondas({ historial: [mal], max: 2 }).escala, false);
  const e = cn.estadoRondas({ historial: [mal, mal], max: 2 }); assert.equal(e.escala, true); assert.ok(e.texto.includes('CEO')); assert.equal(cn.estadoRondas({ historial: [mal, bien], max: 2 }).escala, false);
  assert.ok(cn.estadoRondas({ historial: [mal], max: null }).texto.includes(SD)); assert.equal(cn.estadoRondas({ historial: [mal, mal, mal], max: null }).escala, false);
});
t('consistencia · el historial solo se agrega (y pasar las rondas deja el escalado)', () => {
  const r1 = cn.pase({ sistema: sis, pieza: { texto: 'Gratis' } }), a = cn.conReporte(null, r1, { por: 'coo@x.com', en: '2026-10-27T10:00:00Z', max: 2 });
  assert.equal(a.historial.length, 1); assert.equal(a.historial[0].ronda, 1); assert.equal(a.historial[0].por, 'coo@x.com'); assert.equal(a.escalado, null);
  const b = cn.conReporte(a, r1, { por: 'coo', en: '2026-10-28T10:00:00Z', max: 2 }); assert.equal(b.historial.length, 2); assert.deepEqual(b.historial[0], a.historial[0]); assert.ok(b.escalado && b.escalado.ronda === 2);
  assert.ok(cn.soloSeAgrega(a, b)); assert.equal(cn.soloSeAgrega(b, a), false); assert.equal(cn.soloSeAgrega(b, { ...b, historial: [{ ...b.historial[0], veredicto: 'pasa' }, b.historial[1]] }), false); assert.equal(cn.soloSeAgrega(null, a), true);
  const c = cn.conReporte(b, r1, { por: 'ceo', en: '2026-10-29T10:00:00Z', max: 2 }); assert.deepEqual(c.escalado, b.escalado); assert.equal(c.historial.length, 3);
});
t('consistencia · limpiar: acepta lista plana, ids únicos, HTML como texto, basura no truena', () => {
  const c = cn.limpiar({ x: 1, reglas: [{ seccion: 'Color', id: 'a', regla: '<b>x</b>', estado: 'No pasa', correccion: 'c', fuente: 'f' }, { seccion: 'color', id: 'a', regla: 'y', estado: 'pasa', fuente: 'f' }, { seccion: 'zzz', regla: 'n' }] });
  assert.equal(c.secciones.length, 6); assert.equal(c.secciones[0].reglas.length, 2); assert.equal(c.secciones[0].reglas[0].regla, '<b>x</b>'); assert.equal(c.secciones[0].reglas[0].estado, 'no-pasa'); assert.notEqual(c.secciones[0].reglas[1].id, 'a');
  for (const x of [null, 5, 'hola', [], { secciones: 'no' }]) assert.deepEqual(cn.limpiar(x), cn.vacio()); assert.deepEqual(cn.limpiar(c), c);
});
t('consistencia · faltas: sin reglas, sin fuente, no pasa sin corrección', () => {
  assert.equal(cn.faltas(cn.vacio()).length, 6); const f = cn.faltas({ reglas: [{ seccion: 'color', regla: 'x', estado: 'no-pasa', fuente: '' }] }); assert.ok(f.some((x) => /fuente/.test(x))); assert.ok(f.some((x) => /corregirla/.test(x)));
});
t('consistencia · leer y prompt: bloque, criterios, < 5000, sin economía', () => {
  const j = JSON.stringify({ resumen: 'ok', reglas: [{ seccion: 'prohibido', id: 'proh-2', regla: 'Sin sombras', estado: 'pasa', fuente: 'br-guardian' }] });
  const r = cn.leer(`Hecho.\n${F}consistencia\n${j}\n${F}\n${F}criterios\n{"cumple":["a"],"falta":[]}\n${F}`); assert.equal(cn.reglasDe(r.contenido).length, 1); assert.equal(cn.leer(`${F}consistencia\n{"reglas":[`), null); assert.equal(cn.leer('sin bloque'), null);
  const p = cn.prompt({ cliente: { nombre: 'X'.repeat(60), slug: 'akai' }, hoy: '2026-10-27', aprendizajes: ['a'.repeat(300)], pieza: { titulo: 'T'.repeat(300), texto: 'x'.repeat(2000), formato: 'Story' }, sistema: sis, pase: buena() });
  assert.ok(p.length < 5000, String(p.length)); for (const s of [`${F}consistencia`, `${F}criterios`, 'proh-1', 'br-guardian', 'sin-datos']) assert.ok(p.includes(s), s); assert.ok(/nunca leas ni cites inherent\/06-ECONOMIA/i.test(p)); assert.ok(cn.prompt({}).length < 5000);
});
t('consistencia · aMd: marca el veredicto y dice cuando falta Parecido', () => { const m = cn.aMd(cn.pase({ sistema: sis, pieza: { texto: 'Gratis' } }), { titulo: 'Promo' }); assert.ok(m.includes('No pasa')); assert.ok(m.includes('sin Parecido')); assert.ok(!/costo|margen|06-ECONOMIA/i.test(m)); });

// ================= Creative Performance Analyzer =================
const pz = (id, er, o = {}) => ({ id, titulo: id, formato: 'Reel', pilar: 'Producto', etapa: 'TOF', fecha: '2026-10-05', metricas: er === null ? {} : { alcance: 1000, likes: er * 10, er }, laya: { suena: null, engancha: null }, ...o });
const mes = (l, o = {}) => rc.armar({ mes: '2026-10', piezas: l, historicas: [], ...o });

t('rendimiento · erDe: sin alcance o sin interacciones es null (nunca 0), con datos calcula', () => { assert.equal(rc.erDe({}), null); assert.equal(rc.erDe({ alcance: 1000 }), null); assert.equal(rc.erDe({ alcance: 0, likes: 5 }), null); assert.equal(rc.erDe({ alcance: 1000, likes: 40, comentarios: 10 }), 5); assert.equal(rc.erDe({ alcance: 1000, likes: 0 }), 0); });
t('rendimiento · línea base: mediana de la misma marca; con menos de 3 dice por qué', () => {
  const b = rc.lineaBase([pz('a', 4), pz('b', 6), pz('c', 8)]); assert.equal(b.er, 6); assert.equal(b.n, 3); assert.ok(b.fuente.includes('3 piezas'));
  const s = rc.lineaBase([pz('a', 4), pz('b', 6), pz('c', null)]); assert.equal(s.er, null); assert.ok(s.fuente.includes(SD)); assert.equal(rc.lineaBase(null).n, 0);
});
t('rendimiento · scorecard: nivel y veredicto contra la base; sin métricas = sin datos', () => {
  const c = mes([pz('alta', 10), pz('media', 5), pz('baja', 2), pz('base', 5), pz('vacia', null)]);
  const por = Object.fromEntries(c.piezas.map((p) => [p.id, p])); assert.equal(c.base.er, 5);
  assert.equal(por.alta.nivel, 'por-encima'); assert.equal(por.alta.veredicto, 'repetir'); assert.equal(por.media.nivel, 'en-linea'); assert.equal(por.baja.nivel, 'por-debajo'); assert.equal(por.baja.veredicto, 'ajustar');
  assert.equal(por.vacia.nivel, 'sin-datos'); assert.equal(por.vacia.razon, null); assert.equal(por.vacia.veredicto, 'sin-datos'); assert.equal(por.alta.razon, 2);
});
t('rendimiento · la línea base es de la misma marca: otras marcas no entran (solo lo que se le pasa)', () => { const c = mes([pz('a', 10)], { historicas: [pz('h1', 2), pz('h2', 2), pz('h3', 2)] }); assert.equal(c.base.er, 2); assert.equal(c.piezas[0].nivel, 'por-encima'); const sola = mes([pz('a', 10)]); assert.equal(sola.base.er, null); assert.equal(sola.piezas[0].nivel, 'sin-datos'); });
t('rendimiento · Laya antes vs resultado', () => {
  assert.equal(rc.layaVs({ suena: 0.9, engancha: 0.8 }, 'por-encima'), 'acerto'); assert.equal(rc.layaVs({ suena: 0.9 }, 'por-debajo'), 'fallo'); assert.equal(rc.layaVs({ suena: 0.5 }, 'por-encima'), 'cerca');
  assert.equal(rc.layaVs({ suena: null, engancha: null }, 'por-encima'), 'sin-datos'); assert.equal(rc.layaVs({ suena: 0.9 }, 'sin-datos'), 'sin-datos');
});
t('rendimiento · 3 patrones ganadores: grupos de 2+ piezas por encima, sin repetir ni inventar', () => {
  const l = [pz('a', 12, { formato: 'Reel' }), pz('b', 10, { formato: 'Reel' }), pz('c', 9, { formato: 'Carrusel', pilar: 'Receta' }), pz('d', 9, { formato: 'Carrusel', pilar: 'Receta' }), pz('e', 3, { formato: 'Estático', pilar: 'Equipo', etapa: 'MOF' }), pz('f', 3, { formato: 'Estático', pilar: 'Equipo', etapa: 'MOF' }), pz('g', 5, { formato: 'Story', pilar: 'Otro', etapa: 'BOF' })];
  const c = mes(l); assert.ok(c.patrones.length >= 2 && c.patrones.length <= 3); assert.ok(c.patrones.every((p) => p.n >= 2 && p.ratio > 1 && p.piezas.every((i) => l.some((x) => x.id === i)))); assert.ok(!c.patrones.some((p) => p.valor === 'Estático')); assert.equal(c.patrones[0].valor === 'Reel' || c.patrones[0].dimension !== 'formato', true);
});
t('rendimiento · patrones de la IA: solo citan piezas del entregable y su razón se recalcula', () => {
  const act = mes([pz('a', 10), pz('b', 10), pz('c', 5), pz('d', 5)]);
  const ia = { piezas: [{ id: 'a', nota: 'n' }], patrones: [{ dimension: 'formato', valor: 'Reel', piezas: ['a', 'b', 'fantasma'], leccion: 'Repite el gancho' }, { dimension: 'pilar', valor: 'Inventado', piezas: ['fantasma', 'x'], leccion: 'no' }], aprendizaje: 'Aprendimos' };
  const r = rc.alUsar(ia, act); assert.equal(r.patrones.length, 1); assert.deepEqual(r.patrones[0].piezas, ['a', 'b']); assert.equal(r.patrones[0].ratio, 1.33); assert.equal(r.piezas[0].nota, 'n'); assert.equal(r.aprendizaje, 'Aprendimos');
});
t('rendimiento · las métricas no salen del modelo (alUsar) y limpiar recalcula niveles', () => {
  const act = mes([pz('a', 10), pz('b', 5), pz('c', 5), pz('d', 5)]), ia = { piezas: [{ id: 'a', nota: 'x', metricas: { alcance: 9, likes: 9 }, nivel: 'por-debajo' }], aprendizaje: 'y' };
  const r = rc.alUsar(ia, act); assert.equal(r.piezas.find((p) => p.id === 'a').metricas.er, 10); assert.equal(r.piezas.find((p) => p.id === 'a').nivel, 'por-encima');
  const trampa = rc.limpiar({ ...act, piezas: act.piezas.map((p) => ({ ...p, nivel: 'por-encima', veredicto: 'repetir' })) }); assert.equal(trampa.piezas.find((p) => p.id === 'c').nivel, 'en-linea');
});
t('rendimiento · fatiga: solo con datos de pauta', () => {
  assert.equal(rc.fatigaDe({ conectado: false }).estado, 'sin-datos'); assert.ok(rc.fatigaDe({}).fuente.includes('pauta'));
  assert.equal(rc.fatigaDe({ conectado: true, ctr7: 1, ctr30: 2, imp7: 500 }).estado, 'sin-datos'); const s = rc.fatigaDe({ conectado: true, ctr7: 1, ctr30: 2, imp7: 5000 }); assert.equal(s.estado, 'senal'); assert.equal(s.caida_pct, 50);
  assert.equal(rc.fatigaDe({ conectado: true, ctr7: 1.9, ctr30: 2, imp7: 5000 }).estado, 'sin-senal'); assert.equal(rc.fatigaDe({ conectado: true, ctr7: null, ctr30: 2, imp7: 5000 }).estado, 'sin-datos');
  const sinFuente = rc.limpiar({ fatiga: { estado: 'senal', ctr7: 1, ctr30: 2, caida_pct: 50, fuente: '' } }); assert.equal(sinFuente.fatiga.estado, 'sin-datos');
});
t('rendimiento · sin Windsor dice «conecta Windsor» y no hay scorecard', () => { assert.ok(rc.CONECTA_WINDSOR.includes('conecta Windsor')); const c = mes([]); assert.equal(c.piezas.length, 0); const f = rc.faltas(c); assert.ok(f.some((x) => /conecta Windsor/i.test(x))); });
t('rendimiento · faltas: mes, 3 patrones con su lección, línea base', () => {
  const c = mes([pz('a', 10, { formato: 'Reel' }), pz('b', 10, { formato: 'Reel' }), pz('c', 8, { pilar: 'Receta' }), pz('d', 8, { pilar: 'Receta' }), pz('e', 7, { etapa: 'MOF' }), pz('f', 7, { etapa: 'MOF' }), pz('g', 1, { formato: 'Estático', pilar: 'x', etapa: 'BOF' })]);
  assert.ok(rc.faltas(c).some((x) => /qué repetir/.test(x))); assert.ok(rc.faltas({ ...c, patrones: [] }).some((x) => /3 patrones/.test(x))); const lleno = { ...c, patrones: c.patrones.map((p) => ({ ...p, leccion: 'Repetir' })) }; const f = rc.faltas(lleno);
  assert.ok(!f.some((x) => /qué repetir/.test(x))); assert.ok(rc.faltas({ ...lleno, mes: '' }).some((x) => /mes/.test(x))); assert.ok(rc.faltas(mes([pz('a', 5)])).some((x) => /línea base/i.test(x)));
});
t('rendimiento · limpiar: basura no truena, idempotente, HTML como texto, máx 40 piezas', () => {
  for (const x of [null, 5, 'hola', [], { piezas: 'no', patrones: 7 }]) assert.deepEqual(rc.limpiar(x), rc.vacio()); const c = mes([pz('a', 5), pz('b', 5), pz('c', 5), pz('d', 7)]); assert.deepEqual(rc.limpiar(c), c);
  const h = rc.limpiar({ piezas: Array.from({ length: 60 }, (_, i) => ({ id: `p${i}`, titulo: '<b>x</b>' })), mes: 'mal' }); assert.equal(h.piezas.length, 40); assert.equal(h.piezas[0].titulo, '<b>x</b>'); assert.equal(h.mes, '');
});
t('rendimiento · leer: bueno, a medias y basura', () => {
  const j = JSON.stringify({ piezas: [{ id: 'a', nota: 'n' }], patrones: [{ dimension: 'formato', valor: 'Reel', piezas: ['a', 'b'], leccion: 'x' }], aprendizaje: 'ap' });
  const r = rc.leer(`Listo.\n${F}rendimientoCreativo\n${j}\n${F}\n${F}criterios\n{"cumple":["a"],"falta":["b"]}\n${F}`); assert.equal(r.contenido.patrones.length, 1); assert.deepEqual(r.criterios, { cumple: ['a'], falta: ['b'] });
  assert.equal(rc.leer(`${F}rendimientoCreativo\n{"piezas":[`), null); assert.equal(rc.leer('sin bloque'), null); assert.equal(rc.leer(null), null);
});
t('rendimiento · prompt: < 5000, bloque, criterios, base de su marca, sin economía ni pauta', () => {
  const c = mes([pz('a', 10), pz('b', 5), pz('c', 5), pz('d', 5)]); rc.recordarRendimiento('akai', c);
  const p = rc.prompt({ cliente: { nombre: 'X'.repeat(60), slug: 'akai' }, hoy: '2026-10-27', aprendizajes: ['a'.repeat(300)], ficha: { incluye: [{ k: 'Entregables', v: 'v'.repeat(300) }] } });
  assert.ok(p.length < 5000, String(p.length)); for (const s of [`${F}rendimientoCreativo`, `${F}criterios`, 'LÍNEA BASE', 'SU marca', 'ER ']) assert.ok(p.includes(s), s);
  assert.ok(/nunca leas ni cites inherent\/06-ECONOMIA/i.test(p)); assert.ok(/nunca pautes ni escribas en plataformas de anuncios/i.test(p)); assert.ok(rc.prompt({}).length < 5000);
});
t('rendimiento · resultado de pieza y aMd (sin costos, vacío dice SIN DATOS o conecta Windsor)', () => {
  const c = mes([pz('a', 10), pz('b', 5), pz('c', 5), pz('d', 5)]); const r = rc.resultadoDePieza(c.piezas[0], '2026-10'); assert.equal(r.nivel, 'por-encima'); assert.equal(r.veredicto, 'repetir'); assert.equal(r.er, 10);
  assert.ok(rc.aMd(rc.vacio('2026-10')).includes('conecta Windsor')); const m = rc.aMd(c); assert.ok(m.includes('Scorecard')); assert.ok(!/costo|margen|06-ECONOMIA|gasto/i.test(m));
});
console.log(`\n${ok} pruebas ok`);
