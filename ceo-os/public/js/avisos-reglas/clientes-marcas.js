// Avisos · Clientes · las marcas: el plan del mes, las campañas, las piezas, el diseño y la grabación de cada marca (ver index.js).
// Cada regla: { id, grupo, area, urgencia, necesita, calcular(datos, persona, hoy, ciclo) → [aviso] }.
// datos.plans ('<slug>--<AAAA-MM>'), datos.campanas (mk_campaigns) y datos.content llegan ya filtrados: solo a quien ve Marcas ·
// contenido en completo o edita, con la marca en su alcance y nunca la marca personal (api/_lib/avisos-datos.js). Aquí tampoco.
// El ciclo: lo que se arma del 1 al 20 de M es el contenido de Mc, que se publica desde el día 1 del mes siguiente.
// «Corre el departamento» sale de la ficha (cycle.js · deptsOfPlan), igual que en clientes-estrategia.js; en Inherent corre todo.
import { aviso, plural, nombreMes, masDias, diasEntre, finDeMes, fold } from './base.js';
import { deptsOfPlan } from '../cycle.js';
import { idPlan, avancePlan, revisarSlots, sumaPilares, slotsAPiezas } from '../plan-mes.js';
import { anticipacion, revisarCampana, revisarMes, campanasDelMes } from '../campanas.js';
import { estadoDe, separar, nombreDe } from '../element.js';
import { candado, formatoDe } from '../calendario-contenido.js';
import { redDe } from '../calendario-vistas.js';
import { FORMATOS as FORMATOS_DG } from '../diseno.js';
import { vivaId } from '../estrategia-viva.js';

const lc = (x) => String(x || '').toLowerCase();
const url = encodeURIComponent;
const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
const fechaDe = (x) => (esFecha(String(x?.date || '').slice(0, 10)) ? String(x.date).slice(0, 10) : '');
const porFecha = (a, b) => fechaDe(a).localeCompare(fechaDe(b));
const corta = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };
const yLista = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`);
const Mayus = (s) => String(s).replace(/^./, (c) => c.toUpperCase());
// «el 5» si es de este mes; «el 5 de noviembre» si no.
const elDia = (iso, hoy) => `el ${+iso.slice(8, 10)}${iso.slice(0, 7) === hoy.slice(0, 7) ? '' : ` de ${nombreMes(iso)}`}`;

// La marca: un cliente con ficha (sin ficha solo sale cli-sin-ficha) y nunca la marca personal.
const marcas = (d) => (d.clientes || []).filter((c) => c?.slug && c.slug !== 'personal' && c.ficha?.hay);
const nivelId = (c) => c?.ficha?.nivel?.id || '';
// ¿Corre este departamento? Con pipeline en la ficha, manda el pipeline; sin pipeline, Growth y Partnership corren todo y a la
// medida nada. Brand Foundation no tiene ciclo. Inherent corre todo (sus propias redes).
const corre = (c, code) => { if (c.slug === 'inherent') return true; const n = nivelId(c), pip = c.ficha?.pipeline || []; return !n || n === 'foundation' ? false : pip.length ? deptsOfPlan(c.ficha).includes(code) : n !== 'medida'; };
// ¿Ya está en su carpeta? (intel.presentes: el listado del repo, sin leer los archivos). mes: el AAAA-MM del entregable.
const hay = (c, id, mes) => (c.presentes || []).some((x) => x.id === id && (mes === undefined || x.mes === mes));
const planDe = (d, slug, mes) => (d.plans || []).find((x) => x?.id === idPlan(slug, mes)) || null;
// Las piezas de la marca (content kind 'post') sin las del Archivo (element.js · separar).
const piezasDe = (d, slug, hoy) => separar((d.content || []).filter((x) => x?.kind === 'post' && x.profile === slug), hoy).vivos;
const delMes = (xs, mes) => xs.filter((x) => fechaDe(x).slice(0, 7) === mes);
const sinTerminar = (x) => ['Idea', 'En proceso'].includes(estadoDe(x));
// Lo que diseña ⑥A: carrusel, estático y story (los formatos del chat de Diseño, diseno.js, sin «Plantilla»).
const DISENO = FORMATOS_DG.map(([f]) => f).filter((f) => f !== 'Plantilla');
const PLURAL_F = { Carrusel: 'carruseles', 'Estático': 'estáticos', Story: 'stories' };
const nombrePieza = (x, c) => x.title || nombreDe(x, c.nombre);

// El perfil content: el operador corre ④, ⑥A, ⑧ y ⑨ (inherent/05-OPERACION.md §5). Si nadie del equipo lo tiene, lo lleva el CEO.
const opera = (d, p) => (d.yo?.roles || []).includes('content') || (p.esCeo && !(d.team || []).some((x) => x.active !== false && (x.roles || []).includes('content')));
const edita = (p) => p.edita('content');
const veMarcas = (p) => p.completo('content'); // ve las piezas y los planes (el CEO siempre)
// ¿La estrategia está aprobada? El candado de PUT plan (api/_lib/plan.js · estrategiaAprobada). c.aprobada lo trae avisos-datos para
// todo el que ve la marca (GET plan ya se lo dice); sin él, el doc viva, que solo llega a quien ve Estrategia. null = no se sabe.
const aprobadaDe = (d, p, c) => (typeof c.aprobada === 'boolean' ? c.aprobada : p.esCeo || p.ve('estrategia') ? Boolean((d.strategy || []).find((x) => x.id === vivaId(c.slug))?.aprobado) : null);
// La tarea de la receta de ese departamento en el ciclo de este mes, tuya y vencida: ya sale en tareas-vencidas. El aviso la enlaza
// y la «tapa» (catálogo: «si un aviso de cliente coincide con su tarea de receta atrasada, sale uno solo, con la tarea enlazada»).
const tareaReceta = (d, p, slug, M, code, hoy) => {
  const ps = new Set((d.projects || []).filter((x) => x?.kind === 'Ciclo mensual' && x.client_slug === slug && x.cycle === M).map((x) => x.id));
  return (d.tasks || []).find((t) => ps.has(t?.project_id) && String(t.dept || '').startsWith(code + ' ') && lc(t.assignee) === p.email && t.status !== 'Hecha' && esFecha(t.due) && t.due <= hoy) || null;
};
const conTarea = (x, t) => {
  if (!t) return x;
  const b = { label: 'Abrir la tarea', abre: 'tarea', id: t.id };
  return { ...x, ...(x.accion ? { accion2: x.accion2 || b } : { accion: b }), tapa: [`tareas-vencidas:${t.id}`] };
};
// Las campañas de la marca que esta persona sigue: el CEO, quien ve Marcas · contenido completo y la persona de c.responsable
// (a ella le salen en «Tu trabajo»).
const campanasDe = (d, p, c) => (d.campanas || []).filter((x) => x?.profile === c.slug && (p.esCeo || p.completo('content') || lc(x.responsable) === p.email));
const idC = (c, x) => x.id || `${c.slug}--${fold(x.nombre).replace(/[^a-z0-9]+/g, '-')}`;
const paraResp = (x, camp, p) => (lc(camp.responsable) === p.email ? { ...x, grupo: 'trabajo' } : x);
const laCampana = (x) => (x.tipo === 'evento' ? 'El evento' : 'La campaña');
// El botón a la campaña: solo a quien abre Marcas · contenido completo (GET campanas responde 403 en «resumen» y sin Marcas). La
// persona responsable sin esa vista no tiene botón; a quien no edita, el detalle le dice quién la edita.
const verCampana = (p, slug) => (veMarcas(p) ? { label: edita(p) ? 'Abrir la campaña' : 'Ver la campaña', href: hrefCamp(slug) } : null);
const quienEdita = (p) => (edita(p) ? '' : 'La edita quien edita Marcas · contenido.');
const hrefPlan = (slug, mes) => `#/marcas/${url(slug)}/plan/${mes}`;
const hrefCal = (slug) => `#/marcas/${url(slug)}/calendario`;
// El calendario de la marca con un solo filtro prendido, o el chat de Diseño en una etapa y un mes (screens/avisos.js).
const cal = (label, slug, filtro) => ({ label, abre: 'calendario', slug, filtro });
const chatDiseno = (label, slug, etapa, mes) => ({ label, abre: 'diseno', slug, etapa, mes });
const hrefCamp = (slug) => `#/marcas/${url(slug)}/campanas`;
const pasar = (slug, mes, label, hecho) => ({ label, api: { method: 'POST', ruta: `plan/${url(slug)}/${mes}/a-creatividad`, body: {} }, hecho });

