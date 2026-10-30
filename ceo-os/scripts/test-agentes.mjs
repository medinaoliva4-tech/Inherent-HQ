// Agent Area: el parser de los WORKFLOW.md del repo y las reglas del run (puras). npm run test:agentes
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { AGENTES } from '../public/js/harness/agentes.js';
import { leerWorkflow, ESTRATEGIA_GUIADA, puede, activa, completo, simular, leerRespuesta, pedido } from '../public/js/agentes-flujos.js';

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
t('el simulado marca SIN DATOS y la evidencia de un modelo nunca sale verificada', () => {
  const s = simular(nuevo(), 0);
  assert.match(s.salida, /SIN DATOS/);
  assert.ok(s.actividades.some((a) => /Simulado/.test(a)));
  const r = leerRespuesta('```etapa\n{"actividades":["a"],"salida":"## X","evidencia":[{"titulo":"t","url":"https://x"}]}\n```');
  assert.equal(r.evidencia[0].verificada, false);
  assert.equal(leerRespuesta('texto suelto').salida, 'texto suelto');
});
t('el pedido lleva las reglas y lo aprobado', () => {
  const r = nuevo(); r.etapas[0].estado = 'aprobada'; r.etapas[0].salida = 'DIAGNOSTICO-OK';
  const p = pedido(r, 1);
  assert.match(p, /Evidencia o etiqueta|evidencia o etiqueta/i);
  assert.match(p, /DIAGNOSTICO-OK/);
});
console.log(`\n${ok} pruebas OK`);
