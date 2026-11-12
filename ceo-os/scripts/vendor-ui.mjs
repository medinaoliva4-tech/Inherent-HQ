// Vendoriza el comportamiento de los componentes del OS: Zag.js (máquinas de estado sin estilos) + Floating UI (posición).
// El OS sirve JS estático con CSP script-src 'self' y sin bundler: aquí se construyen módulos ESM mínimos, una sola vez,
// y quedan versionados en public/vendor/zag-<versión>/. ui.js los carga con import() solo cuando hacen falta.
//
//   node scripts/vendor-ui.mjs           → reconstruye public/vendor/zag-<versión>/ (necesita npm y red)
//   node scripts/vendor-ui.mjs --check   → solo verifica que lo vendorizado coincide con el README (sha256)
//
// Nada de esto es dependencia de ejecución del servidor: npm instala en una carpeta temporal y se borra al terminar.
// Versiones fijas (revisadas el 2026-11-11 con `npm view` y `gh api repos/chakra-ui/zag`, MIT las dos):
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ZAG = '1.47.0';          // @zag-js/* · publicado 2026-10-26
const FLOATING = '1.8.0';      // @floating-ui/dom · publicado 2026-07-11 (Zag 1.47 lo trae como dependencia de @zag-js/popper)
const ESBUILD = '0.25.0';      // solo para construir
const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DEST = path.join(AQUI, '..', 'public', 'vendor', `zag-${ZAG}`);

// Un módulo de entrada por máquina: ui.js importa solo el que usa. Lo común (núcleo, vanilla, popper/Floating UI)
// queda en trozos compartidos que el navegador baja una vez.
const ENTRADAS = {
  'menu.js': `export * as menu from '@zag-js/menu';\nexport { VanillaMachine, normalizeProps, spreadProps } from '@zag-js/vanilla';\n`,
  'popover.js': `export * as popover from '@zag-js/popover';\nexport { VanillaMachine, normalizeProps, spreadProps } from '@zag-js/vanilla';\n`,
  'tooltip.js': `export * as tooltip from '@zag-js/tooltip';\nexport { VanillaMachine, normalizeProps, spreadProps } from '@zag-js/vanilla';\n`,
};

const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const archivosJs = () => fs.readdirSync(DEST).filter((f) => f.endsWith('.js')).sort();

if (process.argv.includes('--check')) {
  const readme = fs.readFileSync(path.join(DEST, 'README.md'), 'utf8');
  const malos = archivosJs().filter((f) => !readme.includes(`${sha(path.join(DEST, f))}  ${f}`));
  if (malos.length) { console.error('No coinciden con el README:', malos.join(', ')); process.exit(1); }
  console.log(`vendor zag-${ZAG}: ${archivosJs().length} archivos verificados`);
  process.exit(0);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vendor-ui-'));
try {
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'vendor-ui', private: true, type: 'module' }));
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--silent',
    `@zag-js/vanilla@${ZAG}`, `@zag-js/menu@${ZAG}`, `@zag-js/popover@${ZAG}`, `@zag-js/tooltip@${ZAG}`,
    `@floating-ui/dom@${FLOATING}`, `esbuild@${ESBUILD}`], { cwd: tmp, stdio: 'inherit' });
  // esbuild trae su binario por plataforma en un paquete opcional; con --ignore-scripts se usa ese directo.
  const src = path.join(tmp, 'src'); fs.mkdirSync(src);
  for (const [f, c] of Object.entries(ENTRADAS)) fs.writeFileSync(path.join(src, f), c);
  fs.rmSync(DEST, { recursive: true, force: true }); fs.mkdirSync(DEST, { recursive: true });
  const { build } = await import(path.join(tmp, 'node_modules', 'esbuild', 'lib', 'main.js'));
  await build({
    entryPoints: Object.keys(ENTRADAS).map((f) => path.join(src, f)), absWorkingDir: tmp,
    bundle: true, splitting: true, format: 'esm', minify: true, target: 'es2020', outdir: DEST,
    chunkNames: 'comun-[hash]', legalComments: 'none', define: { 'process.env.NODE_ENV': '"production"' },
  });
  // Licencias: una por paquete que termina dentro del bundle.
  const paquetes = [];
  const recorrer = (base) => { for (const scope of ['@zag-js', '@floating-ui']) { const d = path.join(base, scope); if (!fs.existsSync(d)) continue; for (const p of fs.readdirSync(d)) { const pj = JSON.parse(fs.readFileSync(path.join(d, p, 'package.json'), 'utf8')); const lic = fs.readdirSync(path.join(d, p)).find((x) => /^licen[cs]e/i.test(x)); paquetes.push({ nombre: pj.name, version: pj.version, licencia: pj.license, texto: lic ? fs.readFileSync(path.join(d, p, lic), 'utf8').trim() : '' }); } } };
  recorrer(path.join(tmp, 'node_modules'));
  const unicos = [...new Map(paquetes.map((p) => [p.texto, p])).values()];
  fs.writeFileSync(path.join(DEST, 'LICENSES.txt'), [
    'Licencias de lo vendorizado en esta carpeta (todo MIT).',
    'Paquetes: ' + paquetes.map((p) => `${p.nombre}@${p.version} (${p.licencia})`).join(', '),
    '', ...unicos.map((p) => `---------- ${p.nombre} y los demás paquetes con el mismo texto ----------\n${p.texto}\n`),
  ].join('\n'));
  const filas = archivosJs().map((f) => { const b = fs.statSync(path.join(DEST, f)).size; return { f, b, sha: sha(path.join(DEST, f)) }; });
  const total = filas.reduce((a, x) => a + x.b, 0);
  fs.writeFileSync(path.join(DEST, 'README.md'), `# Zag.js ${ZAG} + Floating UI ${FLOATING} (vendorizado)

Comportamiento y accesibilidad de los menús, popovers y tooltips del OS. Sin estilos: el aspecto sale de los tokens
\`--ui-*\` (primitives.css) y de las reglas \`.ui-*\` de app.css. La única puerta es \`public/js/ui.js\`; ninguna pantalla
importa esta carpeta directo.

- Generado con \`node scripts/vendor-ui.mjs\` (esbuild ${ESBUILD}, ESM, minificado, con trozos compartidos).
- Comprobar que no se tocó a mano: \`node scripts/vendor-ui.mjs --check\`.
- Licencias: \`LICENSES.txt\` (MIT: Chakra UI / Segun Adebayo para Zag; Floating UI contributors).
- Entradas: \`menu.js\` (@zag-js/menu), \`popover.js\` (@zag-js/popover), \`tooltip.js\` (@zag-js/tooltip). Cada una
  reexporta \`VanillaMachine\`, \`normalizeProps\` y \`spreadProps\` de @zag-js/vanilla. La posición (flip, shift, offset,
  arrow, size) es @floating-ui/dom ${FLOATING}, que entra por @zag-js/popper dentro de los trozos \`comun-*\`.

Peso total: ${(total / 1024).toFixed(1)} KB sin comprimir.

| archivo | bytes | sha256 |
|---|---:|---|
${filas.map((x) => `| ${x.f} | ${x.b} | \`${x.sha}\` |`).join('\n')}

sha256 (formato de \`shasum -a 256\`):

\`\`\`
${filas.map((x) => `${x.sha}  ${x.f}`).join('\n')}
\`\`\`
`);
  console.log(`vendor listo en ${path.relative(process.cwd(), DEST)}: ${filas.length} archivos, ${(total / 1024).toFixed(1)} KB`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
