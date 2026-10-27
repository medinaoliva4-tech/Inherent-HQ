// Avisos · Clientes (la ficha, el ciclo, la estrategia y Consulting de cada cliente). Ver index.js.
// datos.clientes = [{ slug, nombre, ficha: { hay, nivel, plan, incluye, pipeline, redes }, presentes: [{ id, mes }] }],
// solo los del alcance de la persona. Si un cliente no tiene ficha, solo sale cli-sin-ficha de ese cliente (base.js · correr).
// La estrategia de cada cliente: datos.strategy; la viva es el doc '<slug>--viva' = { viva: {…}, aprobado: { por, en } | null }.
// Inherent no es cliente de Consulting: los cons-* no salen para 'inherent'.
import { aviso, plural, nombreMes, masDias, diasEntre } from './base.js';
import { BLOQUES, limiteDe, docId } from '../estrategia.js';
import { vivaId, avance, PASOS } from '../estrategia-viva.js';
import { deptsOfPlan, holders } from '../cycle.js';
import { alcanceConsulting, consultingAbierto, encargosDe, textoAlcanceConsulting, CONSULTING } from '../llm/modos.js';

const lc = (x) => String(x || '').toLowerCase();
const url = encodeURIComponent;
// Una lista de la base que puede venir rota (null, un objeto, un texto): siempre un arreglo, sin huecos.
const lista = (x) => (Array.isArray(x) ? x.filter((y) => y && typeof y === 'object') : []);
// Las fechas de _meta (created_at…) llegan de la base como Date (api/_lib/db.js · row): siempre en texto ISO, para ordenar y para «desde».
const iso = (v) => (v instanceof Date ? (Number.isNaN(v.getTime()) ? '' : v.toISOString()) : String(v || ''));
const fecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || '').slice(0, 10)) ? String(s).slice(0, 10) : '';
const dm = (f) => `${f.slice(8, 10)}/${f.slice(5, 7)}`;
const corta = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : t; };
const yLista = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`);
const lo = (p) => (p.esCeo ? 'lo decides tú' : 'lo decide el CEO');

const nivelId = (c) => c?.ficha?.nivel?.id || '';
const conNivel = (d) => (d.clientes || []).filter((c) => c.ficha?.hay && c.ficha.nivel);
const vivaDoc = (d, slug) => (d.strategy || []).find((x) => x.id === vivaId(slug)) || null;
// Aprobada = el mismo candado que PUT plan y «a Creatividad» (api/_lib/plan.js · estrategiaAprobada): el doc viva trae «aprobado».
const aprobada = (doc) => Boolean(doc?.aprobado);
// ¿Ya está en su carpeta? (intel.presentes: el listado del repo, sin leer los archivos). mes: el AAAA-MM del entregable.
const hay = (c, id, mes) => (c.presentes || []).some((x) => x.id === id && (mes === undefined || x.mes === mes));
const cuentaDe = (d, slug) => (d.accounts || []).find((a) => a.id === `acc-${slug}` || lc(a.slug) === slug) || null;
// ¿Corre este departamento? Con pipeline en la ficha, manda el pipeline (el mismo deptsOfPlan con el que flow.activate arma el
// ciclo, inherent/05-OPERACION.md §3 «El pipeline es del cliente»); sin pipeline, Growth y Partnership corren todo y a la medida
// nada. Brand Foundation no tiene ciclo.
const corre = (c, code) => { const n = nivelId(c), pip = lista(c.ficha?.pipeline); return !n || n === 'foundation' ? false : pip.length ? deptsOfPlan({ pipeline: pip.map((r) => ({ paso: String(r.paso || '') })) }).includes(code) : n !== 'medida'; };
// Corre el ciclo del 1 al 20: Growth y Partnership siempre; a la medida, si su pipeline trae ③ Marketing.
const correCiclo = (c) => ['growth', 'partnership'].includes(nivelId(c)) || (nivelId(c) === 'medida' && corre(c, '③'));
// ¿Su ficha nombra esto en «Qué incluye» o en «Su pipeline»?
const nombra = (c, re) => [...lista(c.ficha?.incluye).map((x) => `${x.k || ''} ${x.v || ''}`), ...lista(c.ficha?.pipeline).map((x) => `${x.paso || ''} ${x.que || ''}`)].some((s) => re.test(s));
// Consulting fuera de su alcance: su nivel no lo trae, o es a la medida y su ficha no nombra Consulting, Operations, Money, SOPs ni finanzas.
const RE_CONSULTING = /consult|operations|operaci[oó]n|money|\bsops?\b|finanz/i;
const alcanceDe = (c) => alcanceConsulting(c.ficha?.nivel || null, c.ficha);
const consultingFuera = (c) => { const a = alcanceDe(c); return !consultingAbierto(a) || (a === 'ficha' && !nombra(c, RE_CONSULTING)); };
// Los encargos de Estrategia a Consulting que siguen abiertos (llm/modos.js · encargosDe), del más viejo al más nuevo.
const creada = (t) => iso(t._meta?.created_at || t.created_at);
const abiertos = (d, slug) => encargosDe(d.tasks, 'consulting', slug).filter((t) => t.status !== 'Hecha').sort((a, b) => creada(a).localeCompare(creada(b)));

// cli-sin-ficha · CLAUDE.md § El techo comercial: «Sin ficha, el agente BLOQUEA a ese cliente». No se pospone.
// El botón (crear la ficha) solo para el CEO: solo él escribe en el repo.
const SIN_FICHA = { id: 'cli-sin-ficha', grupo: 'clientes', area: 'todas', urgencia: 'alta', fijo: true };
SIN_FICHA.calcular = (d, p) => (d.clientes || []).filter((c) => !c.ficha?.hay).map((c) => aviso(SIN_FICHA, {
  clave: `cli-sin-ficha:${c.slug}`, cliente: c.slug, titulo: `A ${c.nombre} le falta su ficha de oferta: todos los agentes lo bloquean`,
  detalle: p.esCeo ? 'El alcance contratado es el techo: sin ficha, nadie sabe qué entregar.' : 'La crea el CEO.', huella: 'sin-ficha',
  accion: p.esCeo ? { label: 'Crear la ficha', href: `#/estrategia/${encodeURIComponent(c.slug)}` } : null,
}));

