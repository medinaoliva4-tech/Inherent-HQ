// Lint de CSS del OS (línea base): bloquea lo NUEVO que se salga de los tokens, sin romper lo que ya existe.
//   npm run lint:css            → falla si hay más hex, radios, font-size, !important o tokens viejos que en la línea base
//   npm run lint:css -- --update → reescribe la línea base (solo cuando se migra algo y los números bajan, o con aprobación)
//   npm run lint:css -- --report → imprime las cifras actuales sin fallar
// Qué mide, por archivo de public/*.css (primitives.css queda fuera: ahí viven los tokens):
//   hex       color #rrggbb dentro de un valor (usa un token --ui-*)
//   radio     border-radius que no sea var(--r-*) / 0 / 50% (usa el token de radio)
//   fuente    font-size que no sea var(--fs-*) / inherit (usa el token de tamaño)
//   important cantidad de !important
//   viejo     var(--ink|--mut|--surface|--fill|--line|--hair|--cream…) : alias de transición, en código nuevo va --ui-*
// La comparación es por valor (no por línea): mover código de lugar no cuenta como nuevo.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(AQUI, '..', 'public');
const BASE = path.join(AQUI, 'lint-css.baseline.json');
const EXENTOS = new Set(['primitives.css']);
const VIEJOS = /var\(--(ink|ink2|mut|tone|warn|bg|surface|surface-rgb|ink-rgb|fill|fill-2|fill2|line|hair|hair-strong|cream|cream2|espresso|brown|lime|lime-ink|glass|glass2|bar|stroke|soft|accent)\b/g;

export function medir(css) {
  const t = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, 'url()').replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
  const r = { hex: {}, radio: {}, fuente: {}, important: 0, viejo: {} };
  const suma = (o, k) => { o[k] = (o[k] || 0) + 1; };
  for (const m of t.matchAll(/[{;]\s*(--[\w-]+|[a-z-]+)\s*:\s*([^;{}]*)/g)) {
    const prop = m[1], val = m[2].trim();
    for (const h of val.match(/#[0-9a-fA-F]{3,8}\b/g) || []) suma(r.hex, h.toLowerCase());
    if (/^border(-[a-z]+){0,2}-radius$/.test(prop)) {
      for (const v of val.replace(/!important/, '').split(/\s*\/\s*|\s+(?![^(]*\))/)) {
        const x = v.trim(); if (x && !/^(var\(|0$|0px$|50%$|100%$|inherit$|initial$|unset$|calc\(var\()/.test(x)) suma(r.radio, x);
      }
    }
    if (prop === 'font-size' && !/^(var\(|inherit|initial|unset|calc\(var\()/.test(val.replace(/!important/, '').trim())) suma(r.fuente, val.replace(/\s*!important/, ''));
  }
  r.important = (t.match(/!important/g) || []).length;
  for (const m of t.matchAll(VIEJOS)) suma(r.viejo, `--${m[1]}`);
  return r;
}
const total = (o) => (typeof o === 'number' ? o : Object.values(o).reduce((a, b) => a + b, 0));

export function medirTodo() {
  const out = {};
  for (const f of fs.readdirSync(PUBLIC).filter((x) => x.endsWith('.css') && !EXENTOS.has(x))) out[f] = medir(fs.readFileSync(path.join(PUBLIC, f), 'utf8'));
  return out;
}

export function nuevos(actual, base) {
  const fallas = [];
  for (const [f, r] of Object.entries(actual)) {
    const b = base[f] || { hex: {}, radio: {}, fuente: {}, important: 0, viejo: {} };
    for (const cat of ['hex', 'radio', 'fuente', 'viejo']) for (const [k, n] of Object.entries(r[cat])) if (n > (b[cat]?.[k] || 0)) fallas.push(`${f} · ${cat} nuevo: ${k} (${b[cat]?.[k] || 0} → ${n})`);
    if (r.important > (b.important || 0)) fallas.push(`${f} · !important nuevo (${b.important || 0} → ${r.important})`);
  }
  return fallas;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const actual = medirTodo(), arg = process.argv.slice(2);
  const resumen = () => { for (const [f, r] of Object.entries(actual)) console.log(`${f}: hex ${total(r.hex)} · radios ${total(r.radio)} (${Object.keys(r.radio).length} distintos) · font-size ${total(r.fuente)} (${Object.keys(r.fuente).length} distintos) · !important ${r.important} · tokens viejos ${total(r.viejo)}`); };
  if (arg.includes('--update')) { fs.writeFileSync(BASE, JSON.stringify(actual, null, 1) + '\n'); console.log('Línea base reescrita.'); resumen(); }
  else if (arg.includes('--report')) resumen();
  else {
    const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : {};
    const f = nuevos(actual, base);
    if (f.length) { console.error('CSS fuera de los tokens (usa primitives.css):'); for (const x of f) console.error(' -', x); console.error('Si es un token nuevo, agrégalo en primitives.css y úsalo con var(). Si bajaron las cifras: npm run lint:css -- --update'); process.exit(1); }
    console.log('lint:css bien: nada nuevo fuera de los tokens.'); resumen();
  }
}