// mk-plan-del-mes · inherent/05-OPERACION.md §4 (días 1-3 el plan; «el ciclo de octubre es el contenido de noviembre») y
// agents/03-marketing/brain/WORKFLOW.md «Tu ventana en el ciclo»: el calendario llega a ④ a más tardar el día 3. Del 1 al 20, si
// corren ③ y ④: el plan de Mc vacío, en borrador o sin pasar a Ideas. Sin estrategia aprobada o brief de comunicación, «bloqueado»
// y sin botón. Media del 1 al 3, alta desde el 4. Pasarlo pide editar Marcas · contenido (y, con slots por revisar, verlo antes).
const PLAN = { id: 'mk-plan-del-mes', grupo: 'clientes', area: 'marketing', urgencia: 'alta', necesita: { area: 'content', nivel: 'completo' } };
PLAN.calcular = (d, p, hoy, { d: dia, M, Mc }) => {
  if (dia > 20) return [];
  const urgencia = dia <= 3 ? 'media' : 'alta', mes = nombreMes(Mc);
  const ventana = dia <= 3 ? '③ Marketing tiene hasta el día 3.' : 'La ventana de ③ Marketing cerraba el día 3: ④ Creatividad no puede idear.';
  return marcas(d).filter((c) => corre(c, '③') && corre(c, '④')).flatMap((c) => {
    const plan = planDe(d, c.slug, Mc), slots = plan?.slots || [];
    if (slots.length && plan.a_creatividad) return [];
    const apr = aprobadaDe(d, p, c), brief = hay(c, 'brief-comunicacion', M) || hay(c, 'brief-comunicacion', Mc);
    const faltan = [apr === false && 'la estrategia aprobada', !brief && 'el brief de comunicación'].filter(Boolean);
    const base = { clave: `mk-plan-del-mes:${c.slug}`, cliente: c.slug, urgencia, desde: `${M}-01` }, t = tareaReceta(d, p, c.slug, M, '③', hoy);
    if (faltan.length) return [conTarea(aviso(PLAN, { ...base, huella: `bloqueado|${apr}|${brief}|${urgencia}`,
      titulo: `El plan de ${mes} de ${c.nombre} está bloqueado: falta ${yLista(faltan)}`,
      detalle: [apr === false ? (p.esCeo ? 'La estrategia la apruebas tú.' : 'La estrategia la aprueba el CEO.') : '', brief ? '' : 'El brief lo arma ① Strategy.', 'Sin eso, ③ Marketing no puede planear.'].filter(Boolean).join(' ') }), t)];
    const n = avancePlan(plan || {});
    if (!slots.length) return [conTarea(aviso(PLAN, { ...base, huella: `${n ? 'borrador' : 'vacio'}|${n}|${urgencia}`,
      titulo: n ? `El plan de ${mes} de ${c.nombre} va en borrador: ${n} de 5` : `El plan de ${mes} de ${c.nombre} está vacío`,
      detalle: [n ? 'Le faltan las piezas: sin ellas no pasa a Ideas.' : 'Se arma en el Chat, en modo Marketing.', ventana].join(' '),
      accion: { label: edita(p) ? (n ? 'Seguir el plan' : 'Armar el plan') : 'Ver el plan', href: hrefPlan(c.slug, Mc) } }), t)];
    const porRevisar = revisarSlots(slots, plan.canales || []).length;
    return [conTarea(aviso(PLAN, { ...base, huella: `sin-pasar|${slots.length}|${urgencia}`,
      titulo: `El plan de ${mes} de ${c.nombre} tiene ${plural(slots.length, 'pieza', 'piezas')} sin pasar a Ideas`,
      detalle: [porRevisar ? `${plural(porRevisar, 'pieza tiene', 'piezas tienen')} algo por revisar antes de pasar el plan.` : '', ventana, edita(p) ? '' : 'Las pasa quien edita Marcas · contenido.'].filter(Boolean).join(' '),
      accion: edita(p) && !porRevisar ? pasar(c.slug, Mc, `Pasar ${plural(slots.length, 'pieza', 'piezas')} a Ideas`, 'Listo: las piezas ya están en Ideas') : { label: edita(p) ? 'Revisar y pasar' : 'Ver el plan', href: hrefPlan(c.slug, Mc) } }), t)];
  });
};

