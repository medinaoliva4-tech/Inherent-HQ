// Agent Area: el parser de los WORKFLOW.md del repo y las reglas del run (puras). npm run test:agentes
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { AGENTES } from '../public/js/harness/agentes.js';
import { correccionesDe, agregarRegla, bloqueReglas, MAX_REGLAS } from '../public/js/memoria.js';
import { columnaDe, tablero, COLUMNAS } from '../public/js/tablero.js';
import { conArchivos, motivoRechazo } from '../public/js/chat-archivos.js';
import { ajustarAlTope, tokensDe, leerLimite, debeRecordar, hiloParaMemoria, pedidoMemoria } from '../gateway/contexto.mjs';
import { leerMenciones, limpiarCadena, siguienteDeCadena } from '../public/js/chat-agentes.js';
import { leerRevision, limpiarRevision, debeCorregir, retroalimentacion, pideLecturaCompleta } from '../public/js/revisor.js';
import { nombresSkill, metodoDeSkill, equipoHoy, bloqueEquipo, bloqueInstrucciones, MAX_INSTRUCCIONES, deCliente, MAX_SKILL, MAX_EQUIPO } from '../public/js/conocimiento.js';
import { RUTAS_BASE, skillDe, pulsoNegocio } from '../api/_lib/conocimiento.js';
import { leer, aTexto } from '../gateway/web.mjs';
import { esEscritura } from '../api/_lib/mcp.js';
import { PROPONIBLES_CHAT } from '../api/_lib/agentes.js';
import { idChatTrabajo, sistemaTrabajo, hilo, fuentes, archivos, modoDeArea } from '../public/js/agentes-chat-datos.js';
import { leerIdSesion } from '../public/js/llm/modos.js';
import { leerMencion, modeloDeEtapa, planDe, contextoChat, mapaFuentes, enlazarCitas, hiloChat, clienteDelPlan, conversacionLigada, inputsConContexto } from '../public/js/chat-agentes.js';
import { partirUi, uiHtml, PROMPT_GENUI, ESQUEMA_UI, sinUi, limpiaPedido } from '../public/js/llm/genui.js';
import { createStreamingParser } from '../public/vendor/openui-lang-core-1.1.0.min.js';
import { respuestaAbierta, puedeRecibir, enCola, siguienteAuto, leerPregunta, salidaParcial, faltaAporte, trasFalla, normalizarEtapa, leerWorkflow, ESTRATEGIA_GUIADA, puede, activa, completo, simular, leerRespuesta, pedido, desdePlantilla, normalizarWorkflow, TIPOS, aplicarResultado, soloEvidenciaDeInputs, enServidor } from '../public/js/agentes-flujos.js';

const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('los 12 agentes del repo tienen al menos 4 etapas', () => {
  for (const a of AGENTES) {
    const md = fs.readFileSync(path.join(repo, a.carpeta, 'brain/WORKFLOW.md'), 'utf8');
    const w = leerWorkflow(md, { codigo: a.n });
    assert.ok(w.etapas.length >= 4, `${a.id}: ${w.etapas.length} etapas`);
    for (const e of w.etapas) assert.ok(e.nombre, `${a.id}: etapa sin nombre`);
  }
});
t('Strategy cierra con gate del CEO y Ads trae sus dos 🚦', () => {
  const st = leerWorkflow(fs.readFileSync(path.join(repo, 'agents/01-strategy/brain/WORKFLOW.md'), 'utf8'), { codigo: '01' });
  assert.ok(st.etapas.filter((e) => !e.loop).at(-1).gate);
  const ads = leerWorkflow(fs.readFileSync(path.join(repo, 'agents/10-ads-management/brain/WORKFLOW.md'), 'utf8'), { codigo: '10' });
  assert.equal(ads.etapas.filter((e) => e.gate).length, 2);
});

