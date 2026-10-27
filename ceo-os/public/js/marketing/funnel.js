// Funnel Builder (herramienta funnel-builder de Marketing, solo Growth Partnership): el embudo TOF → MOF → captura → cierre → recompra, cada etapa
// con sus activos (piezas con etapaFunnel, landings de Tech, etapa del CRM) y su métrica, las barras de caída entre etapas y el plan de mejoras.
// Existe para que los números, las caídas, el pedido a la IA, la lectura de su respuesta y las reglas de aprobación vivan en un solo módulo puro
// (sin DOM ni red) que comparten la vista y las pruebas. Una métrica que falta es null con su fuente («⚠️ SIN DATOS: sale de…»), nunca 0.
import { plano, corta, numeroONull, leerHerramienta, contextoPrompt, celda, sinAcentos, SIN_DATOS } from '../consulting/marcos.js';
import { areaDe, deptDe, AREAS } from './reporte.js';
import { isPartnership } from '../levels.js';

export const BLOQUE = 'funnel';
export const MIN_MEJORAS = 1;
export const MAX_MEJORAS = 5;
const MAX_PROMPT = 4900;
// Las 5 etapas, de arriba a abajo. medida = lo que se cuenta en ella; sale_de = de dónde sale cuando falta.
export const ETAPAS = [
  { id: 'tof', nombre: 'TOF · Atención', medida: 'Alcance', sale_de: 'Windsor (el Instagram de la marca)' },
  { id: 'mof', nombre: 'MOF · Interés', medida: 'Interacciones', sale_de: 'Windsor (los posts de Instagram de la marca)' },
  { id: 'captura', nombre: 'Captura', medida: 'Leads', sale_de: 'el CRM (los leads que llevan a este cliente)' },
  { id: 'cierre', nombre: 'Cierre', medida: 'Clientes ganados', sale_de: 'el CRM (los leads en Ganado de este mes)' },
  { id: 'recompra', nombre: 'Recompra', medida: 'Clientes que repiten', sale_de: 'el historial de compras que comparte el cliente' },
];
export const ETAPA_IDS = ETAPAS.map((e) => e.id);
export const etapaDe = (id) => ETAPAS.find((e) => e.id === id) || null;
export const nombreEtapa = (id) => etapaDe(id)?.nombre || String(id || '');
const SINONIMOS = { tof: 'tof', atencion: 'tof', mof: 'mof', interes: 'mof', bof: 'captura', captura: 'captura', leads: 'captura', cierre: 'cierre', venta: 'cierre', ventas: 'cierre', recompra: 'recompra', retencion: 'recompra' };
// El id de una etapa, venga como venga escrita («TOF», «Cierre», «recompra»); '' si no es ninguna.
export const etapaId = (v) => SINONIMOS[sinAcentos(v).replace(/\s*[·-].*$/, '')] || '';
const fechaReal = (s) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s ?? ''))) return ''; const d = new Date(`${s}T12:00:00Z`); return d.toISOString().slice(0, 10) === s ? s : ''; };
const sd = (e, razon = '') => `${SIN_DATOS}: sale de ${e.sale_de}${razon ? ` · ${corta(razon, 160)}` : ''}`;

// ---------- Nivel: solo Growth Partnership ----------
// '' si el cliente puede usarlo; si no, la razón que se le muestra (el servidor ya lo rechaza: aquí solo se refleja).
export function motivoOculto(nivel) {
  const n = plano(nivel) ? nivel : {}, nombre = corta(n.nombre, 60);
  if (n.id === 'partnership' || isPartnership(nombre)) return '';
  return nombre ? `El Funnel Builder es del nivel Growth Partnership y este cliente está en ${nombre}.` : `${SIN_DATOS}: el nivel del cliente sale de su ficha de oferta (clients/<cliente>/00-onboarding/plan-contratado.md); el Funnel Builder es solo de Growth Partnership.`;
}