// mk-plan-por-revisar · agents/03-marketing/brain/WORKFLOW.md §2 («Las combinaciones que están prohibidas», «Todo slot traza a una
// MUST BE TRUE»), la skill mk-pilares (el reparto cierra en 100%) y mk-campana §5 y §7. El plan de Mc con slots y algo por revisar
// (plan-mes.js · revisarSlots y sumaPilares, lo mismo que marca la pantalla). Media mientras no pasa a Creatividad; baja después.
// La huella lleva el mes: los slots se llaman MK-001… cada mes, y un pospuesto del plan de un mes no tapa el del siguiente.
const PLAN_REV = { id: 'mk-plan-por-revisar', grupo: 'clientes', area: 'marketing', urgencia: 'media', necesita: { area: 'content', nivel: 'completo' } };
PLAN_REV.calcular = (d, p, hoy, { Mc }) => marcas(d).flatMap((c) => {
  const plan = planDe(d, c.slug, Mc);
  if (!plan?.slots?.length) return [];
  const malos = revisarSlots(plan.slots, plan.canales || []), suma = sumaPilares(plan.pilares || []), pilares = (plan.pilares || []).length > 0 && suma !== 100;
  const cp = plan.campana && (plan.campana.nombre || plan.campana.idea) ? plan.campana : null, sinTraza = Boolean(cp && !cp.traza), sinMeta = Boolean(cp && !cp.meta);
  const n = malos.length + (pilares ? 1 : 0) + (sinTraza || sinMeta ? 1 : 0);
  if (!n) return [];
  const idea = sinTraza && sinMeta ? 'la idea del mes no traza a una MUST BE TRUE ni tiene meta' : sinTraza ? 'la idea del mes no traza a una MUST BE TRUE' : sinMeta ? 'la idea del mes no tiene meta' : '';
  return [aviso(PLAN_REV, {
    clave: `mk-plan-por-revisar:${c.slug}`, cliente: c.slug, urgencia: plan.a_creatividad ? 'baja' : 'media',
    huella: `${Mc}|${malos.map((x) => `${x.id}:${x.avisos.length}`).join(',')}|${pilares ? suma : ''}|${sinTraza ? 1 : 0}${sinMeta ? 1 : 0}|${plan.a_creatividad ? 1 : 0}`,
    titulo: `El plan de ${nombreMes(Mc)} de ${c.nombre} tiene ${plural(n, 'cosa por revisar', 'cosas por revisar')}`,
    detalle: Mayus([malos.length ? `${plural(malos.length, 'pieza', 'piezas')} con algo por revisar (${malos[0].id}: ${malos[0].avisos[0]})` : '', pilares ? `los pilares suman ${suma}%, no 100%` : '', idea].filter(Boolean).join(' · ')),
    accion: { label: 'Revisar el plan', href: hrefPlan(c.slug, Mc) },
  })];
});

// mk-plan-desactualizado · agents/03-marketing/brain/WORKFLOW.md §6 (a ④ Creatividad le toca el calendario completo) y
// agents/04-creative/brain/WORKFLOW.md §2 (el calendario de ③ es lo único que bloquea). Ya pasó a Ideas y después cambiaron sus slots,
// o a Ideas le falta alguna pieza del plan (plan-mes.js · slotsAPiezas, ids fijos). «Poner al día» no toca lo que escribió ④.
const PLAN_DES = { id: 'mk-plan-desactualizado', grupo: 'clientes', area: 'marketing', urgencia: 'media', necesita: { area: 'content', nivel: 'edita' } };
PLAN_DES.calcular = (d, p, hoy, { Mc }) => marcas(d).flatMap((c) => {
  const plan = planDe(d, c.slug, Mc);
  if (!plan?.a_creatividad || !plan.slots?.length) return [];
  const cambio = String(plan.actualizado?.slots || '') > String(plan.a_creatividad), ids = new Set((d.content || []).map((x) => x?.id));
  const faltan = slotsAPiezas(plan, c.slug, Mc).filter((x) => !ids.has(x.id));
  if (!cambio && !faltan.length) return [];
  const mes = nombreMes(Mc);
  return [aviso(PLAN_DES, {
    clave: `mk-plan-desactualizado:${c.slug}`, cliente: c.slug, desde: String(plan.actualizado?.slots || plan.a_creatividad).slice(0, 10),
    huella: `${plan.actualizado?.slots || ''}|${faltan.map((x) => x.id).join(',')}`,
    titulo: cambio ? `El plan de ${mes} de ${c.nombre} cambió después de pasarlo a Ideas` : `A Ideas ${faltan.length === 1 ? 'le falta 1 pieza' : `le faltan ${faltan.length} piezas`} del plan de ${mes} de ${c.nombre}`,
    detalle: [cambio && faltan.length ? `Y ${plural(faltan.length, 'pieza no está', 'piezas no están')} en el calendario.` : '', 'Ponerlo al día solo cambia el slot de cada pieza: lo que escribió ④ Creatividad se queda.'].filter(Boolean).join(' '),
    accion: pasar(c.slug, Mc, 'Poner al día', 'Listo: Ideas quedó al día con el plan'),
  })];
});

