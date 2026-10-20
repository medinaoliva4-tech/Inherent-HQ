// Intel · lo que los agentes dejaron escrito en la carpeta de un cliente, organizado como lo define el WORKFLOW.md de cada área.
// El mapa (qué archivos, dónde y quién los ve) vive en public/js/intel-mapa.js. Aquí solo se lee, se filtra y se limpia.
// Seguridad: la ruta de cada archivo sale SIEMPRE del mapa (nunca de lo que mande quien llama); el slug se valida contra
// la lista real de clientes. Solo el equipo lo abre: la ruta responde 403 al cliente (la vista «cliente» queda como defensa extra).
import { readFile, listFiles, listDir, repoSource, fileDate } from './gh.js';
import { DEPTS, ENTREGABLES, AVATAR, CARPETAS, coincide, varianteLabel } from '../../public/js/intel-mapa.js';

const MAX_DOC = 150_000;
export const rootOf = (slug) => (slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${slug}`);

// El slug tiene que ser exactamente el nombre de una carpeta de clients/ (sin «_plantilla») o «inherent» (la marca de la casa).
export async function slugValido(slug, { inherent = true } = {}) {
  if (typeof slug !== 'string' || !/^[a-z0-9][a-z0-9_-]{1,59}$/.test(slug)) return false;
  if (slug === 'inherent') return inherent;
  return (await clientSlugs()).includes(slug);
}
export async function clientSlugs() {
  return (await listDir('clients')).filter((d) => d.type === 'dir' && !d.name.startsWith('_')).map((d) => d.name);
}

// Todos los archivos de las carpetas que Intel lee, con su ruta relativa a la del cliente.
async function archivos(root) {
  let l = listFiles(root);
  if (!l.length && repoSource() === 'github') {
    const q = CARPETAS.map((c) => `${root}/${c}`), base = root.split('/').length; l = [];
    while (q.length && l.length < 600) { const d = q.shift(); for (const it of await listDir(d)) { if (it.type === 'dir') { if (it.path.split('/').length - base < 5) q.push(it.path); } else l.push(it.path); } }
  }
  return l.map((p) => p.slice(root.length + 1));
}

// ---------- Limpieza ----------
// Líneas que nunca salen del equipo de costos (ni hacia el cliente ni hacia quien no ve costos).
// («márgenes» a secas NO se filtra: en el sistema visual son los márgenes de la página.)
const ECON = /06-ECONOMIA|\bm[aá]rgen(?:es)? (?:bruto|neto|por|de (?:ganancia|utilidad|la cuenta|cada|inherent))|% de margen|costo de la cuenta|\bbaseline\b|\btarifas? (?:de|por|del)|performance fee|costo interno|🔒/i;
// Al cliente, además: el fee, el plan contratado y las cuotas mensuales de Inherent («Q2,500 al mes»).
const SOLO_CLIENTE = /\b(?:fee|honorarios|retainer|cuota mensual|precio de lista)\b|\b(?:Q|USD|US\$|\$)\s?\d[\d,.]*\s*(?:al mes|\/\s?mes|mensuales?|por mes)\b|plan-contratado|^\s*>\s*(🛑|Plantilla)/i;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function limpiar(md, nivel, otros = []) {
  if (!nivel) return { md, quitadas: 0 };
  const otro = otros.length ? new RegExp(`(^|[^a-z0-9áéíóúñ])(${otros.map(esc).join('|')})([^a-z0-9áéíóúñ]|$)`, 'i') : null;
  let quitadas = 0; const out = [];
  for (const ln of String(md).split('\n')) {
    if (ECON.test(ln) || (nivel === 'cliente' && (SOLO_CLIENTE.test(ln) || otro?.test(ln)))) { quitadas++; continue; }
    out.push(nivel === 'cliente' ? ln.replace(/\[(?:dice|dicen|dijo)[^\]]*\]/gi, '').replace(/[🟢🟡⚪]/gu, '').replace(/[ \t]+$/, '') : ln);
  }
  return { md: out.join('\n'), quitadas };
}

// CSV → tabla markdown (para que se vea como tabla en la pantalla).
function csvRows(text) {
  const rows = []; let row = [], cur = '', q = false; const s = String(text).replace(/\r/g, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"' && s[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; } else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}
export function csvAMd(text, max = 300) {
  const rows = csvRows(text); if (!rows.length) return '';
  const cell = (c) => String(c ?? '').replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ').trim();
  const [h, ...r] = rows; const n = h.length;
  const line = (a) => '| ' + Array.from({ length: n }, (_, i) => cell(a[i])).join(' | ') + ' |';
  return [line(h), line(h.map(() => '---')), ...r.slice(0, max).map(line), ...(r.length > max ? [`\n*…y ${r.length - max} filas más.*`] : [])].join('\n');
}

// ---------- El avatar ----------
// Se arma con celdas sueltas de los entregables de ① Strategy (nunca se entrega el documento entero).
const plain = (s) => String(s || '').replace(/[*`_]/g, '').replace(/\s+/g, ' ').trim();
const cabeza = (s) => plain(s).replace(/^§\s*/, '').replace(/^[A-Z]?\d*(?:\.\d+)?\s*·\s*/, '').replace(/^[^\p{L}\p{N}]+/u, '');
const celdas = (ln) => ln.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
const sepFila = (c) => c.every((x) => /^:?-{2,}:?$/.test(x));
const limpia = (s) => String(s || '').replace(/\*+/g, '').replace(/\s*·?\s*⚠.*$/, '').replace(/\[(?:dice|dicen|dijo)[^\]]*\]/gi, '').replace(/[🟢🟡⚪]/gu, '').replace(/`/g, '').replace(/\s+/g, ' ').replace(/[\s.·]+$/, '').trim();
const vacio = (s) => !s || /^(⚠️?\s*)?SIN DATOS/i.test(s) || /^ver\s+(§|abajo|arriba|la |el )/i.test(s) || /^<.*>$/.test(s) || /^[—–-]+$/.test(s) || s.startsWith('⚠');
const dudoso = (s) => /sin verificar|⚠/i.test(s);

function valorDe(md, re) {
  const L = md.split('\n');
  for (let i = 0; i < L.length; i++) {
    const ln = L[i];
    if (/^\s*\|/.test(ln)) {
      const c = celdas(ln); if (sepFila(c)) continue;
      for (const [li, vi] of [[0, 1], [1, 2]]) {
        if (c.length <= vi || !re.test(cabeza(c[li]))) continue;
        const labs = cabeza(c[li]).split(' · '), vals = c[vi].split(' · ');
        const v = labs.length > 1 && vals.length === labs.length ? vals[labs.findIndex((l) => re.test(l))] : c[vi];
        return { raw: v, txt: limpia(v) };
      }
      continue;
    }
    let m = /^\s*(?:[-*]\s+)?\*\*([^*]+?)\*\*\s*[:—–-]?\s*(.*)$/.exec(ln);
    if (m && m[2] && re.test(cabeza(m[1]))) return { raw: m[2], txt: limpia(m[2]) };
    m = /^(#{1,4})\s+(.*)$/.exec(ln);
    if (m && re.test(cabeza(m[2]))) {
      const bloque = []; let dud = false;
      for (let j = i + 1; j < L.length; j++) {
        const t = L[j]; const h = /^(#{1,4})\s/.exec(t);
        if ((h && h[1].length <= m[1].length) || /^\s*---+\s*$/.test(t)) break;
        const s = t.trim().replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, ''); if (!s || /^>/.test(s) || /^\|/.test(s)) continue;
        if (s.startsWith('⚠')) { dud = true; continue; }
        if (/⚠|sin verificar/i.test(s)) dud = true;
        bloque.push(limpia(s));
      }
      const txt = bloque.filter(Boolean).join(' · ');
      return { raw: txt + (dud ? ' ⚠️' : ''), txt };
    }
  }
  return null;
}
// «Las audiencias»: una fila por audiencia. modo 'nombre' → los nombres; 'sueno' → «nombre: lo que sueña».
function audiencias(md, modo) {
  const L = md.split('\n'); let head = null; const rows = [];
  for (const ln of L) {
    if (!/^\s*\|/.test(ln)) { if (head && rows.length) break; head = null; continue; }
    const c = celdas(ln); if (sepFila(c)) continue;
    if (!head) { if (/^audiencias?$/i.test(cabeza(c[0]))) head = c.map((x) => cabeza(x)); continue; }
    rows.push(c);
  }
  if (!head || !rows.length) return null;
  if (modo === 'nombre') { const t = rows.slice(0, 6).map((r) => limpia(r[0])).filter(Boolean).join(' · '); return t ? { raw: t, txt: t } : null; }
  const vi = head.findIndex((h) => /sue[ñn]a|quiere|desea/i.test(h)); if (vi < 1) return null;
  const t = rows.slice(0, 5).map((r) => (r[vi] ? `${limpia(r[0])}: ${limpia(r[vi])}` : '')).filter(Boolean).join(' · ');
  return t ? { raw: t, txt: t } : null;
}
const recorta = (s, n = 420) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

function avatarDe(docs, titulos, cliente, otros) {
  const buscar = (fuentes) => {
    for (const [id, q] of fuentes) {
      const md = docs[id]; if (!md) continue;
      const r = typeof q === 'string' ? audiencias(md, q.split(':')[1]) : valorDe(md, q);
      if (r && !vacio(r.txt)) {
        let txt = r.txt; if (cliente) { const l = limpiar(txt, 'cliente', otros); txt = l.quitadas ? '' : l.md; } if (!txt) continue;
        return { texto: recorta(txt), de: titulos[id], sinVerificar: !cliente && dudoso(r.raw) };
      }
    }
    return null;
  };
  const arq = buscar(AVATAR.arquetipo);
  const campos = AVATAR.campos.map((c) => { const r = buscar(c.fuentes); return { k: c.k, label: c.label, texto: r?.texto || null, ...(!cliente && r ? { de: r.de, sinVerificar: r.sinVerificar } : {}) }; });
  return { hay: campos.some((c) => c.texto), arquetipo: arq?.texto || null, campos };
}

// ---------- Lo que se entrega ----------
// vista: 'equipo' (todo lo de su alcance, con costos solo si `costos`) o 'cliente' (solo lo marcado «cliente», limpio).
export async function intelFor(slug, { vista = 'equipo', costos = false } = {}) {
  const root = rootOf(slug), cliente = vista === 'cliente';
  const nivel = cliente ? 'cliente' : costos ? null : 'sin-costos';
  const otros = cliente ? (await clientSlugs()).filter((s) => s !== slug) : [];
  // Qué archivos existen: cada uno con el entregable al que pertenece.
  const hay = [];
  for (const rel of await archivos(root)) for (const e of ENTREGABLES) { const c = coincide(e, rel); if (c) { hay.push({ e, rel, ...c }); break; } }
  // El avatar sale de lo más reciente de cada fuente, sea o no visible: solo se entregan sus celdas.
  const ultimo = (id) => hay.filter((h) => h.e.id === id).sort((a, z) => String(z.mes || '').localeCompare(String(a.mes || '')))[0];
  const docs = {}, titulos = {};
  for (const id of new Set([...AVATAR.arquetipo, ...AVATAR.campos.flatMap((c) => c.fuentes)].map((f) => f[0]))) {
    const h = ultimo(id); if (!h) continue;
    const f = await readFile(`${root}/${h.rel}`); if (f) { docs[id] = f.content; titulos[id] = h.e.titulo; }
  }
  const avatar = avatarDe(docs, titulos, cliente, otros);
  const visible = (e) => (cliente ? e.cliente && !e.costos : !e.costos || costos);
  const depts = [];
  for (const [id, nombre] of DEPTS) {
    const es = ENTREGABLES.filter((e) => e.dept === id && visible(e)); if (!es.length) continue;
    const items = [], faltan = [];
    for (const e of es) {
      const mios = hay.filter((h) => h.e.id === e.id).sort((a, z) => String(z.mes || '').localeCompare(String(a.mes || '')) || String(a.variante || '').localeCompare(String(z.variante || '')));
      if (!mios.length) { faltan.push({ id: e.id, titulo: e.titulo, sirve: e.sirve }); continue; }
      for (const h of mios) {
        const f = await readFile(`${root}/${h.rel}`); if (!f) continue;
        const crudo = e.fmt === 'csv' ? csvAMd(f.content) : f.content.slice(0, MAX_DOC);
        const l = limpiar(crudo, nivel, otros);
        items.push({ id: e.id, mes: h.mes, variante: h.variante, titulo: h.variante ? `${e.titulo} · ${varianteLabel(h.variante)}` : e.titulo, sirve: e.sirve, cliente: e.cliente, fmt: e.fmt, fecha: fileDate(`${root}/${h.rel}`), contenido: l.md, ...(cliente ? {} : { ruta: h.rel }) });
      }
      if (!mios.some((h) => items.some((x) => x.id === e.id))) faltan.push({ id: e.id, titulo: e.titulo, sirve: e.sirve });
    }
    depts.push({ id, nombre, items, faltan });
  }
  const ids = new Set(depts.flatMap((d) => d.items.map((x) => x.id)));
  return { slug, vista, avatar, depts, total: depts.reduce((a, d) => a + new Set([...d.items.map((x) => x.id), ...d.faltan.map((x) => x.id)]).size, 0), listos: ids.size };
}