// ---------- El contenido ----------
export const vacio = () => ({ etapas: ETAPAS.map((e) => ({ id: e.id, valor: null, fuente: '', nota: '' })), mejoras: [] });

// Solo lo conocido, con su tipo y su tamaño. Las 5 etapas siempre, en orden; un valor con fuente «SIN DATOS» es null (nunca un 0 por un dato que falta).
export function limpiar(c) {
  const o = plano(c) ? c : {}, por = new Map();
  for (const x of Array.isArray(o.etapas) ? o.etapas : []) { const id = plano(x) ? etapaId(x.id) : ''; if (id && !por.has(id)) por.set(id, x); }
  const etapas = ETAPAS.map((e) => {
    const x = por.get(e.id) || {}, fuente = corta(x.fuente, 200);
    return { id: e.id, valor: /sin datos/i.test(fuente) ? null : numeroONull(x.valor, { min: 0 }), fuente, nota: corta(x.nota, 300) };
  });
  const mejoras = (Array.isArray(o.mejoras) ? o.mejoras : []).filter(plano).map((m) => ({ etapa: etapaId(m.etapa), accion: corta(m.accion, 240), area: areaDe(m.area), fecha: fechaReal(corta(m.fecha, 10)) }))
    .filter((m) => m.accion).slice(0, 8);
  return { etapas, mejoras };
}

// ---------- Las caídas ----------
// De cada etapa a la siguiente: pct = lo que se pierde (1 − siguiente / actual). Sin los dos números, null con su razón. Negativo = sube (las medidas son de distinta cosa).
export function caidas(contenido) {
  const c = limpiar(contenido), out = [];
  for (let i = 0; i < c.etapas.length - 1; i++) {
    const a = c.etapas[i], b = c.etapas[i + 1], de = etapaDe(a.id), hasta = etapaDe(b.id);
    const ok = a.valor !== null && b.valor !== null && a.valor > 0;
    out.push({ de: a.id, a: b.id, pct: ok ? Math.round((1 - b.valor / a.valor) * 100) : null,
      razon: ok ? '' : a.valor === 0 ? `${de.medida} en 0: no hay desde dónde medir` : `${SIN_DATOS}: falta ${a.valor === null ? de.medida : hasta.medida} (${a.valor === null ? de.sale_de : hasta.sale_de})` });
  }
  return out;
}
// El índice de la caída más grande (solo entre las que tienen número y pierden); null si ninguna.
export function mayorCaida(contenido) {
  const l = caidas(contenido); let mejor = null;
  l.forEach((x, i) => { if (x.pct !== null && x.pct > 0 && (mejor === null || x.pct > l[mejor].pct)) mejor = i; });
  return mejor;
}