// mk-canal-fuera-ficha · agents/03-marketing/brain/WORKFLOW.md §0 «Canales contratados» y §7 («No inventa un canal que el cliente
// no tiene»); CLAUDE.md «Escalar no es bloquear»: el alcance va al CEO. El plan de Mc usa un canal que no está en «Redes» de la
// ficha (sin acentos ni mayúsculas). Sin «Redes» en la ficha (como la de Inherent), no se calcula. La huella lleva el mes.
// Cada red se compara sin signos (el punto al final de la fila no cambia la red) y con los alias de los dos lados (IG = Instagram).
const ALIAS_RED = { ig: 'instagram', fb: 'facebook', tt: 'tiktok', 'tik tok': 'tiktok', yt: 'youtube' };
const normaRed = (s) => { const k = fold(s).replace(/[^a-z0-9]+/g, ' ').trim(); return ALIAS_RED[k] || k; };
const lineaRedes = (txt) => String(txt || '').split(/\.\s/)[0].replace(/[\s.]+$/, '');
const redesDe = (txt) => lineaRedes(txt).replace(/\([^)]*\)/g, ' ').split(/·|,|\/|\s+y\s+/).map(normaRed).filter(Boolean);
const enRedes = (canal, redes) => { const k = normaRed(canal); return redes.some((r) => k === r || k.startsWith(r + ' ') || r.startsWith(k + ' ')); };
const CANAL = { id: 'mk-canal-fuera-ficha', grupo: 'clientes', area: 'marketing', urgencia: 'media', necesita: { rol: ['ceo'] } };
CANAL.calcular = (d, p, hoy, { Mc }) => marcas(d).flatMap((c) => {
  const redes = redesDe(c.ficha?.redes), plan = planDe(d, c.slug, Mc);
  if (!redes.length || !plan) return [];
  const fuera = (xs) => [...new Map(xs.map((x) => String(x?.canal || '').trim()).filter((k) => normaRed(k) && !enRedes(k, redes)).map((k) => [normaRed(k), k])).values()];
  const enSlots = fuera(plan.slots || []), todos = fuera([...(plan.slots || []), ...(plan.canales || [])]);
  if (!todos.length) return [];
  const cuales = enSlots.length ? enSlots : todos;
  return [aviso(CANAL, {
    clave: `mk-canal-fuera-ficha:${c.slug}`, cliente: c.slug, huella: `${Mc}|${todos.map(normaRed).sort().join(',')}`,
    titulo: `El plan de ${nombreMes(Mc)} de ${c.nombre} ${enSlots.length ? 'pone piezas en' : 'usa'} ${yLista(cuales)}, que no ${cuales.length === 1 ? 'está' : 'están'} en su ficha`,
    detalle: `Su ficha dice: ${corta(lineaRedes(c.ficha.redes), 140)}. El alcance lo decides tú: se quita del plan o se cotiza aparte.`,
    accion: { label: 'Revisar el plan', href: hrefPlan(c.slug, Mc) },
  })];
});

// cr-sin-brief · agents/04-creative/brain/WORKFLOW.md §1 «Qué lleva brief-del-ciclo.md», «La carpeta del cliente» y «Tu ventana en
// el ciclo» (días 1-3). Del 1 al 20, si corre ④ y el candado de Mc está cerrado (calendario-contenido.js · candado, el mismo de
// reglasPieza en api/index.js): no hay brief del ciclo de Mc y el CEO no abrió el mes. Media del 1 al 3, alta desde el 4.
// El brief vale en las dos rutas (la del servidor, 04-contenido/<mes>/, y la del manual, …/ideas/): c.briefCiclo, de avisos-datos.
// Con Marcas · contenido en «resumen» no sale (no abre el brief ni el calendario), aunque tenga el perfil content.
const BRIEF_C = { id: 'cr-sin-brief', grupo: 'clientes', area: 'diseno', urgencia: 'alta', necesita: { area: 'content', nivel: 'completo' } };
const conBriefDe = (c) => (Array.isArray(c.briefCiclo) ? [...new Set([...c.briefCiclo, ...(c.presentes || []).filter((x) => x.id === 'brief-ciclo').map((x) => x.mes)])] : null);
BRIEF_C.calcular = (d, p, hoy, { d: dia, M, Mc }) => {
  if (dia > 20 || !(p.esCeo || opera(d, p))) return [];
  const urgencia = dia <= 3 ? 'media' : 'alta', mes = nombreMes(Mc);
  return marcas(d).filter((c) => corre(c, '④')).flatMap((c) => {
    const con = conBriefDe(c);
    if (!con || !candado(Mc, con, d.settings?.brief_open?.marcas?.[c.slug] || []).cerrado) return [];
    return [aviso(BRIEF_C, {
      clave: `cr-sin-brief:${c.slug}`, cliente: c.slug, urgencia, desde: `${M}-01`, huella: `${Mc}|${urgencia}`,
      titulo: `${Mayus(mes)} de ${c.nombre} sigue cerrado: falta el brief del ciclo`,
      detalle: `Sin él no se crean piezas con fecha de ${mes}: lo deja ④ Creatividad. ${p.esCeo ? `Si hace falta, tú lo abres sin brief: en el calendario, pasa a ${mes}.` : 'Si hace falta, el CEO abre el mes sin brief.'}`,
      accion: p.esCeo ? { label: 'Abrir el mes sin brief', href: hrefCal(c.slug) } : { label: 'Ver qué falta', href: `#/marcas/${url(c.slug)}/brief` },
    })];
  });
};

// cr-ideas-faltan · agents/04-creative/brain/WORKFLOW.md «Tu ventana en el ciclo» (cierra a más tardar el día 3) y
// agents/06-graphic-design/brain/WORKFLOW.md §6 (sin el Excel de ④, BLOQUEADO); el servidor no deja diseñar sin idea. Del 1 al 20,
// si corre ④ y el plan de Mc ya pasó a Ideas: piezas del plan sin idea_chat. Media del 1 al 3, alta desde el 4 (⑤ coordina).
const IDEAS = { id: 'cr-ideas-faltan', grupo: 'clientes', area: 'diseno', urgencia: 'alta', necesita: { area: 'content', nivel: 'completo' } };
IDEAS.calcular = (d, p, hoy, { d: dia, M, Mc }) => {
  if (dia > 20 || !(p.esCeo || opera(d, p))) return [];
  const urgencia = dia <= 3 ? 'media' : 'alta';
  return marcas(d).filter((c) => corre(c, '④') && planDe(d, c.slug, Mc)?.a_creatividad).flatMap((c) => {
    const xs = piezasDe(d, c.slug, hoy).filter((x) => x.slot?.plan === idPlan(c.slug, Mc) && !x.idea_chat);
    if (!xs.length) return [];
    return [conTarea(aviso(IDEAS, {
      clave: `cr-ideas-faltan:${c.slug}`, cliente: c.slug, urgencia, desde: `${M}-01`, huella: `${Mc}|${xs.length}|${urgencia}`,
      titulo: `A ${plural(xs.length, 'pieza', 'piezas')} del plan de ${nombreMes(Mc)} de ${c.nombre} ${xs.length === 1 ? 'le falta su idea' : 'les falta su idea'}`,
      detalle: [dia <= 3 ? '④ Creatividad tiene hasta el día 3.' : 'La ventana de ④ Creatividad cerraba el día 3: ⑤ Producción ya coordina.', 'Sin idea, una pieza del plan no se diseña.', edita(p) ? '' : 'Las pide quien edita Marcas · contenido.'].filter(Boolean).join(' '),
      accion: edita(p) ? chatDiseno('Pedir las ideas', c.slug, 'ideas', Mc) : { label: 'Ver las ideas', href: `#/marcas/${url(c.slug)}/ideas` },
    }), tareaReceta(d, p, c.slug, M, '④', hoy))];
  });
};

