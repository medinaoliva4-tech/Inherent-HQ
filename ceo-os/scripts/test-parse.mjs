// Corre el parser contra el manual real del repo: si cambia el formato de las tablas, esto avisa.
// No imprime montos: solo cuántos datos encontró.
import fs from 'node:fs';
import { parseEconomia, parseOperacion, parsePlanContratado } from '../api/_lib/parse.js';
const root = new URL('../../', import.meta.url).pathname;
const fallas = [];
const ok = (cond, que) => { if (!cond) fallas.push(que); };

const eco = parseEconomia(fs.readFileSync(root + 'inherent/06-ECONOMIA.md', 'utf8'));
ok(!eco.error, `06-ECONOMIA: ${eco.error}`);
if (eco.plans?.length) {
  // El esquema anterior (una tabla de costos por plan): cada plan cuadra.
  for (const p of eco.plans) ok(p.checks.cuadra && p.precio && p.volumen?.piezas, `el plan ${p.name} no cuadra`);
} else {
  // El manual de hoy (por alcance): los rubros con lo que pagan y las herramientas.
  const rub = (eco.rubros || []).map((r) => r.rubro);
  ok(rub.length >= 5, `06-ECONOMIA: encontré ${rub.length} rubros`);
  for (const r of ['Grabación', 'Operador de agentes', 'Herramientas / IA']) ok(rub.includes(r), `06-ECONOMIA: falta el rubro «${r}»`);
  ok((eco.herramientas || []).length >= 1, '06-ECONOMIA: no encontré la tabla de herramientas');
}
ok(Object.keys(eco.piso || {}).length >= 2, '06-ECONOMIA: no encontré el piso mensual');
ok(eco.tipoCambio > 0, '06-ECONOMIA: no encontré el tipo de cambio');
console.log(`06-ECONOMIA · planes ${eco.plans?.length || 0} · rubros ${eco.rubros?.length || 0} · herramientas ${eco.herramientas?.length || 0} · piso ${Object.keys(eco.piso || {}).join('/')} · tipo de cambio ${eco.tipoCambio ? 'sí' : 'no'}`);

const op = parseOperacion(fs.readFileSync(root + 'inherent/05-OPERACION.md', 'utf8'));
ok(op.roles.length > 0 && op.slots.length > 0, '05-OPERACION: sin roles o sin slots');
console.log(`05-OPERACION · roles ${op.roles.length} · slots ${op.slots.length}`);

const nao = fs.readFileSync(root + 'clients/nao/00-onboarding/plan-contratado.md', 'utf8');
const pc = parsePlanContratado(nao, 'team'), pcc = parsePlanContratado(nao, 'ceo');
ok(pc.fields.length > 0, 'la ficha de NAO no trae campos');
ok(!pc.costo, 'la ficha de NAO deja ver el costo al equipo');
console.log(`ficha de NAO · campos ${pc.fields.length} · costo visible al equipo: ${pc.costo ? 'sí' : 'no'} · pasos del pipeline (CEO) ${pcc.pipeline.length}`);

// Las dos copias del puente (la que se instala y la de correr a mano) tienen que ser iguales.
const a = fs.readFileSync(root + 'ceo-os/public/laya/puente.py', 'utf8'), b = fs.readFileSync(root + 'ceo-os/tools/laya-puente/puente.py', 'utf8');
ok(a === b, 'public/laya/puente.py y tools/laya-puente/puente.py no son iguales: copia la que cambiaste sobre la otra');
console.log(`puente · las dos copias iguales: ${a === b ? 'sí' : 'no'}`);

if (fallas.length) { console.error('\n' + fallas.map((f) => '✗ ' + f).join('\n')); process.exit(1); }
console.log('\nEl parser y el puente están bien.');
