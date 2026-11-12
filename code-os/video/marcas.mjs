// Style menu por marca: lo que cada marca eligió del catálogo base (transiciones, efectos, animaciones de texto,
// estilos/recetas) más lo suyo (tipografías, colores, música, sonidos, assets y una guía). Es la «guía de cómo
// editar para esta marca» que el agente sigue al producir por prompting.
//
// <datos>/marcas/<id>.json:
// { id, nombre,
//   elegidos: { transiciones: [id], efectos: [id], animaciones_texto: [id], estilos: [id] },
//   tipografias: [{ nombre, ruta, uso: 'titulos'|'texto' }],   colores: [{ nombre, hex, uso: 'texto'|'caja'|'acento' }],
//   musica: [{ nombre, ruta, nota }],  sonidos: [{ nombre, ruta }],  assets: [{ nombre, ruta, tipo: 'logo'|'imagen'|'animacion' }],
//   guia: 'texto libre: tono, ritmo, qué evitar' }
// Carpeta de assets de cada marca (en la raíz de medios): marcas/<id>/{fuentes,musica,sonidos,imagenes}/
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nombreTipografia } from './ffmpeg.mjs';

export const RUTA_CATALOGO = join(dirname(fileURLToPath(import.meta.url)), 'catalogo.json');
export const SECCIONES = ['transiciones', 'efectos', 'animaciones_texto', 'estilos'];
export const CARPETAS_MARCA = { fuentes: /\.(ttf|otf)$/i, musica: /\.(mp3|m4a|wav|aac|ogg)$/i, sonidos: /\.(mp3|m4a|wav|aac|ogg)$/i, imagenes: /\.(png|webp|gif|jpg|jpeg|mov|webm|svg)$/i };
export class ErrorMarca extends Error {}

export const cargarCatalogo = (ruta = RUTA_CATALOGO) => JSON.parse(readFileSync(ruta, 'utf8'));

const lista = (v) => (Array.isArray(v) ? v : []);
const esColor = (v) => /^#[0-9a-f]{6}$/i.test(v ?? '');

export function validarMarca(m) {
  if (!m || typeof m !== 'object') throw new ErrorMarca('marca inválida');
  if (!/^[a-z0-9-]+$/.test(m.id ?? '')) throw new ErrorMarca('id de marca: minúsculas, números y guiones');
  if (!String(m.nombre ?? '').trim()) throw new ErrorMarca(`marca ${m.id}: falta nombre`);
  const elegidos = Object.fromEntries(SECCIONES.map((s) => [s, [...new Set(lista(m.elegidos?.[s]).filter((x) => typeof x === 'string'))]]));
  for (const c of lista(m.colores)) if (!esColor(c.hex)) throw new ErrorMarca(`marca ${m.id}: color «${c.nombre}» sin hex válido (#rrggbb)`);
  const conRuta = (x, que) => { if (typeof x?.ruta !== 'string' || !x.ruta) throw new ErrorMarca(`marca ${m.id}: ${que} sin ruta`); return x; };
  return {
    id: m.id, nombre: String(m.nombre).trim(), elegidos,
    tipografias: lista(m.tipografias).map((x) => ({ nombre: String(x.nombre), ruta: x.ruta ?? null, uso: x.uso === 'texto' ? 'texto' : 'titulos' })),
    colores: lista(m.colores).map((c) => ({ nombre: String(c.nombre ?? c.hex), hex: c.hex.toLowerCase(), uso: ['texto', 'caja', 'acento'].includes(c.uso) ? c.uso : 'acento' })),
    musica: lista(m.musica).map((x) => ({ ...conRuta(x, 'música'), nombre: String(x.nombre ?? x.ruta.split('/').pop()), nota: x.nota ?? '' })),
    sonidos: lista(m.sonidos).map((x) => ({ ...conRuta(x, 'sonido'), nombre: String(x.nombre ?? x.ruta.split('/').pop()) })),
    assets: lista(m.assets).map((x) => ({ ...conRuta(x, 'asset'), nombre: String(x.nombre ?? x.ruta.split('/').pop()), tipo: ['logo', 'imagen', 'animacion'].includes(x.tipo) ? x.tipo : 'imagen' })),
    guia: String(m.guia ?? ''),
  };
}