// mk-campana-a-tiempo · agents/03-marketing/brain/skills/mk-campana/SKILL.md § La anticipación, regla 3 («no puede exceder el ciclo»),
// y § 6 Bloqueos («El aviso llegó tarde. Se trabaja igual y se declara»). (a) campanas.js · revisarCampana dice que el aviso llegó
// tarde o que el primer aviso ya pasó en borrador, y la campaña no ha terminado: alta. (b) Del 1 al 20, una en Borrador cuyo primer
// aviso cae de hoy al fin de Mc y ni el plan ni ninguna pieza la nombran: media; alta si el primer aviso cae en 7 días o menos.
const CAMP_T = { id: 'mk-campana-a-tiempo', grupo: 'clientes', area: 'marketing', urgencia: 'alta' };
CAMP_T.calcular = (d, p, hoy, { d: dia, M, Mc, finMc }) => marcas(d).flatMap((c) => {
  const piezas = piezasDe(d, c.slug, hoy), planes = [planDe(d, c.slug, M), planDe(d, c.slug, Mc)];
  return campanasDe(d, p, c).filter((x) => !['Cerrada', 'Archivada'].includes(x.estado)).flatMap((x) => {
    const r = revisarCampana(x, hoy), a = anticipacion(x), fin = x.hasta || x.ancla, base = { clave: `mk-campana-a-tiempo:${idC(c, x)}`, cliente: c.slug };
    const tarde = r.some((t) => /el aviso llegó tarde/.test(t)), borr = r.includes('El primer aviso ya pasó y sigue en borrador');
    const ver = verCampana(p, c.slug);
    if ((tarde || borr) && esFecha(fin) && fin >= hoy) return [paraResp(aviso(CAMP_T, { ...base, urgencia: 'alta', desde: a[0]?.fecha || x.ancla, huella: `${tarde ? 'tarde' : ''}|${borr ? 'borrador' : ''}|${x.ancla}|${x.estado}`,
      titulo: tarde ? `El aviso de «${x.nombre}» de ${c.nombre} llegó tarde` : `El primer aviso de «${x.nombre}» de ${c.nombre} ya pasó y sigue en borrador`,
      detalle: [tarde ? `Cae ${elDia(x.ancla, hoy)}, en los primeros 7 días del ciclo: se trabaja igual y se declara.` : '', borr ? `El primer aviso era ${elDia(a[0].fecha, hoy)}: ${edita(p) ? 'ponla en curso o ajusta su anticipación' : 'se pone en curso o se ajusta su anticipación'}.` : '', quienEdita(p)].filter(Boolean).join(' '),
      accion: ver }), x, p)];
    // (b) cruza el plan y las piezas: sin verlos (la persona responsable sin Marcas · contenido) no se puede saber.
    if (!veMarcas(p) || dia > 20 || x.estado !== 'Borrador' || !a[0] || a[0].fecha < hoy || a[0].fecha > finMc) return [];
    const nombra = planes.some((pl) => fold(pl?.campana?.nombre) === fold(x.nombre)) || piezas.some((z) => fold(z.campana) === fold(x.nombre) && [M, Mc].includes(fechaDe(z).slice(0, 7)));
    if (nombra) return [];
    const urgencia = diasEntre(hoy, a[0].fecha) <= 7 ? 'alta' : 'media', mes = nombreMes(Mc);
    return [paraResp(aviso(CAMP_T, { ...base, urgencia, desde: a[0].fecha, huella: `plan|${a[0].fecha}|${urgencia}`,
      titulo: `El primer aviso de «${x.nombre}» de ${c.nombre} cae en este ciclo y no está en el plan`,
      detalle: `Su primer aviso es ${elDia(a[0].fecha, hoy)}. La anticipación no puede exceder el ciclo: ${edita(p) ? `métela al plan de ${mes}` : `va en el plan de ${mes}, y la mete quien edita Marcas · contenido`}.`,
      accion: { label: edita(p) ? 'Meterla al plan' : 'Ver el plan', href: hrefPlan(c.slug, Mc) }, accion2: ver }), x, p)];
  });
});

// mk-campana-incompleta · agents/03-marketing/brain/skills/mk-campana/SKILL.md §2 («Una por ciclo. Dos como máximo»), §5 «Qué
// escribe», §6 Bloqueos y §7 Checklist. Una en Borrador o En curso a la que revisarCampana le encuentra algo que no es de fecha;
// y, por marca, revisarMes de Mc (más de 2 en el ciclo). Media; baja si su primer aviso está a más de 30 días (la huella lleva la
// urgencia: un pospuesto en baja vuelve cuando se acerca).
const FALTA_C = [[/^Falta la frase/, 'su frase'], [/^Falta la MUST BE TRUE/, 'la MUST BE TRUE que mueve'], [/^Falta en qué se va a notar/, 'en qué se va a notar'], [/^Falta qué NO es/, 'qué NO es'],
  [/^Falta la fecha/, 'la fecha'], [/^Nunca un solo aviso/, 'más de un aviso'], [/^El evento no tiene objetivo/, 'su objetivo comercial'], [/^El evento no dice cómo se mide/, 'cómo se mide']];
