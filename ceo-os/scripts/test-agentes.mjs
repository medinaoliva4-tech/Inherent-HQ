// Agent Area: el parser de los WORKFLOW.md del repo y las reglas del run (puras). npm run test:agentes
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { AGENTES } from '../public/js/harness/agentes.js';
import { leerWorkflow, ESTRATEGIA_GUIADA, puede, activa, completo, simular, leerRespuesta, pedido, desdePlantilla, normalizarWorkflow, TIPOS } from '../public/js/agentes-flujos.js';

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
console.log(`\n${ok} pruebas OK`);
