// Marketing Performance Center (servidor): GET marketing/:slug/kpis?mes=AAAA-MM. Junta, para un cliente y un mes, lo que ya existe en el OS:
// alcance, views y ER (Windsor · Instagram), leads por fuente (el CRM), publicadas vs planeadas (el calendario y el Plan del mes) y, solo para
// quien ve costos, gasto vs presupuesto, CPA y ROAS (Windsor · pauta). Las cuentas y las reglas viven en public/js/marketing/kpis.js.
// Acceso: guard 'content' sin cerrar la vista «resumen» (esta es la única ruta de Marketing que la deja pasar: el rendimiento es lo único que
// ve) · alcance por cliente (scoper) · la marca «personal» solo el CEO. Es solo lectura: nunca escribe en una plataforma de anuncios.
// Gasto, presupuesto, CPA y ROAS: solo quien ve costos (seesCosts: CEO, COO o quien edita Clientes); a los demás ni se piden a Windsor.
// Lo que falta es null con su fuente (⚠️ SIN DATOS), nunca 0.
import * as db from './db.js';
import * as content from './content.js';
import * as ads from './ads.js';
import { guard, scoper, seesCosts } from './access.js';
import { personalOk } from './leer.js';
import { hoyGT } from '../../public/js/avisos-reglas/base.js';
import { COLL_P, idPlan, mesOk } from '../../public/js/plan-mes.js';
import { armarKpis, piezasDelMes, tablaDe, embudoDe, FUENTE_COSTOS, mesDe } from '../../public/js/marketing/kpis.js';

// Constante local, como en entregables.js: el slug es el nombre de la carpeta del cliente (sin «_» al inicio).
const slugOk = (s) => /^[a-z0-9][\w-]{1,59}$/.test(String(s || ''));
const DIA = 864e5;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const restaDias = (fecha, n) => iso(Date.parse(`${fecha}T12:00:00Z`) - n * DIA);
const suma = (l, campo) => l.reduce((a, x) => a + (Number.isFinite(+x[campo]) ? +x[campo] : 0), 0);

// Memoria corta: lo de Windsor es lento y no cambia en minutos. Se guarda la promesa (varias peticiones juntas comparten una sola lectura)
// y se olvida si falla. Solo guarda datos del cliente que ya pasó el alcance en cada petición.
const MEMO = new Map();
function memo(clave, ms, fn) {
  const h = MEMO.get(clave);
  if (h && Date.now() - h.at < ms) return h.p;
  if (MEMO.size > 200) MEMO.clear();
  const p = Promise.resolve().then(fn);
  MEMO.set(clave, { at: Date.now(), p });
  p.catch(() => MEMO.delete(clave));
  return p;
}
// Una fuente que falla no tumba el tablero: sale su aviso y las demás siguen.
const seguro = async (fn, vacio) => { try { return await fn(); } catch (e) { console.error('marketing/kpis', e?.message || e); return vacio; } };

// ---------- Instagram (Windsor) ----------
// Alcance y views del mes salen de la serie diaria de 90 días; el ER, de los posts de los últimos 30 días (solo el mes en curso: Windsor
// entrega ventanas móviles, no meses calendario).
const handlesDe = (slug) => memo(`handles:${slug}`, 10 * 60e3, async () => {
  const picked = (await content.cfg(slug)).ig_account;
  if (picked) return [picked];
  const p = (await content.profiles()).find((x) => x.slug === slug);
  if (!p) return null;
  return (await content.profile(p)).own.filter((a) => a.red === 'instagram').map((a) => a.handle);
});
async function instagramDe(slug, mes, hoy) {
  if (!content.windsorOn()) return { conectado: false, razon: 'Windsor todavía no está conectado' };
  if (mes > hoy.slice(0, 7)) return { conectado: true, razon: 'Ese mes todavía no llega' };
  const handles = await handlesDe(slug);
  if (handles === null) return { conectado: true, razon: 'Este cliente no tiene perfil de contenido (su carpeta en clients/)' };
  if (!handles.length) return { conectado: true, razon: 'Las cuentas de Instagram del cliente (su LINKS.md o Contenido → Fuentes)' };
  const hint = slug === 'personal' ? '' : slug, actual = mes === hoy.slice(0, 7);
  const [i90, i30] = await Promise.all([memo(`ig:${slug}:90`, 10 * 60e3, () => content.instagram(handles, 90, hint)), actual ? memo(`ig:${slug}:30`, 10 * 60e3, () => content.instagram(handles, 30, hint)) : null]);
  if (!i90.matched) return { conectado: true, cuentas: handles, razon: 'Windsor todavía no trae datos de esas cuentas' };
  const out = { conectado: true, cuentas: handles };
  // Un mes que empezó antes de la ventana de 90 días no se puede sumar completo: se dice, no se suma a medias.
  const cubre = `${mes}-01` >= restaDias(hoy, 89), delMes = (i90.series || []).filter((x) => mesDe(x.date) === mes);
  if (!cubre) out.razon = 'Windsor solo entrega los últimos 90 días';
  else if (!delMes.length) out.razon = 'Windsor no trae días de este mes para esas cuentas';
  else { out.alcance = suma(delMes, 'reach'); out.views = suma(delMes, 'views'); out.nota = `${delMes.length} ${delMes.length === 1 ? 'día' : 'días'} con datos de Windsor`; }
  if (actual && i30?.matched) {
    out.interacciones = i30.eng; out.alcancePosts = i30.engReach;
    out.notaEr = i30.erDays === 30 ? 'Posts de los últimos 30 días (ventana móvil de Windsor, no el mes calendario)' : 'Sin posts en los últimos 30 días: es el de los últimos 90 (ventana móvil de Windsor)';
  } else out.razonEr = actual ? 'Windsor todavía no trae posts de esas cuentas' : 'Windsor entrega el engagement por ventana móvil (7, 30 o 90 días): el de un mes que ya cerró sale de su reporte guardado';
  return out;
}

