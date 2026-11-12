// Pruebas del aviso de actualización: comparación versión + armado, panel, ruta del despliegue y archivos de la release (sin red ni Electron).
// npm run test:aviso
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { estadoApp, panelActual, hayCambiosWeb, nombreVersion } from '../public/js/app-mac-estado.js';
import { archivoDe, idDespliegue, rutas } from '../api/_lib/escritorio.js';
const require = createRequire(import.meta.url);
const { leerArmado, esMasNueva } = require('../escritorio/armado.js');

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };

t('estadoApp: mismo semver, distinto armado (0.1.11 (18) → (19)) avisa', () => {
  assert.equal(estadoApp('0.1.11', { version: '0.1.11', n: 19 }, 18), 'nueva');
  assert.equal(estadoApp('0.1.11', { version: '0.1.11', n: 19 }, 19), 'aldia');
  assert.equal(estadoApp('0.1.11', { version: '0.1.11', n: 18 }, 19), 'aldia');
});
t('estadoApp: una app sin armado es más vieja que cualquier publicada con su semver', () => {
  assert.equal(estadoApp('0.1.11', { version: '0.1.11', n: 5 }, undefined), 'nueva');
  assert.equal(estadoApp('0.1.11', { version: '0.1.11', n: 5 }, 0), 'nueva');
  assert.equal(estadoApp('0.1.11', { version: '0.1.11' }), 'aldia'); // la ruta no dijo el armado: nada que comparar
});
t('estadoApp: el semver manda sobre el armado', () => {
  assert.equal(estadoApp('0.1.10', { version: '0.1.11', n: 1 }, 99), 'nueva');
  assert.equal(estadoApp('0.1.12', { version: '0.1.11', n: 99 }, 1), 'aldia');
  assert.equal(estadoApp('0.1.9', { version: '0.1.10', n: 1 }, 1), 'nueva'); // 10 > 9, no por texto
  assert.equal(estadoApp('0.2.0', { version: '0.1.30', n: 9 }, 1), 'aldia');
  assert.equal(estadoApp('0.1.5', { version: '0.1.6' }), 'nueva');
  assert.equal(estadoApp('0.1.6', { version: null }), 'aldia');
  assert.equal(estadoApp(undefined, { version: '0.1.1' }), 'nueva'); // sin versión instalada = muy vieja
});
t('nombreVersion: «0.1.12 (23)»', () => { assert.equal(nombreVersion({ version: '0.1.12', n: 23 }), '0.1.12 (23)'); assert.equal(nombreVersion({ version: '0.1.12' }), '0.1.12'); });
t('esMasNueva (main.js) coincide con estadoApp', () => {
  for (const [iv, ib, uv, un] of [['0.1.11', 18, '0.1.11', 19], ['0.1.11', 0, '0.1.11', 5], ['0.1.11', 19, '0.1.11', 19], ['0.1.12', 1, '0.1.11', 99], ['0.1.9', 1, '0.1.10', 1]])
    assert.equal(esMasNueva(uv, un, iv, ib), estadoApp(iv, { version: uv, n: un }, ib) === 'nueva', `${iv}(${ib}) vs ${uv}(${un})`);
});
t('leerArmado: lee build.json; sin archivo, roto o raro es 0', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'armado-'));
  assert.equal(leerArmado(d), 0);
  fs.writeFileSync(path.join(d, 'build.json'), '{"n": 23}'); assert.equal(leerArmado(d), 23);
  fs.writeFileSync(path.join(d, 'build.json'), '{"n": "x"}'); assert.equal(leerArmado(d), 0);
  fs.writeFileSync(path.join(d, 'build.json'), 'no es json'); assert.equal(leerArmado(d), 0);
  fs.rmSync(d, { recursive: true });
});
t('panelActual: la app manda, lo web va después, «Más tarde» calla y sin nada no hay panel', () => {
  const base = { enApp: true, instalada: '0.1.11', build: 18, ultima: { version: '0.1.11', n: 19 }, inicialWeb: 'a', actualWeb: 'a', ahora: 1000 };
  assert.equal(panelActual(base), 'app');
  assert.equal(panelActual({ ...base, actualWeb: 'b' }), 'app');
  assert.equal(panelActual({ ...base, build: 19, actualWeb: 'b' }), 'web');
  assert.equal(panelActual({ ...base, build: 19 }), null);
  assert.equal(panelActual({ ...base, silencioHasta: 2000 }), null);
  assert.equal(panelActual({ ...base, silencioHasta: 999 }), 'app');
  assert.equal(panelActual({ ...base, enApp: false }), null); // en el navegador no hay panel de la app
  assert.equal(panelActual({ ...base, enApp: false, actualWeb: 'b' }), 'web');
});
t('cambios web: sin id (local o ruta caída) no se avisa; con ids distintos sí', () => {
  assert.equal(hayCambiosWeb(null, 'b'), false); assert.equal(hayCambiosWeb('a', null), false);
  assert.equal(hayCambiosWeb('a', 'a'), false); assert.equal(hayCambiosWeb('a', 'b'), true);
});
t('archivoDe: el .zip para actualizar, el .dmg para instalar, por chip', () => {
  const a = ['arm64', 'x64'].flatMap((x) => ['dmg', 'zip'].map((e) => ({ id: 1, nombre: `Inherent-OS-${x}.${e}` })));
  assert.equal(archivoDe(a, 'x64', 'dmg').nombre, 'Inherent-OS-x64.dmg');
  assert.equal(archivoDe(a, 'arm64').nombre, 'Inherent-OS-arm64.zip');
  assert.equal(archivoDe(a, 'raro', 'dmg').nombre, 'Inherent-OS-arm64.dmg');
  assert.equal(archivoDe([], 'arm64', 'dmg'), null);
});
t('GET os/version: público, sin caché, devuelve el id del despliegue', () => {
  const r = []; rutas((m, p, fn) => r.push({ m, p, fn }));
  const ruta = r.find((x) => x.p === 'os/version'); assert.ok(ruta && ruta.m === 'GET');
  const cab = {}; let cuerpo;
  process.env.VERCEL_GIT_COMMIT_SHA = 'abc123';
  ruta.fn({}, { setHeader: (k, v) => { cab[k] = v; }, json: (j) => { cuerpo = j; } });
  assert.deepEqual(cuerpo, { id: 'abc123' }); assert.equal(cab['Cache-Control'], 'no-store');
  delete process.env.VERCEL_GIT_COMMIT_SHA; delete process.env.VERCEL_DEPLOYMENT_ID; assert.equal(idDespliegue(), null);
});
t('piezas: el preload expone build, el workflow lo escribe y el aviso viejo del perfil ya no existe', () => {
  const R = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
  assert.match(fs.readFileSync(path.join(R, 'escritorio/preload.js'), 'utf8'), /build: ipcRenderer\.sendSync\('inherent:build'\)/);
  assert.match(fs.readFileSync(path.join(R, '../.github/workflows/escritorio.yml'), 'utf8'), /build\.json/);
  assert.ok(!fs.readFileSync(path.join(R, 'public/js/app.js'), 'utf8').includes('lat-act'));
  assert.ok(!fs.readFileSync(path.join(R, 'public/app.css'), 'utf8').includes('.lat-act'));
  const pk = JSON.parse(fs.readFileSync(path.join(R, 'escritorio/package.json'), 'utf8'));
  assert.ok(pk.build.files.includes('armado.js') && pk.build.files.includes('build.json'));
});
console.log(`\n${ok} pruebas ok`);
