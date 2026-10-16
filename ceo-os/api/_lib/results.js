// Resultados: los números de Inherent y de cada cliente, solo con datos reales.
// Lo que no tiene dato sale vacío con de dónde va a salir; nunca un cero inventado.
// Cada bloque pide ver su sección de origen (Comercial, Operaciones, Finanzas, Clientes) y respeta el alcance.
// Lo comparten la pantalla (GET /api/results) y el conector de Claude (herramienta «resultados»).
import * as db from './db.js';
import * as google from './google.js';
import * as content from './content.js';
import * as leads from './leads.js';
import { scoper, inScope } from './access.js';

const DAY = 864e5;
const iso = (d) => new Date(d).toISOString().slice(0, 10);
// La fecha de alta de un documento (la base la da como fecha o como texto, según el driver).
const bornAt = (x) => { const t = new Date(x?._meta?.created_at || x?.activity?.[0]?.at || NaN).getTime(); return Number.isFinite(t) ? t : null; };
const median = (l) => { if (!l.length) return null; const s = [...l].sort((a, z) => a - z), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
const lc = (x) => String(x || '').toLowerCase();

// Una tarea guarda el día en que se marcó «Hecha» (done_at): con eso se mide si se entregó a tiempo.
// Si vuelve a abrirse, la fecha se quita. Lo usan la API, el conector y el flujo de cotizaciones.
export function stampDone(prev, next) {
  if (!next || !('status' in next)) return next;
  if (next.status === 'Hecha') { if (!next.done_at) next.done_at = prev?.status === 'Hecha' && prev?.done_at ? prev.done_at : iso(Date.now()); }
  else if (next.status) next.done_at = null;
  return next;
}

// Las tareas: las mismas reglas de visibilidad que el resto de la app (Personal solo su dueño, «solo yo», alcance).
const seesTask = (u, t) => {
  if (t?.tipo === 'Personal') return lc(t._meta?.created_by || t.assignee) === u.email;
  const vis = t?.visibility || 'all'; if (vis === 'all') return true;
  return [t._meta?.created_by, t.assignee, ...(vis === 'people' ? [t.accountable, ...(Array.isArray(t.viewers) ? t.viewers : [])] : [])].filter(Boolean).map(lc).includes(u.email);
};

// El tiempo de respuesta de un lead que entró solo: del alta a la primera acción de alguien del equipo
// (lo que no es «Lead creado» ni «Volvió a entrar»). Los prospectos que salimos a buscar no cuentan.
function responseHours(l) {
  const born = bornAt(l); if (!born) return undefined;
  const first = (l.activity || []).slice(1).find((a) => a?.at && !/^(Lead creado|Volvió a entrar)/i.test(String(a.text || '')));
  if (!first) return null; // todavía sin respuesta
  const h = (Date.parse(first.at) - born) / 3600e3;
  return h >= 0 ? h : undefined;
}

// ---------- Comercial ----------
function comercial(all, from) {
  const real = all.filter((l) => !l.archived && (l.stage || 'Nuevo') !== 'Prospecto');
  const inP = real.filter((l) => { const b = bornAt(l); return b != null && iso(b) >= from; });
  const by = new Map();
  for (const l of inP) {
    const k = String(l.source || '').trim() || 'Sin fuente';
    const x = by.get(k) || by.set(k, { fuente: k, leads: 0, ganados: 0, perdidos: 0, abiertos: 0 }).get(k);
    x.leads++; if (l.stage === 'Ganado') x.ganados++; else if (l.stage === 'Perdido') x.perdidos++; else x.abiertos++;
  }
  const porFuente = [...by.values()].map((x) => ({ ...x, cierre_pct: pct(x.ganados, x.leads) })).sort((a, z) => z.leads - a.leads || z.ganados - a.ganados);
  const inbound = inP.filter((l) => l.direction !== 'out').map(responseHours).filter((h) => h !== undefined);
  const medidas = inbound.filter((h) => h != null);
  const pipeline = leads.OPEN.map((etapa) => { const l = real.filter((x) => (x.stage || 'Nuevo') === etapa); const v = l.filter((x) => +x.value_usd > 0); return { etapa, leads: l.length, valor_usd: v.reduce((a, x) => a + +x.value_usd, 0), con_valor: v.length }; });
  const lost = inP.filter((l) => l.stage === 'Perdido');
  const perdidas = leads.LOST.map((m) => ({ motivo: m, n: lost.filter((l) => l.lost_reason === m).length })).filter((x) => x.n);
  const sinMotivo = lost.filter((l) => !leads.LOST.includes(l.lost_reason)).length;
  return {
    leads: inP.length, ganados: inP.filter((l) => l.stage === 'Ganado').length, perdidos: lost.length,
    por_fuente: porFuente,
    respuesta: { mediana_horas: medidas.length ? Math.round(median(medidas) * 10) / 10 : null, medidos: medidas.length, sin_respuesta: inbound.length - medidas.length },
    pipeline, pipeline_total_usd: pipeline.reduce((a, x) => a + x.valor_usd, 0), pipeline_sin_valor: pipeline.reduce((a, x) => a + x.leads - x.con_valor, 0),
    perdidas: sinMotivo ? [...perdidas, { motivo: 'sin motivo', n: sinMotivo }] : perdidas,
  };
}

// ---------- Entregas ----------
function entregas(tasks, from) {
  const done = tasks.filter((t) => t.status === 'Hecha');
  const medibles = done.filter((t) => t.done_at && t.done_at >= from && t.due);
  const aTiempo = medibles.filter((t) => t.done_at <= t.due).length;
  const T = iso(Date.now());
  return {
    medidas: medibles.length, a_tiempo: aTiempo, tarde: medibles.length - aTiempo, a_tiempo_pct: pct(aTiempo, medibles.length),
    hechas_sin_fecha_limite: done.filter((t) => t.done_at && t.done_at >= from && !t.due).length,
    abiertas_atrasadas: tasks.filter((t) => t.status !== 'Hecha' && t.due && t.due < T).length,
  };
}

// ---------- Finanzas: los ingresos del mes (sin costos ni márgenes) ----------
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => String(x).trim()));
}
// La hoja de movimientos: las mismas columnas y reglas que la pantalla de Finanzas.
export function sheetEntries(csvText) {
  const [head = [], ...rows] = parseCsv(String(csvText || ''));
  const H = head.map((h) => String(h).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim());
  const at = (k) => H.findIndex((h) => h.startsWith(k));
  const [cF, cT, , cM] = ['fecha', 'tipo', 'concepto', 'monto'].map(at);
  const day = (v) => { v = String(v || '').trim(); let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); if (m) return `${m[3].length === 2 ? '20' + m[3] : m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; return ''; };
  return rows.map((r) => {
    const raw = Number(String(r[cM] ?? '').replace(/[^\d.-]/g, '')); const t = lc(r[cT]);
    const type = /ingres|entrad|cobr|venta|income/.test(t) ? 'ingreso' : /gast|salid|pag|egres|expense/.test(t) ? 'gasto' : raw < 0 ? 'gasto' : 'ingreso';
    return { date: day(r[cF]), type, amount: Math.abs(raw) || 0 };
  }).filter((e) => e.date && e.amount);
}
async function finanzas(u) {
  const month = iso(Date.now()).slice(0, 7), prev = (() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return iso(d).slice(0, 7); })();
  let entries = (await db.list('finance')).map((e) => ({ date: String(e.date || ''), type: e.type, amount: +e.amount || 0 }));
  let hoja = 'sin hoja';
  const url = (await db.get('settings', 'finance_sheet'))?.url || ''; const id = (String(url).match(/\/spreadsheets\/d\/([-\w]{20,})/) || [])[1];
  if (id) {
    try {
      const r = await fetch(`https://www.googleapis.com/drive/v3/files/${id}/export?mimeType=text/csv&supportsAllDrives=true`, { headers: { Authorization: 'Bearer ' + (await google.accessToken(u.email)) } });
      if (r.ok) { entries = [...entries, ...sheetEntries(await r.text())]; hoja = 'leída'; } else hoja = 'no se pudo leer';
    } catch { hoja = 'no se pudo leer'; }
  }
  const sum = (m) => entries.filter((e) => e.type === 'ingreso' && e.date.slice(0, 7) === m).reduce((a, e) => a + e.amount, 0);
  const n = entries.filter((e) => e.type === 'ingreso' && e.date.slice(0, 7) === month).length;
  return { mes: month, ingresos_q: n ? sum(month) : null, movimientos: n, mes_anterior: prev, ingresos_mes_anterior_q: entries.some((e) => e.type === 'ingreso' && e.date.slice(0, 7) === prev) ? sum(prev) : null, hoja };
}

