// Catálogo de estilos: cada estilo es una receta JSON en code-os/video/estilos/<id>.json.
// El editor la muestra como tarjeta (vista previa en loop, nombre, descripción, favoritos, «Copiar prompt», «Aplicar»)
// y el agente de ⑤ Producción (Post) la lista y la aplica al primer corte (estilos_listar / estilos_aplicar).
//
// {
//   id, nombre, categoria: 'cortos'|'largos'|'tarjetas'|'ctas'|'posts', descripcion, prompt,
//   formato?: '9:16'|'1:1'|'16:9',                    // si el estilo pide un formato, lo fija al aplicarse
//   requiere?: [{ recurso: 'reels', cantidad: 3, descripcion }],   // lo que el agente debe pasar en `recursos`
//   ejemplo?: { textos: ['…'] },                      // textos de la vista previa del catálogo
//   escenas_plantilla: [{ rol: 'gancho'|'cuerpo'|'cierre', duracion?, referencia?, capas: [...], estilos: [...] }]
//   (duracion: acorta la escena a ese largo para imitar el ritmo; referencia: texto que el tablero muestra en vivo)
// }
// Comodines en las plantillas: texto '{texto}' = el texto de la escena (del guion); ruta '{reels.0}' = recursos.reels[0].
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizarCorte, ErrorCorte } from './corte.mjs';

export const CATEGORIAS = {
  cortos: 'Videos cortos', largos: 'Videos largos', tarjetas: 'Tarjetas y movimientos', ctas: 'CTAs', posts: 'Posts y anuncios',
};
export const DIR_ESTILOS = join(dirname(fileURLToPath(import.meta.url)), 'estilos');

export class ErrorEstilo extends Error {}

export function validarEstilo(e, origen = '') {
  const donde = origen ? ` (${origen})` : '';
  if (!e || typeof e !== 'object') throw new ErrorEstilo(`estilo inválido${donde}`);
  for (const k of ['id', 'nombre', 'descripcion', 'prompt']) if (typeof e[k] !== 'string' || !e[k].trim()) throw new ErrorEstilo(`estilo ${e.id ?? '?'}: falta ${k}${donde}`);
  if (!/^[a-z0-9-]+$/.test(e.id)) throw new ErrorEstilo(`estilo ${e.id}: el id solo lleva minúsculas, números y guiones`);
  if (!CATEGORIAS[e.categoria]) throw new ErrorEstilo(`estilo ${e.id}: categoría «${e.categoria}» no existe (${Object.keys(CATEGORIAS).join(', ')})`);
  if (!Array.isArray(e.escenas_plantilla) || !e.escenas_plantilla.length) throw new ErrorEstilo(`estilo ${e.id}: necesita escenas_plantilla`);
  for (const p of e.escenas_plantilla) {
    if (!['gancho', 'cuerpo', 'cierre'].includes(p.rol)) throw new ErrorEstilo(`estilo ${e.id}: rol «${p.rol}» no existe (gancho, cuerpo, cierre)`);
    if (p.duracion != null && !(typeof p.duracion === 'number' && p.duracion > 0)) throw new ErrorEstilo(`estilo ${e.id}: duracion de plantilla inválida`);
  }
  // la receta tiene que ser un corte válido: se prueba con un clip de mentira y los recursos de ejemplo
  const recursos = Object.fromEntries((e.requiere ?? []).map((r) => [r.recurso, Array.from({ length: r.cantidad ?? 1 }, (_, i) => `ejemplo/${r.recurso}-${i}.png`)]));
  const escenas = e.escenas_plantilla.map((_, i) => ({ id: `p${i}`, clip: 'ejemplo.mp4', inicio: 0, fin: 3, texto: 'Ejemplo' }));
  try { aplicarEstilo({ formato: e.formato ?? '9:16', escenas }, e, recursos); } catch (err) { throw new ErrorEstilo(`estilo ${e.id}: ${err.message}`); }
  return e;
}

export function cargarEstilos(dir = DIR_ESTILOS) {
  return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => validarEstilo(JSON.parse(readFileSync(join(dir, f), 'utf8')), f));
}

