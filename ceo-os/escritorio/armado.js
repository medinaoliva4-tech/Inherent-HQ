// El número de armado de esta app: el workflow (.github/workflows/escritorio.yml) escribe build.json ({"n": <run_number>}) antes de
// empaquetar, y la release se llama «escritorio-v<versión>-<n>». Sin build.json (app de desarrollo o armada antes de este campo)
// el armado es 0: se trata como más vieja que cualquier publicada con el mismo semver. Sin dependencias: lo usan main.js y las pruebas.
const fs = require('node:fs');
const path = require('node:path');

function leerArmado(dir) {
  try {
    const n = Number(JSON.parse(fs.readFileSync(path.join(dir, 'build.json'), 'utf8')).n);
    return Number.isInteger(n) && n > 0 ? n : 0;
  } catch { return 0; }
}

const partes = (v) => String(v || '').split('.').map(Number);
// ¿(versión, armado) publicada es más nueva que la instalada? Primero major.minor.patch; si empatan, el número de armado.
function esMasNueva(ultimaVersion, ultimaN, instalada, instaladaN) {
  const a = partes(ultimaVersion), b = partes(instalada);
  for (let i = 0; i < 3; i++) if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0);
  return Number(ultimaN || 0) > Number(instaladaN || 0);
}

module.exports = { leerArmado, esMasNueva };
