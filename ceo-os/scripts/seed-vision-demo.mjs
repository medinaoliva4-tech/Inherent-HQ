// Datos sintéticos para revisar y editar pantallas profundas en una base PGlite aislada.
// Uso: node scripts/seed-vision-demo.mjs; PORT=3004 LOCAL_DB="$PWD/.vision-demo-db" npm run dev
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.VERCEL || process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DEV_BASE_REAL === '1') {
  throw new Error('La demo solo se crea en PGlite local, sin conexión a producción.');
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.LOCAL_DB = path.join(root, '.vision-demo-db');
const db = await import('../api/_lib/db.js');
const { herramientaDe } = await import('../public/js/herramientas.js');
const { SISTEMAS, SISTEMAS_IDS } = await import('../public/js/consulting/marcos.js');
const { idSesion } = await import('../public/js/llm/modos.js');
const who = 'ceo@inherentglobal.com';
const now = new Date(), day = now.toISOString().slice(0, 10), month = day.slice(0, 7);
const date = (offset) => { const d = new Date(now); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };
const made = [];
const add = async (coll, id, data) => {
  if (await db.get(coll, id)) return;
  await db.create(coll, { ...data, demo: true }, who, id); made.push(`${coll}/${id}`);
};
const diagnosticoDemo = {
  etapa: { n: 3, por_que: 'Ejemplo sintético: el equipo ya vende, pero el seguimiento depende de una persona.', cita: 'DEMO · entrevista ficticia', entre: null, falta: '' },
  restriccion: { funcion: 'ventas', por_que: 'Ejemplo sintético: algunos contactos no tienen siguiente paso.', cita: 'DEMO · CRM ficticio' },
  capacidad: 'ambar',
  sistemas: Object.fromEntries(SISTEMAS_IDS.map((s, si) => [s, SISTEMAS[s].palancas.map((p, i) => ({ palanca: p.id, puntaje: [3, 2, 4, 3][(i + si) % 4], evidencia: `Ejemplo ficticio para probar ${p.nombre.toLowerCase()}.`, fuente: 'DEMO · datos inventados' }))])),
  foda: { f: ['Equipo con experiencia (ficticio)'], o: ['Estandarizar seguimiento (ficticio)'], d: ['Proceso manual (ficticio)'], a: ['Demora de respuesta (ficticia)'] },
  prioridades: [
    { orden: 1, que: 'Definir siguiente paso para cada oportunidad ficticia', numero: 'ventas de prueba: 5 → 7' },
    { orden: 2, que: 'Documentar el traspaso al equipo ficticio', numero: 'margen de prueba: 25% → 28%' },
    { orden: 3, que: 'Medir tiempos de respuesta ficticios', numero: 'CAC de prueba: 100 → 90' },
  ],
};

await add('team', who, { email: who, name: 'CEO · DEMO', role: 'ceo', active: true });
await add('accounts', 'acc-akai', { slug: 'akai', name: 'AKAI · DEMO', contact: 'Andrea Pérez (ficticia)', phone: '+502 5555 0101', email: 'andrea@example.test', notes: 'Datos sintéticos para probar edición. No enviar mensajes.', links: [], roadmap: [] });
await add('accounts', 'acc-cerantola', { slug: 'cerantola', name: 'CERANTOLA · DEMO', contact: 'Marco Ruiz (ficticio)', phone: '+502 5555 0102', email: 'marco@example.test', notes: 'Datos sintéticos para probar edición.', links: [], roadmap: [] });
await add('accounts', 'acc-nao', { slug: 'nao', name: 'NAO · DEMO', contact: 'Elena Soto (ficticia)', phone: '+502 5555 0103', email: 'elena@example.test', notes: 'Datos sintéticos para probar edición.', links: [], roadmap: [] });

await add('projects', 'demo-akai-ciclo', { name: 'DEMO · Ciclo de contenido AKAI', kind: 'Ciclo mensual', line: 'contenido', cycle: month, client: 'AKAI', client_slug: 'akai', color: 'ink',
  phases: [{ name: 'Investigación', start: date(-3), end: date(1), status: 'now' }, { name: 'Producción', start: date(2), end: date(7), status: 'todo' }, { name: 'Revisión', start: date(8), end: date(11), status: 'todo' }], meetings: [], pipeline: {} });
await add('projects', 'demo-cerantola-web', { name: 'DEMO · Lanzamiento Cerantola', kind: 'Proyecto por fases', line: 'growth', client: 'CERANTOLA', client_slug: 'cerantola', color: 'ink',
  phases: [{ name: 'Brief', start: date(-2), end: date(2), status: 'now' }, { name: 'Entrega', start: date(3), end: date(14), status: 'todo' }], meetings: [], pipeline: {} });
await add('tasks', 'demo-akai-brief', { title: 'DEMO · Revisar brief de AKAI', project_id: 'demo-akai-ciclo', client_slug: 'akai', status: 'En revisión', due: date(2), assignee: who, visibility: 'all', checklist: [{ t: 'Confirmar objetivo', done: true }, { t: 'Aprobar referencias', done: false }], comments: [], description: 'Tarea sintética: puedes editarla desde Proyectos o Tareas.' });
await add('tasks', 'demo-cerantola-entrega', { title: 'DEMO · Preparar entrega', project_id: 'demo-cerantola-web', client_slug: 'cerantola', status: 'En curso', due: date(7), assignee: who, visibility: 'all', checklist: [], comments: [], description: 'Tarea sintética editable.' });

for (const [id, type, concept, amount, offset, client] of [
  ['demo-ingreso-akai', 'ingreso', 'DEMO · Anticipo AKAI', 8500, -4, 'AKAI'],
  ['demo-ingreso-cerantola', 'ingreso', 'DEMO · Proyecto Cerantola', 12400, -1, 'CERANTOLA'],
  ['demo-gasto-estudio', 'gasto', 'DEMO · Producción de estudio', 3200, -2, 'AKAI'],
  ['demo-gasto-herramienta', 'gasto', 'DEMO · Licencia de edición', 640, 0, ''],
]) await add('finance', id, { type, concept, amount, date: date(offset), category: type === 'ingreso' ? 'Servicios' : 'Operación', client });
await add('invoices', 'demo-factura-akai', { kind: 'cobrar', client: 'AKAI', concept: 'DEMO · Segundo pago', amount: 8500, currency: 'GTQ', issued: day, due: date(10), source: 'manual', status: 'pendiente' });

for (const [id, slug, toolId, title, content] of [
  ['demo-herramienta-akai', 'akai', 'business-health-assessment', 'DEMO · Diagnóstico AKAI', diagnosticoDemo],
  ['demo-herramienta-cerantola', 'cerantola', 'marketing-performance-center', 'DEMO · Rendimiento Cerantola', { periodo: month, alcance: 18000, leads: 43, conversiones: 5, fuente: 'Cifras sintéticas de prueba' }],
]) {
  const t = herramientaDe(toolId); if (!t) throw new Error(`Herramienta no encontrada: ${toolId}`);
  await add('deliverables', id, { tool: toolId, titulo: title, client_slug: slug, ws: t.ws, pestana: t.pestana, ciclo: month, project_id: '', contenido: content,
    criterios: { cumple: [], falta: ['Revisar datos reales'] }, entradas: [], ia: { via: 'manual', modelo: '' }, owner: who, estado: 'Borrador', archivado: false, version: 1, aprobado: null, historial: [{ en: now.toISOString(), por: who, accion: 'crear', nota: 'Ejemplo sintético', version: 1 }], tareas: [], resultado: [], siguientes: [] });
  await add('deliverable_versions', `${id}--v1`, { deliverable_id: id, version: 1, tool: toolId, ws: t.ws, pestana: t.pestana, titulo: title, client_slug: slug, ciclo: month, project_id: '', estado: 'Borrador', contenido: content, criterios: { cumple: [], falta: ['Revisar datos reales'] }, entradas: [], ia: { via: 'manual', modelo: '' } });
}

// Corrige únicamente la primera semilla incompleta; una edición posterior del usuario se conserva.
for (const coll of ['deliverables', 'deliverable_versions']) {
  const id = coll === 'deliverables' ? 'demo-herramienta-akai' : 'demo-herramienta-akai--v1';
  const old = await db.get(coll, id);
  if (old?.contenido?.objetivo === 'Probar una herramienta con un borrador editable' && !old.contenido.etapa) {
    const { id: _id, v: _v, _meta, ...data } = old;
    await db.update(coll, id, { ...data, contenido: diagnosticoDemo }, old.v, who);
    made.push(`${coll}/${id} (contenido ampliado)`);
  }
}

await add('chat_proyectos', 'demo-chat-akai', { owner: who, nombre: 'AKAI · DEMO', cliente: 'akai', instrucciones: 'Ejemplo sintético. Puedes editar estas instrucciones; ninguna conversación debe enviarse al cliente.' });
const sid = idSesion('libre', 'akai', 1794610000000, 0.42);
await add('chat_sesiones', sid, { owner: who, title: 'DEMO · Planear el próximo ciclo', modo: 'libre', cliente: 'akai', proyecto_id: 'demo-chat-akai', archivado: false, oculto: false, turno: null,
  mensajes: [{ role: 'user', content: '¿Qué debemos revisar antes de crear la campaña?', at: now.toISOString() }, { role: 'assistant', content: 'Ejemplo sintético: confirmar el ICP, la oferta aprobada y la capacidad de producción. Este mensaje no viene de un modelo.', at: now.toISOString() }] });

console.log(`Base demo local: ${process.env.LOCAL_DB}\nNuevos registros: ${made.length}. Los existentes se conservan para que tus ediciones no se borren.`);
// PGlite conserva un worker activo; todas las escrituras ya fueron esperadas.
process.exit(0);
