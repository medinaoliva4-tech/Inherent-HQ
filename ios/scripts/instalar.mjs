// npm run ios:instalar — deja la cápsula lista para abrir en Xcode. Corre en el MAC (Linux no tiene Xcode).
// No firma, no sube nada y no toca tu cuenta: solo instala dependencias, sincroniza el proyecto y lo abre.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const aqui = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const sh = (c) => execSync(c, { cwd: aqui, stdio: 'inherit' });
const tiene = (c) => { try { execSync(`${c} --version`, { stdio: 'ignore' }); return true; } catch { return false; } };

console.log('\n1 · Reviso tu Mac');
if (process.platform !== 'darwin') { console.log('   ⚠️  Esto es para el Mac (necesita Xcode). Aquí solo se prepara el proyecto; abrirlo y firmarlo se hace en el Mac.'); }
const major = Number(process.versions.node.split('.')[0]);
if (major < 20) { console.error(`   ✗ Node ${process.versions.node}: hace falta Node 20 o más nuevo (nodejs.org).`); process.exit(1); }
if (process.platform === 'darwin') {
  if (!tiene('xcodebuild')) { console.error('   ✗ No encuentro Xcode. Instálalo desde la App Store (es gratis), ábrelo una vez y acepta la licencia.'); process.exit(1); }
  console.log('   ✓ Xcode está instalado');
}
console.log('\n2 · Instalo lo que necesita la cápsula'); sh('npm install --no-audit --no-fund');
if (!fs.existsSync(path.join(aqui, 'ios', 'App', 'App.xcodeproj'))) { console.log('\n   Creo el proyecto de Xcode'); sh('npx cap add ios'); }
console.log('\n3 · Sincronizo'); sh('npx cap sync ios');
if (process.platform === 'darwin') { console.log('\n4 · Abro Xcode'); sh('npx cap open ios'); }
console.log(`
Listo. En Xcode, ahora:
  1) Arriba a la izquierda elige el proyecto «App» → pestaña «Signing & Capabilities» → «Team»: elige tu Apple ID («Personal Team»).
     Si dice que el identificador ya existe, cámbialo (por ejemplo a global.inherent.os.tunombre).
  2) Conecta el iPhone con el cable, desbloquéalo y toca «Confiar en esta computadora».
  3) Arriba elige tu iPhone como destino y pulsa ▶ (Run).
  4) En el iPhone: Ajustes → General → VPN y gestión de dispositivos → tu Apple ID → «Confiar».
Con el Apple ID gratis la app caduca a los 7 días: vuelve a dar ▶ con el cable y listo.
`);
