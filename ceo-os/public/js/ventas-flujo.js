// El flujo de atención y cierre de Ventas. La regla de Inherent: al primer contacto se responde en un minuto;
// luego se entiende el caso, se ve lo que está en juego y entonces se da el precio, con el alcance delante.
// Solo funciones puras: las usan Ventas, Hoy y el servidor (leads.js), y se prueban sin navegador.

// ---------- Las etapas ----------
// Se guardan con su nombre de siempre (Contactado, Reunión, Propuesta) para no romper datos viejos, Control ni el conector;
// en pantalla se leen con el nombre del flujo. Los nombres nuevos también se aceptan al guardar (alias).
export const STORED = ['Prospecto', 'Nuevo', 'Contactado', 'Reunión', 'Propuesta', 'Ganado', 'Perdido'];
export const LABELS = { Prospecto: 'Prospecto', Nuevo: 'Nuevo', Contactado: 'Respondido', Reunión: 'Entendiendo el caso', Propuesta: 'Propuesta con alcance', Ganado: 'Ganado', Perdido: 'Perdido' };
const ALIAS = { respondido: 'Contactado', 'entendiendo el caso': 'Reunión', diagnóstico: 'Reunión', diagnostico: 'Reunión', 'propuesta con alcance': 'Propuesta' };
for (const k of STORED) ALIAS[k.toLowerCase()] = k;
ALIAS.reunion = 'Reunión';
export const STAGE_ALIAS = ALIAS;
// Lo que se acepta como etapa al guardar: las de siempre y los nombres del flujo.
export const STAGE_INPUTS = [...STORED, 'Respondido', 'Entendiendo el caso', 'Propuesta con alcance'];
// Etapa guardada (o la misma, si no se reconoce: el candado del servidor la rechaza).
export const stageKey = (s) => { const t = String(s ?? '').trim(); return t ? ALIAS[t.toLowerCase()] || t : ''; };
export const stageLabel = (s) => LABELS[stageKey(s) || 'Nuevo'] || String(s);

// La tira del cierre: cinco pasos, cada uno con lo que toca hacer ahí.
export const FLOW = [
  { id: 'nuevo', keys: ['Nuevo'], label: 'Nuevo', step: 'Responder en un minuto' },
  { id: 'respondido', keys: ['Contactado'], label: 'Respondido', step: 'Entender el caso' },
  { id: 'caso', keys: ['Reunión'], label: 'Entendiendo el caso', hint: 'Diagnóstico', step: 'Dar el precio con el alcance delante' },
  { id: 'propuesta', keys: ['Propuesta'], label: 'Propuesta con alcance', step: 'Cerrar o dar seguimiento' },
  { id: 'cierre', keys: ['Ganado', 'Perdido'], label: 'Ganado / Perdido', step: 'Arrancar el proyecto o anotar el motivo' },
];
export const flowIndex = (s) => FLOW.findIndex((f) => f.keys.includes(stageKey(s) || 'Nuevo'));
const OPEN = ['Nuevo', 'Contactado', 'Reunión', 'Propuesta'];
// Lo que se propone como siguiente paso al responder por primera vez.
export const AFTER_REPLY = 'Entender el caso';

// ---------- El cronómetro del primer contacto ----------
const ms = (x) => { const t = x == null || x === '' ? NaN : typeof x === 'number' ? x : Date.parse(x); return Number.isFinite(t) ? t : null; };
// Cuándo entró: el alta del documento (o la primera línea del historial).
export const createdAt = (l) => ms(l?.created_at) ?? ms(l?._meta?.created_at) ?? ms(l?.activity?.[0]?.at);
// La primera respuesta: first_reply_at; en leads viejos, la primera acción de alguien del equipo en el historial
// (lo que no es «Lead creado» ni «Volvió a entrar»), igual que Indicadores.
export function firstReplyAt(l) {
  const own = ms(l?.first_reply_at); if (own != null) return own;
  const a = (Array.isArray(l?.activity) ? l.activity : []).slice(1).find((x) => x?.at && !/^(Lead creado|Volvió a entrar)/i.test(String(x.text || '')));
  return a ? ms(a.at) : null;
}
// Espera respuesta: lead nuevo que entró solo (no lo salimos a buscar), sin archivar y sin respuesta.
export const isWaiting = (l) => Boolean(l) && (stageKey(l.stage) || 'Nuevo') === 'Nuevo' && l.direction !== 'out' && !l.archived && createdAt(l) != null && firstReplyAt(l) == null;
export const waitMs = (l, now = Date.now()) => { const c = createdAt(l); return c == null ? null : Math.max(0, now - c); };
// Verde antes del minuto, ámbar antes de 15 minutos, rojo después.
export const waitTone = (m) => (m == null ? '' : m < 60e3 ? 'ok' : m < 15 * 60e3 ? 'warn' : 'late');
export function durText(m) {
  if (m == null || !Number.isFinite(m)) return '—';
  const s = Math.max(0, Math.floor(m / 1000));
  if (s < 60) return `${s} s`;
  const min = Math.floor(s / 60); if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60), rm = min % 60; if (h < 24) return rm ? `${h} h ${rm} min` : `${h} h`;
  const d = Math.floor(h / 24), rh = h % 24; return rh ? `${d} d ${rh} h` : `${d} d`;
}
// Cuánto tardó la primera respuesta (null si todavía no hay o si los datos no cuadran).
export const replyMs = (l) => { const c = createdAt(l), r = firstReplyAt(l); return c == null || r == null || r < c ? null : r - c; };

