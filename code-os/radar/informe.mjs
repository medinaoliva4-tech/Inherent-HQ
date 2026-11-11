// Salida: radar.json (todo), radar.md (para leer) y nodos para el hilo del cliente (tipo `radar`).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const fmt = (x) => (x === null || x === undefined ? '—' : Number(x) >= 1e6 ? `${(x / 1e6).toFixed(1)} M` : Number(x) >= 1e3 ? `${(x / 1e3).toFixed(1)} k` : String(x));
const pct = (x) => (x === null || x === undefined ? '—' : `${(x * 100).toFixed(1)} %`);
const celda = (t = '') => String(t).replace(/\|/g, '/').replace(/\s+/g, ' ').trim();

/** Nodos del hilo (diseño §4): uno por winner, siempre `hipotesis` hasta que una persona lo apruebe. */
export function nodosRadar(posts, { cliente = null, generado }) {
  return posts.filter((p) => p.winner).map((p) => ({
    id: `radar:${p.clave}`,
    cliente,
    tipo: 'radar',
    titulo: `${p.cuenta} (${p.plataforma}): ${p.gancho?.gancho || p.titulo || p.id}`.slice(0, 140),
    contenido: {
      url: p.url, fecha: p.fecha, rol_referente: p.rol, x_cuenta: p.metricas.x_cuenta, engagement: p.metricas.engagement,
      gancho: p.gancho?.gancho ?? null, tipo_gancho: p.gancho?.tipo ?? null, angulo: p.gancho?.angulo ?? null,
      por_que: p.gancho?.por_que ?? null, quemado: p.quemado?.estado ?? 'sin-huella',
    },
    estado: 'hipotesis',
    fuente: p.url,
    viene_de: [],
    version: 1,
    actualizado: generado,
  }));
}

export function markdown(r) {
  const l = [];
  l.push(`# Radar${r.cliente ? ` · ${r.cliente}` : ''}`, '', `Generado: ${r.generado} · ${r.posts.length} publicaciones de ${r.referentes.length} referentes · ${r.estadisticas.segundos_total} s`, '');
  l.push('Métricas públicas. `× cuenta` = cuánto rinde frente a la mediana de su propia cuenta. Winner = ≥ ' + r.umbrales.winner + '× con al menos 3 publicaciones de muestra.', '');
  l.push('| # | Cuenta | Red | Fecha | Vistas | Eng. | × cuenta | Dur. | Gancho | Quemado |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const p of r.posts) {
    const g = p.gancho?.gancho ? `${p.gancho.gancho}${p.gancho.tipo ? ` *(${p.gancho.tipo})*` : ''}` : '—';
    l.push(`| ${p.rango}${p.winner ? ' 🏆' : ''} | [${celda(p.cuenta)}](${p.url}) | ${p.plataforma} | ${p.fecha?.slice(0, 10) ?? '—'} | ${fmt(p.vistas)} | ${pct(p.metricas.engagement)} | ${p.metricas.x_cuenta ?? '—'}${p.metricas.joven ? ' ⏳' : ''} | ${p.duracion_s ?? '—'}s | ${celda(g).slice(0, 120)} | ${p.quemado?.estado ?? '—'} |`);
  }
  if (r.errores.length) {
    l.push('', '## No se pudo leer', '');
    for (const e of r.errores) l.push(`- ${e.plataforma} · ${e.usuario}: **${e.codigo}** — ${celda(e.mensaje)}`);
  }
  l.push('', '## Corrida', '', `- Éxito: ${r.estadisticas.exito_publicaciones}/${r.estadisticas.publicaciones} publicaciones con métricas; transcripción ${r.estadisticas.con_transcripcion}; huella visual ${r.estadisticas.con_huella_visual}; huella de audio ${r.estadisticas.con_huella_audio}.`);
  l.push(`- IA (${r.ia.nivel}): ${r.ia.llamadas} llamadas, ${r.ia.tokens} tokens, US$ ${r.ia.usd}${r.ia.omitidas ? `, ${r.ia.omitidas} omitidas por tope` : ''}.`);
  l.push(`- Video bajado: ${r.estadisticas.descarga_mb} MB (se borra tras sacar huellas).`);
  l.push('', '_⏳ = publicada hace menos de 3 días: sus métricas siguen creciendo. Los nodos del hilo salen como `hipotesis`: una persona los aprueba._');
  return l.join('\n') + '\n';
}

export function escribirSalida(dir, r) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'radar.json'), JSON.stringify(r, null, 2));
  writeFileSync(join(dir, 'radar.md'), markdown(r));
  writeFileSync(join(dir, 'nodos-radar.json'), JSON.stringify(r.nodos, null, 2));
}