const CAMP_I = { id: 'mk-campana-incompleta', grupo: 'clientes', area: 'marketing', urgencia: 'media' };
CAMP_I.calcular = (d, p, hoy, { Mc }) => marcas(d).flatMap((c) => {
  const ver = veMarcas(p) ? { label: edita(p) ? 'Completarla' : 'Ver la campaña', href: hrefCamp(c.slug) } : null;
  const out = campanasDe(d, p, c).filter((x) => ['Borrador', 'En curso'].includes(x.estado || 'Borrador')).flatMap((x) => {
    const r = revisarCampana(x, hoy), faltas = FALTA_C.filter(([re]) => r.some((t) => re.test(t))).map(([, f]) => f);
    if (!faltas.length) return [];
    const a0 = anticipacion(x)[0], urgencia = a0 && diasEntre(hoy, a0.fecha) > 30 ? 'baja' : 'media';
    return [paraResp(aviso(CAMP_I, {
      clave: `mk-campana-incompleta:${idC(c, x)}`, cliente: c.slug, urgencia, desde: a0?.fecha || '', huella: `${faltas.join(',')}|${urgencia}`,
      titulo: `${x.tipo === 'evento' ? 'Al evento' : 'A la campaña'} «${x.nombre}» de ${c.nombre} le falta ${yLista(faltas)}`,
      detalle: [`${laCampana(x)} no está definida sin eso.`, a0 ? `Su primer aviso es ${elDia(a0.fecha, hoy)}.` : '', quienEdita(p)].filter(Boolean).join(' '),
      accion: ver }), x, p)];
  });
  const todas = (d.campanas || []).filter((x) => x?.profile === c.slug), mes = p.esCeo || p.completo('content') ? revisarMes(todas, Mc) : '';
  if (mes) {
    const n = campanasDelMes(todas, Mc).filter((x) => x.estado !== 'Cerrada').length;
    out.push(aviso(CAMP_I, { clave: `mk-campana-incompleta:${c.slug}:${Mc}`, cliente: c.slug, huella: `${Mc}|${n}`,
      titulo: `${Mayus(nombreMes(Mc))} de ${c.nombre} tiene ${n} campañas: ninguna está definida`, detalle: 'Una por ciclo, dos como máximo: si parecen tres, ninguna está definida.',
      accion: { label: 'Revisar las campañas', href: hrefCamp(c.slug) } }));
  }
  return out;
});

// mk-campana-sin-piezas · mk-campana § La anticipación, regla 1 («nunca un solo aviso») y regla 2 («el último empujón siempre
// existe»). Una campaña En curso: cada paso de su anticipación de hoy al fin de Mc lleva una pieza que la nombra (p.campana), del
// paso a 2 días antes; «El día» y «Último día», ese mismo día. Alta si falta el último empujón o un paso cae en 7 días o menos
// (la huella lleva la urgencia: un pospuesto en media vuelve cuando el paso se acerca). Los recordatorios repetidos se cuentan.
const EXACTO = ['El día', 'Último día'], EMPUJON = ['Último empujón', 'El día', 'Último día'];
const PASO_TXT = { 'Primer aviso': 'su primer aviso', Recordatorio: 'su recordatorio', 'Último empujón': 'su último empujón', 'El día': 'el día', 'Último día': 'su último día' };
const PASOS_TXT = { Recordatorio: (n) => `sus ${n} recordatorios` };
const pasosTxt = (xs) => { const n = new Map(); for (const s of xs) n.set(s.que, (n.get(s.que) || 0) + 1); return yLista([...n].map(([q, k]) => (k > 1 && PASOS_TXT[q] ? PASOS_TXT[q](k) : PASO_TXT[q] || q.toLowerCase()))); };
const CAMP_P = { id: 'mk-campana-sin-piezas', grupo: 'clientes', area: 'marketing', urgencia: 'alta' };
CAMP_P.calcular = (d, p, hoy, { finMc }) => (!veMarcas(p) ? [] : marcas(d)).flatMap((c) => {
  const piezas = piezasDe(d, c.slug, hoy).filter((z) => z.campana && fechaDe(z));
  return campanasDe(d, p, c).filter((x) => x.estado === 'En curso' && x.ancla).flatMap((x) => {
    const suyas = piezas.filter((z) => fold(z.campana) === fold(x.nombre)).map(fechaDe);
    const faltan = anticipacion(x).filter((s) => s.fecha >= hoy && s.fecha <= finMc)
      .filter((s) => !suyas.some((f) => (EXACTO.includes(s.que) ? f === s.fecha : f >= masDias(s.fecha, -2) && f <= s.fecha)));
    if (!faltan.length) return [];
    const emp = faltan.some((s) => EMPUJON.includes(s.que)), urgencia = emp || faltan.some((s) => diasEntre(hoy, s.fecha) <= 7) ? 'alta' : 'media';
    return [paraResp(aviso(CAMP_P, {
      clave: `mk-campana-sin-piezas:${idC(c, x)}`, cliente: c.slug, urgencia, desde: faltan[0].fecha, huella: `${faltan.map((s) => s.fecha).join(',')}|${urgencia}`,
      titulo: `${laCampana(x)} «${x.nombre}» de ${c.nombre} no tiene ${faltan.length === 1 ? 'pieza' : 'piezas'} para ${pasosTxt(faltan)}`,
      detalle: [faltan.map((s) => `${s.que} ${elDia(s.fecha, hoy)}`).join(' · '), emp ? 'El último empujón siempre existe.' : 'Nunca un solo aviso: cada paso lleva su pieza.'].join('. '),
      accion: { label: 'Ver el calendario', href: hrefCal(c.slug) } }), x, p)];
  });
});

// gd-sin-sistema-visual · agents/06-graphic-design/brain/WORKFLOW.md §6: sin sistema-visual.md, BLOQUEADO (la ficha de NAO lo dice
// en «Su pipeline»). Si corre ⑥A y no está 02-marca/sistema-visual.md. Alta desde el día 12 (montaje) o si ya hay carruseles,
// estáticos o stories de Mc por diseñar; media si no. Lo escribe ②B Branding (br-sistema). En «resumen» no sale.
const SISTEMA = { id: 'gd-sin-sistema-visual', grupo: 'clientes', area: 'diseno', urgencia: 'alta', necesita: { area: 'content', nivel: 'completo' } };
SISTEMA.calcular = (d, p, hoy, { d: dia, Mc }) => {
  if (!(p.esCeo || opera(d, p))) return [];
  return marcas(d).filter((c) => corre(c, '⑥A') && !hay(c, 'sistema-visual')).map((c) => {
    const n = delMes(piezasDe(d, c.slug, hoy), Mc).filter((x) => DISENO.includes(formatoDe(x)) && sinTerminar(x)).length, urgencia = dia >= 12 || n ? 'alta' : 'media';
    return aviso(SISTEMA, {
      clave: `gd-sin-sistema-visual:${c.slug}`, cliente: c.slug, urgencia, huella: `sin-sistema|${urgencia}`,
      titulo: `${c.nombre} no tiene sistema visual: ⑥A Diseño no puede arrancar`,
      detalle: [n ? `Ya ${plural(n, 'pieza', 'piezas')} de ${nombreMes(Mc)} ${n === 1 ? 'espera' : 'esperan'} diseño.` : '', 'Lo escribe ②B Branding (br-sistema) en 02-marca/sistema-visual.md.'].filter(Boolean).join(' '),
      accion: { label: 'Ver qué falta', href: `#/marcas/${url(c.slug)}/design` },
    });
  });
};