/** Lo que ve el agente al listar: sin las plantillas completas. */
export const resumen = (e) => ({ id: e.id, nombre: e.nombre, categoria: e.categoria, categoriaNombre: CATEGORIAS[e.categoria], descripcion: e.descripcion, prompt: e.prompt, formato: e.formato ?? null, requiere: e.requiere ?? [] });

function rellenar(valor, escena, recursos) {
  if (typeof valor !== 'string') return valor;
  if (valor === '{texto}') return escena.texto ?? null;
  const m = valor.match(/^\{(\w+)\.(\d+)\}$/);
  if (m) {
    const r = recursos?.[m[1]]?.[Number(m[2])];
    if (!r) throw new ErrorEstilo(`falta el recurso ${m[1]}[${m[2]}]`);
    return r;
  }
  return valor;
}

/** Qué plantilla le toca a cada escena: la primera es gancho, la última cierre, las demás cuerpo (en ciclo). */
export function plantillaPara(estilo, i, n) {
  const de = (rol) => estilo.escenas_plantilla.filter((p) => p.rol === rol);
  const cuerpo = de('cuerpo').length ? de('cuerpo') : estilo.escenas_plantilla;
  if (i === 0 && de('gancho').length) return de('gancho')[0];
  if (i === n - 1 && n > 1 && de('cierre').length) return de('cierre')[0];
  return cuerpo[(i - (de('gancho').length ? 1 : 0) + cuerpo.length) % cuerpo.length];
}

/**
 * Aplica un estilo a un corte: cada escena conserva su clip, su tramo, su nota y su texto (del guion),
 * y recibe las capas y estilos de su plantilla. Devuelve el corte y lo que queda pendiente (p. ej. máscaras).
 */
export function aplicarEstilo(corte, estilo, recursos = {}) {
  const faltan = (estilo.requiere ?? []).filter((r) => (recursos?.[r.recurso]?.length ?? 0) < (r.cantidad ?? 1));
  if (faltan.length) throw new ErrorEstilo(`el estilo ${estilo.id} necesita: ${faltan.map((r) => `${r.cantidad ?? 1} × ${r.recurso} (${r.descripcion ?? ''})`).join('; ')}`);
  const pendientes = [];
  const n = corte.escenas.length;
  const escenas = corte.escenas.map((e, i) => {
    const p = plantillaPara(estilo, i, n);
    const texto = e.texto ?? e.capas?.find((c) => c.id === 'principal')?.texto ?? null;
    const base = { ...e, texto };
    const capas = (p.capas ?? []).map((c) => {
      const x = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, rellenar(v, base, recursos)]));
      if (x.tipo === 'texto' && x.id === 'principal' && e.fuente && !c.fuente) x.fuente = e.fuente; // respeta la tipografía del guion
      return x;
    }).filter((c) => c.tipo !== 'texto' || (c.texto ?? '').trim());
    const ids = new Set(capas.map((c) => c.id));
    const mascaraPrevia = e.estilos?.find((s) => s.tipo === 'detras-de-persona')?.mascara ?? null;
    const estilos = (p.estilos ?? []).filter((s) => !s.capa || ids.has(s.capa)).map((s) => {
      if (s.tipo !== 'detras-de-persona') return { ...s };
      if (!mascaraPrevia) pendientes.push({ escena: e.id, falta: 'mascara', como: `video_mascara {clip: "${e.clip}"} y poner resultado.mascara en el estilo detras-de-persona` });
      return { ...s, mascara: s.mascara ?? mascaraPrevia };
    });
    // el atajo texto/fuente manda sobre la capa principal: se quita para que gane la plantilla
    const { texto: _t, fuente: _f, ...resto } = e;
    // imitar el ritmo: la plantilla puede traer su duración (nunca alarga la escena: no sabemos cuánto clip queda)
    const fin = p.duracion > 0 ? Math.min(e.fin, e.inicio + p.duracion) : e.fin;
    return { ...resto, fin, capas, estilos, referencia: p.referencia ?? e.referencia ?? null, estilo: estilo.id };
  });
  try {
    return { corte: normalizarCorte({ ...corte, formato: estilo.formato ?? corte.formato, estilo: estilo.id, escenas }), pendientes };
  } catch (err) {
    if (err instanceof ErrorCorte) throw new ErrorEstilo(`la receta no encaja: ${err.message}`);
    throw err;
  }
}
