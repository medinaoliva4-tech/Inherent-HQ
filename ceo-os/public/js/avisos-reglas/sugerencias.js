// Avisos · las sugerencias del Chat: reglas cuyo aviso también se muestra como una tarjeta discreta sobre la caja del Chat
// (sugerencia-chat.js). La sugerencia solo propone: la persona hace clic y la acción corre por llm/acciones-os.js.
// Puro: sin DOM ni red (lo prueba scripts/test-openui.mjs).
import { aviso, masDias, nombreMes } from './base.js';

const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '').slice(0, 10));
const fechaDe = (x) => (esFecha(x?.date) ? String(x.date).slice(0, 10) : '');
const cuando = (f, hoy) => (f === hoy ? 'hoy' : f === masDias(hoy, 1) ? 'mañana' : `el ${+f.slice(8, 10)}${f.slice(0, 7) === hoy.slice(0, 7) ? '' : ` de ${nombreMes(f)}`}`);

// pr-imprimir-hoja · inherent/05-OPERACION.md §4 (días 6-10 producir): una grabación «Por grabar» (content kind 'shoot', sin
// archivar) que cae de hoy a dos días. Se sugiere imprimir su hoja de preproducción (el call sheet del Production Planner:
// llamado, locación, crew, orden de tiro) para llevarla al set. Baja: es una ayuda, no algo que falte.
const HOJA = { id: 'pr-imprimir-hoja', grupo: 'clientes', area: 'diseno', urgencia: 'baja', necesita: { area: 'content', nivel: 'completo' } };
HOJA.calcular = (d, p, hoy) => {
  const nombres = Object.fromEntries((d.clientes || []).map((c) => [c.slug, c.nombre]));
  return (d.content || []).filter((x) => x?.kind === 'shoot' && !x.archivado && (x.status || 'Por grabar') === 'Por grabar' && fechaDe(x) >= hoy && fechaDe(x) <= masDias(hoy, 2))
    .map((x) => {
      const f = fechaDe(x), marca = nombres[x.profile] || x.profile || '', titulo = x.title || 'la grabación';
      const linea = `${marca ? marca + ' graba' : 'Se graba'} ${cuando(f, hoy)}${x.time ? ` a las ${x.time}` : ''}: llévala al set con el llamado, la locación y el orden de tiro.`;
      return aviso(HOJA, {
        clave: `pr-imprimir-hoja:${x.id}`, cliente: x.profile || '', huella: `${f}|${x.time || ''}|${x.place || ''}`, desde: f,
        titulo: `Imprime la hoja de preproducción de ${titulo}`, detalle: linea,
        accion: { label: 'Abrir el Production Planner', href: x.profile ? `#/ws/production/${encodeURIComponent(x.profile)}/production/production-planner` : '#/ws/production' },
        sugerencia: {
          titulo: 'Te recomiendo imprimir la hoja de preproducción', linea, icono: 'printer',
          acciones: [{ label: 'Imprimir', accion: 'imprimir', args: { tipo: 'call-sheet', jornada: x.id, slug: x.profile } }],
        },
      });
    });
};

export const SUGERENCIAS = [HOJA];