// ---------- Armar las etapas con lo que ya existe en el OS ----------
// Los leads de este cliente: los que llevan su client_slug y los que entraron por una landing suya conectada al CRM. Sin prospectos (etapa «Prospecto»).
export function leadsDe(leads, sitios, slug) {
  const fuentes = new Set((Array.isArray(sitios) ? sitios : []).filter((s) => plano(s) && s.profile === slug && !s.archivado && s.intake?.fuente).map((s) => s.intake.fuente));
  return (Array.isArray(leads) ? leads : []).filter((l) => plano(l) && !l.archived && (l.stage || 'Nuevo') !== 'Prospecto' && (l.client_slug === slug || (l.source_id && fuentes.has(l.source_id))));
}
const mesDeLead = (l) => String(l?._meta?.created_at || '').slice(0, 7);
const cuenta = (l, f) => l.filter(f).length;
// insumos: { embudo: [{ etapa, valor, fuente }] (de marketing/<cliente>/kpis), piezas (de piezasDelMes), sitios (de tech), leads (null si no se pudo leer el CRM), slug, mes }.
// → [{ id, valor, fuente, activos: [{ tipo: 'pieza'|'landing'|'crm', texto }] }]
export function desdeDatos({ embudo = [], piezas = [], sitios = [], leads = null, slug = '', mes = '' } = {}) {
  const emb = (e) => (Array.isArray(embudo) ? embudo : []).find((x) => plano(x) && x.etapa === e) || null;
  const val = (e) => { const v = numeroONull(emb(e)?.valor, { min: 0 }); return v; };
  const fuenteEmb = (e, def, v) => { const f = corta(emb(e)?.fuente, 200); return v === null ? (f.startsWith(SIN_DATOS) ? f : def) : f || def; };
  const ps = (Array.isArray(piezas) ? piezas : []).filter(plano), landings = (Array.isArray(sitios) ? sitios : []).filter((s) => plano(s) && s.kind === 'sitio' && s.profile === slug && !s.archivado && s.tipo === 'Landing');
  const delCliente = leads === null ? null : leadsDe(leads, sitios, slug), delMes = delCliente && /^\d{4}-\d{2}$/.test(mes) ? delCliente.filter((l) => mesDeLead(l) === mes) : delCliente;
  const piezasEn = (e) => { const l = ps.filter((p) => p.etapa === e); return l.length ? [{ tipo: 'pieza', texto: `${l.length} ${l.length === 1 ? 'pieza' : 'piezas'} ${e} (${cuenta(l, (p) => p.publicada)} publicadas)` }] : [{ tipo: 'pieza', texto: `${SIN_DATOS}: ninguna pieza del mes tiene nivel de consciencia ${e} (sale del calendario de contenido)` }]; };
  const sinNivel = cuenta(ps, (p) => !p.etapa);
  const landingsAct = landings.length ? landings.map((s) => ({ tipo: 'landing', texto: `${corta(s.nombre, 80) || 'Landing'} · ${s.estado || 'sin estado'} · ${s.intake?.key ? 'conectada al CRM' : 'sin conectar al CRM'}` })) : [{ tipo: 'landing', texto: `${SIN_DATOS}: no hay landings de esta marca (salen de Funnel Builder › Sitios y landings)` }];
  const crmEn = (etapas) => (delMes === null ? [{ tipo: 'crm', texto: `${SIN_DATOS}: no pude leer el CRM` }] : etapas.map((s) => ({ tipo: 'crm', texto: `${cuenta(delMes, (l) => (l.stage || 'Nuevo') === s)} en ${s}` })));
  const ganados = delMes === null ? null : cuenta(delMes, (l) => (l.stage || 'Nuevo') === 'Ganado');
  const captura = val('BOF');
  const valores = { tof: val('TOF'), mof: val('MOF'), captura, cierre: ganados, recompra: null };
  const fuentes = {
    tof: fuenteEmb('TOF', sd(ETAPAS[0]), valores.tof),
    mof: fuenteEmb('MOF', sd(ETAPAS[1]), valores.mof),
    captura: fuenteEmb('BOF', sd(ETAPAS[2]), captura),
    cierre: ganados === null ? sd(ETAPAS[3], 'no pude leer el CRM') : 'CRM de Inherent OS',
    recompra: sd(ETAPAS[4]),
  };
  const activos = { tof: piezasEn('TOF'), mof: piezasEn('MOF'), captura: [...piezasEn('BOF'), ...landingsAct, ...crmEn(['Nuevo', 'Contactado'])], cierre: crmEn(['Reunión', 'Propuesta', 'Ganado']), recompra: [{ tipo: 'crm', texto: `${SIN_DATOS}: la recompra sale del historial de compras del cliente` }] };
  if (sinNivel) activos.tof.push({ tipo: 'pieza', texto: `${sinNivel} ${sinNivel === 1 ? 'pieza' : 'piezas'} del mes sin nivel de consciencia: no cuentan en ninguna etapa` });
  return ETAPAS.map((e) => ({ id: e.id, valor: valores[e.id], fuente: fuentes[e.id], activos: activos[e.id] }));
}

