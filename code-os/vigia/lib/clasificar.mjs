// Deduplicar, clasificar por departamento con palabras clave y elegir candidatos a probar. Sin IA.

export function normalizarUrl(u = '') {
  try {
    const x = new URL(u.trim());
    x.hash = '';
    for (const k of [...x.searchParams.keys()]) if (/^(utm_|ref$|ref_src$|source$|fbclid$|gclid$)/i.test(k)) x.searchParams.delete(k);
    x.hostname = x.hostname.replace(/^www\./, '').toLowerCase();
    if (x.hostname === 'github.com') x.pathname = x.pathname.toLowerCase().replace(/\.git$/, '');
    return `${x.protocol}//${x.hostname}${x.pathname.replace(/\/+$/, '')}${x.search}`;
  } catch { return u.trim(); }
}

const clave = (t = '') => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** Quita repetidos (misma URL normalizada o mismo título) y los ya vistos en corridas anteriores. */
export function deduplicar(items, vistos = {}) {
  const urls = new Set();
  const titulos = new Set();
  const out = [];
  for (const it of items) {
    const id = normalizarUrl(it.url);
    const t = clave(it.titulo);
    if (vistos[id] || urls.has(id) || (t.length > 12 && titulos.has(t))) continue;
    urls.add(id); titulos.add(t);
    out.push({ ...it, id });
  }
  return out;
}

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patron = (p) => new RegExp(`(^|[^a-z0-9])${escapar(clave(p))}($|[^a-z0-9])`);

/** Palabras del tema encontradas en el texto (sin acentos, sin mayúsculas, palabra completa). */
export function coincidencias(texto, palabras = []) {
  const t = ` ${clave(texto)} `;
  return palabras.filter((p) => patron(p).test(t));
}

/**
 * Asigna departamentos por palabras clave. Devuelve el ítem con
 * `departamentos: [{id, palabras}]`, `puntaje` y `ruido` (si cae en la lista de exclusión).
 */
export function clasificar(item, temas, pesoFuente = 1) {
  const texto = `${item.titulo} ${item.resumen ?? ''} ${(item.repo?.temas ?? []).join(' ')}`;
  const ruido = coincidencias(texto, temas.ruido ?? []).length > 0;
  const deps = [];
  for (const [id, d] of Object.entries(temas.departamentos)) {
    const p = coincidencias(texto, d.palabras);
    if (p.length) deps.push({ id, palabras: p });
  }
  // El departamento de negocio gana a «sistema» (base técnica) cuando ambos aparecen.
  const base = temas.base ?? 'sistema';
  deps.sort((a, b) => (a.id === base) - (b.id === base) || b.palabras.length - a.palabras.length);
  const golpes = deps.reduce((s, d) => s + d.palabras.length, 0);
  const estrellas = item.repo?.estrellas ?? 0;
  const puntaje = golpes * 2 + pesoFuente + (estrellas > 0 ? Math.log10(estrellas + 1) : 0) - (ruido ? 5 : 0);
  return { ...item, departamentos: deps, puntaje: Math.round(puntaje * 10) / 10, ruido };
}

const PERMISIVAS = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'Unlicense', 'MPL-2.0', '0BSD']);
const COPYLEFT = new Set(['AGPL-3.0', 'GPL-3.0', 'GPL-2.0', 'LGPL-3.0', 'LGPL-2.1']);

/** Coste y riesgo de probar un repo, con la razón en palabras simples. */
export function evaluarRepo(repo, ahora = Date.now()) {
  const dias = repo.ultimo_commit ? Math.floor((ahora - Date.parse(repo.ultimo_commit)) / 864e5) : 9999;
  const lic = repo.licencia ?? 'SIN LICENCIA';
  const razones = [];
  let riesgo = 0;
  if (repo.archivado) { riesgo += 3; razones.push('archivado'); }
  if (dias > 180) { riesgo += 2; razones.push(`sin commits hace ${dias} días`); } else if (dias > 60) { riesgo += 1; razones.push(`último commit hace ${dias} días`); }
  if (COPYLEFT.has(lic)) { riesgo += 1; razones.push(`${lic}: si se modifica y se ofrece como servicio hay que publicar el código`); } else if (!PERMISIVAS.has(lic)) { riesgo += 2; razones.push(`licencia ${lic}: revisar antes de usar`); }
  if ((repo.estrellas ?? 0) < 100) { riesgo += 1; razones.push('poca comunidad (<100 ★)'); }
  const nivel = riesgo >= 3 ? 'alto' : riesgo >= 1 ? 'medio' : 'bajo';
  return {
    coste: PERMISIVAS.has(lic) || COPYLEFT.has(lic) ? 'Gratis (código abierto); solo tiempo de prueba y servidor' : 'Por confirmar: licencia no estándar',
    riesgo: nivel, razones, dias,
  };
}

/** probar / vigilar / ignorar a partir de puntaje y riesgo. */
export function recomendar(item, ahora = Date.now()) {
  if (item.ruido || !item.departamentos?.length) return 'ignorar';
  if (item.tipo === 'release') return 'vigilar';
  // Registro MCP: cualquiera publica; sin comunidad (<20 ★) solo pasa si es muy relevante.
  if (item.tipo === 'mcp' && (item.repo?.estrellas ?? 0) < 20) return item.puntaje >= 8 ? 'vigilar' : 'ignorar';
  if (!item.repo) return item.puntaje >= 6 ? 'vigilar' : 'ignorar';
  const ev = evaluarRepo(item.repo, ahora);
  if (ev.riesgo === 'alto') return 'vigilar';
  if (item.repo.estrellas >= 500 && item.puntaje >= 6) return 'probar';
  return 'vigilar';
}

export function candidatos(items, { max = 8, ahora = Date.now() } = {}) {
  return items
    .filter((it) => it.repo && it.tipo !== 'release' && recomendar(it, ahora) === 'probar')
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, max)
    .map((it) => ({ ...it, evaluacion: evaluarRepo(it.repo, ahora) }));
}

/** Una línea de «por qué le sirve a Inherent» sin IA. */
export function porQueSinIa(item, temas) {
  const d = item.departamentos?.[0];
  if (!d) return '';
  const dep = temas.departamentos[d.id];
  return `${dep.porque} (toca: ${d.palabras.slice(0, 3).join(', ')})`;
}
