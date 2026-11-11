// Informe en Markdown. Conserva el bloque curado a mano entre <!-- curado:inicio --> y <!-- curado:fin -->.
import { candidatos, porQueSinIa, recomendar } from './clasificar.mjs';

const fmtFecha = (d) => (d ? String(d).slice(0, 10) : 's/f');
const fmtNum = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
const md = (s = '') => String(s).replace(/\|/g, '/').replace(/\s+/g, ' ').replace(/([[\]])/g, '\\$1').trim();

export function datosRepo(r) {
  if (!r) return '';
  return `★ ${fmtNum(r.estrellas)} · ${r.licencia} · último commit ${fmtFecha(r.ultimo_commit)}${r.archivado ? ' · ARCHIVADO' : ''}`;
}

export function extraerCurado(previo = '') {
  const m = previo.match(/<!-- curado:inicio -->[\s\S]*?<!-- curado:fin -->/);
  return m ? m[0] : '';
}

export function renderInforme({ fecha, desde, items, temas, fuentes, errores = [], ia = null, curado = '', ahora = Date.now(), maxPorDep = 8 }) {
  const utiles = items.filter((it) => !it.ruido && it.departamentos?.length);
  const L = [];
  L.push(`# Vigía · informe ${fecha}`, '');
  L.push(`Lo nuevo desde **${fmtFecha(desde)}** en ${fuentes.length} fuentes. ${utiles.length} ítems relevantes de ${items.length} revisados.`
    + ` Clasificación: ${ia ? `IA (${ia.modelo}, ${ia.llamadas} llamadas) + palabras clave` : 'palabras clave (sin IA)'}.`, '');
  if (curado) L.push(curado, '');

  L.push('## Candidatos a probar', '');
  const cand = candidatos(utiles, { ahora });
  if (!cand.length) L.push('_Nada nuevo pasa el filtro esta semana (≥500 ★, licencia clara, commits recientes, relevante)._', '');
  else {
    L.push('| Qué | Para | Datos | Coste | Riesgo |', '|---|---|---|---|---|');
    for (const c of cand) {
      const dep = temas.departamentos[c.departamentos[0].id].nombre;
      L.push(`| [${md(c.titulo)}](${c.url}) | ${dep} | ${datosRepo(c.repo)} | ${c.evaluacion.coste} | ${c.evaluacion.riesgo}${c.evaluacion.razones.length ? `: ${md(c.evaluacion.razones.join('; '))}` : ''} |`);
    }
    L.push('');
  }

  // Herramientas vigiladas: solo la versión más reciente de cada repo.
  const ultimas = new Map();
  for (const it of items.filter((x) => x.tipo === 'release')) {
    const k = it.repo_ref ?? it.titulo;
    if (!ultimas.has(k) || (it.fecha ?? '') > (ultimas.get(k).fecha ?? '')) ultimas.set(k, { ...it, n: (ultimas.get(k)?.n ?? 0) + 1 });
    else ultimas.get(k).n++;
  }
  if (ultimas.size) {
    L.push('## Novedades de herramientas vigiladas', '');
    for (const it of [...ultimas.values()].sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))) {
      L.push(`- **[${md(it.titulo)}](${it.url})** — ${fmtFecha(it.fecha)}${it.n > 1 ? ` · ${it.n} versiones en el periodo` : ''}${it.repo ? ` · ${datosRepo(it.repo)}` : ''}`);
    }
    L.push('');
  }

  L.push('## Lo nuevo por departamento', '');
  for (const [id, d] of Object.entries(temas.departamentos)) {
    const lista = utiles.filter((it) => it.departamentos[0].id === id && it.tipo !== 'release' && recomendar(it, ahora) !== 'ignorar')
      .sort((a, b) => b.puntaje - a.puntaje).slice(0, maxPorDep);
    if (!lista.length) continue;
    L.push(`### ${d.nombre}`, '');
    for (const it of lista) {
      const porque = it.ia?.porque || porQueSinIa(it, temas);
      const extra = it.repo ? ` — ${datosRepo(it.repo)}` : ` — ${fmtFecha(it.fecha)} · ${it.fuente}`;
      L.push(`- **[${md(it.titulo)}](${it.url})**${extra} · _${recomendar(it, ahora)}_`);
      if (porque) L.push(`  - ${md(porque)}`);
    }
    L.push('');
  }

  if (errores.length) {
    L.push('## Fuentes que fallaron', '');
    for (const e of errores) L.push(`- ${md(e)}`);
    L.push('');
  }
  L.push('---', `_Generado por \`code-os/vigia\`. Recomendaciones automáticas: probar = popular, licencia clara y activo; vigilar = interesante pero falta algo; ignorar = no aplica. Nada se instala sin OK del CEO._`, '');
  return L.join('\n');
}
