// «Decide» (servidor): lo que solo esa persona puede resolver. UNA fuente por rol; la pantalla no calcula permisos.
//   GET  /api/decide                    las decisiones de quien pregunta, ya ordenadas por el reloj del ciclo
//   POST /api/decide/:id/escalar        {a:'ceo'|'coo', nota, v}  deja la decisión en otro nivel (precio/alcance/fechas → CEO; lo demás → COO)
// Aprobar y Pedir cambios NO tienen ruta nueva: pasan por POST /api/entregables/:id/estado, que vuelve a validar todo
// (sesión, rol, área, ficha, criterios y versión: 409 si alguien cambió el entregable). Aquí solo se muestra y se escala.
import * as db from './db.js';
import { guardAny, permiteArea, scoper, levelOf, edits } from './access.js';
import { body } from './http.js';
import { herramientaDe } from '../../public/js/herramientas.js';
import { COLL, AREA_DE, puedeAprobar, faltas, pasoPermitido } from '../../public/js/entregables.js';
import { construirHilo } from '../../public/js/hilo.js';
import { ordenar } from '../../public/js/decide.js';
import { interno } from './entregables.js';

const lc = (x) => String(x || '').toLowerCase();
const AREAS = [...new Set(Object.values(AREA_DE))];
const activaEscalada = (d) => d.escalado && d.escalado.version === (d.version || 1) && !['Aprobado', 'Entregado'].includes(d.estado);

// ¿Esta persona ve este entregable? Misma regla que el hilo: el área, no solo «resumen», y la marca dentro de su alcance.
async function visibles(u) {
  const sc = await scoper(u);
  return (await db.list(COLL)).filter((d) => d && !d.archivado && AREA_DE[d.ws] && permiteArea(u, AREA_DE[d.ws]) && (u.role === 'ceo' || levelOf(u, AREA_DE[d.ws]) !== 'resumen')
    && !(lc(d.client_slug) === 'personal' && u.role !== 'ceo') && (!sc || lc(d.client_slug) === 'inherent' || sc.client(lc(d.client_slug))));
}

export async function decisionesDe(u, { hoy = new Date(), ahora = Date.now() } = {}) {
  const todos = await visibles(u), porCliente = new Map();
  const hiloDe = (slug) => { if (!porCliente.has(slug)) porCliente.set(slug, construirHilo(todos.filter((d) => lc(d.client_slug) === slug), { slug })); return porCliente.get(slug); };
  const items = [];
  for (const d of todos) {
    const tool = herramientaDe(d.tool), enRevision = d.estado === 'En revisión', escalada = activaEscalada(d) && d.escalado.a === u.role;
    const aprueba = enRevision && puedeAprobar(u, tool) && d.tool !== 'offer-architect'; // la oferta se aprueba con su propio bloque (solo CEO)
    if (!aprueba && !escalada) continue;
    const f = aprueba ? faltas(d, await interno.extraDe(d)) : [];
    const nodo = hiloDe(lc(d.client_slug)).nodes.find((n) => n.id === d.id);
    items.push({
      id: d.id, v: d.v, client_slug: d.client_slug, tool: d.tool, area: d.ws, titulo: d.titulo || tool?.nombre || d.tool, version: d.version || 1, estado: d.estado,
      desde: d._meta?.updated_at || '', escaladoPor: escalada ? d.escalado.por : '', escaladoNota: escalada ? d.escalado.nota || '' : '',
      faltas: f, revisar: nodo?.revisar ? nodo.razon : '', llegaAlICP: Boolean(nodo?.llegaAlICP),
      puede: { aprobar: aprueba, cambios: enRevision && Boolean(pasoPermitido('En revisión', 'Borrador')) && edits(u, AREA_DE[d.ws]), escalar: !activaEscalada(d) && edits(u, AREA_DE[d.ws]) && u.role !== 'ceo' },
    });
  }
  return ordenar(items, { hoy, ahora });
}

// El reloj se inyecta solo en pruebas (configurar({ hoy })). La ruta NO acepta fecha por parámetro: nadie adelanta el ciclo desde afuera.
const deps = { hoy: null };
export function configurar(o = {}) { Object.assign(deps, o); }

export function rutas(on) {
  on('GET', 'decide', async (req, res) => {
    const u = await guardAny(req, res, AREAS); if (!u) return;
    if (u.role === 'client') return res.status(403).json({ error: 'Sin acceso' });
    const items = await decisionesDe(u, deps.hoy ? { hoy: deps.hoy() } : {});
    res.json({ items, total: items.length });
  });

  on('POST', 'decide/:id/escalar', async (req, res) => {
    const { cur, u } = await interno.deDoc(req, res, { write: true, cierra: false }); if (!u) return;
    const b = body(req), a = lc(b.a), nota = String(b.nota ?? '').replace(/\s+/g, ' ').trim().slice(0, 400);
    if (!['ceo', 'coo'].includes(a)) return res.status(400).json({ error: 'Escala al CEO o al COO', code: 'DESTINO' });
    if (a === u.role) return res.status(409).json({ error: 'Ya estás en ese nivel', code: 'MISMO_NIVEL' });
    if (a === 'coo' && u.role === 'ceo') return res.status(409).json({ error: 'El CEO decide: no se escala hacia abajo', code: 'HACIA_ABAJO' });
    if (['Aprobado', 'Entregado'].includes(cur.estado)) return res.status(409).json({ error: 'Ya está aprobado: no hay nada que decidir', code: 'PASO' });
    if (b.v == null || Number(b.v) !== cur.v) return res.status(409).json({ error: 'Alguien lo cambió justo ahora. Recarga y vuelve a intentar.', code: 'CONFLICTO' });
    const escalado = { a, por: u.email, en: new Date().toISOString(), nota, version: cur.version || 1 };
    const data = { ...cur, escalado, historial: [...interno.hist(cur), interno.entrada(u, 'escalar', cur.version, [`→ ${a.toUpperCase()}`, nota].filter(Boolean).join(' · '))] };
    const d = await interno.guardar(res, cur, data, b, u); if (!d) return;
    res.json(interno.salida(u, d));
  });
}
