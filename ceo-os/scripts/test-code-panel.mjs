import assert from 'node:assert/strict';
import { lineasDiff, mensajeComentarios } from '../public/js/llm/code-panel-puro.js';
import { readFileSync } from 'node:fs';

const diff = 'diff --git a/src/a.ts b/src/a.ts\n--- a/src/a.ts\n+++ b/src/a.ts\n@@ -8,3 +8,4 @@\n contexto\n-viejo\n+nuevo\n+extra';
const ls = lineasDiff(diff);
assert.deepEqual(ls.filter((x) => x.linea).map(({ tipo, linea, lado }) => ({ tipo, linea, lado })), [
  { tipo: 'igual', linea: 8, lado: 'despues' },
  { tipo: 'menos', linea: 9, lado: 'antes' },
  { tipo: 'mas', linea: 9, lado: 'despues' },
  { tipo: 'mas', linea: 10, lado: 'despues' },
]);
assert.match(mensajeComentarios([{ ruta: 'src/a.ts', linea: 9, lado: 'antes', texto: 'Conserva esta condición' }]), /src\/a.ts` línea 9 \(versión anterior\): Conserva esta condición/);
const csp = readFileSync(new URL('../vercel.json', import.meta.url), 'utf8');
assert.match(csp, /connect-src [^;]*wss:\/\/code\.inherentglobal\.com/);
assert.match(csp, /frame-src [^;]*https:\/\/\*\.vercel\.app/);
console.log('✓ Código: líneas de diff, comentarios y conexiones permitidas');