// cli-ficha-incompleta · CLAUDE.md § El techo comercial (nivel + áreas + volumen + revisiones) y agents/01-strategy/brain/WORKFLOW.md
// §0 «⬜ Alcance a la medida» (lleva «Qué incluye» y «Su pipeline»; lo que no está en su pipeline no corre). Sin nivel o a la medida
// sin pipeline: alta. A la medida sin «Qué incluye»: media. El botón, solo el CEO (él escribe la ficha).
const FICHA_INC = { id: 'cli-ficha-incompleta', grupo: 'clientes', area: 'todas', urgencia: 'alta', necesita: { area: 'estrategia' } };
const FALTA_FICHA = {
  nivel: ['no dice qué nivel contrató', 'Sin nivel, Strategy la trata como si no hubiera ficha: nadie sabe el techo.'],
  pipeline: ['no trae su pipeline', 'A la medida, un departamento que no está en su pipeline no corre.'],
  incluye: ['no dice qué incluye', 'A la medida, el techo es lo que dice «Qué incluye».'],
};
FICHA_INC.calcular = (d, p) => (d.clientes || []).filter((c) => c.ficha?.hay).flatMap((c) => {
  const f = c.ficha, faltas = !f.nivel ? ['nivel'] : f.nivel.id === 'medida' ? [!lista(f.pipeline).length && 'pipeline', !lista(f.incluye).length && 'incluye'].filter(Boolean) : [];
  if (!faltas.length) return [];
  return [aviso(FICHA_INC, {
    clave: `cli-ficha-incompleta:${c.slug}`, cliente: c.slug, urgencia: faltas.some((x) => x !== 'incluye') ? 'alta' : 'media', huella: faltas.join(','),
    titulo: `La ficha de ${c.nombre} ${faltas.map((x, i) => (i ? FALTA_FICHA[x][0].replace(/^no /, '') : FALTA_FICHA[x][0])).join(' ni ')}`,
    detalle: [FALTA_FICHA[faltas[0]][1], p.esCeo ? '' : 'La edita el CEO.'].filter(Boolean).join(' '),
    accion: p.esCeo ? { label: 'Editar la ficha', href: `#/estrategia/${url(c.slug)}` } : null,
  })];
});

// ciclo-sin-armar · inherent/05-OPERACION.md §4 «El calendario del ciclo» (del día 1 al 20) y §3 «El pipeline es del cliente».
// Del 1 al 20, el cliente que corre ciclo sin el proyecto «Ciclo mensual» de este mes. Alta del 1 al 3, media después. Inherent no
// se arma por aquí (flow.activate con plan lee clients/<slug>). Lo arma quien edita Proyectos (POST flow/activate).
// Con alcance «asignados» la persona no ve el proyecto del mes si no tiene tareas ahí: datos.ciclos ({ client_slug, cycle } de
// todos los «Ciclo mensual» de sus clientes, sin más campos) dice si ya existe; sin ese dato, se miran sus proyectos.
const CICLO = { id: 'ciclo-sin-armar', grupo: 'clientes', area: 'todas', urgencia: 'alta', necesita: { area: 'operations', nivel: 'edita' } };
CICLO.calcular = (d, p, hoy, { d: dia, M }) => {
  if (dia > 20) return [];
  const urgencia = dia <= 3 ? 'alta' : 'media';
  const armados = new Set([...lista(d.ciclos), ...lista(d.projects).filter((x) => x.kind === 'Ciclo mensual')].map((x) => `${x.client_slug}|${x.cycle}`));
  return conNivel(d).filter((c) => c.slug !== 'inherent' && correCiclo(c) && !armados.has(`${c.slug}|${M}`))
    .map((c) => aviso(CICLO, {
      clave: `ciclo-sin-armar:${c.slug}`, cliente: c.slug, urgencia, desde: `${M}-01`, huella: `${M}|${urgencia}`,
      titulo: `El ciclo de ${nombreMes(M)} de ${c.nombre} no está armado: no hay tareas ni reuniones`,
      detalle: 'Se arma con los departamentos de su ficha: las tareas de las recetas, las reuniones y el onboarding.',
      accion: { label: 'Armar el ciclo', api: { method: 'POST', ruta: 'flow/activate', body: { slug: c.slug, plan: true, start: `${M}-01`, label: c.nombre } }, hecho: 'Ciclo armado' },
    }));
};