// pr-dia11-grabacion · inherent/05-OPERACION.md §4 «Los dos límites»: el día 11 es el último para producir (después no se graba nada
// del ciclo); días 4-5 «Coordinar producción». Del 4 al 11, si corren ⑤ y ④: no hay grabación (content kind 'shoot', no Cancelado)
// del 1 al 11 de M, o una «Por grabar» cae después del 11 o ya pasó («¿se grabó?»). Media del 4 al 7, alta del 8 al 11.
const GRAB = { id: 'pr-dia11-grabacion', grupo: 'clientes', area: 'diseno', urgencia: 'alta', necesita: { area: 'content', nivel: 'completo' } };
GRAB.calcular = (d, p, hoy, { d: dia, M }) => {
  if (dia < 4 || dia > 11 || !(p.esCeo || p.esCoo || opera(d, p))) return [];
  const urgencia = dia <= 7 ? 'media' : 'alta', once = `${M}-11`, fin = finDeMes(M), porGrabar = (x) => (x.status || 'Por grabar') === 'Por grabar';
  return marcas(d).filter((c) => corre(c, '⑤') && corre(c, '④')).flatMap((c) => {
    const gs = (d.content || []).filter((x) => x?.kind === 'shoot' && x.profile === c.slug && x.status !== 'Cancelado' && fechaDe(x)).sort(porFecha);
    const antes = gs.filter((x) => fechaDe(x) >= `${M}-01` && fechaDe(x) <= once), tarde = gs.filter((x) => porGrabar(x) && fechaDe(x) > once && fechaDe(x) <= fin);
    const pasada = antes.filter((x) => porGrabar(x) && fechaDe(x) < hoy), sin = !antes.length;
    if (!sin && !tarde.length && !pasada.length) return [];
    const n = c.nombre, tTarde = tarde.length ? `La grabación de ${n} cae ${elDia(fechaDe(tarde[0]), hoy)}: después del 11 ya no se graba nada del ciclo` : '';
    const tPasada = pasada.length ? `La grabación de ${n} del ${+fechaDe(pasada[0]).slice(8, 10)} sigue «Por grabar»: ¿se grabó?` : '';
    const titulo = sin ? tTarde || `${n} no tiene grabación antes del día 11` : tPasada || tTarde;
    return [aviso(GRAB, {
      clave: `pr-dia11-grabacion:${c.slug}`, cliente: c.slug, urgencia, desde: `${M}-04`,
      huella: `${sin ? 'sin' : ''}|${tarde.map((x) => `${x.id}:${fechaDe(x)}`).join(',')}|${pasada.map((x) => x.id).join(',')}|${urgencia}`, titulo,
      detalle: [tPasada && titulo !== tPasada ? `${tPasada}.` : '', tTarde && titulo !== tTarde ? `${tTarde}.` : '', 'El día 11 es el último para producir.'].filter(Boolean).join(' '),
      accion: cal(!edita(p) ? 'Ver el calendario' : sin || tarde.length ? 'Agendar la grabación' : 'Revisar la grabación', c.slug, 'operativo'),
    })];
  });
};

// gd-por-disenar · agents/06-graphic-design/brain/WORKFLOW.md «Tu ventana en el ciclo»: del 12 al 15 se monta y el paquete sale a más
// tardar el día 19. Del 12 al 19, si corre ⑥A y ya está su sistema visual: los carruseles, estáticos y stories de Mc sin diseñar
// (diseno.js · «FALTA DISEÑAR»), y los del plan con su idea. Al perfil content (el operador). Media del 12 al 15, alta del 16 al 19.
const DISENAR = { id: 'gd-por-disenar', grupo: 'clientes', area: 'diseno', urgencia: 'media', necesita: { area: 'content', nivel: 'completo' } };
DISENAR.calcular = (d, p, hoy, { d: dia, M, Mc }) => {
  if (dia < 12 || dia > 19 || !opera(d, p)) return [];
  const urgencia = dia <= 15 ? 'media' : 'alta';
  return marcas(d).filter((c) => corre(c, '⑥A') && hay(c, 'sistema-visual')).flatMap((c) => {
    const xs = delMes(piezasDe(d, c.slug, hoy), Mc).filter((x) => DISENO.includes(formatoDe(x)) && sinTerminar(x) && !x.diseno && (!x.slot?.plan || x.idea_chat));
    if (!xs.length) return [];
    const por = DISENO.map((f) => [f, xs.filter((x) => formatoDe(x) === f).length]).filter(([, k]) => k);
    return [aviso(DISENAR, {
      clave: `gd-por-disenar:${c.slug}`, cliente: c.slug, urgencia, desde: `${M}-12`, huella: `${Mc}|${xs.length}|${urgencia}`,
      titulo: `${plural(xs.length, 'pieza', 'piezas')} de ${c.nombre} por diseñar: el paquete va el 19`,
      detalle: `De ${nombreMes(Mc)}: ${por.map(([f, k]) => (k === 1 ? `1 ${f.toLowerCase()}` : `${k} ${PLURAL_F[f]}`)).join(' · ')}.`,
      accion: edita(p) ? chatDiseno('Diseñar en el chat', c.slug, 'diseno', Mc) : cal('Ver el calendario', c.slug, 'planificacion'),
    })];
  });
};

// ciclo-20-faltan-piezas · inherent/05-OPERACION.md §4 «Los dos límites» (el 20 llega completo, revisado y programado), «Las reglas
// del calendario» y §5 «Presentar las piezas del día 20». Desde el día 12, si corre ④: las piezas de Mc en Idea o En proceso (el
// conteo de «Contenido del mes» de Hoy, para Mc). Media del 12 al 15; alta del 16 en adelante (del 21 ya «salen desde el día 1»).
const FALTAN = { id: 'ciclo-20-faltan-piezas', grupo: 'clientes', area: 'diseno', urgencia: 'alta', necesita: { area: 'content', nivel: 'completo' } };
FALTAN.calcular = (d, p, hoy, { d: dia, M, Mc }) => {
  if (dia < 12 || !(p.esCeo || p.esCoo || opera(d, p))) return [];
  const urgencia = dia <= 15 ? 'media' : 'alta', mes = nombreMes(Mc);
  return marcas(d).filter((c) => corre(c, '④')).flatMap((c) => {
    const xs = delMes(piezasDe(d, c.slug, hoy), Mc).filter(sinTerminar);
    if (!xs.length) return [];
    const ideas = xs.filter((x) => estadoDe(x) === 'Idea').length, proc = xs.length - ideas, que = `${xs.length === 1 ? 'Falta 1 pieza' : `Faltan ${xs.length} piezas`} de ${mes} de ${c.nombre}`;
    return [aviso(FALTAN, {
      clave: `ciclo-20-faltan-piezas:${c.slug}`, cliente: c.slug, urgencia, desde: `${M}-12`, huella: `${Mc}|${xs.length}|${urgencia}`,
      titulo: dia <= 20 ? `${que} para la presentación del 20` : `${que}: salen desde el día 1`,
      detalle: [[ideas ? `${ideas} en idea` : '', proc ? `${proc} en proceso` : ''].filter(Boolean).join(' · '), dia <= 20 ? 'El 20 llega completo, revisado y programado.' : 'Lo presentado el 20 se publica desde el día 1.'].join('. '),
      accion: cal('Ver qué falta', c.slug, 'planificacion'),
    })];
  });
};

