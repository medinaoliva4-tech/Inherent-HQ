// Plantillas de agentes y el «construir con IA» sin modelo: puro (sin DOM ni red).
// Cada plantilla es una especificación COMPLETA y válida (la comprueba validarSpec en las pruebas); nace en el modelo barato y con tope.
// El borrador desde texto NO inventa: elige la plantilla que más se parece por palabras y la deja editable; si no hay parecido, arma uno genérico y lo dice.
import { ACCIONES_EXTERNAS } from './agente-spec.js';

const P = (area, id, nombre, que, medida, fuentes, acciones, extra = {}) => ({
  area, nota: extra.nota || '', claves: extra.claves || [],
  spec: { id, nombre, resultado: { que, medida }, fuentes, acciones, modelo: extra.modelo || 'bajo', harness: extra.harness || 'herramientas',
    contexto: { biblioteca: [], hilo: true, rol: extra.rol || area, cliente: '' }, presupuesto: { por_corrida: extra.corrida ?? 0.25, por_mes: extra.mes ?? 15 } },
});
export const AREAS_PLANTILLA = ['Revenue', 'Marketing', 'Clientes', 'Producción'];
export const PLANTILLAS = [
  P('Revenue', 'calificador-de-leads', 'Calificador de leads', 'Califica cada lead nuevo contra el cliente ideal aprobado y dice por qué encaja o no, con la razón de cada criterio.', 'El 90 % de los leads calificados coincide con la decisión del CEO', ['hilo', 'estrategia', 'ficha-oferta'], ['crearTarea', 'guardarEnHerramienta'], { rol: 'revenue', claves: ['lead', 'calific', 'prospect', 'icp'] }),
  P('Revenue', 'preparador-de-reunion', 'Preparador de reunión', 'Una hora antes de cada llamada arma una hoja: quién viene, qué se dijo antes y qué conviene preguntar.', 'La hoja se lee en menos de 2 minutos y cita sus fuentes', ['hilo', 'entregables', 'estrategia'], ['abrirEnChat'], { rol: 'revenue', claves: ['reunion', 'llamada', 'junta', 'prepar'] }),
  P('Revenue', 'monitor-de-seguimiento', 'Monitor de seguimiento', 'Avisa de los tratos detenidos o sin siguiente paso y deja redactado el seguimiento para que alguien lo apruebe.', 'Ningún trato pasa 7 días sin siguiente paso', ['hilo', 'tareas'], ['crearTarea'], { rol: 'revenue', claves: ['seguim', 'trato', 'pipeline', 'detenid', 'cierre'] }),
  P('Marketing', 'explorador-de-contenido', 'Explorador de contenido', 'Busca lo que mejor funciona en el nicho de la marca, saca su formato y lo adapta a la voz de la marca.', 'Cada idea trae su fuente y se alinea a un pilar de la marca', ['contenido', 'investigacion', 'marca', 'estrategia'], ['guardarEnHerramienta', 'crearTarea'], { rol: 'creative', claves: ['content', 'idea', 'viral', 'tiktok', 'reel', 'nicho'] }),
  P('Marketing', 'guionista', 'Guionista', 'Escribe guiones con gancho en los primeros 3 segundos, con la voz de la marca y lo que se necesita para grabarlos.', 'Cada guion pasa la ficha de criterios de aceptación sin correcciones de forma', ['marca', 'estrategia', 'hilo', 'contenido'], ['guardarEnHerramienta'], { rol: 'creative', claves: ['guion', 'script', 'gancho', 'hook', 'copy'] }),
  P('Marketing', 'analista-de-pauta', 'Analista de pauta', 'Lee el gasto y el rendimiento de los anuncios y propone qué mover, sin mover nada por su cuenta.', 'Cada propuesta cita el dato que la justifica', ['contenido', 'entregables', 'estrategia'], ['abrirEnChat'], { rol: 'ads', claves: ['pauta', 'ads', 'anuncio', 'gasto', 'cpa', 'roas'] }),
  P('Marketing', 'programador-de-publicaciones', 'Programador de publicaciones', 'Prepara lo aprobado para publicarse y lo deja esperando el OK humano antes de salir.', 'Nada sale sin aprobación y cada pieza lleva su fecha y su caption', ['contenido', 'entregables'], ['zernio-publicar'], { rol: 'posting', claves: ['public', 'program', 'posting', 'calendario'], nota: 'Publica: siempre pide aprobación humana.' }),
  P('Clientes', 'resumen-de-llamada', 'Resumen de llamada', 'Convierte una transcripción en lo acordado, lo pendiente y los compromisos, cada uno con su cita literal.', 'Cada compromiso trae la frase exacta de la llamada', ['hilo', 'entregables'], ['crearTarea', 'guardarEnHerramienta'], { rol: 'account', claves: ['transcrip', 'resumen', 'compromiso', 'acuerdo', 'acta'] }),
  P('Clientes', 'reporte-semanal', 'Reporte semanal', 'Arma el avance de la semana de un cliente: qué se entregó, qué espera aprobación y qué viene.', 'El reporte cabe en una pantalla y no menciona costos', ['entregables', 'tareas', 'proyectos', 'hilo'], ['guardarEnHerramienta'], { rol: 'account', claves: ['reporte', 'semana', 'avance', 'informe'] }),
  P('Producción', 'captura-de-pedidos', 'Captura de pedidos', 'Convierte lo que el cliente pide por mensaje en tareas claras con lo que falta para empezar.', 'Cada pedido queda como tarea con responsable y fecha propuesta', ['hilo', 'ficha-oferta', 'tareas'], ['crearTarea'], { rol: 'production', claves: ['pedido', 'solicitud', 'request', 'tarea'] }),
  P('Producción', 'armador-de-shot-list', 'Armador de shot list', 'Ordena las escenas aprobadas en una shot list por locación, con lo que se necesita en cada una.', 'La shot list cubre todas las escenas del ciclo sin repetirlas', ['contenido', 'entregables', 'marca'], ['guardarEnHerramienta'], { rol: 'production', claves: ['shot', 'escena', 'rodaje', 'grabar', 'locaci'] }),
];
export const sugerencias = ['Redacta seguimientos para los tratos detenidos', 'Convierte mis llamadas en tareas y compromisos', 'Busca ideas de contenido virales para una marca'];

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'agente';
// Texto → borrador de especificación. Devuelve { spec, base, parecido, aviso }. Siempre editable; nunca activa nada.
export function borradorDeTexto(texto) {
  const t = norm(texto);
  const puntos = PLANTILLAS.map((p) => ({ p, n: p.claves.filter((c) => t.includes(c)).length })).sort((a, b) => b.n - a.n);
  const mejor = puntos[0]?.n > 0 ? puntos[0].p : null, txt = String(texto || '').trim();
  const base = mejor ? JSON.parse(JSON.stringify(mejor.spec)) : { id: '', nombre: '', resultado: { que: '', medida: '' }, fuentes: ['hilo'], acciones: [], modelo: 'bajo', harness: 'herramientas', contexto: { biblioteca: [], hilo: true, rol: 'revenue', cliente: '' }, presupuesto: { por_corrida: 0.25, por_mes: 15 } };
  const nombre = (mejor ? mejor.spec.nombre : txt.split(/\s+/).slice(0, 4).join(' ')).trim().slice(0, 60);
  base.nombre = nombre.length >= 3 ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : base.nombre || 'Nuevo agente';
  base.id = slug(base.nombre);
  if (txt.length >= 10) base.resultado.que = txt.slice(0, 600);
  base.resultado.medida = mejor ? mejor.spec.resultado.medida : 'Dices tú cómo se mide que salió bien (escríbelo aquí)';
  return { spec: base, base: mejor?.spec.id || null, parecido: mejor ? mejor.spec.nombre : null,
    aviso: mejor ? `Partí de «${mejor.spec.nombre}» porque se parece a lo que pides. Revisa cada campo: es un borrador, no se activa solo.` : 'No encontré un agente parecido: armé un borrador mínimo. Completa lo que falta; no se activa solo.' };
}
export const esExterna = (a) => ACCIONES_EXTERNAS.includes(typeof a === 'string' ? a : a?.nombre);