// reunion-ciclo-por-agendar · inherent/05-OPERACION.md §4: día 1 «Reunión con el cliente» y día 20 «Presentación al cliente».
// Las reuniones con el cliente del «Ciclo mensual» (el de este mes y el que viene) sin agendar, de aquí a 7 días, y las que ya
// pasaron sin hacerse. Le sale a quien la lleva (cycle.js · holders con el roles_map del proyecto): la del día 1, el CEO; la del
// 20, el COO en Brand Growth y el CEO en Growth Partnership.
const REUNION = { id: 'reunion-ciclo-por-agendar', grupo: 'clientes', area: 'todas', urgencia: 'alta', necesita: { area: ['operations', 'work'] } };
REUNION.calcular = (d, p, hoy, { M, Mc }) => {
  const tope = masDias(hoy, 7), out = [];
  for (const pr of (d.projects || []).filter((x) => x.kind === 'Ciclo mensual' && [M, Mc].includes(x.cycle))) {
    const c = (d.clientes || []).find((x) => x.slug === pr.client_slug), nombre = c?.nombre || pr.client || pr.client_slug || pr.name || 'el cliente';
    const quien = holders(lista(d.team), '', pr.roles_map);
    // El índice es el de la reunión en el proyecto (lo usa la clave y, mañana, el botón de agendar): una reunión rota se salta, no se quita.
    (Array.isArray(pr.meetings) ? pr.meetings : []).forEach((m, i) => {
      if (!m || typeof m !== 'object') return;
      const who = Array.isArray(m.who) ? m.who : [], f = fecha(m.date), roles = who.filter((r) => r !== 'cliente' && r !== 'especialista');
      if (!who.includes('cliente') || ['agendada', 'hecha'].includes(m.status) || m.link || !f || f > tope || !roles.length) return;
      const pres = /presentaci/i.test(m.name || ''), arranque = /arranque/i.test(m.name || '');
      const rol = pres && nivelId(c) === 'growth' && roles.includes('coo') && quien('coo') ? 'coo' : roles.includes('ceo') ? 'ceo' : roles[0];
      const lleva = quien(rol);
      if (lleva ? lc(lleva) !== p.email : !p.esCeo) return; // sin nadie en ese rol, la lleva el CEO
      const ir = c && p.ve('clients') ? `#/clients/${url(c.slug)}` : p.ve('operations') ? `#/operations/p/${url(pr.id)}` : '';
      out.push(aviso(REUNION, {
        clave: `reunion-ciclo-por-agendar:${pr.id}:${i}`, cliente: pr.client_slug || '', desde: f, huella: `${f}|${m.status || 'todo'}`,
        titulo: arranque ? `La reunión del día 1 con ${nombre} no está agendada` : pres ? `La presentación del 20 de ${nombre} no está agendada` : `«${m.name}» con ${nombre} no está agendada`,
        detalle: [f < hoy ? `Era el ${dm(f)} y no se agendó ni se marcó hecha.` : f === hoy ? 'Es hoy.' : `Es el ${dm(f)}.`, d.tieneGoogle ? '' : 'Conecta tu Google para que la invitación salga de Calendar.'].filter(Boolean).join(' '),
        // Con Proyectos en edita se agenda desde el aviso (meetings.js · schedule: invita por Calendar y la marca agendada).
        accion: p.edita('operations') ? { label: 'Agendar', abre: 'agendar', proyecto: pr.id, i } : ir ? { label: 'Ver la reunión', href: ir } : null,
      }));
    });
  }
  return out;
};

