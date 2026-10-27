// Todas las reglas de Avisos, en el orden en que se revisan. Cada archivo es un grupo del catálogo:
//   trabajo.js · lo que te toca a ti (tareas, revisiones, leads, cobros, aprobaciones del CEO)
//   clientes-estrategia.js · la ficha, el ciclo, la estrategia y Consulting de cada cliente
//   clientes-marcas.js · el plan del mes, las campañas, las piezas, el diseño y la grabación de cada marca
//   plataforma.js · lo que falta conectar o terminar (Google, el Drive, el celular, tu primer día…)
// Lo que vive en tu compu (Hermes, el puente, la app de Mac) no está aquí: lo revisa el navegador (avisos-compu.js).
import { TRABAJO } from './trabajo.js';
import { CLIENTES_ESTRATEGIA } from './clientes-estrategia.js';
import { CLIENTES_MARCAS } from './clientes-marcas.js';
import { PLATAFORMA } from './plataforma.js';

export const REGLAS = [...TRABAJO, ...CLIENTES_ESTRATEGIA, ...CLIENTES_MARCAS, ...PLATAFORMA];
