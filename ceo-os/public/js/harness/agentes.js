// Los 9 agentes del repo (agents/00-account … agents/08-ads, la reestructura de PR #297: 1 orquestador + 4 skills como máximo)
// como lista fija. Puro: sin DOM ni red. El OS vive en Vercel y la carpeta agents/ NO está en la copia del build, así que no se
// lista desde el servidor: la lista sale de llm/departamentos.js (los mismos 9 que se llaman con «@» en el Chat) y la vigila
// scripts/test-harness.mjs (9 agentes, ids únicos, números en orden y cada carpeta existe si el repo está).
// modo: el modo del Chat (llm/modos.js) que trabaja ese terreno en el OS; '' = no tiene modo propio.
import { DEPARTAMENTOS } from '../llm/departamentos.js';

export const AGENTES = DEPARTAMENTOS.map(({ n, id, nombre, depto, hace, ventana, modo, carpeta, arroba, orquestador, skills }) => ({ n, id, nombre, depto, hace, ventana, modo, carpeta, arroba, orquestador, skills }));
export const agenteDe = (id) => AGENTES.find((a) => a.id === id) || null;
// Los agentes que trabajan dentro de un modo del Chat (Creative: ② Branding y ⑤ Diseño gráfico; Production: ④ Producción).
export const agentesDeModo = (modo) => AGENTES.filter((a) => a.modo === modo);
// Dónde vive una skill común (recepcion, resultados) o el router (/inherent): fuera de las carpetas numeradas.
export const CARPETAS_COMUNES = ['agents/_comun/', 'agents/_router/'];
