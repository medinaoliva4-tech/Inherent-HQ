// El ojo visual (servidor): lo que el puente de la compu necesita para decir si una imagen se parece a la marca.
//   GET ojo/contexto?profile=<marca> → { refs: [urls del moodboard], texto: la marca en una frase (colores, tono, lo que dice su design system) }
// El juicio lo hace el puente (CLIP, en 127.0.0.1:7357/ver); aquí solo se arma el contexto, con la misma puerta que el resto de la marca.
import * as db from './db.js';
import { readFile } from './gh.js';
import { abreMarca } from './creacion.js';
import { marcaDe } from '../../public/js/element.js';
import { leerSistema, plano } from '../../public/js/sistema-visual.js';

const HTTPS = /^https:\/\/[^\s"'<>]+$/;
const root = (slug) => (slug === 'inherent' ? 'inherent/inherent-social-media' : `clients/${slug}`);

export async function contexto(slug) {
  const board = await db.get('brand_boards', slug).catch(() => null);
  const refs = (board?.images || []).map((i) => i?.url).filter((u) => HTTPS.test(String(u || ''))).slice(0, 24);
  let sis = null;
  if (slug !== 'personal') { const f = await readFile(`${root(slug)}/02-marca/sistema-visual.md`); if (f) sis = leerSistema(f.content); }
  const colores = (sis?.colores || []).slice(0, 4).map((c) => c.nombre).filter(Boolean);
  const tono = (board?.tone || []).filter(Boolean).slice(0, 3);
  const partes = [`brand imagery of ${marcaDe(slug)}`, colores.length ? `colors ${colores.join(', ')}` : '', tono.length ? `${tono.join(', ')} mood` : '', plano((sis?.intro || [])[0] || '').slice(0, 120)].filter(Boolean);
  return { refs, texto: partes.join('; ').slice(0, 300), con: { moodboard: refs.length, colores: colores.length, tono: tono.length } };
}

export function rutas(on) {
  on('GET', 'ojo/contexto', async (req, res) => {
    const slug = String(req.query.profile || ''), u = await abreMarca(req, res, slug); if (!u) return;
    res.json(await contexto(slug));
  });
}
