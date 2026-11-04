// Agent Area: el parser de los WORKFLOW.md del repo y las reglas del run (puras). npm run test:agentes
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { AGENTES } from '../public/js/harness/agentes.js';
import { leer, aTexto } from '../gateway/web.mjs';
import { esEscritura } from '../api/_lib/mcp.js';
import { PROPONIBLES_CHAT } from '../api/_lib/agentes.js';
import { idChatTrabajo, sistemaTrabajo, hilo, fuentes, archivos, modoDeArea } from '../public/js/agentes-chat-datos.js';
import { leerIdSesion } from '../public/js/llm/modos.js';
import { leerWorkflow, ESTRATEGIA_GUIADA, puede, activa, completo, simular, leerRespuesta, pedido, desdePlantilla, normalizarWorkflow, TIPOS, aplicarResultado, soloEvidenciaDeInputs, enServidor } from '../public/js/agentes-flujos.js';

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
  assert.equal(puede(r, 0, 'aprobar', { rol: 'coo' }), null);
  r.etapas[0].estado = 'aprobada';
  assert.equal(activa(r), 1);
});
t('el gate del CEO solo lo aprueba el CEO', () => {
  const r = nuevo(); const g = r.etapas.findIndex((e) => e.gate);
  r.etapas.forEach((e, i) => { if (i < g) e.estado = 'aprobada'; });
  r.etapas[g].estado = 'revision';
  assert.match(puede(r, g, 'aprobar', { rol: 'coo' }), /CEO/);
  assert.equal(puede(r, g, 'aprobar', { rol: 'ceo' }), null);
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
// El servidor nunca lee direcciones internas (LiteLLM, SearXNG, Tailscale, metadatos de la nube) ni esquemas raros.
for (const u of ['http://127.0.0.1:4000/v1/models', 'http://10.0.0.1/', 'http://100.83.31.16/', 'http://169.254.169.254/', 'http://[::1]/', 'file:///etc/passwd', 'http://1.1.1.1:8080/']) {
  await leer(u).then(() => assert.fail(`leyó ${u}`), (e) => assert.match(e.message, /no permitida/));
}
ok++; console.log('✓ web: bloquea direcciones internas y esquemas raros');
console.log(`\n${ok} pruebas OK`);
