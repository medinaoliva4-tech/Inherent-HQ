// Corre el parser contra el manual real del repo: si cambia el formato de las tablas, esto avisa.
import fs from 'node:fs';
import { parseEconomia, parseOperacion, parsePlanContratado } from '../api/_lib/parse.js';
const root = new URL('../../', import.meta.url).pathname;
const eco = parseEconomia(fs.readFileSync(root + 'inherent/06-ECONOMIA.md', 'utf8'));
if (eco.error) { console.error(eco.error); process.exit(1); }
let bad = 0;
for (const p of eco.plans) {
  console.log(p.name.padEnd(12), 'precio', p.precio, 'costo', p.costo, 'util', p.utilidad, 'margen', p.margen + '%', 'piezas', p.volumen?.piezas, p.checks.cuadra ? '✅' : '❌ NO CUADRA');
  if (!p.checks.cuadra || !p.precio || !p.volumen?.piezas) bad++;
}
console.log('piso', eco.piso, 'scraping', eco.scraping, 'TC', eco.tipoCambio);
const op = parseOperacion(fs.readFileSync(root + 'inherent/05-OPERACION.md', 'utf8'));
console.log('roles', op.roles.length, 'slots', op.slots.length);
const pc = parsePlanContratado(fs.readFileSync(root + 'clients/nao/00-onboarding/plan-contratado.md', 'utf8'), 'team');
console.log('nao(team) campos:', pc.fields.map((f) => f.key).join(' | '), '| costo visible:', pc.costo);
const pcc = parsePlanContratado(fs.readFileSync(root + 'clients/nao/00-onboarding/plan-contratado.md', 'utf8'), 'ceo');
console.log('nao(ceo) costo:', pcc.costo, 'pipeline pasos:', pcc.pipeline.length);
process.exit(bad ? 1 : 0);