// po-sin-hora-red · agents/09-posting/brain/WORKFLOW.md («④ Creatividad pone la fecha · Posting pone la hora») e inherent/05-OPERACION.md
// §4: el 20 llega completo, revisado y programado. Las piezas Listo sin hora o sin red (calendario-vistas.js · redDe), de hoy al fin
// de Mc: las de Mc desde el día 16 y las que salen en 7 días o menos, siempre. Al perfil content. Alta si alguna sale en 2 días o menos.
const HORA = { id: 'po-sin-hora-red', grupo: 'clientes', area: 'marketing', urgencia: 'media', necesita: { area: 'content', nivel: 'completo' } };
HORA.calcular = (d, p, hoy, { d: dia, Mc, finMc }) => {
  if (!opera(d, p)) return [];
  return marcas(d).flatMap((c) => {
    const xs = piezasDe(d, c.slug, hoy).filter((x) => { const f = fechaDe(x); return estadoDe(x) === 'Listo' && f && f >= hoy && f <= finMc && (!x.time || !redDe(x)) && (diasEntre(hoy, f) <= 7 || (dia >= 16 && f.slice(0, 7) === Mc)); }).sort(porFecha);
    if (!xs.length) return [];
    const hora = xs.filter((x) => !x.time).length, red = xs.filter((x) => !redDe(x)).length, f0 = fechaDe(xs[0]), urgencia = diasEntre(hoy, f0) <= 2 ? 'alta' : 'media';
    const ambas = hora === xs.length && red === xs.length, falta = ambas ? 'hora ni red' : hora && red ? 'hora o red' : hora ? 'hora' : 'red';
    return [aviso(HORA, {
      clave: `po-sin-hora-red:${c.slug}`, cliente: c.slug, urgencia, desde: f0, huella: `${xs.map((x) => `${x.id}:${x.time ? 1 : 0}${redDe(x) ? 1 : 0}`).join(',')}|${urgencia}`,
      titulo: `${xs.length === 1 ? '1 pieza lista' : `${xs.length} piezas listas`} de ${c.nombre} no ${xs.length === 1 ? 'tiene' : 'tienen'} ${falta}`,
      detalle: [hora && red && !ambas ? `${hora} sin hora · ${red} sin red.` : '', `La primera sale ${f0 === hoy ? 'hoy' : elDia(f0, hoy)}.`, '④ Creatividad pone la fecha; ⑨ Posting, la hora.'].filter(Boolean).join(' '),
      accion: cal(edita(p) ? `${xs.length === 1 ? 'Ponerle' : 'Ponerles'} ${hora && red ? 'hora y red' : hora ? 'hora' : 'red'}` : 'Ver el calendario', c.slug, 'programado'),
    })];
  });
};

// pz-vencidas · inherent/05-OPERACION.md §4 «Las reglas del calendario» (lo presentado se publica desde el día 1 del mes siguiente)
// y agents/09-posting/brain/WORKFLOW.md (po-verificacion). Piezas de la marca con fecha de hace 30 días (el Archivo, element.js ·
// ARCHIVO_DIAS) a ayer, que siguen en Idea, En proceso o Listo. Se marcan Publicado o se les cambia la fecha.
const VENCIDAS = { id: 'pz-vencidas', grupo: 'clientes', area: 'marketing', urgencia: 'alta', necesita: { area: 'content', nivel: 'completo' } };
VENCIDAS.calcular = (d, p, hoy) => {
  if (!(p.esCeo || opera(d, p))) return [];
  const ini = masDias(hoy, -30), ayer = masDias(hoy, -1);
  return marcas(d).flatMap((c) => {
    const xs = piezasDe(d, c.slug, hoy).filter((x) => { const f = fechaDe(x); return f && f >= ini && f <= ayer && ['Idea', 'En proceso', 'Listo'].includes(estadoDe(x)); }).sort(porFecha);
    if (!xs.length) return [];
    return [aviso(VENCIDAS, {
      clave: `pz-vencidas:${c.slug}`, cliente: c.slug, desde: fechaDe(xs[0]), huella: xs.map((x) => `${x.id}:${fechaDe(x)}`).join(','),
      titulo: xs.length === 1 ? `1 pieza de ${c.nombre} ya pasó su fecha y no salió` : `${xs.length} piezas de ${c.nombre} ya pasaron su fecha y no salieron`,
      detalle: [[...xs.slice(0, 2).map((x) => `«${corta(nombrePieza(x, c), 60)}» (${elDia(fechaDe(x), hoy)})`), xs.length > 2 ? `y ${xs.length - 2} más` : ''].filter(Boolean).join(' · '), edita(p) ? (xs.length === 1 ? 'Márcala Publicado o cámbiale la fecha.' : 'Márcalas Publicado o cámbiales la fecha.') : ''].filter(Boolean).join('. '),
      accion: { label: edita(p) ? 'Revisar en el calendario' : 'Ver el calendario', href: hrefCal(c.slug) },
    })];
  });
};

// En el orden del ciclo: el plan, el brief y las ideas; las campañas; el diseño y la grabación; el día 20; la publicación.
export const CLIENTES_MARCAS = [PLAN, PLAN_REV, PLAN_DES, CANAL, BRIEF_C, IDEAS, CAMP_T, CAMP_I, CAMP_P, SISTEMA, GRAB, DISENAR, FALTAN, HORA, VENCIDAS];
