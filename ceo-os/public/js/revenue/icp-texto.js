// De una frase al cliente ideal, y de ahí afinando con otra frase (puro: sin DOM ni red).
//   icpDeTexto('Dueños de cafeterías en Guatemala con 5 a 50 personas')   → { icp, excluir, cambios, entendido, resumen }
//   icpDeTexto('solo en Antigua, agrega gerentes, deja fuera agencias', previo)  → ajusta lo anterior
// Reglas por palabras (sin modelo): lo que no reconoce NO lo inventa, lo dice en `cambios` vacío y `entendido:false`.
// `icp` usa las claves del motor de leads (industrias, tamano{min,max}, ubicaciones, senales, cargos); `excluir` va aparte
// y se aplica a los leads con `filtrarExcluidos` (el motor puntúa; lo excluido ni entra al lote).
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const uniq = (a) => [...new Set(a.filter(Boolean))];
const CARGOS = [['fundador', ['fundador', 'fundadora', 'fundadores', 'founder', 'founders']], ['dueño', ['dueno', 'duena', 'duenos', 'propietario', 'owner']], ['ceo', ['ceo', 'director general']], ['gerente', ['gerente', 'gerentes', 'manager']], ['director', ['director', 'directora', 'directores']], ['vp', ['vp', 'vps', 'vicepresidente', 'vicepresidentes', 'vice presidente']], ['marketing', ['cmo', 'jefe de marketing', 'encargado de marketing']], ['ventas', ['lider de ventas', 'lideres de ventas', 'jefe de ventas', 'ventas']]];
const INDUSTRIAS = [['cafeterías', ['cafeteria', 'cafeterias', 'cafe ', 'cafes']], ['restaurantes', ['restaurante', 'restaurantes']], ['agencias', ['agencia', 'agencias']], ['clínicas', ['clinica', 'clinicas']], ['tiendas', ['tienda', 'tiendas', 'retail', 'comercio']], ['hoteles', ['hotel', 'hoteles']], ['inmobiliarias', ['inmobiliaria', 'inmobiliarias', 'bienes raices']], ['automotriz', ['automotriz', 'autos', 'talleres']], ['educación', ['educacion', 'escuela', 'escuelas', 'academias']], ['tecnología', ['tecnologia', 'software', 'saas', 'startup', 'startups']], ['belleza', ['belleza', 'salon', 'salones', 'spa']], ['fitness', ['gimnasio', 'gimnasios', 'fitness']]];
const TAMANOS = [[['pequena', 'pequenas', 'pequeno', 'pequenos', 'small'], { min: 1, max: 50 }], [['mediana', 'medianas', 'mediano', 'medianos', 'mid-sized', 'mid sized'], { min: 50, max: 250 }], [['grande', 'grandes'], { min: 250, max: 100000 }]];
const tiene = (t, p) => new RegExp(`(^|[^a-z0-9])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z0-9])`).test(t);
const hallar = (t, tabla) => tabla.filter(([, ps]) => ps.some((p) => tiene(t, p.trim()))).map(([k]) => k);

// «deja fuera X», «sin X», «quita X», «excepto X» → lo que sigue hasta una coma/«y»/punto es lo excluido.
function partirExcluidos(t) {
  const m = [...t.matchAll(/(?:deja fuera|dejar fuera|sin|quita|quitar|excepto|menos|no incluyas|excluye|excluir|fuera)\s+([^,.;]+)/g)];
  return { excl: m.map((x) => x[1]).join(' , '), resto: t.replace(/(?:deja fuera|dejar fuera|sin|quita|quitar|excepto|menos|no incluyas|excluye|excluir|fuera)\s+[^,.;]+/g, ' ') };
}
const lugares = (original) => {
  const out = []; for (const m of original.matchAll(/\b(?:en|de|desde|agrega|suma|incluye|añade|anade)\s+((?:[A-ZÁÉÍÓÚÑ][\wáéíóúñ.-]+)(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ.-]+)*(?:\s*(?:,|y)\s*[A-ZÁÉÍÓÚÑ][\wáéíóúñ.-]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ.-]+)*)*)/g)) out.push(...m[1].split(/\s*(?:,|\by\b)\s*/).map((x) => x.trim()));
  return out.filter((x) => x && !/^(Inherent|El|La|Los|Las)$/.test(x));
};
function tamano(t) {
  let m = /(?:de|entre|con)\s+(\d{1,6})\s*(?:a|y|-)\s*(\d{1,6})/.exec(t); if (m) return { min: Math.min(+m[1], +m[2]), max: Math.max(+m[1], +m[2]) };
  if ((m = /(?:menos de|hasta|maximo)\s+(\d{1,6})/.exec(t))) return { min: 1, max: +m[1] };
  if ((m = /(?:mas de|desde|minimo)\s+(\d{1,6})/.exec(t))) return { min: +m[1], max: 100000 };
  for (const [ps, r] of TAMANOS) if (ps.some((p) => tiene(t, p))) return r;
  return null;
}
const vacio = () => ({ industrias: [], ubicaciones: [], senales: [], cargos: [] });

