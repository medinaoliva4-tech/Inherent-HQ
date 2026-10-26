// Avisos (#/avisos y la campanita): lo que pide atención en tu trabajo, en cada cliente y en la plataforma. La base de las
// reglas: el día en Guatemala, el ciclo del mes, la forma de un aviso, el orden, quién puede ver qué y posponer.
// Puro: sin DOM ni red (lo prueba scripts/test-avisos.mjs). Las reglas están en trabajo.js, clientes-*.js y plataforma.js;
// el catálogo de dónde sale cada una está en el comentario de cada regla.

// El día en hora de Guatemala (UTC−6, sin horario de verano): después de las 18:00 en UTC ya sería mañana.
export const hoyGT = (ahora = new Date()) => new Date(ahora.getTime() - 6 * 3600e3).toISOString().slice(0, 10);
// El ciclo del 1 al 20 (inherent/05-OPERACION.md §4): d = el día del mes, M = el mes del ciclo, Mc = el mes del contenido
// (lo que se presenta el 20 se publica desde el 1 del siguiente) y Ma = el mes anterior.
const mesMas = (mes, n) => { const [y, m] = mes.split('-').map(Number), t = (y * 12 + m - 1) + n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`; };
export function cicloDe(hoy) {
  const M = hoy.slice(0, 7);
  return { d: +hoy.slice(8, 10), M, Mc: mesMas(M, 1), Ma: mesMas(M, -1), finMc: finDeMes(mesMas(M, 1)) };
}
export function finDeMes(mes) { const [y, m] = mes.split('-').map(Number); return `${mes}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`; }
export const masDias = (iso, n) => { const t = new Date(iso + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
export const diasEntre = (a, b) => Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5);
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const nombreMes = (mes) => MESES[+String(mes).slice(5, 7) - 1] || String(mes);
export const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
export const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

export const GRUPOS = [['trabajo', 'Tu trabajo'], ['clientes', 'Clientes'], ['plataforma', 'La plataforma']];
export const URGENCIAS = ['alta', 'media', 'baja'];
const rango = (u) => Math.max(0, URGENCIAS.indexOf(u));

// Un aviso listo para pintar. clave: única y estable (con ella se pospone); huella: cambia cuando cambia lo que avisa
// (un pospuesto vuelve si cambia). accion: { label, href } | { label, api: { method, ruta, body } } | { label, abre, id }.
// fijo: no se puede posponer (un lead esperando, la pauta corriendo sin OK, un cliente sin ficha).
export function aviso(regla, o) {
  return {
    id: regla.id, clave: o.clave || regla.id, grupo: regla.grupo, area: o.area || regla.area || 'todas',
    urgencia: URGENCIAS.includes(o.urgencia) ? o.urgencia : regla.urgencia || 'media',
    titulo: String(o.titulo || '').slice(0, 200), detalle: String(o.detalle || '').slice(0, 400), cliente: o.cliente || '',
    accion: o.accion || null, accion2: o.accion2 || null, huella: String(o.huella ?? ''), desde: o.desde instanceof Date ? o.desde.toISOString() : String(o.desde || ''), fijo: Boolean(o.fijo ?? regla.fijo),
    ...(o.tapa?.length ? { tapa: o.tapa } : {}),
    ...(o.vivo ? { vivo: o.vivo } : {}),
  };
}
// Más urgente primero; dentro de la misma urgencia, el más viejo primero (lo que más espera).
export const ordenar = (xs) => [...xs].sort((a, b) => rango(a.urgencia) - rango(b.urgencia) || String(a.desde || '9').localeCompare(String(b.desde || '9')) || a.titulo.localeCompare(b.titulo));
export function contar(xs) {
  const n = { total: xs.length, alta: 0, media: 0, baja: 0, trabajo: 0, clientes: 0, plataforma: 0 };
  for (const x of xs) { n[x.urgencia]++; n[x.grupo]++; }
  return n;
}

// Quién es la persona para las reglas (lo arma el servidor con su perfil ya aplicado: áreas, vistas y rol).
// nivel(area) → 'oculto' | 'resumen' | 'completo' | 'edita'.
export function personaDe({ email = '', nombre = '', role = '', areas = [], niveles = {}, puesto = '' } = {}) {
  const nivel = (a) => (role === 'ceo' ? 'edita' : niveles[a] || (areas.includes(a) ? 'edita' : 'oculto'));
  return {
    email: String(email).toLowerCase(), nombre, role, areas, puesto, esCeo: role === 'ceo', esCoo: role === 'coo', nivel,
    ve: (a) => nivel(a) !== 'oculto', completo: (a) => ['completo', 'edita'].includes(nivel(a)), edita: (a) => nivel(a) === 'edita',
  };
}
// Lo que una regla necesita para correr: { area, nivel: 've'|'completo'|'edita', rol: ['ceo','coo'] }. Sin necesita, corre para todos.
export function puede(p, n) {
  if (!n) return true;
  if (n.rol && !n.rol.includes(p.role)) return false;
  if (!n.area) return true;
  const as = [].concat(n.area);
  return as.some((a) => (n.nivel === 'edita' ? p.edita(a) : n.nivel === 'completo' ? p.completo(a) : p.ve(a)));
}

// Corre las reglas. Una regla que falla no tumba las demás: se anota en errores. Si un cliente no tiene ficha, solo sale
// ese aviso de ese cliente (todos los agentes lo bloquean: lo demás sería ruido).
export function correr(reglas, datos, persona, hoy) {
  const out = [], errores = [];
  for (const r of reglas) {
    if (!puede(persona, r.necesita)) continue;
    try { for (const x of r.calcular(datos, persona, hoy, cicloDe(hoy)) || []) if (x?.titulo) out.push(x); }
    catch (e) { errores.push(`${r.id}: ${e.message}`); }
  }
  const sinFicha = new Set(out.filter((x) => x.id === 'cli-sin-ficha').map((x) => x.cliente));
  // Un aviso de cliente que ya enlaza tu tarea de la receta atrasada la «tapa»: sale uno solo, con la tarea adentro.
  const tapadas = new Set(out.flatMap((x) => x.tapa || []));
  const xs = out.filter((x) => !tapadas.has(x.clave) && !(x.cliente && sinFicha.has(x.cliente) && x.id !== 'cli-sin-ficha' && x.grupo === 'clientes'));
  // Una clave sale una vez (dos reglas que dicen lo mismo de lo mismo: gana la primera).
  const vistos = new Set();
  return { items: ordenar(xs.filter((x) => (vistos.has(x.clave) ? false : vistos.add(x.clave)))), errores };
}

// Posponer: { <clave>: { hasta: AAAA-MM-DD, huella } }. Un aviso pospuesto vuelve el día «hasta» o si cambió su huella.
// Uno alta se pospone un día como máximo; uno fijo, nunca.
export function aplicarPospuestos(xs, pos = {}, hoy) {
  const visibles = [], pospuestos = [];
  for (const x of xs) { const p = pos[x.clave]; (p && !x.fijo && p.hasta > hoy && String(p.huella ?? '') === x.huella ? pospuestos : visibles).push(x); }
  return { visibles, pospuestos };
}
export function posponer(pos = {}, { clave, hasta, huella = '', volver = false }, item, hoy) {
  const out = Object.fromEntries(Object.entries(pos || {}).filter(([, v]) => v?.hasta > hoy)); // lo vencido se limpia al guardar
  if (volver) { delete out[clave]; return { pos: out }; }
  if (!item) return { error: 'Ese aviso ya no está' };
  if (item.fijo) return { error: 'Este aviso no se puede posponer: hay que resolverlo' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(hasta || '')) || hasta <= hoy) return { error: 'Elige un día después de hoy' };
  const tope = masDias(hoy, item.urgencia === 'alta' ? 1 : 14);
  out[clave] = { hasta: hasta > tope ? tope : hasta, huella: String(huella ?? item.huella ?? '') };
  return { pos: out };
}