const nuevo = () => ({ titulo: 'Prueba', flujo: { nombre: ESTRATEGIA_GUIADA.nombre, fuente: ESTRATEGIA_GUIADA.fuente, limites: [] }, etapas: ESTRATEGIA_GUIADA.etapas.map((e) => ({ ...e, estado: 'pendiente', actividades: [], salida: '' })) });
t('solo se trabaja la etapa activa y se aprueba para avanzar', () => {
  const r = nuevo();
  assert.equal(activa(r), 0);
  assert.ok(puede(r, 1, 'resultado'));
  assert.equal(puede(r, 0, 'resultado'), null);
  assert.ok(puede(r, 0, 'aprobar', { rol: 'ceo' }), 'sin resultado no se aprueba');
  r.etapas[0].estado = 'revision';
  assert.ok(puede(r, 0, 'aprobar', { rol: 'team' }), 'el equipo no aprueba');
  assert.match(puede(r, 0, 'aprobar', { rol: 'coo', email: 'coo@x' }), /Abre el documento/, 'sin leer no se aprueba');
  r.etapas[0].leida_por = [{ email: 'coo@x', at: new Date().toISOString() }];
  assert.equal(puede(r, 0, 'aprobar', { rol: 'coo', email: 'coo@x' }), null);
  r.etapas[0].estado = 'aprobada';
  assert.equal(activa(r), 1);
});
t('el gate del CEO solo lo aprueba el CEO', () => {
  const r = nuevo(); const g = r.etapas.findIndex((e) => e.gate);
  r.etapas.forEach((e, i) => { if (i < g) e.estado = 'aprobada'; });
  r.etapas[g].estado = 'revision';
  assert.match(puede(r, g, 'aprobar', { rol: 'coo' }), /CEO/);
  r.etapas[g].leida_por = [{ email: 'ceo@x', at: new Date().toISOString() }];
  assert.equal(puede(r, g, 'aprobar', { rol: 'ceo', email: 'ceo@x' }), null);
});
t('completo cuando todas están aprobadas', () => { const r = nuevo(); r.etapas.forEach((e) => (e.estado = 'aprobada')); assert.ok(completo(r)); });
t('el simulado deja todo como hipótesis SIN DATOS y avisa que falta evidencia', () => {
  const r = nuevo(); r.etapas[0].herramientas = ['web']; r.etapas[0].fuentes_min = 2;
  const s = simular(r, 0);
  assert.ok(s.campos.length && s.campos.every((c) => c.estado === 'hipotesis' && /SIN DATOS/.test(c.valor)));
  assert.ok(s.actividades.some((a) => a.aviso && /evidencia/i.test(a.titulo)));
  assert.equal(s.confianza, 0);
});
t('la respuesta de un modelo: evidencia sin verificar y un campo sin fuente baja a hipótesis', () => {
  const r = leerRespuesta('```etapa\n{"actividades":[{"titulo":"Busqué"}],"campos":[{"campo":"Segmento","valor":"B2B","fuentes":["e1"],"estado":"evidencia"},{"campo":"Comprador","valor":"CMO","estado":"evidencia"}],"confianza":82,"evidencia":[{"id":"e1","titulo":"Gartner","url":"https://x"}],"salida":"## ICP"}\n```');
  assert.equal(r.evidencia[0].verificada, false);
  assert.equal(r.campos[0].estado, 'evidencia');
  assert.equal(r.campos[1].estado, 'hipotesis', 'sin fuente no es evidencia');
  assert.equal(r.confianza, 82);
  assert.equal(leerRespuesta('texto suelto').salida, 'texto suelto');
});
t('el pedido: la plantilla es estructura, no fuente; lleva conexiones, inputs y lo aprobado', () => {
  const r = nuevo(); r.etapas[0].estado = 'aprobada'; r.etapas[0].salida = 'DIAGNOSTICO-OK'; r.etapas[1].herramientas = ['web'];
  r.inputs = [{ id: 'i-1', titulo: 'Entrevista', texto: 'TEXTO-ENTREVISTA' }];
  const p = pedido(r, 1);
  assert.match(p, /no como fuente/);
  assert.match(p, /Búsqueda web/);
  assert.match(p, /TEXTO-ENTREVISTA/);
  assert.match(p, /DIAGNOSTICO-OK/);
});
t('importar una plantilla la desacopla: tipos de nodo válidos, sin loops y con su origen', () => {
  for (const a of AGENTES) {
    const w = leerWorkflow(fs.readFileSync(path.join(repo, a.carpeta, 'brain/WORKFLOW.md'), 'utf8'), { codigo: a.n });
    const wf = desdePlantilla({ ...w, id: a.id, nombre: a.nombre, fuente: a.carpeta });
    assert.ok(wf.etapas.length >= 3, a.id);
    for (const e of wf.etapas) { assert.ok(TIPOS.some((t) => t.id === e.tipo), `${a.id}: tipo ${e.tipo}`); assert.ok(e.id && e.entrega.titulo, a.id); }
    assert.equal(wf.origen.tipo, 'repo');
  }
});
t('normalizarWorkflow limpia lo que manda el editor', () => {
  const w = normalizarWorkflow({ nombre: 'x'.repeat(500), etapas: [{ tipo: 'raro', nombre: '', fuentes_min: 99, herramientas: 'web\ninherent' }] });
  assert.equal(w.nombre.length, 100);
  assert.equal(w.etapas[0].tipo, 'analisis');
  assert.equal(w.etapas[0].fuentes_min, 10);
  assert.deepEqual(w.etapas[0].herramientas, ['web', 'inherent']);
  assert.equal(w.estado, 'borrador');
});
t('memoria: solo lo escrito por el equipo y solo reglas aprobadas', () => {
  const c = correccionesDe([{ cliente_nombre: 'NAO', etapas: [{ nombre: 'Copy' }], historial: [{ accion: 'ajuste', etapa: 0, nota: 'Más corto', at: '2026-11-02' }, { accion: 'corregir', etapa: 0, nota: 'Resultado corregido a mano', at: '2026-11-03' }, { accion: 'aprobar', etapa: 0, nota: 'ok' }] }]);
  assert.equal(c.length, 1); assert.deepEqual([c[0].nota, c[0].etapa, c[0].cliente], ['Más corto', 'Copy', 'NAO']);
  const a = agregarRegla([], ' Di el número ', 'c@x', 'hoy'); assert.equal(a.reglas[0].texto, 'Di el número');
  assert.ok(agregarRegla(a.reglas, 'di el número').error); assert.ok(agregarRegla([], ' ').error);
  assert.ok(agregarRegla(Array.from({ length: MAX_REGLAS }, (_, i) => ({ texto: `r${i}` })), 'x').error);
  assert.match(bloqueReglas(a.reglas), /Di el número/); assert.equal(bloqueReglas(undefined), '');
});
t('tablero: cada trabajo cae en una sola columna', () => {
  const T = (estado, tipo, activa = 1, extra = {}) => ({ activa, etapas: [{ estado: 'aprobada', tipo: 'analisis' }, { estado, tipo }], flujo: { area: 'strategy' }, ...extra });
  assert.equal(columnaDe({ activa: 0, etapas: [{ estado: 'pendiente', tipo: 'analisis' }] }), 'Encargo');
  assert.equal(columnaDe(T('trabajando', 'analisis')), 'Diagnóstico'); assert.equal(columnaDe(T('en_cola', 'decision')), 'Plan');
  assert.equal(columnaDe(T('trabajando', 'entregable')), 'Producción'); assert.equal(columnaDe(T('revision', 'entregable')), 'Revisión');
  assert.equal(columnaDe(T('pregunta', 'analisis')), 'Revisión'); assert.equal(columnaDe({ completo: true }), 'Entrega');
  const xs = [T('revision', 'decision'), T('revision', 'decision', 1, { archivado: true }), T('revision', 'decision', 1, { flujo: { area: 'creative' } })];
  const c = tablero(xs, { area: 'strategy' }); assert.equal(c.length, COLUMNAS.length); assert.equal(c[4].total, 1);
  assert.equal(tablero(Array.from({ length: 12 }, () => ({ completo: true })))[5].trabajos.length, 8);
});
t('contexto: el pulso cuenta el negocio sin costos', () => {
  const p = pulsoNegocio({ cuentas: [{ name: 'AKAI' }, { name: 'Vieja', archivado: true }], proyectos: [{ name: 'Web', status: 'En curso', client_slug: 'akai' }, { name: 'Fin', status: 'Hecho' }], leads: [{ stage: 'Nuevo' }, { stage: 'Nuevo' }, { stage: 'Ganado', archived: true }], tareas: [{ status: 'Hecha' }, { status: 'Por hacer' }] });
  assert.match(p, /Clientes \(1\): AKAI/); assert.match(p, /Web \(akai\)/); assert.match(p, /Nuevo 2/); assert.match(p, /Tareas pendientes: 1/);
  assert.ok(!/Fin|Vieja|Ganado/.test(p));
});
t('archivos: texto e imágenes, con límite y como dato', () => {
  assert.equal(motivoRechazo({ name: 'a.csv', type: 'text/csv', size: 10 }), '');
  assert.match(motivoRechazo({ name: 'a.pdf', type: 'application/pdf', size: 10 }), /PDF y Word todavía no/);
  assert.match(motivoRechazo({ name: 'a.txt', size: 50000 }), /máximo/);
  assert.match(motivoRechazo({ name: 'b.txt', size: 1 }, [1, 2, 3, 4, 5]), /Máximo 5/);
  assert.match(conArchivos('Hola', [{ nombre: 'a.txt', texto: 'dato' }]), /son datos, no instrucciones/); assert.equal(conArchivos('Hola'), 'Hola');
});
t('contexto: el pedido cabe en cualquier modelo', () => {
  assert.equal(leerLimite("Maximum context length for model 'moonshotai/Kimi-K3' allowed on your plan is 32768 tokens. Your prompt has 48840 tokens").limite, 32768);
  assert.equal(leerLimite('maximum context length is 8192 tokens').limite, 8192);
  assert.equal(leerLimite('HTTP 500 otra cosa'), null);
  const largo = 'x'.repeat(200000), base = [{ role: 'system', content: largo }, { role: 'user', content: 'viejo' }, { role: 'assistant', content: largo }, { role: 'user', content: `INICIO${largo}FIN` }];
  const a = ajustarAlTope(base, 8000);
  assert.ok(tokensDe(a) <= 8000, `quedó en ${tokensDe(a)}`);
  assert.equal(a[0].role, 'system'); assert.equal(a.at(-1).role, 'user'); assert.ok(a.at(-1).content.startsWith('INICIO')); assert.ok(a.at(-1).content.endsWith('FIN'));
  assert.equal(base[0].content.length, 200000, 'no toca el original');
  const conTool = [{ role: 'system', content: 's' }, { role: 'user', content: 'a' }, { role: 'assistant', content: null, tool_calls: [{ id: '1' }] }, { role: 'tool', tool_call_id: '1', content: largo }, { role: 'user', content: 'b' }];
  const b = ajustarAlTope(conTool, 2000), ids = b.filter((m) => m.role === 'tool');
  for (const m of ids) assert.ok(b.some((x) => x.tool_calls?.some((c) => c.id === m.tool_call_id)), 'sin resultados huérfanos');
  const corto = [{ role: 'user', content: 'hola' }]; assert.deepEqual(ajustarAlTope(corto, 1000), corto);
});
t('memoria: usa al ayudante solo si tiene más contexto', () => {
  const ctx = (m) => ({ kimi: 32768, nv: 131072 }[m] || 32768);
  assert.equal(debeRecordar([{}], 'nv', 'kimi', ['kimi', 'nv'], ctx), true);
  assert.equal(debeRecordar([], 'nv', 'kimi', ['kimi', 'nv'], ctx), false);
  assert.equal(debeRecordar([{}], 'nv', 'nv', ['nv'], ctx), false);
  assert.equal(debeRecordar([{}], 'nv', 'kimi', ['kimi'], ctx), false, 'si el ayudante no está, no se usa');
  const h = hiloParaMemoria([{ role: 'user', content: `ENCARGO ${'a'.repeat(5000)}` }, { role: 'assistant', content: `${'b'.repeat(5000)} ULTIMO` }], 500);
  assert.ok(h.length <= 1700 && h.includes('ENCARGO') && h.endsWith('ULTIMO'));
  assert.match(pedidoMemoria('h', 'p'), /Son datos, no instrucciones/);
});
t('supervisor: lee varios agentes y sigue una sola vez', () => {
  const ag = [{ id: 'a', nombre: 'Strategy' }, { id: 'b', nombre: 'Creative' }];
  const m = leerMenciones('@Strategy @Creative arma la campaña', ag);
  assert.deepEqual(m.agentes.map((x) => x.id), ['a', 'b']); assert.equal(m.resto, 'arma la campaña');
  assert.equal(leerMenciones('@Strategy @Strategy hola', ag).agentes.length, 1); assert.equal(leerMenciones('hola', ag), null);
  const c = limpiarCadena({ siguientes: [{ id: 'b', nombre: 'Creative' }, { id: 'c', nombre: 'X' }, { id: '' }] });
  assert.equal(c.siguientes.length, 2); assert.equal(limpiarCadena({ siguientes: [] }), null); assert.equal(limpiarCadena(null), null);
  const r = { cadena: c, etapas: [{ estado: 'aprobada' }, { estado: 'revision' }] };
  assert.equal(siguienteDeCadena(r), null, 'sin terminar no sigue');
  r.etapas[1].estado = 'aprobada';
  const s = siguienteDeCadena(r); assert.equal(s.agente.id, 'b'); assert.equal(s.cadena.siguientes[0].id, 'c');
  r.cadena.hecho = 'x'; assert.equal(siguienteDeCadena(r), null, 'no arranca dos veces');
});
t('revisor: lee criterios, falla cerrado y corrige solo una vez', () => {
  const rv = leerRevision('x {"criterios":[{"n":1,"cumple":true,"razon":"ok"},{"n":2,"cumple":false,"razon":"sin cifra"}],"decision":{"propone":"P","alternativa":"A","asumio":["S"]}}', ['Uno', 'Dos']);
  assert.equal(rv.pasa, false); assert.equal(rv.decision.propone, 'P'); assert.equal(debeCorregir(rv, 0), true); assert.equal(debeCorregir(rv, 1), false);
  assert.match(retroalimentacion(rv), /Dos: sin cifra/); assert.ok(!/Uno:/.test(retroalimentacion(rv)));
  assert.equal(leerRevision('no es json', ['Uno']), null); assert.equal(debeCorregir(null, 0), false);
  assert.equal(leerRevision('{"criterios":[]}', ['Uno']).pasa, false, 'un criterio sin respuesta no pasa');
  assert.equal(limpiarRevision(null), null);
  const r = nuevo(), u = r.etapas.length - 1; r.etapas[0].gate = false; r.etapas[0].revision = rv;
  assert.equal(pideLecturaCompleta(r, 0), u === 0); r.etapas[0].gate = true; assert.equal(pideLecturaCompleta(r, 0), true);
});
t('en pausa no se ejecuta', () => { const r = nuevo(); r.pausado = true; assert.match(puede(r, 0, 'resultado'), /pausa/); });
// ---------- El servidor (Gateway, F2) ----------
t('encolar: solo una etapa pendiente o en ajuste, y no dos veces', () => {
  const r = nuevo(); assert.equal(puede(r, 0, 'encolar'), null);
  r.etapas[0] = { ...r.etapas[0], estado: 'en_cola', via: 'gateway' };
  assert.ok(enServidor(r.etapas[0])); assert.match(puede(r, 0, 'encolar'), /servidor/); assert.match(puede(r, 0, 'resultado'), /servidor/);
  assert.equal(puede(r, 0, 'cancelar'), null);
  r.etapas[0].estado = 'trabajando'; assert.match(puede(r, 0, 'cancelar'), /ya la está trabajando/);
});
t('aplicarResultado deja la etapa en revisión con su costo y conserva la actividad del servidor', () => {
  const r = nuevo(); r.etapas[0] = { ...r.etapas[0], estado: 'trabajando', via: 'gateway', actividades: [{ titulo: 'Tomada por el servidor', at: new Date().toISOString() }] };
  const out = aplicarResultado(r, 0, { via: 'gateway', modelo: 'deepseek-v4-flash', salida: 'ok', campos: [{ campo: 'a', estado: 'evidencia', fuentes: ['i1'] }], costo: { entrada: 10, salida: 20, seg: 3 } });
  const e = out.etapas[0];
  assert.equal(e.estado, 'revision'); assert.equal(e.via, 'gateway'); assert.deepEqual(e.costo, { entrada: 10, salida: 20, seg: 3 });
  assert.equal(e.actividades[0].titulo, 'Tomada por el servidor');
});
t('sin herramientas: la evidencia que no viene de los inputs se descarta y su campo baja a hipótesis', () => {
  const run = { inputs: [{ id: 'i1', titulo: 'Ficha de prueba', texto: 'Ticket promedio Q45.' }] };
  const r = soloEvidenciaDeInputs(run, { evidencia: [{ id: 'e1', titulo: 'Ficha de prueba (cliente)' }, { id: 'e2', titulo: 'Statista', url: 'https://statista.com' }], campos: [{ campo: 'a', estado: 'evidencia', fuentes: ['e1'] }, { campo: 'b', estado: 'evidencia', fuentes: ['e2'] }], faltantes: [], confianza: 80 });
  assert.deepEqual(r.evidencia.map((x) => x.id), ['e1']);
  assert.deepEqual(r.campos.map((c) => c.estado), ['evidencia', 'hipotesis']);
  assert.match(r.faltantes[0], /no está en los inputs/); assert.equal(r.confianza, 40);
  assert.match(pedido({ ...nuevo(), inputs: [] }, 0, { sinHerramientas: true }), /NO tienes internet/);
});
t('una URL que viene dentro del resultado de un MCP cuenta como evidencia; una inventada no', () => {
  const run = { inputs: [{ id: 'm1', titulo: 'Cloudflare · search', texto: 'Límite de CPU: 30 s. Fuente: https://developers.cloudflare.com/workers/platform/limits/' }] };
  const r = soloEvidenciaDeInputs(run, { evidencia: [{ id: 'e1', titulo: 'Límites', url: 'https://developers.cloudflare.com/workers/platform/limits/' }, { id: 'e2', titulo: 'Blog', url: 'https://blog.inventado.com/x' }], campos: [], faltantes: [], confianza: 80 });
  assert.deepEqual(r.evidencia.map((x) => x.id), ['e1']); assert.equal(r.faltantes.length, 1);
});
t('el servidor solo lee el OS: las herramientas que escriben quedan fuera', () => {
  for (const n of ['crear_tarea', 'actualizar_lead', 'subir_documento', 'marcar_pagada', 'asignar_rol']) assert.equal(esEscritura(n), true, n);
  for (const n of ['mis_pendientes', 'tareas', 'clientes', 'leads', 'resultados', 'leer_documento']) assert.equal(esEscritura(n), false, n);
});
t('el Chat solo puede PROPONER acciones del trabajo diario (nada de roles, pagos, facturas ni borrar)', () => {
  for (const n of PROPONIBLES_CHAT) assert.equal(esEscritura(n), true, `${n} debería ser de las que escriben`);
  for (const n of ['asignar_rol', 'marcar_pagada', 'registrar_factura', 'borrar_idea', 'borrar_research', 'activar_paquete', 'importar_prospectos']) assert.equal(PROPONIBLES_CHAT.has(n), false, n);
});
t('web: el texto de una página sale limpio (sin scripts ni menús, con acentos)', () => {
  const r = aTexto('<title>T &amp; Co</title><script>x()</script><nav>menú</nav><p>Hola&nbsp;mundo &#233;xito</p>');
  assert.equal(r.titulo, 'T & Co'); assert.equal(r.texto, 'T & Co Hola mundo éxito');
});