// ---------- Leads (el CRM) ----------
// Los leads de un cliente: los que llevan su client_slug y los que entraron por una landing suya conectada al CRM (tech › intake.fuente).
// Los prospectos que salimos a buscar (etapa «Prospecto») no cuentan, como en el portal. Aquí solo se cuentan: nada de nombres ni contactos.
const mesDeLead = (l) => { const t = Date.parse(l?._meta?.created_at || l?.activity?.[0]?.at || ''); return Number.isFinite(t) ? hoyGT(new Date(t)).slice(0, 7) : ''; };
async function leadsDe(slug, mes) {
  const [todos, sitios] = await Promise.all([db.list('leads'), db.list('tech').catch(() => [])]);
  const landings = new Set(sitios.filter((s) => s.kind === 'sitio' && s.profile === slug && !s.archivado && s.intake?.fuente).map((s) => s.intake.fuente));
  const suyos = todos.filter((l) => !l.archived && (l.client_slug === slug || (l.source_id && landings.has(l.source_id))));
  if (!suyos.length && !landings.size) return { conectado: false, razon: 'Ningún lead lleva a este cliente: conecta su landing al CRM (Funnel Builder › Sitios y landings) o márcalos con su cliente' };
  const delMes = suyos.filter((l) => (l.stage || 'Nuevo') !== 'Prospecto' && mesDeLead(l) === mes);
  const por = new Map();
  for (const l of delMes) { const k = String(l.source || '').trim() || 'Sin fuente'; por.set(k, (por.get(k) || 0) + 1); }
  return { conectado: true, total: delMes.length, porFuente: [...por].map(([fuente, n]) => ({ fuente, n })).sort((a, z) => z.n - a.n || a.fuente.localeCompare(z.fuente, 'es')) };
}

// ---------- La pauta (Windsor · solo lectura; solo quien ve costos) ----------
// El gasto del mes sale de la serie diaria de 90 días. El CPA y el ROAS, de la ventana móvil de 30 días (conversiones y valor no vienen por día):
// solo en el mes en curso, y la nota lo dice.
async function pautaDe(slug, mes, hoy, sc) {
  const acc = await db.get('accounts', `acc-${slug}`).catch(() => null), a = acc?.ads || {};
  const presupuesto = +a.budget > 0 ? +a.budget : null;
  const out = { presupuesto, aprobado: presupuesto === null ? null : Boolean(a.ok && a.ok.month === mes && +a.ok.budget === presupuesto) };
  if (presupuesto === null) out.razonPresupuesto = 'el presupuesto mensual del cliente (lo pone ⑩ Ads en las cuentas de pauta)';
  if (![a.meta, a.google, a.linkedin].some(Boolean)) return { ...out, conectado: false, razon: 'Las cuentas de pauta del cliente (las conecta ⑩ Ads)' };
  if (!ads.windsorOn()) return { ...out, conectado: false, razon: 'Windsor todavía no está conectado' };
  if (mes > hoy.slice(0, 7)) return { ...out, conectado: true, razon: 'Ese mes todavía no llega' };
  const actual = mes === hoy.slice(0, 7);
  // costos: true porque solo llega aquí quien ve costos; tabla: false porque no hace falta la tabla por campaña (otra lectura de Windsor).
  const [r90, r30] = await Promise.all([ads.report(90, { sc, costos: true, tabla: false }), actual ? ads.report(30, { sc, costos: true, tabla: false }) : null]);
  const c90 = r90?.on ? r90.clients.find((c) => c.slug === slug) : null;
  if (!c90 || !Object.keys(c90.plats || {}).length) return { ...out, conectado: true, razon: 'Windsor no trae datos de esas cuentas de pauta' };
  const cubre = `${mes}-01` >= restaDias(hoy, 89), delMes = (c90.series || []).filter((x) => mesDe(x.date) === mes);
  if (!cubre) out.razonGasto = 'Windsor solo entrega los últimos 90 días';
  else if (!delMes.length) out.razonGasto = 'Windsor no trae gasto de esas cuentas en este mes';
  else { out.gasto = Math.round(suma(delMes, 'spend') * 100) / 100; out.notaGasto = 'En la moneda de la cuenta de pauta'; }
  const c30 = actual ? r30?.clients?.find((c) => c.slug === slug) : null;
  if (c30?.total) {
    // tiene (de ads.report): ¿Windsor mandó el campo? Sin él, conversiones y valor son un dato que falta, no un cero.
    const t = c30.total, tiene = t.tiene || { conv: true, rev: true };
    out.gastoVentana = t.spend; out.conversiones = tiene.conv ? t.conv : null; out.ingresos = tiene.rev ? t.rev : null;
    out.notaVentana = 'Ventana móvil de 30 días de Windsor, no el mes calendario';
    if (!tiene.conv) out.razonCpa = 'Windsor no manda las conversiones de esas cuentas';
    else if (!(t.conv > 0)) out.razonCpa = 'Windsor no trae conversiones de la pauta en esos 30 días';
    if (!tiene.rev) out.razonRoas = 'Windsor no manda el valor de las conversiones de esas cuentas';
    else if (!(t.rev > 0)) out.razonRoas = 'Windsor no trae el valor de las conversiones de la pauta en esos 30 días';
  } else out.razonConversiones = actual ? 'Windsor no trae datos de esas cuentas en los últimos 30 días' : 'Windsor entrega ventanas móviles (7, 30 o 90 días): el CPA y el ROAS de un mes que ya cerró salen de su reporte guardado';
  return { ...out, conectado: true };
}

