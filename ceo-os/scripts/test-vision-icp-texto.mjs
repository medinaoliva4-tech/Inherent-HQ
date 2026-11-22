// Del texto al cliente ideal: reconoce, afina, excluye y no inventa.
import assert from 'node:assert/strict';
import { icpDeTexto, filtrarExcluidos, resumirICP } from '../public/js/revenue/icp-texto.js';
let ok = 0; const t = (n, f) => { try { f(); ok++; console.log('✓', n); } catch (e) { console.error('✗', n, '\n', e.message); process.exitCode = 1; } };
t('una frase arma el ICP', () => {
  const r = icpDeTexto('Dueños de cafeterías en Guatemala con 5 a 50 personas');
  assert.deepEqual(r.icp.industrias, ['cafeterías']); assert.deepEqual(r.icp.cargos, ['dueño']); assert.deepEqual(r.icp.ubicaciones, ['Guatemala']); assert.deepEqual(r.icp.tamano, { min: 5, max: 50 }); assert.ok(r.entendido);
});
t('«pequeñas» y «medianas» son rangos', () => { assert.deepEqual(icpDeTexto('fundadores de startups pequeñas').icp.tamano, { min: 1, max: 50 }); assert.deepEqual(icpDeTexto('empresas medianas').icp.tamano, { min: 50, max: 250 }); });
t('afinar: agrega cargos y cambia la ubicación sin perder lo anterior', () => {
  const a = icpDeTexto('Dueños de cafeterías en Guatemala'), b = icpDeTexto('agrega gerentes', a);
  assert.deepEqual(b.icp.cargos, ['dueño', 'gerente']); assert.deepEqual(b.icp.industrias, ['cafeterías']); assert.deepEqual(b.icp.ubicaciones, ['Guatemala']);
});
t('«solo en Antigua» reemplaza la ubicación', () => { const a = icpDeTexto('Dueños de cafeterías en Guatemala'), b = icpDeTexto('solo en Antigua', a); assert.deepEqual(b.icp.ubicaciones, ['Antigua']); });
t('deja fuera: quita del ICP y anota la exclusión', () => {
  const a = icpDeTexto('Fundadores de agencias y tiendas en Guatemala'), b = icpDeTexto('deja fuera agencias', a);
  assert.ok(!b.icp.industrias.includes('agencias')); assert.deepEqual(b.excluir.industrias, ['agencias']); assert.ok(b.icp.industrias.includes('tiendas'));
});
t('lo que no entiende no se inventa', () => { const r = icpDeTexto('blablabla xyz'); assert.equal(r.entendido, false); assert.deepEqual(r.cambios, []); assert.equal(r.resumen, 'Sin criterios todavía'); });
t('resumen legible', () => assert.equal(resumirICP({ cargos: ['dueño'], industrias: ['cafeterías'], ubicaciones: ['Guatemala'], tamano: { min: 5, max: 50 } }, { industrias: ['agencias'] }), 'dueño de cafeterías en Guatemala con 5–50 personas (sin agencias)'));
t('filtrarExcluidos saca los excluidos y deja los demás', () => {
  const r = filtrarExcluidos([{ name: 'a', industry: 'agencia de publicidad' }, { name: 'b', industry: 'cafeterías' }, { name: 'c', contact_role: 'Gerente de compras', industry: 'cafeterías' }], { industrias: ['agencias'], cargos: ['gerente'] });
  assert.deepEqual(r.leads.map((x) => x.name), ['b']); assert.equal(r.excluidos.length, 2);
});
t('no muta lo previo', () => { const a = icpDeTexto('Dueños de cafeterías'), copia = JSON.stringify(a); icpDeTexto('agrega gerentes', a); assert.equal(JSON.stringify(a), copia); });
console.log(`${ok} pruebas del ICP por texto`);