export function crearMarcas({ datos, raiz }) {
  const dir = join(datos, 'marcas');
  mkdirSync(dir, { recursive: true });
  const ruta = (id) => { if (!/^[a-z0-9-]+$/.test(id)) throw new ErrorMarca('id de marca inválido'); return join(dir, `${id}.json`); };
  const api = {
    lista: () => readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8'))),
    leer(id) { const r = ruta(id); if (!existsSync(r)) throw new ErrorMarca(`no existe la marca ${id}`); return JSON.parse(readFileSync(r, 'utf8')); },
    guardar(m) {
      const v = validarMarca(m);
      writeFileSync(ruta(v.id), JSON.stringify(v, null, 2));
      for (const c of Object.keys(CARPETAS_MARCA)) mkdirSync(join(raiz, 'marcas', v.id, c), { recursive: true }); // su carpeta de assets
      return v;
    },
    /** Marcar o desmarcar un elemento del catálogo en el style menu de la marca. */
    elegir(id, seccion, elemento, elegido = true) {
      if (!SECCIONES.includes(seccion)) throw new ErrorMarca(`sección «${seccion}» (usa ${SECCIONES.join(', ')})`);
      const m = api.leer(id);
      const s = new Set(m.elegidos[seccion]);
      if (elegido) s.add(elemento); else s.delete(elemento);
      return api.guardar({ ...m, elegidos: { ...m.elegidos, [seccion]: [...s] } });
    },
    /** Lo que hay en la carpeta de la marca aunque no esté registrado (assets guardados). */
    archivos(id) {
      return Object.fromEntries(Object.entries(CARPETAS_MARCA).map(([c, re]) => {
        const d = join(raiz, 'marcas', id, c);
        const f = existsSync(d) ? readdirSync(d).filter((x) => re.test(x)).sort() : [];
        return [c, f.map((x) => {
          const r = `marcas/${id}/${c}/${x}`;
          if (c !== 'fuentes') return { ruta: r, nombre: x.replace(extname(x), '') };
          try { return { ruta: r, nombre: nombreTipografia(join(d, x)) ?? x }; } catch { return { ruta: r, nombre: x }; }
        })];
      }));
    },
  };
  return api;
}

/**
 * La guía de edición de la marca, para el agente: qué puede usar (solo lo elegido y con render), con qué receta,
 * con qué tipografías, colores, música y assets, y sus reglas. Es lo que se pega al prompt del agente.
 */
export function guiaDeEdicion(marca, catalogo, estilos = []) {
  const de = (seccion) => marca.elegidos[seccion].map((id) => catalogo[seccion]?.find((x) => x.id === id)).filter(Boolean);
  const titulo = marca.tipografias.find((t) => t.uso === 'titulos') ?? marca.tipografias[0] ?? null;
  const texto = marca.colores.find((c) => c.uso === 'texto');
  const caja = marca.colores.find((c) => c.uso === 'caja');
  return {
    marca: { id: marca.id, nombre: marca.nombre },
    transiciones: de('transiciones').map(({ id, nombre, receta, render }) => ({ id, nombre, receta, render })),
    efectos: de('efectos').map(({ id, nombre, receta, render }) => ({ id, nombre, receta, render })),
    animaciones_texto: de('animaciones_texto').map(({ id, nombre, receta, render }) => ({ id, nombre, receta, render })),
    estilos: marca.elegidos.estilos.map((id) => estilos.find((e) => e.id === id)).filter(Boolean).map((e) => ({ id: e.id, nombre: e.nombre, descripcion: e.descripcion })),
    tipografias: marca.tipografias, colores: marca.colores, musica: marca.musica, sonidos: marca.sonidos, assets: marca.assets,
    predeterminados: { fuente: titulo?.nombre ?? null, color_texto: texto?.hex ?? null, color_caja: caja?.hex ?? null, musica: marca.musica[0]?.ruta ?? null },
    reglas: [
      'Usa solo transiciones, efectos, animaciones y estilos de esta lista; lo que tenga render: false se pide al editor humano o se deja para después.',
      titulo ? `Textos en «${titulo.nombre}».` : null,
      texto ? `Color de texto ${texto.hex}${caja ? `; cajas en ${caja.hex}` : ''}.` : null,
      marca.musica.length ? `Música de la marca: ${marca.musica.map((m) => m.nombre).join(', ')} (con ducking bajo la voz).` : null,
      marca.guia || null,
    ].filter(Boolean),
  };
}

/** Aplica los predeterminados de la marca a un video: tipografía y color de los textos que no los tienen, y música. */
export function aplicarMarca(video, marca) {
  const g = guiaDeEdicion(marca, { transiciones: [], efectos: [], animaciones_texto: [] });
  const p = g.predeterminados;
  return {
    ...video, marca: marca.id,
    musica: video.musica ?? (p.musica ? { ruta: p.musica, volumen: 0.22, inicio: 0, ducking: true } : null),
    escenas: video.escenas.map((e) => ({
      ...e,
      fuente: e.fuente ?? p.fuente,
      capas: (e.capas ?? []).map((c) => (c.tipo !== 'texto' ? c : {
        ...c, fuente: c.fuente ?? p.fuente,
        color: c.caja ? c.color : (p.color_texto ?? c.color),
        caja: c.caja ? (p.color_caja ?? c.caja) : null,
      })),
    })),
  };
}
