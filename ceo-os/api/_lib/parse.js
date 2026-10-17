// Lee las tablas del manual y las convierte en datos. Si el manual cambia, el dashboard cambia.
export const clean = (s) => String(s ?? '').replace(/\*\*|\*|`/g, '').replace(/\s+/g, ' ').trim();
const word = (s) => clean(s).replace(/[^\p{L}\p{N} ·\/().$,%-]/gu, '').replace(/\s+/g, ' ').trim();

export const q = (s) => { const m = String(s).match(/Q\s?([\d,]+(?:\.\d+)?)/); return m ? +m[1].replace(/,/g, '') : null; };
const usd = (s) => { const m = String(s).match(/\(\$([\d,]+)\)/); return m ? +m[1].replace(/,/g, '') : null; };
const pct = (s) => { const m = String(s).match(/(\d+(?:\.\d+)?)\s?%/); return m ? +m[1] : null; };
const int = (s) => { const m = clean(s).match(/\d+/); return m ? +m[0] : null; };

export function tables(md) {
  const out = [];
  let heading = '', cur = null;
  for (const line of md.split('\n')) {
    const h = /^#{1,4}\s+(.*)/.exec(line);
    if (h) heading = clean(h[1]);
    if (/^\s*\|/.test(line)) {
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      if (!cur) { cur = { heading, rows: [] }; out.push(cur); }
      cur.rows.push(cells);
    } else cur = null;
  }
  return out;
}

const findRow = (t, label) => t.rows.find((r) => clean(r[0]).toLowerCase().startsWith(label.toLowerCase()));
// Ids de los planes del esquema anterior: solo para leer tablas de costos viejas; el manual de hoy habla de niveles (public/js/levels.js).
const PLAN_IDS = ['marketing', 'pro', 'accelerate', 'compound'];

export function parseEconomia(md) {
  const all = tables(md);
  const costT = all.find((t) => findRow(t, 'Grabación') && findRow(t, 'COSTO') && findRow(t, 'MARGEN'));
  if (!costT) return { error: 'No encontré la tabla de costos en 06-ECONOMIA.md' };
  const head = costT.rows[0];
  const iPrecio = costT.rows.findIndex((r) => clean(r[0]).toLowerCase() === 'precio');
  const iCosto = costT.rows.findIndex((r) => clean(r[0]).toUpperCase() === 'COSTO');
  const rubroRows = costT.rows.slice(iPrecio + 1, iCosto);

  const volT = all.find((t) => findRow(t, 'TOTAL piezas/mes'));
  const promT = all.find((t) => findRow(t, 'Qué promete'));
  const vol = (label) => (volT && findRow(volT, label)) || null;

  const plans = PLAN_IDS.map((id, i) => {
    const c = i + 1;
    const rubros = rubroRows.map((r) => ({ label: clean(r[0]), monto: q(r[c]) ?? 0, nota: clean(r[c]) }));
    const sum = rubros.reduce((a, r) => a + r.monto, 0);
    const costo = q(findRow(costT, 'COSTO')[c]);
    const precio = q(costT.rows[iPrecio][c]);
    const utilidad = q(findRow(costT, 'UTILIDAD')[c]);
    const piezas = vol('TOTAL piezas/mes') ? int(vol('TOTAL piezas/mes')[c]) : null;
    return {
      id, name: word(head[c]).replace(/^[^A-Z]*/, ''),
      precio, precioUsd: usd(costT.rows[iPrecio][c]),
      rubros, costo, utilidad, margen: pct(findRow(costT, 'MARGEN')[c]),
      costoPorPieza: q(findRow(costT, 'Costo por pieza')?.[c] ?? ''),
      checks: { sumaRubros: sum, cuadra: sum === costo && precio - costo === utilidad },
      volumen: volT ? {
        videosPlanificados: int(vol('Videos planificados')?.[c] ?? ''),
        derivados: int(vol('Videos derivados')?.[c] ?? ''),
        estaticos: int(vol('Estáticos')?.[c] ?? ''),
        stories: int(vol('Stories')?.[c] ?? ''),
        piezas,
        grabacion: clean(vol('Grabación')?.[c] ?? ''),
        variantes: clean(vol('Variantes')?.[c] ?? ''),
        revisiones: clean(vol('Revisiones')?.[c] ?? ''),
      } : null,
      promete: promT ? clean(findRow(promT, 'Qué promete')[c]) : '',
      hace: promT ? clean(findRow(promT, 'Qué hacemos')?.[c] ?? '') : '',
      incluye: promT ? clean(findRow(promT, 'Qué incluye')?.[c] ?? '') : '',
    };
  });

  // El piso mensual de la empresa (bloque de texto) y el costo de scraping por cliente.
  const pisoIdx = md.indexOf('El piso mensual de la empresa');
  const pisoBlock = pisoIdx >= 0 ? md.slice(pisoIdx, pisoIdx + 600) : '';
  const piso = {};
  for (const m of pisoBlock.matchAll(/^(CEO|IA|Scraping)\s+Q\s*([\d,]+)/gm)) piso[m[1].toLowerCase()] = +m[2].replace(/,/g, '');
  const sc = md.replace(/\*/g, '').match(/~Q([\d.]+)\s*🔷\s*·\s*~Q([\d.]+)\s*🟨/);
  const scraping = sc ? { marketing: +sc[1], growth: +sc[2] } : null;

  return { plans, piso, scraping, tipoCambio: plans[0].precioUsd ? +(plans[0].precio / plans[0].precioUsd).toFixed(2) : null };
}

export function parseOperacion(md) {
  const all = tables(md);
  const roles = all.find((t) => t.heading.includes('Los roles'))?.rows.slice(1).map((r) => ({
    rol: clean(r[0]), hace: clean(r[1]), cobra: clean(r[2]),
  })) || [];
  const slots = all.find((t) => t.heading.includes('Los slots'))?.rows.slice(1).map((r) => ({
    slot: clean(r[0]), hoy: clean(r[1]),
  })) || [];
  return { roles, slots };
}

// Un cliente = clients/<slug>/00-onboarding/plan-contratado.md
export function parsePlanContratado(md, role) {
  const all = tables(md);
  const first = all[0];
  const fields = [];
  let costo = null;
  for (const r of first?.rows.slice(1) || []) {
    const key = clean(r[0]);
    const val = clean(r[1]);
    if (!key) continue;
    if (/costo/i.test(key) || String(r[0]).includes('🔒')) { costo = q(r[1]); if (role !== 'ceo') continue; }
    if (/^precio$/i.test(key) && role === 'team') continue;
    fields.push({ key: key.replace(/🔒\s*/, ''), value: val, secret: /costo/i.test(key) });
  }
  const pip = all.find((t) => /pipeline/i.test(t.heading));
  return {
    plan: fields.find((f) => /^plan$/i.test(f.key))?.value || '',
    precio: role === 'team' ? null : q(String(first?.rows.find((r) => /^precio$/i.test(clean(r[0])))?.[1] ?? '')),
    costo: role === 'ceo' ? costo : null,
    fields,
    pipeline: pip ? pip.rows.slice(1).map((r) => ({ paso: clean(r[0]), que: clean(r[1]) })) : [],
  };
}
