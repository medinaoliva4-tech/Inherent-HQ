// El portal del cliente «como el dashboard»: lo que se calcula para GET /api/portal y la aprobación de piezas.
// Todo sale de datos reales. Lo que no existe sale null y, en `falta`, una línea que dice qué conectar: nunca un número inventado.
// Alcance: solo lo del cliente que pregunta. Aquí no entra ningún costo, hora, margen ni dato de otro cliente.
import * as db from './db.js';
import { DEPTS } from '../../public/js/cycle.js';
import { estadoDe, conEstado, fechaPublicado } from '../../public/js/element.js';
import { COLL_V, comentariosVisibles, limpiarVersiones } from '../../public/js/video.js';
import * as video from './video.js';

const DAY = 864e5;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const shift = (d, n) => iso(Date.parse(d + 'T12:00:00Z') + n * DAY);
// El cambio contra el periodo anterior, en %. Sin anterior (o en cero) no hay cambio que mostrar.
const pct = (cur, prev) => (cur != null && prev != null && prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);
const kpi = (valor, prev, extra = {}) => ({ valor, prev: prev ?? null, pct: pct(valor, prev), ...extra });
const bornAt = (x) => { const t = Date.parse(x?._meta?.created_at || x?.activity?.[0]?.at || ''); return Number.isFinite(t) ? iso(t) : null; };
const DEPT_NAME = Object.fromEntries(DEPTS);
const deptLabel = (d) => { const s = String(d || '').trim(); if (!s) return ''; const hit = [...DEPTS].sort((a, z) => z[0].length - a[0].length).find(([n]) => s === n || s.startsWith(n + ' ')); return hit ? `${hit[0]} ${DEPT_NAME[hit[0]]}` : s; };

// ---------- Instagram: alcance y seguidores, este periodo y el anterior ----------
// Una sola lectura de Windsor (90 días): 30 de ahora + 30 anteriores. Sin Windsor, sin cuentas o si falla: null.
export async function ig(handles, T) {
  const key = process.env.WINDSOR_API_KEY?.trim();
  if (!key || !handles?.length) return null;
  let rows;
  try {
    const r = await fetch(`https://connectors.windsor.ai/instagram?api_key=${encodeURIComponent(key)}&date_preset=last_90d&fields=account_name,date,followers_count,reach`);
    if (!r.ok) return null;
    const j = await r.json(); rows = Array.isArray(j) ? j : j.data || [];
  } catch { return null; }
  const hs = handles.map((h) => String(h).replace(/^@/, '').toLowerCase());
  const nameOf = (x) => String(x.account_name || x.username || x.user_name || '').replace(/^@/, '').toLowerCase();
  const mine = rows.filter((x) => x.date && hs.includes(nameOf(x)));
  if (!mine.length) return null;
  const day = (x) => String(x.date).slice(0, 10), n = (v) => (Number.isFinite(+v) ? +v : 0);
  const c0 = shift(T, -29), p0 = shift(T, -59), p1 = shift(T, -30);
  const within = (a, b) => mine.filter((x) => day(x) >= a && day(x) <= b && x.reach != null && x.reach !== '');
  const total = (a, b) => { const l = within(a, b); return l.length ? l.reduce((s, x) => s + n(x.reach), 0) : null; };
  // Seguidores nuevos = el último dato de la ventana menos el último dato anterior a ella (o el primero de la ventana).
  const gain = (a, b) => {
    let sum = 0, seen = false;
    for (const h of hs) {
      const pts = mine.filter((x) => nameOf(x) === h && x.followers_count != null && x.followers_count !== '').sort((x, z) => day(x).localeCompare(day(z)));
      const inW = pts.filter((x) => day(x) >= a && day(x) <= b), before = pts.filter((x) => day(x) < a).at(-1);
      if (!inW.length || (!before && inW.length < 2)) continue;
      sum += n(inW.at(-1).followers_count) - n((before || inW[0]).followers_count); seen = true;
    }
    return seen ? sum : null;
  };
  const now = hs.reduce((s, h) => { const p = mine.filter((x) => nameOf(x) === h && day(x) <= T && x.followers_count != null && x.followers_count !== '').sort((x, z) => day(x).localeCompare(day(z))).at(-1); return s + (p ? n(p.followers_count) : 0); }, 0);
  const byDay = {}; for (const x of within(c0, T)) byDay[day(x)] = (byDay[day(x)] || 0) + n(x.reach);
  return { reach: total(c0, T), reachPrev: total(p0, p1), gain: gain(c0, T), gainPrev: gain(p0, p1), followers: now || null, serie: byDay };
}