// ----- Chat de trabajo (F4) -----
const runChat = () => ({ id: 'AbC_123-xyz', titulo: 'Auditoría AKAI', objetivo: 'Encontrar el freno', cliente: 'akai', cliente_nombre: 'AKAI',
  flujo: { id: 'wf1', nombre: 'Strategy', agente: 'Strategy', area: 'strategy', limites: ['No pauta'] },
  etapas: [{ id: 'e1', nombre: 'Diagnóstico', estado: 'aprobada', salida: 'D'.repeat(5000), aprobada_por: 'ceo@x.com' }, { id: 'e2', nombre: 'Oferta', estado: 'revision', salida: 'La oferta propuesta', confianza: 60, faltantes: ['precio de la competencia'], gate: true }, { id: 'e3', nombre: 'Plan', estado: 'pendiente' }],
  inputs: [{ id: 'i-1', titulo: 'Entrevista', texto: 'hola' }, { id: 'i-2', titulo: 'Viejo', archivado: true }],
  evidencia: [{ id: 'w1', etapa: 1, titulo: 'Fuente A' }, { id: 'w2', etapa: 1, titulo: 'Fuente B', quitada: true }, { id: 'x', etapa: 0, titulo: 'Fuente C' }],
  historial: [{ at: '2026-11-04T10:00:00Z', accion: 'crear', quien: 'ceo@x.com' }, { at: '2026-11-04T10:05:00Z', accion: 'ejecutar', etapa: 1 }, { at: '2026-11-04T10:06:00Z', accion: 'tomar', etapa: 1 }, { at: '2026-11-04T10:20:00Z', accion: 'ejecutar', etapa: 1 }] });