// est-sin-aprobar · agents/01-strategy/brain/WORKFLOW.md §2 («Ninguno arranca sin el anterior» y el gate del CEO) y «Tu ventana en
// el ciclo» (la estrategia, a más tardar el día 3). La viva sin aprobar y sin roadmap: con roadmap es est-por-aprobar (nunca salen
// juntos). Alta desde el día 4 si corre ciclo; media del 1 al 3 y en Brand Foundation. Al CEO, si la estrategia ya está en la
// carpeta del repo, le pide pasarla al OS y aprobarla.
const PASO_TXT = { contexto: 'el contexto', analisis: 'el análisis', inversa: 'la ingeniería inversa', metodologia: 'la metodología', entrega: 'el roadmap' };
const SIN_APROBAR = { id: 'est-sin-aprobar', grupo: 'clientes', area: 'estrategia', urgencia: 'alta', necesita: { area: 'estrategia', nivel: 'edita' } };
SIN_APROBAR.calcular = (d, p, hoy, { d: dia, Mc }) => conNivel(d).flatMap((c) => {
  const doc = vivaDoc(d, c.slug), v = doc?.viva || {};
  if (aprobada(doc) || v.roadmap?.filas?.length) return [];
  const ciclo = correCiclo(c), urgencia = ciclo && dia >= 4 ? 'alta' : 'media', a = avance(v), base = `#/estrategia/${url(c.slug)}`;
  if (p.esCeo && hay(c, 'estrategia')) return [aviso(SIN_APROBAR, {
    clave: `est-sin-aprobar:${c.slug}`, cliente: c.slug, urgencia, huella: `repo|${urgencia}`,
    titulo: `La estrategia de ${c.nombre} ya está en su carpeta, pero el OS no la tiene aprobada`,
    detalle: `Pásala al OS con «✦ Agregar roadmap» y apruébala.${ciclo ? ` Sin ella no hay plan de ${nombreMes(Mc)}.` : ''}`,
    accion: { label: 'Pasarla al OS y aprobar', href: `${base}/roadmap` },
  })];
  const bloque = PASOS.find((x) => x.id === a.ahora)?.hz?.[0];
  return [aviso(SIN_APROBAR, {
    clave: `est-sin-aprobar:${c.slug}`, cliente: c.slug, urgencia, huella: `${a.ahora}|${a.n}|${urgencia}`,
    titulo: `La estrategia de ${c.nombre} va en ${a.n} de 5: falta ${PASO_TXT[a.ahora]}${ciclo ? `. Sin ella no hay plan de ${nombreMes(Mc)}` : ''}`,
    detalle: [!ciclo ? 'Ningún departamento arranca sin la estrategia aprobada.' : dia >= 4 ? 'La ventana de Strategy cerraba el día 3: ③ Marketing no puede planear.' : 'Strategy tiene hasta el día 3 del ciclo.', p.esCeo ? '' : 'La aprueba el CEO.'].filter(Boolean).join(' '),
    accion: { label: 'Seguir la estrategia', href: bloque ? `${base}/${bloque}` : base },
  })];
});

// est-brief-comunicacion · agents/01-strategy/brain/WORKFLOW.md §2 04B («🛑 Es el gate de ③ Marketing») y
// agents/03-marketing/brain/WORKFLOW.md §5 («BLOQUEADO — falta el brief de comunicación»). Del 1 al 20, si corre ③ Marketing (nunca
// en Brand Foundation) y no está 01-estrategia/brief-de-comunicacion-<mes>.md. Vale el del mes del ciclo o el del contenido: el
// manual no dice cuál de los dos lleva el nombre. Media el día 1; alta desde el 2, cuando se arma el calendario.
const BRIEF = { id: 'est-brief-comunicacion', grupo: 'clientes', area: 'estrategia', urgencia: 'alta', necesita: { area: 'estrategia', nivel: 'edita' } };
BRIEF.calcular = (d, p, hoy, { d: dia, M, Mc }) => {
  if (dia > 20) return [];
  const urgencia = dia === 1 ? 'media' : 'alta';
  return conNivel(d).filter((c) => corre(c, '③') && !hay(c, 'brief-comunicacion', M) && !hay(c, 'brief-comunicacion', Mc)).map((c) => aviso(BRIEF, {
    clave: `est-brief-comunicacion:${c.slug}`, cliente: c.slug, urgencia, desde: `${M}-01`, huella: `${Mc}|${urgencia}`,
    titulo: `A ${c.nombre} le falta el brief de comunicación de ${nombreMes(Mc)}: ③ Marketing no puede planear`,
    detalle: 'Sin él no se arma el calendario. El archivo se guarda desde Claude Code.',
    accion: { label: 'Armar el brief', chat: { modo: 'estrategia', slug: c.slug, borrador: `Arma el brief de comunicación de ${nombreMes(Mc)}` } },
  }));
};

