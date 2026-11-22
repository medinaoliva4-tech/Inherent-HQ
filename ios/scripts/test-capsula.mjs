// La cápsula de Apple: configuración sana (sin simular Xcode). npm test
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const aqui = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (r) => fs.readFileSync(path.join(aqui, r), 'utf8');
let n = 0; const t = (m, fn) => { fn(); console.log('✓', m); n++; };
const cfg = JSON.parse(leer('capacitor.config.json')), pkg = JSON.parse(leer('package.json')), plist = leer('ios/App/App/Info.plist');

t('carga el OS por https y solo navega a su propio dominio (Google NO va dentro de la web: abre el navegador del sistema)', () => {
  const u = new URL(cfg.server.url); assert.equal(u.protocol, 'https:'); assert.equal(cfg.server.cleartext, false);
  assert.deepEqual(cfg.server.allowNavigation, [u.hostname]); assert.ok(!cfg.server.allowNavigation.some((h) => /google/.test(h)));
});
t('el identificador y el nombre', () => { assert.equal(cfg.appId, 'global.inherent.os'); assert.equal(cfg.appName, 'Inherent'); assert.match(leer('ios/App/App.xcodeproj/project.pbxproj'), /PRODUCT_BUNDLE_IDENTIFIER = global\.inherent\.os;/); });
t('el esquema inherent:// está registrado (es por donde vuelve el login)', () => { assert.match(plist, /<key>CFBundleURLSchemes<\/key>\s*<array>\s*<string>inherent<\/string>/); });
t('cada permiso que usa un plugin dice para qué, en español', () => {
  for (const k of ['NSCameraUsageDescription', 'NSPhotoLibraryUsageDescription', 'NSMicrophoneUsageDescription']) assert.match(plist, new RegExp(`<key>${k}</key>\\s*<string>[^<]{30,}</string>`), k);
});
t('las dependencias están fijadas (sin ^ ni ~): lo que se probó es lo que se instala', () => {
  for (const [k, v] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) assert.match(v, /^\d+\.\d+\.\d+$/, `${k}@${v}`);
  assert.equal(pkg.dependencies['@capacitor/core'], pkg.dependencies['@capacitor/ios']);
});
t('sin secretos: ni llaves, ni tokens, ni equipo de firma, ni contraseñas en lo versionado', () => {
  const todo = [leer('capacitor.config.json'), leer('package.json'), plist, leer('ios/App/App.xcodeproj/project.pbxproj'), leer('www/index.html')].join('\n');
  assert.doesNotMatch(todo, /(sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}|client_secret|BEGIN (RSA )?PRIVATE KEY)/);
  assert.doesNotMatch(leer('ios/App/App.xcodeproj/project.pbxproj'), /DEVELOPMENT_TEAM = [A-Z0-9]{10};/, 'el equipo de firma es de cada persona: no se versiona');
});
t('la pantalla sin red existe y explica qué pasó', () => { assert.match(leer('www/index.html'), /No pude abrir Inherent OS/); assert.match(leer('www/index.html'), /Reintentar/); });
t('la guía existe y tiene los pasos del cable', () => { const g = leer('LEEME.md'); for (const s of ['Xcode', 'Apple ID', 'cable', 'Modo desarrollador', 'Confiar', '7 días']) assert.match(g, new RegExp(s)); });
console.log(`${n} pruebas de la cápsula OK`);