// ---------- Lo que falta (bloquea aprobar) ----------
export function faltas(contenido, extra = {}) {
  const c = limpiar(contenido), f = [];
  if (c.etapas.every((e) => e.valor === null)) f.push('Ninguna etapa tiene dato: conecta Windsor y el CRM, y usa los números de arriba');
  for (const e of c.etapas) if (e.valor !== null && !e.fuente) f.push(`«${nombreEtapa(e.id)}» tiene número sin fuente: sin fuente va ${SIN_DATOS}`);
  const n = c.mejoras.length;
  if (n < MIN_MEJORAS || n > MAX_MEJORAS) f.push(`Debe haber de ${MIN_MEJORAS} a ${MAX_MEJORAS} mejoras (hay ${n})`);
  c.mejoras.forEach((m, i) => {
    if (!m.etapa) f.push(`La mejora ${i + 1} no dice a qué etapa del embudo pertenece`);
    if (!m.area) f.push(`La mejora ${i + 1} no dice qué área la hace`);
  });
  return f;
}

// ---------- De las mejoras a tareas ----------
export function tareasDe(contenido) {
  const c = limpiar(contenido), vistas = new Set(), out = [];
  for (const m of c.mejoras) {
    const fila = `mej-${m.etapa || 'x'}-${sinAcentos(m.accion).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)}`;
    if (vistas.has(fila)) continue;
    vistas.add(fila);
    out.push({ title: m.accion, due: m.fecha, dept: deptDe(m.area), fila, por_que: `Funnel Builder: ${m.etapa ? nombreEtapa(m.etapa) : 'embudo'}`, assignee: '' });
  }
  return out.slice(0, 12);
}

// ---------- Con la respuesta de la IA ----------
// Los números del embudo nunca salen del modelo: son lo que midió el OS (lo que ya estaba en pantalla). De la IA solo entran las notas y las mejoras.
export function alUsar(nuevo, actual) {
  const n = limpiar(nuevo), a = limpiar(actual);
  return { ...n, etapas: n.etapas.map((e, i) => ({ ...a.etapas[i], nota: e.nota || a.etapas[i].nota })) };
}