export function rutas(on) {
  on('GET', 'marketing/:slug/kpis', async (req, res) => {
    const u = await guard(req, res, 'content'); if (!u) return; // «resumen» pasa: el rendimiento es lo único que esa vista ve
    const slug = String(req.params.slug || '').toLowerCase();
    if (!slugOk(slug)) return res.status(400).json({ error: 'Cliente inválido' });
    if (!personalOk(u, slug)) return res.status(404).json({ error: 'Esa marca no está entre las tuyas' });
    const hoy = hoyGT(), mes = req.query.mes ? String(req.query.mes) : hoy.slice(0, 7);
    if (!mesOk(mes)) return res.status(400).json({ error: 'Mes inválido: usa AAAA-MM' });
    const sc = await scoper(u);
    if (sc && slug !== 'inherent' && !sc.client(slug)) return res.status(404).json({ error: 'Ese cliente no está entre los tuyos' });
    const verCostos = seesCosts(u);

    const [ig, leads, piezas, pauta] = await Promise.all([
      seguro(() => instagramDe(slug, mes, hoy), { conectado: null, razon: 'Windsor no respondió: inténtalo en un momento' }),
      seguro(() => leadsDe(slug, mes), { conectado: null, razon: 'No pude leer el CRM: inténtalo en un momento' }),
      seguro(async () => { const [posts, plan] = await Promise.all([db.list('content'), db.get(COLL_P, idPlan(slug, mes)).catch(() => null)]); return piezasDelMes({ posts, plan, slug, mes }); }, []),
      verCostos ? seguro(() => pautaDe(slug, mes, hoy, sc), { conectado: null, razon: 'Windsor no respondió: inténtalo en un momento' }) : null,
    ]);
    const kpis = armarKpis({ ig, leads, ads: pauta || {}, piezas }, { verCostos });
    res.json({
      slug, mes, hoy, costos: verCostos, kpis,
      tabla: tablaDe(piezas),
      embudo: embudoDe(piezas, { alcance: ig.alcance, interacciones: ig.interacciones, leads: leads.total, razon: { TOF: ig.razon, MOF: ig.razonEr || ig.razon, BOF: leads.razon } }),
      fuentes: {
        windsor: { conectado: ig.conectado ?? null, de_donde: ig.alcance != null ? `Windsor · Instagram${ig.cuentas?.length ? ` (${ig.cuentas.map((h) => `@${h}`).join(', ')})` : ''}` : ig.razon || 'Windsor · Instagram' },
        ads: verCostos ? { conectado: pauta?.conectado ?? null, de_donde: pauta?.gasto != null ? 'Windsor · pauta' : pauta?.razon || pauta?.razonGasto || 'Windsor · pauta' } : { oculto: true, de_donde: FUENTE_COSTOS },
        leads: { conectado: leads.conectado ?? null, de_donde: leads.conectado ? 'CRM de Inherent OS' : leads.razon || 'El CRM' },
      },
    });
  });
}

