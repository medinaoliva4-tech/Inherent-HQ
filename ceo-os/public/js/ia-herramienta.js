// El adaptador único de IA de las herramientas (PLAN-WORKSPACES §5.3). Arma el prompt (el harness del modo del workspace +
// lo que pide la herramienta), elige el camino que esta compu tiene —Hermes, el puente de Laya o claude.ai— y devuelve el
// texto tal cual. No guarda ni limpia nada: lo que dice un modelo es dato no confiable hasta que la herramienta lo lee con su
// leer() y la persona lo revisa (el Tool Shell lo hace). Existe para que ninguna herramienta hable con una IA por su cuenta.
import { api, today, ask, openClaude } from './core.js';
import { hermesDe, saludHermes, chatHermes, pasoHermes } from './hermes.js';
import { saludPuente, tokenDe, preguntar } from './puente-chat.js';
import { motorDe, nombreMotor } from './motor-ui.js';
import { sistemaDe, idSesion } from './llm/modos.js';
import { WORKSPACES } from './herramientas.js';
import { nombreContexto } from './contexto.js';

const enc = encodeURIComponent;
const texto = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const abortar = (m = 'Cancelado.') => Object.assign(new Error(m), { name: 'AbortError' });

// El modo del Chat (llm/modos.js) del workspace al que pertenece la herramienta.
function modoDe(tool) {
  const modo = WORKSPACES.find((w) => w.id === tool?.ws)?.modo;
  if (!modo) throw new Error('Esta herramienta no pertenece a ningún workspace');
  return modo;
}
// La carpeta del cliente en el repo (la misma regla de intel.rootOf en el servidor).
const carpetaDe = (slug) => (!slug ? '' : slug === 'inherent' ? 'inherent/inherent-social-media' : 'clients/' + slug);

// ---------- Qué camino usaría hoy (sin correr nada) ----------
// → 'hermes' | 'puente' | 'claude-web'
export async function caminoIA(me) {
  if (hermesDe(me) && (await saludHermes(me)).auth) return 'hermes';
  if (tokenDe(me) && (await saludPuente(4000)).listo) return 'puente';
  return 'claude-web';
}

// ---------- claude.ai: la persona lleva el pedido y pega la respuesta ----------
// Se pega la respuesta completa (con su bloque y sus criterios) y se entrega sin tocar: leer() la lee. Si lo pegado es solo el
// JSON, se envuelve como bloque de la herramienta (como hace ads-ui.js). No se usa claudeJSON: con dos bloques en la respuesta
// su regex junta los dos JSON en uno que no se puede leer.
async function pegarDeClaude(tool, prompt) {
  const cabe = openClaude(prompt);
  const v = await ask(tool.nombre, [{ k: 'out', t: 'textarea', req: true, l: (cabe ? '' : 'El prompt quedó copiado: pégalo en tu Claude. ') + 'Se abrió tu Claude Code con todo listo: dale enviar. Cuando responda, copia su respuesta completa y pégala aquí.' }], 'Listo');
  if (!v) return null;
  const t = String(v.out || '').trim();
  const fence = '`'.repeat(3);
  if (t.includes(fence + tool.bloque)) return t;
  try { const m = t.match(/[[{][\s\S]*[\]}]/); const obj = JSON.parse(m ? m[0] : t); if (obj && typeof obj === 'object') return `${fence}${tool.bloque}\n${JSON.stringify(obj)}\n${fence}`; } catch {}
  return t; // sin bloque: la herramienta dirá que no vino y la persona decide
}

// ---------- Correr la IA ----------
// → { texto, via: 'hermes'|'puente'|'claude-web', modelo }. preferir fuerza un camino (y falla si no está listo).
export async function correrIA(me, { tool, ctx, signal, onDelta = () => {}, onTool = () => {}, preferir } = {}) {
  if (typeof tool?.prompt !== 'function') throw new Error('Esta herramienta todavía no sabe pedirle algo a la IA');
  const c = ctx || {}, slug = c.cliente?.slug || '';
  const sistema = sistemaDe(modoDe(tool), { cliente: c.cliente?.nombre, carpeta: carpetaDe(slug), nivel: c.cliente?.nivel?.nombre, fecha: c.hoy });
  const mensaje = tool.prompt(c);
  const forzado = ['hermes', 'puente', 'claude-web'].includes(preferir) ? preferir : '';
  const vacio = () => new Error('La IA no devolvió nada. Reintenta.');

  // 1) Hermes: el harness en esta compu, con el modelo que la persona eligió en el Chat.
  if (!forzado || forzado === 'hermes') {
    const listo = hermesDe(me) && (await saludHermes(me)).auth;
    if (listo) {
      const mo = motorDe(me), elegido = mo.motor === 'hermes' ? mo : null;
      const out = await chatHermes(me, { sesion: idSesion(modoDe(tool), slug), sistema, mensaje, modelo: elegido ? { model: elegido.modelo, provider: elegido.provider } : {}, signal, onDelta, onTool: (n) => onTool(pasoHermes(n)) });
      if (!String(out || '').trim()) throw vacio();
      return { texto: out, via: 'hermes', modelo: (elegido?.modelo ? nombreMotor(elegido) : 'Hermes').slice(0, 80) };
    }
    if (forzado) throw new Error(hermesDe(me) ? 'Hermes no está encendido en esta compu o su llave no sirve' : 'Hermes no está conectado en esta compu');
  }

  // 2) El puente de Laya (Claude de esta compu, solo lectura).
  if (!forzado || forzado === 'puente') {
    const token = tokenDe(me), s = token ? await saludPuente(4000) : null;
    if (token && s?.listo) {
      const out = await preguntar({ prompt: sistema + '\n\n' + mensaje, token, signal, onDelta, onTool });
      if (!String(out || '').trim()) throw vacio();
      return { texto: out, via: 'puente', modelo: 'Claude · puente' };
    }
    if (forzado) throw new Error(!token ? 'Esta compu no está emparejada con el puente' : typeof s?.ayuda === 'string' && s.ayuda ? s.ayuda : 'El puente de tu compu no está listo para chatear');
  }

  // 3) claude.ai con la cuenta de la persona: siempre disponible, a mano.
  // ⟵ PUNTO DE CAMBIO (decisión 7.1): aquí entra la rama via:'servidor', antes de pedirle nada a la persona.
  const pegado = await pegarDeClaude(tool, sistema + '\n\n' + mensaje);
  if (pegado == null) throw abortar();
  if (!pegado.trim()) throw vacio();
  return { texto: pegado, via: 'claude-web', modelo: 'Claude · claude.ai' };
}