export function icpDeTexto(texto, previo = null) {
  const original = String(texto || ''), t = norm(original), base = previo ? { ...vacio(), ...JSON.parse(JSON.stringify(previo.icp || previo)) } : vacio();
  const excluir = previo?.excluir ? JSON.parse(JSON.stringify(previo.excluir)) : { industrias: [], cargos: [] }, cambios = [];
  const { excl, resto } = partirExcluidos(t), ex = norm(excl);
  const restoOriginal = original.replace(/(?:deja fuera|dejar fuera|sin|quita|quitar|excepto|menos|no incluyas|excluye|excluir|fuera)\s+[^,.;]+/gi, ' ');
  const exI = hallar(ex, INDUSTRIAS), exC = hallar(ex, CARGOS);
  for (const x of exI) { excluir.industrias = uniq([...excluir.industrias, x]); base.industrias = base.industrias.filter((y) => y !== x); cambios.push(`Deja fuera: ${x}`); }
  for (const x of exC) { excluir.cargos = uniq([...excluir.cargos, x]); base.cargos = base.cargos.filter((y) => y !== x); cambios.push(`Deja fuera: ${x}`); }
  const solo = /\bsolo\b|\bunicamente\b|\bnada mas\b/.test(resto), ind = hallar(resto, INDUSTRIAS).filter((x) => !exI.includes(x)), car = hallar(resto, CARGOS).filter((x) => !exC.includes(x)), ubi = lugares(restoOriginal);
  const tam = tamano(resto), agrega = /\bagrega|\bsuma|\bincluye|\banade|\banadir/.test(resto) || !!previo;
  const poner = (campo, nuevos, etiqueta) => { if (!nuevos.length) return; const antes = base[campo].join('|'); base[campo] = (solo && !agrega) || (solo && previo) ? uniq(nuevos) : uniq([...base[campo], ...nuevos]); if (base[campo].join('|') !== antes) cambios.push(`${etiqueta}: ${base[campo].join(', ')}`); };
  poner('industrias', ind, 'Industrias'); poner('cargos', car, 'Cargos'); poner('ubicaciones', ubi, 'Ubicaciones');
  if (tam) { base.tamano = tam; cambios.push(`Tamaño: ${tam.min}–${tam.max >= 100000 ? '∞' : tam.max} personas`); }
  const icp = { industrias: base.industrias, ubicaciones: base.ubicaciones, senales: base.senales, cargos: base.cargos, ...(base.tamano ? { tamano: base.tamano } : {}) };
  return { icp, excluir, cambios, entendido: cambios.length > 0, resumen: resumirICP(icp, excluir) };
}
export function resumirICP(icp = {}, excluir = {}) {
  const p = [];
  if (icp.cargos?.length) p.push(icp.cargos.join(' y '));
  if (icp.industrias?.length) p.push(`de ${icp.industrias.join(', ')}`);
  if (icp.ubicaciones?.length) p.push(`en ${icp.ubicaciones.join(', ')}`);
  if (icp.tamano) p.push(`con ${icp.tamano.min}–${icp.tamano.max >= 100000 ? '∞' : icp.tamano.max} personas`);
  const fuera = [...(excluir.industrias || []), ...(excluir.cargos || [])]; if (fuera.length) p.push(`(sin ${fuera.join(', ')})`);
  return p.join(' ') || 'Sin criterios todavía';
}
// Deja fuera de la lista los leads cuya industria o cargo cae en lo excluido (compara por palabras; no toca los demás).
export function filtrarExcluidos(leads = [], excluir = {}) {
  const ei = (excluir.industrias || []).map(norm), ec = (excluir.cargos || []).map(norm), queda = [], fuera = [];
  for (const l of leads) {
    const ind = norm(l.industry || l.industria), car = norm(l.contact_role || l.cargo || l.decisor_cargo);
    const malo = ei.some((x) => x && (ind.includes(x.slice(0, 6)))) || ec.some((x) => x && car.includes(x.slice(0, 5)));
    (malo ? fuera : queda).push(l);
  }
  return { leads: queda, excluidos: fuera };
}
