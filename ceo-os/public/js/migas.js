// La dirección de arriba: dónde estás y cómo volver. Pura: los nombres llegan de afuera.
const SUB = { meta: 'Mapa de la Meta', voz: 'Voz del comprador', embudo: 'Embudo', rentabilidad: 'Rentabilidad', radar: 'Radar', resultados: 'Resultados', costo: 'Costo y entrega', movimientos: 'Movimientos', notas: 'Notas', agents: 'Agentes' };
export function migasDe(url, n = {}) {
  const p = String(url || '').split('/').filter(Boolean), cliente = (s) => n.cliente?.(s) || String(s).toUpperCase();
  if (p[0] === 'ws') {
    const [, area, slug, tab, tool] = p, base = `#/ws/${area}/${slug}`;
    if (!slug) return [{ t: n.area?.(area) || area, r: `#/areas/${area}` }];
    const out = [{ t: 'Clientes', r: '#/org/clients' }, { t: cliente(slug), r: `#/org/clients/${slug}` }, { t: n.area?.(area) || area, r: `${base}/overview` }];
    if (tab && tab !== 'overview') out.push({ t: n.pestana?.(area, tab) || tab, r: `${base}/${tab}` });
    if (tool) out.push({ t: n.herramienta?.(tool) || tool, r: `${base}/${tab}/${tool}` });
    return out;
  }
  if (p[0] === 'areas') {
    const out = [{ t: 'Áreas', r: '#/areas' }, { t: n.area?.(p[1]) || p[1], r: `#/areas/${p[1]}` }];
    if (p[2]) out.push({ t: SUB[p[2]] || p[2], r: `#/areas/${p[1]}/${p[2]}` });
    return out;
  }
  const q = p[0] === 'org' ? p.slice(1) : p;
  if (q[0] === 'clients') return q[1] ? [{ t: 'Clientes', r: '#/org/clients' }, { t: cliente(q[1]), r: `#/org/clients/${q[1]}` }] : [{ t: 'Clientes', r: '#/org/clients' }];
  return n.pagina ? [{ t: n.pagina, r: `#/${p.join('/')}` }] : [];
}