// ---------- Clientes: sus metas (meta vs. real) y, a pedido, sus redes ----------
function clientes(accounts) {
  return accounts.map((a) => ({
    slug: a.slug || String(a.id).replace(/^acc-/, ''), nombre: a.name || a.slug || String(a.id).replace(/^acc-/, '').toUpperCase(),
    metas: (Array.isArray(a.goals) ? a.goals : (Array.isArray(a.roadmap) ? a.roadmap : []).map((x) => ({ goal: x.t, due: x.date, status: x.status }))).map((g) => ({ meta: g.goal || '', metrica: g.metric || '', base: g.baseline ?? '', actual: g.current ?? '', objetivo: g.target ?? '', vence: g.due || '', estado: { todo: 'Pendiente', now: 'En curso', done: 'Logrado' }[g.status] || g.status || '' })),
  })).sort((a, z) => a.nombre.localeCompare(z.nombre));
}
// Instagram de un cliente (Windsor): seguidores, alcance, vistas y engagement de 30 días. Lento: se pide por cliente.
export async function redes(slug) {
  if (!content.windsorOn()) return { conectado: false, de_donde: 'Windsor (Instagram): todavía no está conectado' };
  const p = (await content.profiles()).find((x) => x.slug === slug);
  if (!p) return { conectado: true, cuentas: [], de_donde: 'Las cuentas de Instagram del cliente en su LINKS.md o en Contenido → Fuentes' };
  const picked = (await content.cfg(slug)).ig_account;
  const hs = picked ? [picked] : (await content.profile(p)).own.filter((a) => a.red === 'instagram').map((a) => a.handle);
  if (!hs.length) return { conectado: true, cuentas: [], de_donde: 'Las cuentas de Instagram del cliente en su LINKS.md o en Contenido → Fuentes' };
  const ig = await content.instagram(hs, 30, slug);
  if (!ig.matched) return { conectado: true, cuentas: hs, de_donde: 'Windsor todavía no trae datos de esas cuentas' };
  return { conectado: true, cuentas: hs, dias: 30, seguidores: ig.followers || null, alcance: ig.reach || null, vistas: ig.views || null, engagement_pct: ig.er ?? null, posts: ig.posts ?? null };
}

// Todo junto, según lo que la persona ve. `dias`: 30, 90 o 365 (lo que entró o se entregó en ese periodo).
export async function compute(u, { dias = 90 } = {}) {
  const d = [30, 90, 365].includes(+dias) ? +dias : 90, from = iso(Date.now() - d * DAY);
  const sees = (a) => (u.areas || []).includes(a);
  const sc = await scoper(u);
  const out = { dias: d, desde: from, hoy: iso(Date.now()) };
  if (sees('sales')) out.comercial = comercial((await db.list('leads')).filter((l) => inScope(sc, 'leads', l)), from);
  if (sees('operations') || sees('work')) out.entregas = entregas((await db.list('tasks')).filter((t) => t.tipo !== 'Personal' && seesTask(u, t) && inScope(sc, 'tasks', t)), from);
  if (sees('finanzas')) out.finanzas = await finanzas(u);
  if (sees('clients')) out.clientes = clientes((await db.list('accounts')).filter((a) => inScope(sc, 'accounts', a)));
  return out;
}