// est-trabado-capacidad · inherent/02-METODO.md § Cómo empieza → «La regla que no se rompe» y CLAUDE.md: «Si la empresa es el
// estorbo, más demanda empeora el problema». Alta si además corre pauta (su cuenta tiene presupuesto de pauta); media si no.
// Fuera de Growth Partnership, arreglar la capacidad no entra: se escala al CEO (alcance → el CEO). Inherent (nuestras redes) no
// se cotiza a sí misma: ahí solo se dice que primero va la capacidad.
const CAPACIDAD = { id: 'est-trabado-capacidad', grupo: 'clientes', area: 'estrategia', urgencia: 'alta', necesita: { area: 'estrategia', nivel: 'edita' } };
CAPACIDAD.calcular = (d, p) => conNivel(d).flatMap((c) => {
  const an = vivaDoc(d, c.slug)?.viva?.analisis;
  if (an?.trabado !== 'capacidad') return [];
  const pauta = Number(cuentaDe(d, c.slug)?.ads?.budget) > 0, entra = nivelId(c) === 'partnership' || c.slug === 'inherent';
  return [aviso(CAPACIDAD, {
    clave: `est-trabado-capacidad:${c.slug}`, cliente: c.slug, urgencia: pauta ? 'alta' : 'media', huella: `${pauta ? 'pauta' : 'sin-pauta'}|${nivelId(c)}`,
    titulo: `${c.nombre} está trabado en capacidad: todavía no le generamos más demanda`,
    detalle: [pauta ? 'Y su pauta está corriendo: más demanda empeora el problema.' : '', entra ? 'Primero se arregla la capacidad.' : `Arreglar la capacidad no entra en ${c.ficha.nivel.nombre}: ${lo(p)}.`, an.porque ? `«${corta(an.porque, 180)}»` : ''].filter(Boolean).join(' '),
    accion: { label: 'Ver el análisis', href: `#/estrategia/${url(c.slug)}` },
  })];
});

// est-trabado-fuera-de-nivel · CLAUDE.md § La economía: «La OFERTA se trabaja en Brand Foundation y en Growth Partnership…
// Confundirlos es regalar el trabajo caro dentro del nivel barato». agents/01-strategy/brain/WORKFLOW.md §0: se levanta como
// excepción y no se absorbe. En Brand Growth: trabado en la oferta o el modelo, o la estrategia ya trae upsells, downsell o
// continuidad (en la viva o en el bloque Modelo de dinero). El límite sale de estrategia.js · limiteDe. Decide el CEO.
// Inherent no: no se cotiza ni sube de nivel consigo misma.
const FUERA_NIVEL = { id: 'est-trabado-fuera-de-nivel', grupo: 'clientes', area: 'estrategia', urgencia: 'media', necesita: { area: 'estrategia', nivel: 'edita' } };
FUERA_NIVEL.calcular = (d, p) => conNivel(d).filter((c) => c.slug !== 'inherent' && nivelId(c) === 'growth').flatMap((c) => {
  const v = vivaDoc(d, c.slug)?.viva || {}, tr = v.analisis?.trabado, mo = v.metodologia?.modelo || {};
  const escalera = ['upsell', 'downsell', 'continuidad'].some((k) => String(mo[k] || '').trim()) || Boolean((d.strategy || []).find((x) => x.id === docId(c.slug, 'modelo'))?.borrador?.texto);
  const bloque = tr === 'oferta' ? 'oferta' : tr === 'modelo' || escalera ? 'modelo' : '', L = bloque ? limiteDe(bloque, 'growth') : null;
  if (L?.estado !== 'no') return [];
  const nv = c.ficha.nivel.nombre;
  return [aviso(FUERA_NIVEL, {
    clave: `est-trabado-fuera-de-nivel:${c.slug}`, cliente: c.slug, huella: `${bloque}|${tr || ''}|${escalera ? 1 : 0}`,
    titulo: tr === 'oferta' ? `${c.nombre} está trabado en la oferta y ${nv} no la toca: ${lo(p)}`
      : tr === 'modelo' ? `${c.nombre} está trabado en el modelo de dinero y ${nv} no lo incluye: ${lo(p)}`
      : `La estrategia de ${c.nombre} trae upsells o continuidad y ${nv} no los incluye: ${lo(p)}`,
    detalle: `${L.texto} Se cotiza aparte o sube de nivel: nunca se absorbe.`,
    accion: p.esCeo ? { label: 'Revisar el alcance', href: `#/estrategia/${url(c.slug)}/${bloque}` } : null,
  })];
});

// est-ofertas-a-empujar · CLAUDE.md § La economía: «② Growth corre ligero: elige cuáles de las ofertas que ya existen se empujan,
// para que la pauta sepa qué pautar». inherent/05-OPERACION.md §3 «Sin input no hay etapa». Con la estrategia aprobada: en Brand
// Growth falta ofertas-a-empujar.md; en Growth Partnership, motor-de-crecimiento.md; a la medida, si corre ② Growth y faltan los dos.
const OFERTAS = { id: 'est-ofertas-a-empujar', grupo: 'clientes', area: 'estrategia', urgencia: 'media', necesita: { area: 'estrategia', nivel: 'edita' } };
OFERTAS.calcular = (d) => conNivel(d).flatMap((c) => {
  if (!aprobada(vivaDoc(d, c.slug))) return [];
  const n = nivelId(c), oe = hay(c, 'ofertas-a-empujar'), mc = hay(c, 'motor-de-crecimiento');
  if (!(n === 'growth' ? !oe : n === 'partnership' ? !mc : n === 'medida' ? corre(c, '②') && !oe && !mc : false)) return [];
  return [aviso(OFERTAS, {
    clave: `est-ofertas-a-empujar:${c.slug}`, cliente: c.slug, huella: n,
    titulo: n === 'partnership' ? `A ${c.nombre} le falta su motor de crecimiento: la pauta no sabe qué pautar` : `${c.nombre} no tiene «ofertas a empujar»: la pauta no sabe qué pautar`,
    detalle: n === 'partnership' ? '② Growth arma ahí la oferta, la escalera y la captura.' : '② Growth elige cuáles de las ofertas que ya existen se empujan este ciclo.',
    accion: { label: 'Abrir el bloque Oferta', href: `#/estrategia/${url(c.slug)}/oferta` },
  })];
});