// ---------- Las piezas de contenido del cliente (lo que ve en «Contenido») ----------
// El estado sale de estadoDe (element.js). «Por aprobar» = En proceso Y con la bandera `por_aprobar` que enciende el equipo
// («Enviar a aprobación»): el cliente nunca aprueba lo que sigue en producción. Su OK la pasa a «Listo» (programada).
export const piezas = (posts, slug, T) => posts
  .filter((x) => x.kind === 'post' && x.profile === slug && x.date && x.date >= shift(T, -30))
  .map((x) => ({ id: x.id, title: x.title, format: x.format || 'Pieza', date: x.date, status: x.status || 'Idea', estado: estadoDe(x), por_aprobar: x.por_aprobar === true && estadoDe(x) === 'En proceso', pillar: x.pillar || '',
    ...(/^https:\/\//.test(x.url || '') ? { url: x.url } : {}),
    // Lo que el cliente ya respondió (su decisión y su nota), nunca el historial interno.
    ...(x.aprobacion?.estado ? { cliente: x.aprobacion.estado, nota: String(x.aprobacion.nota || '').slice(0, 1000) } : {}) }))
  .sort((a, z) => a.date.localeCompare(z.date));

// ---------- Las metas: avance de cada una, actual contra objetivo ----------
const num = (v) => parseFloat(String(v ?? '').replace(/[^\d.-]/g, ''));
export const metas = (goals) => (goals || []).map((g) => {
  const b = num(g.baseline) || 0, t = num(g.target), c = num(g.current);
  const avance = g.status === 'done' ? 100 : Number.isFinite(t) && Number.isFinite(c) && t !== b ? Math.max(0, Math.min(100, Math.round(((c - b) / (t - b)) * 100))) : null;
  return { goal: g.goal, metric: g.metric, baseline: g.baseline, current: g.current, target: g.target, due: g.due, status: g.status, avance, checks: (g.checks || []).map(({ date, done, value }) => ({ date, done, value })) };
});

// ---------- Entregas: esta semana, por departamento, y la presentación del día 20 ----------
export function entregas(ps, pt, T) {
  const dow = new Date(T + 'T12:00:00Z').getUTCDay(), mon = shift(T, -((dow + 6) % 7)), sun = shift(mon, 6);
  const inWeek = (t) => (t.due && t.due >= mon && t.due <= sun) || (t.done_at && t.done_at >= mon && t.done_at <= sun);
  const semana = [];
  for (const x of ps) {
    const ts = pt(x.id).filter((t) => !['Interna', 'Comercial'].includes(t.tipo));
    const groups = new Map();
    for (const t of ts) {
      const sv = (x.services || []).find((s) => String(t.title).startsWith(s.name + ' ·'));
      const k = sv ? 'sv:' + sv.name : 't:' + t.id;
      const g = groups.get(k) || groups.set(k, { sv: Boolean(sv), title: sv ? sv.name : String(t.title).replace(/\s·\s[^·]+\(\d+(\.\d+)? h\)$/, ''), all: [], week: [] }).get(k);
      g.all.push(t); if (inWeek(t)) g.week.push(t);
    }
    for (const g of groups.values()) {
      if (!g.week.length) continue;
      const done = (l) => l.every((t) => t.status === 'Hecha'), moving = (l) => l.some((t) => ['En curso', 'En revisión', 'Hecha'].includes(t.status));
      const estado = g.sv ? (done(g.all) ? 'Entregado' : moving(g.all) ? 'En curso' : 'Por empezar') : done(g.week) ? 'Hecho' : moving(g.week) ? 'En curso' : 'Por empezar';
      semana.push({ title: g.title, dept: g.sv ? '' : deptLabel(g.week[0].dept), estado, due: g.week.map((t) => t.due).filter(Boolean).sort().at(-1) || null });
    }
  }
  const orden = { 'En curso': 0, 'Por empezar': 1, Entregado: 2, Hecho: 2 };
  semana.sort((a, z) => (orden[a.estado] - orden[z.estado]) || String(a.due || '').localeCompare(String(z.due || '')) || a.title.localeCompare(z.title));
  // La presentación al cliente (día 20): la reunión de ese nombre; si todavía no existe, la que marca el calendario del ciclo.
  const pres = ps.flatMap((x) => (x.meetings || []).filter((m) => (m.who || []).includes('cliente') && /presentaci[oó]n/i.test(m.name || '')))
    .sort((a, z) => String(a.date).localeCompare(String(z.date)));
  const next = pres.find((m) => m.status !== 'hecha') || pres.at(-1);
  const est = (m) => (m.status === 'hecha' ? 'Hecho' : m.status === 'agendada' ? 'Agendada' : 'Por agendar');
  let presentacion = null;
  if (next) presentacion = { name: next.name, date: next.date, estado: est(next) };
  else if (ps.length) { const [y, m, d] = T.split('-').map(Number), mm = d <= 20 ? m : m + 1; presentacion = { name: 'Presentación del ciclo', date: `${y + (mm > 12 ? 1 : 0)}-${String(((mm - 1) % 12) + 1).padStart(2, '0')}-20`, estado: 'Por agendar', ciclo: true }; }
  return { desde: mon, hasta: sun, semana, presentacion };
}

// ---------- Resumen: los 5 indicadores, la gráfica de 30 días y los leads por fuente ----------
// `leads` son TODOS los leads del CRM; solo cuentan los que llevan el client_slug de este cliente.
export function resumen({ slug, T, posts, leads, meetings, analytics, ig: ign }) {
  const c0 = shift(T, -29), p0 = shift(T, -59), p1 = shift(T, -30);
  const falta = {};
  const inC = (d) => d && d >= c0 && d <= T, inP = (d) => d && d >= p0 && d <= p1;
  // Alcance y seguidores nuevos (Instagram vía Windsor)
  let alcance = null, seguidores = null, igSerie = {};
  if (ign?.reach != null) { alcance = kpi(ign.reach, ign.reachPrev); igSerie = ign.serie; }
  else if (analytics?.series?.length) { alcance = kpi(analytics.reach, null); igSerie = Object.fromEntries(analytics.series.map((x) => [x.date, x.reach])); }
  else falta.alcance = 'Falta conectar tu Instagram';
  if (ign?.gain != null) seguidores = kpi(ign.gain, ign.gainPrev, { total: ign.followers });
  else falta.seguidores = analytics ? 'Falta el historial de seguidores de tu Instagram' : 'Falta conectar tu Instagram';
  // Leads (CRM): solo los que llevan el cliente. Sin ninguno, el CRM de este cliente no está conectado.
  const mine = leads.filter((l) => l.client_slug === slug && !l.archived && (l.stage || 'Nuevo') !== 'Prospecto');
  const conectado = leads.some((l) => l.client_slug === slug);
  let leadsK = null, fuentes = null;
  const leadsDay = {};
  if (conectado) {
    const dated = mine.map((l) => ({ l, d: bornAt(l) }));
    const cur = dated.filter((x) => inC(x.d)), prev = dated.filter((x) => inP(x.d));
    leadsK = kpi(cur.length, prev.length);
    for (const x of cur) leadsDay[x.d] = (leadsDay[x.d] || 0) + 1;
    const by = new Map(); for (const x of cur) { const k = String(x.l.source || '').trim() || 'Sin fuente'; by.set(k, (by.get(k) || 0) + 1); }
    fuentes = [...by].map(([fuente, n]) => ({ fuente, n })).sort((a, z) => z.n - a.n || a.fuente.localeCompare(z.fuente)).slice(0, 6);
  } else falta.leads = 'Falta conectar tu CRM';
  // Reuniones con el cliente (hechas)
  let reuniones = null;
  if (meetings.length) { const h = meetings.filter((m) => m.status === 'hecha'); reuniones = kpi(h.filter((m) => inC(m.date)).length, h.filter((m) => inP(m.date)).length); }
  else falta.reuniones = 'Aún no hay reuniones registradas';
  // Piezas publicadas (y qué parte salió a tiempo: publicada en o antes de su fecha)
  const pub = posts.filter((x) => x.kind === 'post' && x.profile === slug && estadoDe(x) === 'Publicado' && inC(fechaPublicado(x)));
  const medibles = pub.filter((x) => x.published_at && x.date);
  const piezasK = { valor: pub.length, aTiempo: medibles.length ? Math.round((medibles.filter((x) => x.published_at <= x.date).length / medibles.length) * 100) : null };
  const serie = Array.from({ length: 30 }, (_, i) => { const date = shift(c0, i); return { date, alcance: date in igSerie ? igSerie[date] : null, leads: conectado ? leadsDay[date] || 0 : null }; });
  return { dias: 30, desde: c0, hasta: T, alcance, seguidores, leads: leadsK, reuniones, piezas: piezasK, serie, fuentes, falta };
}

// ---------- El cliente aprueba o pide cambios (solo en su propio slug) ----------
// Solo piezas «Por aprobar» (En proceso con `por_aprobar: true`) de SU marca. Aprobar la deja «Listo» (programada); pedir cambios la
// deja donde está, con su nota. En los dos casos la bandera se apaga. Todo queda en el historial de la pieza (`feedback`, que solo crece).
const err = (m, status) => Object.assign(new Error(m), { status });
export async function decidir(u, slug, id, b) {
  const accion = b?.accion === 'aprobar' ? 'aprobar' : b?.accion === 'cambios' ? 'cambios' : null;
  if (!accion) throw err('Elige aprobar o pedir cambios', 400);
  const nota = String(b?.nota ?? '').trim().slice(0, 1000);
  if (accion === 'cambios' && !nota) throw err('Cuéntanos qué cambiar', 400);
  if (!/^[\w.@+-]{3,120}$/.test(String(id || ''))) throw err('No existe', 404);
  const cur = await db.get('content', String(id));
  if (!cur || cur.kind !== 'post' || cur.profile !== slug) throw err('No existe', 404);
  if (estadoDe(cur) !== 'En proceso' || cur.por_aprobar !== true) throw err('Esta pieza ya no está por aprobar', 409);
  const at = new Date().toISOString();
  const rec = { at, by: u.email, name: u.name || '', accion, nota };
  const { por_aprobar, ...base } = cur;
  const next = { ...(accion === 'aprobar' ? conEstado(base, 'Listo') : base), aprobacion: { estado: accion === 'aprobar' ? 'aprobada' : 'cambios', at, by: u.email, nota }, feedback: [...(Array.isArray(cur.feedback) ? cur.feedback : []), rec].slice(-50) };
  const saved = await db.update('content', cur.id, next, cur.v, u.email);
  if (!saved) throw err('La pieza cambió mientras la veías. Ábrela de nuevo', 409);
  return { ok: true, id: cur.id, estado: estadoDe(saved), cliente: saved.aprobacion.estado };
}

// ---------- Videos en revisión (Review & Approval Studio, lado del cliente) ----------
// El cliente ve SOLO los videos de su marca que el equipo mandó a revisión, con sus versiones (link, nota) y los comentarios que no son
// internos. Nunca ve QA, cortes, notas de edición ni comentarios internos. Comenta (interno siempre false) y aprueba o pide cambios por
// las mismas funciones del equipo (video.js · comentar / revisar), que ya limitan la ficha a la marca del cliente.
const enRevision = (f) => f.kind === 'ficha' && !f.archivado && (f.revision === 'Pendiente' || f.estado === 'En revisión');
const publica = (f, post) => {
  const versiones = limpiarVersiones(f.versiones).map(({ v, link, nota, en }) => ({ v, link, nota, en }));
  const vigente = Math.max(+f.version || 1, ...versiones.map((x) => x.v));
  return { id: f.id, titulo: f.titulo, formato: f.formato, version: vigente, versiones, rondas: Math.max(0, versiones.length - 1), revision: f.revision || '',
    aprobacion: f.aprobacion ? { v: f.aprobacion.v, en: f.aprobacion.en } : null, comentarios: comentariosVisibles(f, true).map(({ id, seg, texto, por, en, version }) => ({ id, seg, texto, por, en, version })),
    caption: String(post?.caption || '').slice(0, 2200) };
};
export async function videos(slug) {
  const fs = (await db.list(COLL_V)).filter((f) => f.profile === slug && enRevision(f));
  const out = [];
  for (const f of fs) out.push(publica(f, f.post ? await db.get('content', f.post).catch(() => null) : null));
  return out.sort((a, z) => String(a.titulo).localeCompare(String(z.titulo)));
}
// Rutas del cliente. Solo el cliente actúa (con SU client_slug); el equipo que mira «como cliente» solo lee. Pedir lo interno es 403.
// on/guard/body/slugOk son los de api/index.js: se montan con portal.rutasVideo({ on, guard, body, slugOk }).
export function rutasVideo({ on, guard, body, slugOk }) {
  const quien = async (req, res, actua) => {
    const u = await guard(req, res, 'portal', { client: true }); if (!u) return null;
    if (/^(1|true|si)$/i.test(String(req.query.interno || ''))) { res.status(403).json({ error: 'Eso es interno del equipo' }); return null; }
    if (actua && u.role !== 'client') { res.status(403).json({ error: 'Solo el cliente revisa sus videos' }); return null; }
    const slug = u.role === 'client' ? u.client_slug : String(req.query.slug || '');
    if (!slugOk(slug)) { res.status(400).json({ error: 'Cliente inválido' }); return null; }
    return { u, slug };
  };
  const responde = (res, r) => (r.error ? res.status(r.status || 400).json({ error: r.error }) : res.json({ ok: true, id: r.doc?.id, revision: r.doc?.revision || '' }));
  on('GET', 'portal/videos', async (req, res) => { const q = await quien(req, res, false); if (q) res.json(await videos(q.slug)); });
  on('POST', 'portal/videos/:id/comentarios', async (req, res) => {
    const q = await quien(req, res, true); if (!q) return;
    const b = body(req); responde(res, await video.comentar(q.u, req.params.id, { texto: b.texto, seg: b.seg, version: b.version, interno: false }));
  });
  on('POST', 'portal/videos/:id/revision', async (req, res) => {
    const q = await quien(req, res, true); if (!q) return;
    const b = body(req); responde(res, await video.revisar(q.u, req.params.id, { accion: b.accion, nota: b.nota, version: b.version }));
  });
}
