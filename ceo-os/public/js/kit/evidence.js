import { h, dato, frame, empty, link, table } from './dom.js';
export function ResearchPanel({ title = 'Investigación', claims = [] } = {}) {
  const el = frame(title, 'Fuentes y límites de cada afirmación.');
  el.append(...(claims.length ? claims.map((c) => h('article', { class: 'kit-research' }, h('h3', {}, c.text || 'Afirmación pendiente'), h('p', {}, `Confianza: ${dato(c.confidence?.level)}`), h('p', { class: 'kit-muted' }, c.confidence?.method || 'Sin método declarado', ' · ', c.confidence?.limitation || 'Limitación no documentada'), c.sources?.length ? h('ul', {}, c.sources.map((s) => h('li', {}, link(s), s.date ? ` · ${s.date}` : '', s.extract ? h('blockquote', {}, s.extract) : null))) : empty('Falta evidencia verificable. Se conserva como hipótesis.'))) : [empty()]));
  return el;
}
export function ScenarioCompare({ title = 'Comparar escenarios', scenarios = [], metrics = [] } = {}) {
  const el = frame(title, 'Modelo sujeto a los supuestos indicados.');
  if (!scenarios.length) { el.append(empty()); return el; }
  el.append(table(['Métrica', ...scenarios.map((s) => s.label)], metrics.map((m) => [m.label, ...scenarios.map((s) => { const x = s.values?.[m.id]; return x && typeof x === 'object' ? `${dato(x.low)} – ${dato(x.high)}` : dato(x); })])));
  el.append(...scenarios.map((s) => h('p', { class: 'kit-muted' }, `${s.label}: ${s.assumptions || 'Faltan supuestos; resultado exploratorio.'}`)));
  return el;
}
export function DataExplorer({ title = 'Explorar datos', columns = [], rows = [], valueKey } = {}) {
  const el = frame(title, 'Filtra los datos disponibles; los vacíos permanecen vacíos.'), result = h('div'), count = h('p', { role: 'status', 'aria-live': 'polite' });
  const input = h('input', { type: 'search', placeholder: 'Filtrar filas', 'aria-label': `Filtrar ${title}`, onInput: paint });
  function paint() { const q = input.value.toLocaleLowerCase('es'); const filtered = rows.filter((r) => columns.some((c) => String(r[c.id] ?? '').toLocaleLowerCase('es').includes(q))); result.replaceChildren(filtered.length ? table(columns.map((c) => c.label), filtered.map((r) => columns.map((c) => dato(r[c.id])))) : empty('No hay filas que coincidan.')); count.textContent = `${filtered.length} de ${rows.length} filas`; if (valueKey) { const vals = filtered.filter((r) => typeof r[valueKey] === 'number' && Number.isFinite(r[valueKey])); if (vals.length) result.append(h('div', { class: 'kit-bars', 'aria-label': 'Valores disponibles' }, vals.map((r) => h('label', {}, dato(r[columns[0]?.id]), h('meter', { min: Math.min(0, ...vals.map((x) => x[valueKey])), max: Math.max(1, ...vals.map((x) => x[valueKey])), value: r[valueKey] }), dato(r[valueKey]))))); } }
  el.append(input, count, result); paint(); return el;
}