// est-revision-20 · agents/01-strategy/brain/WORKFLOW.md §4 Cadencia (el 20 de cada mes) y §8 «El regreso»; inherent/05-OPERACION.md
// §7 «La revisión del 20 cruza los cuatro sistemas». Si corre ③ Marketing (nunca en Brand Foundation): del 21 a fin de mes, si
// falta la de este mes (media); del 1 al 3, si falta la del mes anterior (alta: es lo que entra al ciclo nuevo).
const REVISION = { id: 'est-revision-20', grupo: 'clientes', area: 'estrategia', urgencia: 'media', necesita: { area: 'estrategia', nivel: 'edita' } };
REVISION.calcular = (d, p, hoy, { d: dia, M, Ma }) => {
  const mes = dia >= 21 ? M : dia <= 3 ? Ma : '';
  if (!mes) return [];
  const urgencia = dia <= 3 ? 'alta' : 'media';
  return conNivel(d).filter((c) => corre(c, '③') && !hay(c, 'revision-20', mes)).map((c) => aviso(REVISION, {
    clave: `est-revision-20:${c.slug}`, cliente: c.slug, urgencia, desde: `${mes}-20`, huella: `${mes}|${urgencia}`,
    titulo: `Falta la revisión del 20 de ${nombreMes(mes)} de ${c.nombre}`,
    detalle: dia <= 3 ? 'Qué funcionó y qué no: es lo que entra al ciclo nuevo.' : 'Qué funcionó y qué no en el ciclo: es lo que entra al siguiente.',
    accion: { label: 'Hacer la revisión', chat: { modo: 'estrategia', slug: c.slug, borrador: `Haz la revisión del 20 de ${nombreMes(mes)}: qué funcionó y qué no` } },
  }));
};

// est-carpeta-incompleta · agents/01-strategy/brain/WORKFLOW.md §7.2: los cuatro archivos tienen nombre porque ④ Creatividad,
// ⑤ Producción y ⑨ Posting los citan por ruta. Con la estrategia aprobada, falta alguno en el repo. Los escribe el CEO desde
// Claude Code (el OS no crea archivos): el botón, solo él.
const CARPETA = [['comprension', 'la comprensión'], ['estrategia', 'la estrategia'], ['nucleo', 'el núcleo'], ['posicionamiento', 'el posicionamiento']];
const bloqueDeEntregable = (id) => BLOQUES.find((b) => b.entregables.some((e) => e.id === id && !e.apoyo))?.id || '';
const CARPETA_INC = { id: 'est-carpeta-incompleta', grupo: 'clientes', area: 'estrategia', urgencia: 'media', necesita: { area: 'estrategia', nivel: 'edita' } };
CARPETA_INC.calcular = (d, p) => conNivel(d).flatMap((c) => {
  if (!aprobada(vivaDoc(d, c.slug))) return [];
  const faltan = CARPETA.filter(([id]) => !hay(c, id));
  if (!faltan.length) return [];
  return [aviso(CARPETA_INC, {
    clave: `est-carpeta-incompleta:${c.slug}`, cliente: c.slug, huella: faltan.map(([id]) => id).join(','),
    titulo: `${c.nombre} tiene la estrategia aprobada, pero a su carpeta le ${faltan.length === 1 ? 'falta' : 'faltan'} ${yLista(faltan.map(([, n]) => n))}`,
    detalle: `④ Creatividad, ⑤ Producción y ⑨ Posting los leen por su ruta: ${p.esCeo ? 'se escriben' : 'los escribe el CEO'} desde Claude Code.`,
    accion: p.esCeo ? { label: 'Ver qué falta', href: `#/estrategia/${url(c.slug)}/${bloqueDeEntregable(faltan[0][0])}` } : null,
  })];
});