// ---------- Correr un pedido que no es de una herramienta (Agent Area) ----------
// Mismo orden y mismas vías que correrIA (Hermes → puente → claude.ai): el Agent Area no habla con una IA por su cuenta.
// → { texto, via, modelo }. `bloque` es el nombre del bloque que se pide en la respuesta (para pegar desde claude.ai).
export async function correrPedido(me, { modo = 'estrategia', slug = '', nombre = 'Agent Area', bloque = 'etapa', mensaje, signal, onDelta = () => {}, onTool = () => {}, preferir } = {}) {
  return correrIA(me, { tool: { ws: WORKSPACES.find((w) => w.modo === modo)?.id || 'strategy', nombre, bloque, prompt: () => mensaje }, ctx: { cliente: slug ? { slug } : null, hoy: today() }, signal, onDelta, onTool, preferir });
}

// ---------- El contexto de una herramienta ----------
const TRABADO = ['oferta', 'modelo', 'leads', 'capacidad'];
const num = (n) => Number(n).toLocaleString('en-US');
const hay = (n) => n != null && n !== '' && Number.isFinite(+n);
// La meta de la estrategia en vivo, en una frase (vacía si no hay objetivo: nunca un cero inventado).
function metaTexto(m) {
  if (!m || !hay(m.objetivo) || +m.objetivo <= 0) return '';
  const mon = texto(m.moneda, 4), con = (n) => (mon ? mon + ' ' : '') + num(n);
  return `${con(m.objetivo)}${hay(m.meses) && +m.meses > 0 ? ` en ${m.meses} meses` : ''}${hay(m.actual) && +m.actual > 0 ? `, partiendo de ${con(m.actual)}` : ''}`;
}

// → ctx del contrato: { hoy, cliente, ficha, estrategia, entradas, aprendizajes }. Nunca costos ni precios de Inherent: solo
// lo que el cliente trae (su ficha, su estrategia, los entregables aprobados que alimentan a esta herramienta).
// Lo que no se pudo leer sale vacío (null, '' o []), no inventado.
export async function armarCtx(me, { tool, slug, entradas = [] } = {}) {
  const lee = (ruta) => api(ruta).catch(() => null);
  // Los aprendizajes solo los lee quien ve Estrategia: Strategy y Consulting (los dos cuelgan de esa área).
  const conAprendizajes = tool?.ws === 'consulting' || tool?.ws === 'strategy';
  const [est, ents, apr] = await Promise.all([
    lee('estrategia/' + enc(slug)),
    Promise.all((entradas || []).slice(0, 10).map(async (e) => {
      const d = e?.deliverable_id ? await lee(`entregables/${enc(e.deliverable_id)}/versiones/${enc(e.version)}`) : null;
      return d ? { tool: String(d.tool || e.tool || ''), titulo: texto(d.titulo, 120), version: d.version ?? e.version, contenido: d.contenido ?? {} } : null;
    })),
    conAprendizajes ? lee(`entregables?ws=consulting&slug=${enc(slug)}&tool=impact-tracker`) : null,
  ]);
  const viva = est?.viva || {}, f = est?.ficha;
  const aprendizajes = (apr?.items || []).filter((d) => !d.archivado)
    .flatMap((d) => (Array.isArray(d.resultado) ? d.resultado : []))
    .sort((a, z) => String(z.en || '').localeCompare(String(a.en || '')))
    .map((r) => texto(r.nota, 300)).filter(Boolean).slice(0, 10);
  return {
    hoy: today(),
    cliente: { slug, nombre: est?.nombre || nombreContexto(slug) || slug, nivel: est?.nivel?.id ? { id: est.nivel.id, nombre: est.nivel.nombre } : null },
    ficha: f?.hay ? { incluye: (f.incluye || []).slice(0, 12).map((x) => ({ k: texto(x.k, 120), v: texto(x.v, 400) })), fuera: texto(f.fuera, 600) } : null,
    estrategia: {
      etapa: est?.etapa?.n != null ? { n: est.etapa.n, confirmada: Boolean(est.etapa.confirmada) } : null,
      trabado: TRABADO.includes(viva.analisis?.trabado) ? viva.analisis.trabado : '',
      meta: metaTexto(viva.meta),
    },
    entradas: ents.filter(Boolean),
    aprendizajes,
  };
}