// ---------- Los tres números de arriba ----------
// Sin responder · tiempo medio de primera respuesta de los leads que entraron este mes · propuestas abiertas.
export function salesMetrics(leads, now = Date.now()) {
  const M = new Date(now).toISOString().slice(0, 7);
  const real = (Array.isArray(leads) ? leads : []).filter((l) => l && !l.archived && (stageKey(l.stage) || 'Nuevo') !== 'Prospecto');
  const waiting = real.filter(isWaiting).sort((a, z) => createdAt(a) - createdAt(z));
  const times = real.filter((l) => l.direction !== 'out' && createdAt(l) != null && new Date(createdAt(l)).toISOString().slice(0, 7) === M).map(replyMs).filter((x) => x != null);
  const props = real.filter((l) => stageKey(l.stage) === 'Propuesta');
  return {
    unanswered: waiting.length, oldestMs: waiting.length ? waitMs(waiting[0], now) : null, waiting,
    avgReplyMs: times.length ? Math.round(times.reduce((a, x) => a + x, 0) / times.length) : null, replied: times.length,
    proposals: props.length, proposalsUsd: props.reduce((a, l) => a + (+l.value_usd || 0), 0),
  };
}

// ---------- «Vence pronto» (Hoy) ----------
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
const plus = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
// Quién ve qué: los leads, quien ve Ventas; las facturas por cobrar, el CEO y quien ve Finanzas (en resumen);
// las por pagar, solo el CEO.
export function dueAccess(me) {
  const ceo = me?.role === 'ceo', v = me?.views, areas = me?.areas || [];
  const sees = (a) => (v ? Boolean(v[a]) && v[a] !== 'oculto' : areas.includes(a));
  return { sales: ceo || sees('sales'), cobrar: ceo || sees('finanzas'), pagar: ceo };
}
// Una factura vence pronto si está pendiente y su fecha cae en los próximos 7 días o ya pasó.
export const invoiceOverdue = (f, T) => (f?.status || 'pendiente') === 'pendiente' && /^\d{4}-\d{2}-\d{2}$/.test(String(f?.due || '')) && f.due < T;
export const invoiceSoon = (f, T, days = 7) => (f?.status || 'pendiente') === 'pendiente' && /^\d{4}-\d{2}-\d{2}$/.test(String(f?.due || '')) && f.due <= plus(T, days);
// Mezcla y ordena por fecha lo que vence: leads sin responder, siguientes pasos de ventas de hoy o mañana (y los vencidos)
// y facturas. Cada fila trae a dónde lleva. `now` en ms; T = hoy (AAAA-MM-DD).
export function dueSoon({ leads = [], invoices = [], access, T, now = Date.now() }) {
  T = T || isoDay(now);
  const out = [], tomorrow = plus(T, 1);
  if (access?.sales) for (const l of Array.isArray(leads) ? leads : []) {
    if (!l || l.archived) continue;
    const st = stageKey(l.stage) || 'Nuevo', href = `#/org/sales/crm/${encodeURIComponent(l.id)}`;
    if (isWaiting(l)) { const w = waitMs(l, now); out.push({ kind: 'lead', id: l.id, date: isoDay(createdAt(l)), rank: 0, title: l.name || 'Lead', sub: 'Sin responder', wait: w, tone: waitTone(w), created: createdAt(l), href }); continue; }
    if (OPEN.includes(st) && /^\d{4}-\d{2}-\d{2}$/.test(String(l.next_date || '')) && l.next_date <= tomorrow)
      out.push({ kind: 'lead', id: l.id, date: l.next_date, rank: 1, title: l.name || 'Lead', sub: l.next_step || 'Siguiente paso', tone: l.next_date < T ? 'late' : l.next_date === T ? 'warn' : '', href });
  }
  for (const f of Array.isArray(invoices) ? invoices : []) {
    if (!f || !['cobrar', 'pagar'].includes(f.kind) || !access?.[f.kind] || !invoiceSoon(f, T)) continue;
    out.push({ kind: f.kind, id: f.id, date: f.due, rank: 2, title: (f.kind === 'cobrar' ? String(f.client || '').toUpperCase() : f.vendor) || f.vendor || 'Factura', sub: f.concept || '', amount: +f.amount || 0, currency: f.currency || 'GTQ', tone: f.due < T ? 'late' : f.due === T ? 'warn' : '', overdue: f.due < T, href: '#/org/finanzas/facturas' });
  }
  return out.sort((a, z) => a.date.localeCompare(z.date) || a.rank - z.rank || String(a.title).localeCompare(String(z.title)));
}

// Refresca los cronómetros a la vista (elementos con data-wait = ms de entrada). data-plain: solo el texto, sin color.
export function updateWaits(nodes, now = Date.now()) {
  for (const n of nodes || []) {
    const c = +n.dataset?.wait; if (!Number.isFinite(c) || !c) continue;
    const m = Math.max(0, now - c), t = durText(m); if (n.textContent !== t) n.textContent = t;
    if (!n.dataset.plain) { const tone = waitTone(m); for (const k of ['ok', 'warn', 'late']) n.classList.toggle(k, k === tone); }
  }
}