// cli-onboarding-pendiente · inherent/05-OPERACION.md §3 «Sin input no hay etapa». Lo que se le pidió al cliente al arrancar
// (accounts.onboarding, lo arma flow.js · addOnboarding) sigue sin completarse a los 2 días. Al CEO y al COO. Al cliente se lo
// pide la Secretaria (⓪ Account), nunca el OS.
const ONBOARDING = { id: 'cli-onboarding-pendiente', grupo: 'clientes', area: 'todas', urgencia: 'media', necesita: { rol: ['ceo', 'coo'] } };
ONBOARDING.calcular = (d, p, hoy) => (d.accounts || []).flatMap((a) => {
  const ob = a.onboarding, items = Array.isArray(ob?.items) ? ob.items : [], at = fecha(ob?.at);
  if (!items.length || ob.done_at || !at || at > masDias(hoy, -2)) return [];
  const slug = lc(a.slug || String(a.id || '').replace(/^acc-/, '')), listos = items.filter((x) => x?.done).length;
  const nombre = (d.clientes || []).find((c) => c.slug === slug)?.nombre || a.name || slug;
  return [aviso(ONBOARDING, {
    clave: `cli-onboarding-pendiente:${slug}`, cliente: slug, desde: at, huella: `${listos}/${items.length}`,
    titulo: `${nombre} no ha terminado su onboarding: ${listos} de ${items.length} listos`,
    detalle: `Desde el ${dm(at)}. Se lo pide la Secretaria, nunca el OS.`,
    accion: { label: 'Abrir su portal', href: `#/portal/${url(slug)}` },
  })];
});

// cons-encargos-abiertos · agents/01-strategy/brain/WORKFLOW.md §9 (Strategy decide el qué y lo ejecuta otra área) e
// inherent/05-OPERACION.md §5 «Operación y auditoría». Los encargos de Estrategia a Consulting sin hacer, uno por cliente. Sin los
// que ya tienes asignados (salen en tus tareas), salvo los que siguen a tu nombre porque tú los mandaste. Alta si alguno venció.
// Los de un cliente fuera de alcance salen en cons-encargo-fuera-de-alcance. Consulting lee las tareas: hace falta verlas.
const ENCARGOS = { id: 'cons-encargos-abiertos', grupo: 'clientes', area: 'consulting', urgencia: 'media', necesita: { area: 'estrategia' } };
ENCARGOS.calcular = (d, p, hoy) => {
  if (!p.ve('work') && !p.ve('operations')) return [];
  return (d.clientes || []).filter((c) => c.slug !== 'inherent' && c.ficha?.hay && !consultingFuera(c)).flatMap((c) => {
    const xs = abiertos(d, c.slug).filter((t) => lc(t.assignee) !== p.email || lc(t._meta?.created_by) === p.email);
    if (!xs.length) return [];
    const venc = xs.filter((t) => fecha(t.due) && t.due < hoy).length;
    return [aviso(ENCARGOS, {
      clave: `cons-encargos-abiertos:${c.slug}`, cliente: c.slug, urgencia: venc ? 'alta' : 'media', desde: creada(xs[0]), huella: `${xs.map((t) => t.id).sort().join(',')}|${venc}`,
      titulo: `${c.nombre} tiene ${plural(xs.length, 'encargo', 'encargos')} de Estrategia sin hacer en Consulting${venc ? ` (${plural(venc, 'vencido', 'vencidos')})` : ''}`,
      detalle: xs.slice(0, 3).map((t) => `«${t.title}»`).join(' · '),
      accion: { label: `Abrir Consulting de ${c.nombre}`, href: `#/consulting/${url(c.slug)}` },
    })];
  });
};

// cons-encargo-fuera-de-alcance · inherent/02-METODO.md § Cómo se activan los sistemas (Operations OS y Money OS solo en Growth
// Partnership: «meter un sistema antes es cobrar por algo que no se puede usar») y CLAUDE.md: «se cotiza extra o sube de nivel —
// nunca se absorbe». Uno por encargo abierto a Consulting de un cliente fuera de alcance. Al CEO y a quien lo tiene asignado.
const FUERA = { id: 'cons-encargo-fuera-de-alcance', grupo: 'clientes', area: 'consulting', urgencia: 'media' };
FUERA.calcular = (d, p) => (d.clientes || []).filter((c) => c.slug !== 'inherent' && c.ficha?.hay && consultingFuera(c)).flatMap((c) => {
  const a = alcanceDe(c);
  return abiertos(d, c.slug).filter((t) => p.esCeo || lc(t.assignee) === p.email).map((t) => aviso(FUERA, {
    clave: `cons-encargo-fuera-de-alcance:${t.id}`, cliente: c.slug, desde: creada(t), huella: a,
    titulo: `El encargo «${t.title}» de ${c.nombre} está fuera de su alcance`,
    detalle: [textoAlcanceConsulting(c.ficha.nivel || null, c.ficha), a === 'ficha' ? 'Su ficha no nombra Consulting, Operations OS, Money OS ni finanzas.' : '', `${p.esCeo ? 'Lo decides tú' : 'Lo decide el CEO'}: se cotiza aparte o se cierra.`].filter(Boolean).join(' '),
    accion: p.ve('estrategia') ? { label: 'Abrir el encargo', href: `#/consulting/${url(c.slug)}` } : { label: 'Abrir el encargo', abre: 'tarea', id: t.id },
  }));
});

