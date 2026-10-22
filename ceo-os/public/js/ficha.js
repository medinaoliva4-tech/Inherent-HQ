// La ficha de oferta del cliente (00-onboarding/plan-contratado.md), escrita desde el OS con los campos de
// inherent/03-OFERTA.md › «La ficha de oferta». Lo que no se llena queda como «⚠️ SIN DATOS»: nunca se inventa.
// Sin DOM: lo usan el servidor (que la guarda en el repo), la pantalla (el formulario) y las pruebas.

export const NIVELES_FICHA = ['Brand Foundation', 'Brand Growth', 'Growth Partnership', 'A la medida'];
// [clave, etiqueta, ayuda, tabla] · tabla: 'plan' (la de arriba) o 'incluye' («Qué incluye»).
export const CAMPOS_FICHA = [
  ['linea', 'Línea', 'Por ejemplo: Growth (la meta es más proyectos, más grandes)', 'plan'],
  ['precio', 'Precio', 'Lo define el CEO', 'plan'],
  ['redes', 'Redes', 'Instagram · LinkedIn · web…', 'plan'],
  ['pauta', 'Pauta', '¿Entra? ¿Con qué presupuesto aparte?', 'plan'],
  ['fuera', 'Queda fuera', 'Escrito, no sobreentendido', 'plan'],
  ['resultado', 'Resultado que busca', 'Qué quiere lograr el cliente con esto', 'incluye'],
  ['entregables', 'Entregables exactos', 'Qué recibe, pieza por pieza o documento por documento', 'incluye'],
  ['volumen', 'Frecuencia y volumen', 'Cuántos, cada cuánto', 'incluye'],
  ['revisiones', 'Rondas de revisión', 'Cuántas por entregable', 'incluye'],
  ['aporta', 'Qué debe aportar el cliente', 'Accesos, materiales, decisiones, tiempos de respuesta', 'incluye'],
  ['duracion', 'Duración mínima o plazo', 'Cuánto dura el compromiso', 'incluye'],
  ['responsables', 'Responsable de Inherent y del cliente', 'Un rol de cada lado, por área', 'incluye'],
  ['metricas', 'Métricas que se revisan', 'Con qué se mide si funciona', 'incluye'],
];

const celda = (v) => String(v ?? '').replace(/\r?\n+/g, ' · ').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
const valor = (v) => celda(v) || '⚠️ SIN DATOS';

// d = { nombre, nivel, linea, precio, redes, pauta, fuera, resultado, … }
export function fichaMd(d = {}) {
  const fila = ([k, l]) => `| **${l}** | ${valor(d[k])} |`;
  const nivel = NIVELES_FICHA.includes(d.nivel) ? d.nivel : '';
  return [
    `# Plan contratado — ${celda(d.nombre) || 'Cliente'}`,
    '',
    '| | |',
    '|---|---|',
    `| **Plan** | ${nivel === 'A la medida' ? '⬜ **A la medida**' : nivel ? `**${nivel}**` : '⚠️ SIN DATOS'} |`,
    ...CAMPOS_FICHA.filter((c) => c[3] === 'plan').map(fila),
    '',
    '## Qué incluye',
    '',
    '| | |',
    '|---|---|',
    ...CAMPOS_FICHA.filter((c) => c[3] === 'incluye').map(fila),
    '',
    `> Escrita desde Inherent OS. Lo que dice «⚠️ SIN DATOS» falta definirlo: los agentes no lo suponen.`,
    '',
  ].join('\n');
}

// Una ruta dentro de la carpeta del cliente que se puede editar desde el OS (texto: .md o .csv, sin salirse de la carpeta).
export const rutaEditable = (r) => typeof r === 'string' && r.length < 200 && !r.startsWith('/') && !r.split('/').includes('..') && /^[\w\-./ áéíóúñÁÉÍÓÚÑ()]+\.(md|csv)$/.test(r);