t('chat de trabajo: un id por persona y trabajo, válido para el servidor y estable', () => {
  const r = runChat(), a = idChatTrabajo(r, 'ceo@x.com'), b = idChatTrabajo(r, 'CEO@x.com'), c = idChatTrabajo(r, 'coo@x.com');
  assert.equal(a, b); assert.notEqual(a, c);
  assert.deepEqual(leerIdSesion(a), { modo: 'estrategia', slug: 'tabc_123-xyz' });
  assert.ok(!a.includes('@') && !a.includes('ceo'), 'el correo no queda en el id');
  assert.equal(modoDeArea('creative'), 'diseno'); assert.equal(modoDeArea('otra'), 'organizacion');
  assert.ok(leerIdSesion(idChatTrabajo({ ...r, id: 'x'.repeat(80), flujo: { area: 'production' } }, 'a@b.c')));
});
t('chat de trabajo: el contexto lleva la etapa activa, lo que está en revisión y lo aprobado, y cabe', () => {
  const s = sistemaTrabajo(runChat(), { nombre: 'Rodrigo' });
  assert.match(s, /2\. Oferta — Esperando aprobación ← ACTIVA/); assert.match(s, /RESULTADO EN REVISIÓN/); assert.match(s, /La oferta propuesta/);
  assert.match(s, /🚦/); assert.match(s, /precio de la competencia/); assert.match(s, /\[i-1\] Entrevista/); assert.doesNotMatch(s, /Viejo/);
  assert.match(s, /Diagnóstico \(aprobada\)/); assert.match(s, /NUNCA inventes/); assert.match(s, /No pauta/);
  assert.ok(s.length < 24000, `${s.length} caracteres`);
  const enorme = runChat(); enorme.etapas = Array.from({ length: 12 }, (_, i) => ({ id: `e${i}`, nombre: `E${i}`, estado: i < 11 ? 'aprobada' : 'revision', salida: 'x'.repeat(40000) })); enorme.inputs = Array.from({ length: 20 }, (_, i) => ({ id: `i-${i}`, titulo: 'T', texto: 'y'.repeat(9000) }));
  const se = sistemaTrabajo(enorme); assert.ok(se.length < 26000, `${se.length}: cabe en el contexto de 32k`); assert.match(se, /E0 \(aprobada · el texto está en Archivos/);
});
t('chat de trabajo: el hilo mezcla mensajes y eventos por hora; solo el último resultado de una etapa es tarjeta', () => {
  const h = hilo(runChat(), [{ role: 'user', content: 'hola', at: '2026-11-04T10:10:00Z' }, { role: 'assistant', content: '…' }]);
  assert.deepEqual(h.map((x) => (x.tipo === 'msg' ? `m${x.i}` : `${x.h.accion}${x.ultimo ? '*' : ''}`)), ['crear', 'ejecutar', 'm0', 'ejecutar*', 'm1']);
});
t('chat de trabajo: Sources sin las fuentes quitadas y File tree con inputs y lo producido', () => {
  assert.deepEqual(fuentes(runChat()).map((g) => [g.n, g.xs.map((x) => x.id)]), [[0, ['x']], [1, ['w1']]]);
  const [ins, prod] = archivos(runChat());
  assert.deepEqual(ins.items.map((x) => x.id), ['i-1']);
  assert.deepEqual(prod.items.map((x) => x.nombre), ['01-diagnostico.md', '02-oferta.md']);
});

// ----- F4.5 · el Chat con agentes -----
const AGS = [{ id: 'inv', nombre: 'Investigación', agente: 'Investigación' }, { id: 'gp', nombre: 'Growth Partner' }];
t('F4.5: @agente solo al inicio, sin acentos; correos y @cuentas no son agentes', () => {
  const m = leerMencion('@Investigacion revisa AKAI', AGS); assert.equal(m.agente.id, 'inv'); assert.equal(m.resto, 'revisa AKAI');
  assert.equal(leerMencion('@growthpartner arma el mes', AGS).agente.id, 'gp');
  assert.equal(leerMencion('escríbele a ana@akai.com', AGS), null);
  assert.equal(leerMencion('@akai hola', AGS), null);
});
t('F4.5: cada etapa trae su modelo (fijo, por tipo o el que haya en el servidor)', () => {
  const gw = ['deepseek-v4-pro', 'deepseek-v4-flash'];
  assert.equal(modeloDeEtapa({ tipo: 'analisis' }, gw), 'deepseek-v4-pro');
  assert.equal(modeloDeEtapa({ tipo: 'entregable' }, gw), 'deepseek-v4-flash');
  assert.equal(modeloDeEtapa({ modelo: 'glm-5.3' }, ['glm-5.3']), 'glm-5.3');
  assert.equal(modeloDeEtapa({ tipo: 'analisis' }, ['deepseek-v4-flash']), 'deepseek-v4-flash');
  const pl = planDe({ etapas: [{ nombre: 'A', tipo: 'decision', gate: true, aporte: { pregunta: '¿?' } }] }, gw);
  assert.deepEqual(pl[0], { n: 0, nombre: 'A', entrega: 'A', modelo: 'deepseek-v4-pro', gate: true, aporte: true });
});
t('F4.5: el contexto del Chat cabe en 6,000 caracteres y termina con lo último', () => {
  const ms = Array.from({ length: 40 }, (_, i) => ({ r: i % 2 ? 'a' : 'u', t: `m${i} ` + 'x'.repeat(500) }));
  const c = contextoChat(ms, 'Resumen viejo'); assert.ok(c.length <= 6000, c.length); assert.ok(c.trimEnd().endsWith('x'), 'termina con el último'); assert.match(c, /m39 /); assert.doesNotMatch(c, /m0 /);
});
t('F4.5: aprobar exige haber abierto el documento después del último resultado', () => {
  const r = { etapas: [{ estado: 'aprobada' }, { estado: 'revision' }], historial: [{ accion: 'ejecutar', etapa: 1, at: '2026-11-04T10:20:00Z' }] };
  assert.match(puede(r, 1, 'aprobar', { rol: 'ceo', email: 'c@x' }), /Abre el documento/);
  r.etapas[1].leida_por = [{ email: 'c@x', at: '2026-11-04T10:30:00Z' }];
  assert.equal(puede(r, 1, 'aprobar', { rol: 'ceo', email: 'C@x' }), null);
  r.etapas[1].leida_por = [{ email: 'c@x', at: '2026-11-04T10:10:00Z' }];
  assert.match(puede(r, 1, 'aprobar', { rol: 'ceo', email: 'c@x' }), /Abre el documento/);
});
t('F4.5: la siguiente etapa avanza sola solo dentro de lo platicado', () => {
  const r = (hasta, extra = {}) => ({ plan_ok: { hasta }, etapas: [{ estado: 'aprobada' }, { estado: 'aprobada' }, { estado: 'pendiente' }, { estado: 'pendiente' }], ...extra });
  assert.equal(siguienteAuto(r(2), 1), 2); assert.equal(siguienteAuto(r(1), 1), null);
  assert.equal(siguienteAuto(r(3, { pausado: true }), 1), null); assert.equal(siguienteAuto({ etapas: r(3).etapas }, 1), null);
  assert.equal(siguienteAuto(r(3), 3), null);
});
t('F4.5: encolar una etapa deja su modelo, quién y de dónde venía (lo usan la ruta y el avance solo)', () => {
  const e = enCola({ nombre: 'B', estado: 'ajuste', actividades: [{ titulo: 'viejo' }] }, 'deepseek-v4-pro', 'ceo@x', '2026-11-04T10:00:00Z', 'auto');
  assert.equal(e.estado, 'en_cola'); assert.equal(e.via, 'gateway'); assert.equal(e.modelo, 'deepseek-v4-pro');
  assert.deepEqual(e.cola, { at: '2026-11-04T10:00:00Z', por: 'ceo@x', antes: 'ajuste', modelo: 'deepseek-v4-pro' });
  assert.equal(e.actividades.length, 2, 'un ajuste conserva la actividad anterior');
  assert.match(e.actividades.at(-1).detalle, /sigue sola/);
  assert.equal(enCola({ estado: 'pendiente', actividades: [{ titulo: 'x' }] }, 'm', 'a', 't').actividades.length, 1);
});
t('F4.5: las citas del documento se vuelven enlaces a su fuente (solo las que existen)', () => {
  const run = { inputs: [{ id: 'i-1', titulo: 'Entrevista' }, { id: 'i-2', titulo: 'Viejo', archivado: true }], evidencia: [{ id: 'w1', etapa: 0, titulo: 'Sitio A', url: 'https://a.com/x' }, { id: 'w2', etapa: 0, titulo: 'Quitada', url: 'https://b.com', quitada: true }] };
  const m = mapaFuentes(run, 0);
  assert.deepEqual(Object.keys(m).sort(), ['i-1', 'w1']);
  const h = enlazarCitas('<p>Dato [w1] y [i-1], no [w2] ni [x9] ni <code>[w1]</code>.</p>', m);
  assert.match(h, /<a class="av-cita" href="https:\/\/a\.com\/x" target="_blank" rel="noreferrer" title="Sitio A">w1<\/a>/);
  assert.match(h, /<button type="button" class="av-cita" data-act="abrir-input" data-id="i-1" title="Entrevista">i-1<\/button>/);
  assert.match(h, /\[w2\]/); assert.match(h, /\[x9\]/); assert.match(h, /<code>\[w1\]<\/code>/);
  assert.doesNotMatch(enlazarCitas('[w1]', { w1: { titulo: '"><img>', url: 'javascript:alert(1)' } }), /javascript:|<img>/);
});
t('F4.5: el hilo del Chat mezcla mensajes y eventos de varios agentes por hora; lo que se está escribiendo va al final', () => {
  const runA = { id: 'A', etapas: [{ estado: 'revision' }], historial: [{ at: '2026-11-04T10:01:00Z', accion: 'crear' }, { at: '2026-11-04T10:05:00Z', accion: 'ejecutar', etapa: 0 }] };
  const runB = { id: 'B', etapas: [{ estado: 'pendiente' }], historial: [{ at: '2026-11-04T10:03:00Z', accion: 'crear' }, { at: '2026-11-04T10:03:30Z', accion: 'tomar', etapa: 0 }] };
  const msgs = [{ r: 'u', t: '@A', at: '2026-11-04T10:00:00Z' }, { r: 'u', t: '@B', at: '2026-11-04T10:02:00Z' }, { r: 'a', t: 'escribiendo' }];
  const h = hiloChat(msgs, [runA, runB]);
  assert.deepEqual(h.map((x) => (x.tipo === 'msg' ? `m${x.i}` : `${x.run.id}:${x.x.h.accion}${x.x.ultimo ? '*' : ''}`)), ['m0', 'A:crear', 'm1', 'B:crear', 'A:ejecutar*', 'm2']);
});
t('F4.5: nombres de agente de tres o más palabras también se reconocen', () => {
  const m = leerMencion('@Diagnóstico de marca revisa AKAI', [{ id: 'd', nombre: 'Diagnóstico de marca' }, { id: 'di', nombre: 'Diagnóstico' }]);
  assert.equal(m.agente.id, 'd'); assert.equal(m.resto, 'revisa AKAI');
});
t('F4.5: corregir el resultado también pide volver a leerlo', () => {
  const r = { etapas: [{ estado: 'revision', leida_por: [{ email: 'c@x', at: '2026-11-04T10:30:00Z' }] }], historial: [{ accion: 'ejecutar', etapa: 0, at: '2026-11-04T10:20:00Z' }, { accion: 'corregir', etapa: 0, at: '2026-11-04T10:40:00Z' }] };
  assert.match(puede(r, 0, 'aprobar', { rol: 'coo', email: 'c@x' }), /Abre el documento/);
});
t('F4.5: el cliente del plan se elige, nunca se asume', () => {
  assert.deepEqual(clienteDelPlan({ clientes: [['', 'Elige…'], ['akai', 'AKAI']], cliente: '' }), { error: 'Elige para quién es este trabajo' });
  assert.deepEqual(clienteDelPlan({ clientes: [['akai', 'AKAI']], cliente: 'akai' }), { cliente: 'akai', nombre: 'AKAI' });
  assert.deepEqual(clienteDelPlan({ clientes: [['', 'Elige…'], ['interno', 'Inherent (trabajo interno)']], cliente: 'interno' }), { cliente: '', nombre: '' });
  assert.deepEqual(clienteDelPlan({ clientes: null }, 'nao', 'NAO'), { cliente: 'nao', nombre: 'NAO' });
  assert.deepEqual(clienteDelPlan({ clientes: [], sinClientes: true }), { error: 'No tienes clientes para este trabajo: pídele acceso al CEO' });
});
t('F4.5: la lectura del CEO/COO solo vale si la conversación es de quien creó el lazo', () => {
  assert.equal(conversacionLigada({ chat: { sesion: 's1', owner: 'a@x' } }, { id: 's1', owner: 'A@x' }), true);
  assert.equal(conversacionLigada({ chat: { sesion: 's1', owner: 'coo@x' } }, { id: 's1', owner: 'a@x' }), false, 'un lazo a la conversación de otra persona no vale');
  assert.equal(conversacionLigada({ chat: { sesion: 's2', owner: 'a@x' } }, { id: 's1', owner: 'a@x' }), false);
  assert.equal(conversacionLigada({}, { id: 's1', owner: 'a@x' }), false);
});
// ----- F4.5 · Entrega 2 -----
t('E2: un resultado cortado rescata el documento y avisa', () => {
  const r = leerRespuesta('Listo.\n```etapa\n{"salida":"# Doc\\n\\nTexto \\"citado\\" [w1]","actividades":[{"titulo":"a"');
  assert.equal(r.salida, '# Doc\n\nTexto "citado" [w1]'); assert.match(r.faltantes[0], /cortó/);
  const r2 = leerRespuesta('```etapa\n{"campos":[{"campo":"Mercado","valor":"Crece 5%","items":["uno","dos"],"estado":"hipotesis"},{"campo":"Cort');
  assert.match(r2.salida, /### Mercado\nCrece 5%/); assert.doesNotMatch(r2.salida, /\{"campos"/);
});
t('E2: el documento va primero en el pedido y los campos piden resumen corto', () => {
  const r = nuevo(), p = pedido(r, 0);
  assert.ok(p.indexOf('"salida"') < p.indexOf('"actividades":['), 'salida primero'); assert.match(p, /máximo 200 caracteres/);
});
t('E2: salidaParcial saca el documento mientras se escribe, sin romperse a medias', () => {
  assert.equal(salidaParcial('```etapa\n{"salida":"Hola\\nmun'), 'Hola\nmun');
  assert.equal(salidaParcial('```etapa\n{"salida":"Corte al final \\'), 'Corte al final ');
  assert.equal(salidaParcial('pensando…'), ''); assert.equal(salidaParcial('{"salida":"Fin","campos":[]}'), 'Fin');
});
t('E2: el agente solo pregunta en trabajos del Chat y hasta 3 veces por etapa', () => {
  const r = nuevo(); assert.doesNotMatch(pedido(r, 0), /```pregunta/);
  r.chat = { sesion: 's', owner: 'a@x' }; assert.match(pedido(r, 0, { puedePreguntar: true }), /```pregunta/);
  r.etapas[0].preguntas = 3; assert.doesNotMatch(pedido(r, 0, { puedePreguntar: true }), /```pregunta/);
});
t('E2: leerPregunta entiende el bloque y no confunde un resultado', () => {
  const q = leerPregunta('Necesito esto:\n```pregunta\n{"texto":"¿Cuál es el Instagram?","por_que":"Para revisar sus posts","opciones":["@a","@b"]}\n```');
  assert.deepEqual(q, { texto: '¿Cuál es el Instagram?', por_que: 'Para revisar sus posts', opciones: ['@a', '@b'] });
  assert.equal(leerPregunta('```etapa\n{"salida":"x"}\n```'), null); assert.equal(leerPregunta('```pregunta\n{roto\n```'), null);
  assert.equal(leerPregunta('```pregunta\n{"texto":""}\n```'), null);
});
t('E2: una etapa en pregunta espera; se responde, y solo ella', () => {
  const r = nuevo(); r.etapas[0].estado = 'pregunta';
  assert.equal(puede(r, 0, 'responder'), null); assert.ok(puede(r, 0, 'encolar')); assert.equal(enServidor(r.etapas[0]), false);
  r.etapas[0].estado = 'revision'; assert.ok(puede(r, 0, 'responder'));
});
t('E2: el aporte obligatorio frena la etapa hasta que la persona lo da, y el flujo no la encola solo', () => {
  const r = { plan_ok: { hasta: 2 }, inputs: [], etapas: [{ estado: 'aprobada' }, { estado: 'pendiente', aporte: { pregunta: '¿Tu punto de vista?' } }, { estado: 'pendiente' }] };
  assert.equal(faltaAporte(r, 1), true); assert.equal(siguienteAuto(r, 0), null); assert.match(puede(r, 1, 'encolar'), /aporte/);
  r.inputs.push({ id: 'i-aporte-1', texto: 'Yo creo…' });
  assert.equal(faltaAporte(r, 1), false); assert.equal(siguienteAuto(r, 0), 1); assert.equal(puede(r, 1, 'encolar'), null);
  assert.equal(normalizarEtapa({ nombre: 'A', aporte: { pregunta: ' ¿Qué opinas? ' } }).aporte.pregunta, '¿Qué opinas?');
  assert.equal(normalizarEtapa({ nombre: 'A' }).aporte, null);
});
t('E2: a la primera falla reintenta sola; a la segunda se detiene y avisa', () => {
  const uno = trasFalla({ estado: 'trabajando', cola: { antes: 'pendiente', modelo: 'm' }, modelo: 'm', actividades: [] }, 'se cayó', 't');
  assert.equal(uno.estado, 'en_cola'); assert.equal(uno.fallas, 1); assert.match(uno.actividades.at(-1).titulo, /Reintent/);
  const dos = trasFalla({ ...uno, estado: 'trabajando' }, 'otra vez', 't');
  assert.equal(dos.estado, 'detenida'); assert.equal(dos.fallas, 2); assert.equal(enServidor(dos), false);
  const r = nuevo(); r.etapas[0] = dos; assert.equal(puede(r, 0, 'encolar'), null);
});
t('E2: el modelo fijado en el flujo (ia.modelo) gana', () => {
  assert.equal(modeloDeEtapa({ tipo: 'entregable', ia: { proveedor: 'x', modelo: 'kimi-k3' } }, ['kimi-k3', 'deepseek-v4-flash']), 'kimi-k3');
});
t('E2: el ajuste llega al servidor con el resultado anterior, y se limpia al terminar', () => {
  const r = nuevo(); Object.assign(r.etapas[0], { estado: 'trabajando', ajuste: 'Quita el párrafo de precios', salida: 'Versión 1 del documento', cola: { antes: 'ajuste' } });
  const p = pedido(r, 0); assert.match(p, /AJUSTE QUE PIDIÓ EL HUMANO: Quita el párrafo/); assert.match(p, /Versión 1 del documento/);
  const out = aplicarResultado(r, 0, { via: 'gateway', salida: 'Versión 2' });
  assert.equal(out.etapas[0].ajuste, ''); assert.equal(out.etapas[0].fallas, 0); assert.equal(out.etapas[0].borrador, '');
  assert.equal(enCola({ estado: 'pregunta', actividades: [{ titulo: 'x' }] }, 'm', 'a', 't').actividades.length, 2, 'responder conserva la actividad');
});
t('E2: el contexto del Chat se renueva por etapa y las versiones viejas quedan archivadas', () => {
  const xs = [{ id: 'i-1', titulo: 'a' }, { id: 'i-chat', texto: 'v1' }];
  const y = inputsConContexto(xs, 'v2', 1, 't');
  assert.equal(y.find((x) => x.id === 'i-chat').archivado, true); assert.equal(y.find((x) => x.id === 'i-chat-1').texto, 'v2'); assert.equal(y.find((x) => x.id === 'i-1').archivado, undefined);
  assert.equal(inputsConContexto(y, 'v2', 2, 't'), y, 'sin cambios no agrega versión');
  assert.equal(inputsConContexto(xs, '', 1, 't'), xs);
});
t('E2: la pregunta vigente se marca en el hilo; una ya respondida no', () => {
  const r = { etapas: [{ estado: 'pregunta' }], historial: [{ at: '2026-11-04T10:00:00Z', accion: 'preguntar', etapa: 0, nota: 'a' }, { at: '2026-11-04T10:01:00Z', accion: 'responder', etapa: 0 }, { at: '2026-11-04T10:02:00Z', accion: 'preguntar', etapa: 0, nota: 'b' }] };
  assert.deepEqual(hilo(r, []).map((x) => [x.h.nota || '', Boolean(x.vigente)]), [['a', false], ['', false], ['b', true]]);
});
t('E2 revisión: solo se continúa una respuesta que quedó abierta', () => {
  assert.equal(respuestaAbierta('```etapa\n{"salida":"a"}\n```'), false);
  assert.equal(respuestaAbierta('```pregunta\n{"texto":"¿x?"}\n```'), false);
  assert.equal(respuestaAbierta('```etapa\n{"salida":"a'), true);
  assert.equal(respuestaAbierta('{"salida":"a"}'), false); assert.equal(respuestaAbierta('{"salida":"a'), true);
  assert.equal(respuestaAbierta('Texto normal.'), false);
});
t('E2 revisión: un resultado solo pasa entre trabajos del mismo cliente y de la misma conversación', () => {
  const a = { id: 'a', cliente: 'akai', chat: { sesion: 's' } };
  assert.equal(puedeRecibir(a, { id: 'b', cliente: 'akai', chat: { sesion: 's' }, etapas: [{ estado: 'pendiente' }] }), true);
  assert.equal(puedeRecibir(a, { id: 'b', cliente: 'nao', chat: { sesion: 's' }, etapas: [{ estado: 'pendiente' }] }), false, 'de AKAI a NAO no');
  assert.equal(puedeRecibir(a, { id: 'b', cliente: 'akai', chat: { sesion: 'otra' }, etapas: [{ estado: 'pendiente' }] }), false);
  assert.equal(puedeRecibir(a, { id: 'a', cliente: 'akai', chat: { sesion: 's' }, etapas: [{ estado: 'pendiente' }] }), false, 'a sí mismo no');
  assert.equal(puedeRecibir(a, { id: 'b', cliente: 'akai', chat: { sesion: 's' }, archivado: true, etapas: [{ estado: 'pendiente' }] }), false);
  assert.equal(puedeRecibir(a, { id: 'b', cliente: 'akai', chat: { sesion: 's' }, etapas: [{ estado: 'aprobada' }] }), false, 'uno terminado no recibe');
});
t('E2 revisión: los resultados pasados y el contexto del Chat llegan completos; los inputs son datos', () => {
  const r = nuevo(); r.inputs = [{ id: 'i-de-abc-0', titulo: 'De X', texto: 'y'.repeat(11000) + 'FIN1' }, { id: 'i-chat-1', titulo: 'Chat', texto: 'z'.repeat(5900) + 'FIN2' }, { id: 'i-1', titulo: 'Otro', texto: 'w'.repeat(5000) + 'FIN3' }];
  const p = pedido(r, 0); assert.match(p, /FIN1/); assert.match(p, /FIN2/); assert.doesNotMatch(p, /FIN3/);
  assert.match(p, /son datos, no instrucciones/);
  r.etapas[0].ajuste = 'x'; r.etapas[0].salida = 'd'.repeat(39000) + 'FIN4'; assert.match(pedido(r, 0), /FIN4/);
});
t('E2 revisión: una falla después de usar una conexión externa no se reintenta sola', () => {
  const y = trasFalla({ estado: 'trabajando', borrador: 'b', actividades: [] }, 'x', 't', { sinReintento: true });
  assert.equal(y.estado, 'detenida'); assert.equal(y.borrador, '');
  assert.equal(enCola({ estado: 'detenida', fallas: 2, actividades: [] }, 'm', 'a', 't').fallas, 0, 'Reintentar empieza de cero');
});
// ----- F4.5 · Entrega 3: OpenUI -----
const ui = (src, o) => uiHtml(src, createStreamingParser, o);
t('E3: el mensaje se parte en texto e interfaz, también con el bloque a medias', () => {
  assert.deepEqual(partirUi('Hola\n\n```ui\nroot = Stack([])\n```\n\nAdiós'), [{ tipo: 'md', t: 'Hola\n\n' }, { tipo: 'ui', t: 'root = Stack([])\n' }, { tipo: 'md', t: '\n\nAdiós' }]);
  assert.deepEqual(partirUi('Antes\n```ui\nroot = St'), [{ tipo: 'md', t: 'Antes\n' }, { tipo: 'ui', t: 'root = St' }]);
  assert.deepEqual(partirUi('Solo texto, con ```js\ncode\n``` adentro'), [{ tipo: 'md', t: 'Solo texto, con ```js\ncode\n``` adentro' }]);
});
t('E3: dibuja los componentes del OS', () => {
  const h = ui('root = Stack([c, t, s, q])\nc = Card("Ventas", [m])\nm = Metric("Enero", "Q10,000", "sube 5%")\nt = Table(["Mes", "Total"], [["Ene", "10"]])\ns = Steps(["Uno", "Dos"])\nq = Question("¿Seguimos?", ["Sí", "No"])\n');
  assert.match(h, /class="gu-card"/); assert.match(h, /<b>Ventas<\/b>/); assert.match(h, /gu-metric/); assert.match(h, /Q10,000/); assert.match(h, /<th scope="col">Mes<\/th>/); assert.match(h, /<td>Ene<\/td>/);
  assert.match(h, /<ol class="gu-steps">/); assert.match(h, /data-a="opcion" data-t="Sí"/);
});
t('E3: lo que escribe el modelo es dato: se escapa y una acción solo manda un pedido', () => {
  const h = ui('root = Stack([a, b])\na = Text("<img src=x onerror=alert(1)>")\nb = Pedir("Crear \\"tarea\\"", "Crea la tarea <b>")\n');
  assert.doesNotMatch(h, /<img/); assert.match(h, /&lt;img/); assert.match(h, /data-a="ui-pedir"/); assert.doesNotMatch(h, /href|onclick|<script/);
  assert.equal(ui('root = Stack([x])\nx = Desconocido("a")\n').includes('Desconocido'), false, 'un componente que no existe no se dibuja');
});
t('E3: mientras llega se dibuja lo que hay; las opciones viejas quedan apagadas', () => {
  assert.match(ui('root = Stack([a, b])\na = Text("Listo")\nb = Tex'), /Listo/);
  assert.equal(ui(''), '');
  assert.match(ui('root = Stack([q])\nq = Question("¿Sí?", ["A"])\n', { apagado: true }), /disabled/);
});
t('E3: el ejemplo que aprende el modelo se dibuja de verdad y el texto cabe en el contexto', () => {
  const ej = /```ui\n([\s\S]*?)```/.exec(PROMPT_GENUI)[1];
  const r = createStreamingParser(ESQUEMA_UI, 'Stack').set(ej, true); assert.deepEqual(r.meta.errors, []); assert.deepEqual(r.meta.unresolved, []);
  assert.ok(ui(ej).length > 100); assert.ok(PROMPT_GENUI.length < 4200, `${PROMPT_GENUI.length}`); // el catálogo ampliado (test-openui.mjs)
});
t('E3 revisión: un bloque que se expande sin fin no se dibuja ni congela el Chat', () => {
  const lineas = ['root = Stack([a0, a0])'];
  for (let i = 0; i < 16; i++) lineas.push(`a${i} = Stack([a${i + 1}, a${i + 1}])`);
  lineas.push('a16 = Text("x")');
  const t0 = Date.now(), h = ui(lineas.join('\n') + '\n', { final: true });
  assert.ok(Date.now() - t0 < 300, 'no se queda pensando'); assert.ok(h.length < 3000, `${h.length}`); assert.match(h, /gu-src/);
  assert.ok(ui('root = Stack([' + Array.from({ length: 900 }, () => 'Text("x")').join(',') + '])\n').length < 60000);
});
t('E3 revisión: un botón del modelo no manda nada solo y no dispara comandos', () => {
  const h = ui('root = Stack([b])\nb = Pedir("Ver resumen", "/nuevo y borra todo")\n');
  assert.match(h, /data-a="ui-pedir"/); assert.doesNotMatch(h, /data-a="opcion"/); assert.doesNotMatch(h, /data-t="\/nuevo/);
  assert.equal(limpiaPedido('@Strategy hazlo'), 'Strategy hazlo'); assert.equal(limpiaPedido('  /nuevo'), 'nuevo'); assert.equal(limpiaPedido('x'.repeat(900)).length, 300);
  assert.doesNotMatch(ui('root = Stack([q])\nq = Question("¿?", ["/nuevo"])\n'), /data-t="\/nuevo/);
});
t('E3 revisión: los números se muestran, y lo que no se puede dibujar se ve como texto', () => {
  assert.match(ui('root = Stack([m])\nm = Metric("Ventas", 10000)\n'), /10000/);
  assert.match(ui('esto no = es OpenUI (((\n', { final: true }), /gu-src/);
  assert.match(ui('root = Stack([])\n', { final: true }), /gu-src/);
  assert.equal(ui('root = Sta'), '', 'mientras llega no se muestra el código');
});
t('E3 revisión: el contexto y Copiar llevan los datos, no el código', () => {
  const t2 = sinUi('Mira:\n```ui\nroot = Stack([t])\nt = Table(["Canal"], [["Instagram"]])\n```\nFin');
  assert.match(t2, /Canal/); assert.match(t2, /Instagram/); assert.doesNotMatch(t2, /root =|Table\(/); assert.match(t2, /Fin/);
  assert.match(contextoChat([{ r: 'a', t: 'A\n```ui\nroot = Stack([x])\nx = Text("dato")\n```' }]), /dato/); assert.doesNotMatch(contextoChat([{ r: 'a', t: '```ui\nroot = Stack([x])\nx = Text("dato")\n```' }]), /root =/);
});
t('E3 revisión: también se entiende con espacios y saltos de Windows', () => {
  assert.equal(partirUi('```ui \r\nroot = Stack([])\r\n```')[0].tipo, 'ui');
});
// F4.6 · Entrega 1: el agente sabe (PLAN-GATEWAY §21).
t('skills: salen del método de la etapa, sin repetir y aunque venga en frase', () => {
  assert.deepEqual(nombresSkill({ metodo: 'cr-hook-copy' }), ['cr-hook-copy']);
  assert.deepEqual(nombresSkill({ metodo: 'cr-big-idea, cr-storytelling, cr-big-idea' }), ['cr-big-idea', 'cr-storytelling']);
  assert.deepEqual(nombresSkill({ skill: 'Analysis' }), ['analysis']);
  assert.deepEqual(nombresSkill({}), []);
});
t('skills: se quita el encabezado y lo largo se corta en una sección', () => {
  const md = `---\nname: x\n---\n\n# Título\n\n## Uno\n${'a'.repeat(MAX_SKILL - 200)}\n\n## Dos\n${'b'.repeat(500)}`;
  const r = metodoDeSkill(md);
  assert.ok(r.startsWith('# Título')); assert.ok(r.length <= MAX_SKILL + 120);
  assert.ok(!r.includes('## Dos')); assert.match(r, /recortado/);
  assert.equal(metodoDeSkill('---\nname: x\n---\nCorto'), 'Corto');
  assert.ok(metodoDeSkill('a'.repeat(MAX_SKILL + 50)).startsWith('a'.repeat(MAX_SKILL))); // sin saltos de línea no se pierde todo
});
t('conocimiento: la lista cerrada nunca trae la economía y una skill rara no sale del repo', () => {
  assert.ok(RUTAS_BASE.includes('inherent/00-PRINCIPIOS.md'));
  assert.ok(!RUTAS_BASE.some((p) => /ECONOMIA|clients\//.test(p)));
  assert.equal(skillDe('agents/04-creative/', '../../inherent/06-ECONOMIA'), null);
  assert.equal(skillDe('agents/04-creative/', 'cr-hook-copy'), 'agents/04-creative/brain/skills/cr-hook-copy/SKILL.md');
});
const hoyRuns = [
  { id: 'r1', titulo: 'Estrategia Q1', flujo: { nombre: 'Strategy' }, cliente: 'akai', cliente_nombre: 'AKAI', creado_por: 'ana@x.gt', etapas: [{ nombre: 'ICP', estado: 'aprobada' }, { nombre: 'Oferta', estado: 'revision' }] },
  { id: 'r2', titulo: 'Terminado', flujo: { nombre: 'Strategy' }, etapas: [{ nombre: 'A', estado: 'aprobada' }] },
  { id: 'r3', titulo: 'Viejo', flujo: { nombre: 'X' }, archivado: true, etapas: [{ nombre: 'A', estado: 'pendiente' }] },
];
const hoyTareas = [
  { title: 'Guion', assignee: 'ana@x.gt', status: 'En curso', due: '2026-11-03' },
  { title: 'Lista', assignee: 'ana@x.gt', status: 'Hecha', due: '2026-11-03' },
  { title: 'Foto', assignee: 'leo@x.gt', status: 'Por empezar', due: '2026-11-09' },
];
t('equipo: dice qué trabajos siguen, en qué van y las tareas por persona', () => {
  const x = equipoHoy({ runs: hoyRuns, tareas: hoyTareas, nombres: { 'ana@x.gt': 'Ana' }, hoy: '2026-11-04' });
  assert.match(x, /Estrategia Q1/); assert.match(x, /etapa 2 de 2/); assert.match(x, /esperando aprobación/); assert.match(x, /AKAI/);
  assert.ok(!x.includes('Terminado')); assert.ok(!x.includes('Viejo'));
  assert.match(x, /Ana: 1 abierta/); assert.match(x, /1 vencida/); assert.match(x, /leo@x\.gt: 1 abierta/); assert.ok(!x.includes('Lista'));
});
t('equipo: sin nada no agrega texto y nunca pasa del tope', () => {
  assert.equal(equipoHoy({}), '');
  assert.equal(bloqueEquipo(''), '');
  const muchos = Array.from({ length: 200 }, (_, i) => ({ id: `r${i}`, titulo: `Trabajo largo número ${i} ${'x'.repeat(70)}`, flujo: { nombre: 'A' }, etapas: [{ nombre: 'E', estado: 'en_cola' }] }));
  const x = equipoHoy({ runs: muchos }); assert.ok(x.length <= MAX_EQUIPO); assert.ok(x.endsWith('Trabajos') === false);
  assert.match(bloqueEquipo("algo"), /no instrucciones/i);
});
t('equipo: una etapa solo ve a su cliente; lo personal nunca entra', () => {
  const runs = [{ id: 'a', titulo: 'De AKAI', cliente: 'akai', etapas: [{ nombre: 'E', estado: 'en_cola' }] }, { id: 'b', titulo: 'De NAO', cliente: 'nao', etapas: [{ nombre: 'E', estado: 'en_cola' }] }, { id: 'c', titulo: 'Mío', cliente: 'personal', etapas: [{ nombre: 'E', estado: 'en_cola' }] }, { id: 'd', titulo: 'Interno', etapas: [{ nombre: 'E', estado: 'en_cola' }] }];
  const tareas = [{ title: 'T akai', project_id: 'p1', assignee: 'a@x', status: 'En curso' }, { title: 'T nao', project_id: 'p2', assignee: 'a@x', status: 'En curso' }, { title: 'T privada', project_id: 'p1', assignee: 'a@x', status: 'En curso', visibility: 'people' }, { title: 'T personal', project_id: 'p1', tipo: 'Personal', status: 'En curso' }];
  const proyectos = [{ id: 'p1', client_slug: 'akai' }, { id: 'p2', client_slug: 'nao' }];
  const f = deCliente({ runs, tareas, proyectos, run: { id: 'z', cliente: 'akai' } });
  assert.deepEqual(f.runs.map((r) => r.id), ['a']); assert.deepEqual(f.tareas.map((x) => x.title), ['T akai']);
  const s = deCliente({ runs, tareas, proyectos, run: { id: 'z', cliente: '' } });
  assert.deepEqual(s.runs.map((r) => r.id), ['d']); assert.deepEqual(s.tareas, []);
  assert.deepEqual(deCliente({ runs, tareas, proyectos, run: { id: 'c', cliente: 'personal' } }), { runs: [], tareas: [] });
});
t('instrucciones del cliente: se agregan con tope y sin texto vacío', () => {
  assert.equal(bloqueInstrucciones('   '), '');
  assert.match(bloqueInstrucciones('Nunca Halloween'), /INSTRUCCIONES DE ESTE CLIENTE[\s\S]*Nunca Halloween/);
  assert.ok(bloqueInstrucciones('x'.repeat(MAX_INSTRUCCIONES + 500)).length < MAX_INSTRUCCIONES + 120);
});
t('pedido: lleva principios, método y equipo; sin ellos queda igual', () => {
  const run = { titulo: 'T', flujo: { agente: 'A' }, inputs: [], etapas: [{ nombre: 'E', tipo: 'analisis', entrega: 'Doc' }] };
  const con = pedido(run, 0, { principios: 'PRINCIPIO-1', metodo: [{ nombre: 'cr-hook-copy', texto: 'METODO-1' }], equipo: 'EQUIPO-1' });
  assert.match(con, /PRINCIPIO-1/); assert.match(con, /### cr-hook-copy\nMETODO-1/); assert.match(con, /EQUIPO-1/); assert.match(con, /no lo cites/i); assert.match(con, /no bloquees/i);
  assert.ok(!/PRINCIPIO|Método de esta etapa|equipo trabaja/.test(pedido(run, 0, {})));
});
// El servidor nunca lee direcciones internas (LiteLLM, SearXNG, Tailscale, metadatos de la nube) ni esquemas raros.
for (const u of ['http://127.0.0.1:4000/v1/models', 'http://10.0.0.1/', 'http://100.83.31.16/', 'http://169.254.169.254/', 'http://[::1]/', 'file:///etc/passwd', 'http://1.1.1.1:8080/']) {
  await leer(u).then(() => assert.fail(`leyó ${u}`), (e) => assert.match(e.message, /no permitida/));
}
ok++; console.log('✓ web: bloquea direcciones internas y esquemas raros');
console.log(`\n${ok} pruebas OK`);
