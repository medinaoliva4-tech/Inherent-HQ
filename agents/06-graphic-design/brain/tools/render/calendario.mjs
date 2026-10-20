#!/usr/bin/env node
// Lee el calendario de contenido del ciclo (el Excel de ④ Creatividad) y entrega, por pieza, su fila y su sección.
// No decide nada y no gasta IA: filtra, cruza el `id` del CSV con su `## CR-007 · …` y dice qué piezas no entran.
//
//   node calendario.mjs --dir clients/<cliente>/04-contenido/AAAA-MM/ideas [--canal Instagram] [--formato carrusel] [--ids CR-007,CR-009] [--sin-texto]
//
// Salida (JSON): { ok, total, piezas:[{ …13 columnas…, ideas:{ archivo, texto } }], omitidas:[{ id, motivo }], avisos:[…] }
// Entran: filas de formato estático (estatico, carrusel, story) o con foto, con su sección y sin claim `⏸️`.
// Salen: `material = video` · estado `pendiente` · claim pendiente · sin sección. Siempre con su motivo.
import fs from 'node:fs';
import path from 'node:path';

const salir = (o, code = 0) => { console.log(JSON.stringify(o, null, 2)); process.exit(code); };
const a = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i];
  if (!k.startsWith('--')) continue;
  const [n, v] = k.slice(2).split(/=(.*)/s);
  a[n] = v !== undefined ? v : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true);
}
if (!a.dir) salir({ ok: false, motivo: 'Uso: node calendario.mjs --dir <carpeta con plan-de-contenido.csv y los ideas-<formato>.md>' }, 1);
const dir = path.resolve(a.dir);
const csvRuta = path.join(dir, 'plan-de-contenido.csv');
if (!fs.existsSync(csvRuta)) salir({ ok: false, bloqueado: true, motivo: `BLOQUEADO — falta ${csvRuta} (el Excel del ciclo de ④ Creatividad)` }, 2);

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function leerCSV(texto) {
  const filas = []; let campo = '', fila = [], q = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (q) { if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else q = false; } else campo += c; }
    else if (c === '"') q = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && texto[i + 1] === '\n') i++; fila.push(campo); campo = ''; if (fila.some((x) => x !== '')) filas.push(fila); fila = []; }
    else campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); if (fila.some((x) => x !== '')) filas.push(fila); }
  return filas;
}

const [cab, ...cuerpo] = leerCSV(fs.readFileSync(csvRuta, 'utf8').replace(/^﻿/, ''));
const COLS = ['id', 'campana', 'fecha', 'canal', 'formato', 'pilar', 'funcion', 'concepto', 'mezcla', 'traza', 'material', 'estado', 'trial'];
const avisos = [];
if (!cab || COLS.some((c, i) => norm(cab[i]) !== c)) avisos.push(`El CSV no trae las 13 columnas en su orden (${COLS.join(', ')}). Se lee por nombre de columna.`);
const idx = Object.fromEntries((cab || []).map((c, i) => [norm(c), i]));
const filas = cuerpo.map((f) => Object.fromEntries(COLS.map((c) => [c, (f[idx[c]] ?? '').trim()])));

// Las secciones: «## CR-007 · concepto» en cualquier ideas-*.md de la carpeta.
const secciones = new Map();
for (const archivo of fs.readdirSync(dir).filter((f) => /^ideas-.+\.md$/i.test(f))) {
  const texto = fs.readFileSync(path.join(dir, archivo), 'utf8');
  const partes = texto.split(/^(?=## [A-Z]+-\d+\b)/m).filter((p) => /^## [A-Z]+-\d+\b/.test(p));
  for (const p of partes) {
    const id = p.match(/^## ([A-Z]+-\d+)\b/)[1];
    if (secciones.has(id)) avisos.push(`La sección ${id} está en dos documentos (${secciones.get(id).archivo} y ${archivo}).`);
    secciones.set(id, { archivo: path.join(dir, archivo), texto: p.trim() });
  }
}

const filtroCanal = a.canal ? norm(a.canal) : null, filtroFormato = a.formato ? norm(a.formato) : null;
const filtroIds = a.ids ? new Set(String(a.ids).split(',').map((s) => s.trim())) : null;
const ESTATICOS = ['estatico', 'carrusel', 'story', 'stories', 'post', 'portada', 'presentacion', 'imagen'];
const piezas = [], omitidas = [];
for (const f of filas) {
  if (filtroCanal && !norm(f.canal).includes(filtroCanal)) continue;
  if (filtroFormato && !norm(f.formato).includes(filtroFormato)) continue;
  if (filtroIds && !filtroIds.has(f.id)) continue;
  const esEstatico = ESTATICOS.some((e) => norm(f.formato).includes(e));
  const sec = secciones.get(f.id);
  const aprob = sec ? (sec.texto.match(/###\s*Aprobaciones([\s\S]*?)(?=\n###|\n---|$)/i) || [, ''])[1] : '';
  if (!esEstatico && !sec?.texto.match(/portada|frame para feed/i)) { omitidas.push({ id: f.id, motivo: `formato «${f.formato}» no es de ⑥A Diseño gráfico` }); continue; }
  if (norm(f.material) === 'video' && !/portada|frame para feed/i.test(sec?.texto || '')) { omitidas.push({ id: f.id, motivo: 'material = video: va a ⑦ Video Editing' }); continue; }
  if (/pendiente/i.test(f.estado) || f.estado.includes('⏸️')) { omitidas.push({ id: f.id, motivo: `estado «${f.estado}»: no se libera a producción` }); continue; }
  if (!sec) { omitidas.push({ id: f.id, motivo: 'no tiene su sección ## en ningún ideas-<formato>.md: devolver a ④ Creatividad' }); continue; }
  if (aprob.includes('⏸️') && !aprob.includes('✅')) { omitidas.push({ id: f.id, motivo: 'claim con ⏸️ PENDIENTE APROBACIÓN: espera a ②B Branding (br-guardian)' }); continue; }
  if (norm(f.material) === 'foto') avisos.push(`${f.id}: material = foto. Espera su foto de ⑤ Producción antes de componerse.`);
  piezas.push({ ...f, ideas: { archivo: sec.archivo, ...(a['sin-texto'] ? {} : { texto: sec.texto }) } });
}
for (const id of secciones.keys()) if (!filas.some((f) => f.id === id)) avisos.push(`La sección ${id} no tiene fila en el CSV.`);
salir({ ok: true, dir, total: piezas.length, piezas, omitidas, avisos });