// ---------- El pedido a la IA (< 5 000 caracteres) ----------
const F = '```';
const VISTOS = new Map(); // slug → etapas leídas por la vista (el contexto de armarCtx no trae el embudo)
export function recordarFunnel(slug, etapas) {
  const k = String(slug ?? '').slice(0, 60); if (!k) return;
  if (VISTOS.size > 50) VISTOS.clear();
  VISTOS.set(k, (Array.isArray(etapas) ? etapas : []).filter(plano).slice(0, 5).map((e) => ({ id: etapaId(e.id), valor: numeroONull(e.valor, { min: 0 }), fuente: corta(e.fuente, 120) })));
}
export function prompt(ctx) {
  const c = plano(ctx) ? ctx : {}, cli = plano(c.cliente) ? c.cliente : {}, nombre = corta(cli.nombre, 80) || 'el cliente';
  const et = (Array.isArray(c.etapas) && c.etapas.length ? c.etapas : VISTOS.get(String(cli.slug ?? '')) || []).filter(plano);
  const lineas = ETAPAS.map((e) => { const x = et.find((y) => etapaId(y.id) === e.id), v = numeroONull(x?.valor, { min: 0 }); return `- ${e.id} (${e.nombre}, ${e.medida}): ${v === null ? `null · ${SIN_DATOS}: sale de ${e.sale_de}` : `${v} · ${corta(x?.fuente, 100) || '—'}`}`; }).join('\n');
  const caida = caidas({ etapas: ETAPAS.map((e) => ({ id: e.id, valor: et.find((y) => etapaId(y.id) === e.id)?.valor ?? null })) }).filter((x) => x.pct !== null).map((x) => `${x.de}→${x.a} ${x.pct}%`).join(' · ');
  const intro = `Eres ③ Marketing de Inherent. Lee el EMBUDO de «${nombre}» (TOF, MOF, captura, cierre y recompra) y propón de ${MIN_MEJORAS} a ${MAX_MEJORAS} mejoras que ataquen la caída más grande.`;
  const reglas = [
    'REGLAS (no se negocian):',
    '- Los números los mide el OS: no los cambies, no los estimes ni los inventes. Dato que falta: ⚠️ SIN DATOS con de dónde saldría y a quién se le pide. Nunca 0 por un dato que falta.',
    '- Cada mejora dice a qué etapa pertenece (tof, mof, captura, cierre o recompra), qué se hace, qué área la hace y una fecha AAAA-MM-DD. Una caída sin número no se «arregla»: se pide el dato.',
    '- Si la caída fuerte está en captura → cierre, el problema no es más tráfico: es seguimiento, oferta o camino de compra. Una sola prioridad a la vez.',
    '- Un cambio de pauta es una tarea para ⑩ Ads o el OK del CEO: tú no lo haces. Nunca escribas en plataformas de anuncios.',
    '- Nunca leas ni cites inherent/06-ECONOMIA.md, costos de Inherent ni datos de otro cliente. Roles, no nombres de personas. Español de «tú», corto y humano.',
  ].join('\n');
  const datos = [`EMBUDO (los mide el OS; ids de etapa: ${ETAPA_IDS.join(', ')}):`, lineas, caida ? `Caídas: ${caida}` : `Caídas: ${SIN_DATOS}: faltan números en etapas seguidas`].join('\n');
  const areas = `Áreas: ${AREAS.map(([, n]) => n).join(', ')}.`;
  const salida = [
    'Contesta con un resumen corto y termina con estos dos bloques (el OS los lee):',
    `${F}${BLOQUE}`,
    '{"etapas":[{"id":"captura","nota":"qué pasa en esta etapa"}],"mejoras":[{"etapa":"captura","accion":"…","area":"Marketing","fecha":"2026-11-03"}]}',
    F,
    `${F}criterios`,
    '{"entregable":"Funnel Builder","cumple":["…"],"falta":["… — por qué"]}',
    F,
  ].join('\n');
  const fijo = [intro, '', reglas, '', datos, areas, '', salida].join('\n');
  const ctxTxt = contextoPrompt(c, Math.max(120, MAX_PROMPT - fijo.length - 2));
  return [intro, '', reglas, '', ctxTxt, '', datos, areas, '', salida].join('\n');
}
// Lo que contesta la IA → { contenido, criterios } | null (JSON roto, bloque a medias o sin bloque).
export const leer = (texto) => leerHerramienta(texto, BLOQUE, limpiar);

// ---------- Exportar ----------
export function aMd(contenido) {
  const c = limpiar(contenido), cs = caidas(c);
  const L = ['# Funnel Builder', '', '## El embudo', '', '| Etapa | Medida | Valor | Fuente |', '|---|---|---|---|'];
  for (const e of c.etapas) { const d = etapaDe(e.id); L.push(`| ${celda(d.nombre)} | ${celda(d.medida)} | ${e.valor === null ? SIN_DATOS : e.valor} | ${celda(e.fuente || sd(d))} |`); }
  L.push('', '## Caídas entre etapas', '');
  for (const x of cs) L.push(`- ${nombreEtapa(x.de)} → ${nombreEtapa(x.a)}: ${x.pct === null ? x.razon : x.pct >= 0 ? `se pierde el ${x.pct}%` : `sube ${Math.abs(x.pct)}% (medidas de distinta cosa)`}`);
  const notas = c.etapas.filter((e) => e.nota);
  if (notas.length) L.push('', '## Qué pasa en cada etapa', '', ...notas.map((e) => `- **${nombreEtapa(e.id)}**: ${e.nota}`));
  L.push('', '## Plan de mejoras', '');
  if (c.mejoras.length) L.push('| Etapa | Mejora | Área | Fecha |', '|---|---|---|---|', ...c.mejoras.map((m) => `| ${celda(m.etapa ? nombreEtapa(m.etapa) : '—')} | ${celda(m.accion)} | ${celda(m.area) || '—'} | ${m.fecha || '—'} |`));
  else L.push(`${SIN_DATOS}: faltan las mejoras.`);
  return L.join('\n');
}