// cons-gp-sin-especialista · CLAUDE.md: «el experto de industria es exclusivo de Growth Partnership y se especifica quién, cuántas
// horas y qué entrega» y «El mentor hace la auditoría»; inherent/05-OPERACION.md §5 «Operación y auditoría». Growth Partnership (o a
// la medida con especialista o auditoría en su ficha) y su cuenta sin especialista. Al CEO y al COO; el botón, quien edita Clientes.
const ESPECIALISTA = { id: 'cons-gp-sin-especialista', grupo: 'clientes', area: 'consulting', urgencia: 'media', necesita: { rol: ['ceo', 'coo'] } };
ESPECIALISTA.calcular = (d, p) => conNivel(d).filter((c) => c.slug !== 'inherent' && (nivelId(c) === 'partnership' || (nivelId(c) === 'medida' && nombra(c, /especialista|auditor/i)))).flatMap((c) => {
  const acc = cuentaDe(d, c.slug);
  if (!acc || (acc.mentors || []).length) return [];
  return [aviso(ESPECIALISTA, {
    clave: `cons-gp-sin-especialista:${c.slug}`, cliente: c.slug, huella: 'sin-especialista',
    titulo: nivelId(c) === 'partnership' ? `${c.nombre} es ${c.ficha.nivel.nombre} y no tiene especialista para su auditoría` : `La ficha de ${c.nombre} trae auditoría y no tiene especialista`,
    detalle: `El especialista de industria hace la auditoría: se especifica quién, cuántas horas y qué entrega.${p.edita('clients') ? '' : ' Lo agrega quien edita Clientes.'}`,
    accion: p.edita('clients') ? { label: '+ Especialista', href: `#/clients/${url(c.slug)}` } : null,
  })];
});

// cons-money-sin-numeros · inherent/02-METODO.md §4 Money OS (lo lleva el CEO con Strategy y entra cuando el cliente aporta costos
// confiables) e inherent/05-OPERACION.md §7 «El ritmo del mes». Growth Partnership con finanzas en su ficha (o a la medida con Money
// OS o finanzas) y sin 07-oferta-y-ventas/numeros.md. Ese entregable lleva costos: solo llega en los presentes del CEO.
const MARGEN = CONSULTING.flatMap(([, , , ts]) => ts).find(([t]) => t === 'Margen por línea')?.[1] || '¿Qué línea deja margen y cuál lo desangra?';
const NUMEROS = { id: 'cons-money-sin-numeros', grupo: 'clientes', area: 'consulting', urgencia: 'media', necesita: { rol: ['ceo'] } };
NUMEROS.calcular = (d) => conNivel(d).filter((c) => { const a = alcanceDe(c); return c.slug !== 'inherent' && (a === 'si' || (a === 'ficha' && nombra(c, /money|finanz/i))) && !hay(c, 'numeros'); }).map((c) => aviso(NUMEROS, {
  clave: `cons-money-sin-numeros:${c.slug}`, cliente: c.slug, huella: 'sin-numeros',
  titulo: `Money OS de ${c.nombre} sin números: el margen por línea todavía es teoría`,
  detalle: 'Faltan los costos del cliente. En el Chat de Consulting ves cuáles; se los pide la Secretaria.',
  accion: { label: 'Pedir los costos', chat: { modo: 'consulting', slug: c.slug, borrador: MARGEN } },
}));

// cons-replanteo-trimestral · inherent/05-OPERACION.md §5 «Estrategia» (replanteo trimestral, CEO, Growth Partnership) y §7 «El
// ritmo del mes». La estrategia de un Growth Partnership aprobada hace más de 90 días. Solo el CEO (él la reabre).
const REPLANTEO = { id: 'cons-replanteo-trimestral', grupo: 'clientes', area: 'estrategia', urgencia: 'baja', necesita: { rol: ['ceo'] } };
REPLANTEO.calcular = (d, p, hoy) => conNivel(d).filter((c) => c.slug !== 'inherent' && nivelId(c) === 'partnership').flatMap((c) => {
  const en = fecha(vivaDoc(d, c.slug)?.aprobado?.en), dias = en ? diasEntre(en, hoy) : 0;
  if (dias <= 90) return [];
  return [aviso(REPLANTEO, {
    clave: `cons-replanteo-trimestral:${c.slug}`, cliente: c.slug, desde: en, huella: en,
    titulo: `Toca el replanteo trimestral de la estrategia de ${c.nombre}`,
    detalle: `La aprobaste hace ${dias} días: se reabre, se replantea con lo que pasó y se vuelve a aprobar.`,
    accion: { label: 'Abrir la estrategia', href: `#/estrategia/${url(c.slug)}` },
  })];
});

// En el orden del ciclo: la ficha, el ciclo y sus reuniones, la estrategia y Consulting.
export const CLIENTES_ESTRATEGIA = [SIN_FICHA, FICHA_INC, CICLO, REUNION, SIN_APROBAR, BRIEF, CAPACIDAD, ENCARGOS, FUERA_NIVEL, OFERTAS, REVISION, CARPETA_INC, ONBOARDING, FUERA, ESPECIALISTA, NUMEROS, REPLANTEO];
