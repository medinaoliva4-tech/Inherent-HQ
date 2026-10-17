// La red de especialistas por industria: quién es, cuánto cuesta, por qué ese precio y en qué plan cabe.
// La política (techo por sesión, membresía anual de Inherent) está en inherent/04-MERCADO.md.
import { html, raw, mount, col, drawer, closeDrawer, toast, confirmAsk, $, squareImage, initials, ico } from './core.js';

export const TIERS = [['low', 'Económico'], ['medio', 'Medio'], ['premium', 'Premium']];
export const UNITS = [['sesion', 'por sesión'], ['mes', 'membresía al mes'], ['gratis', 'gratis'], ['cotizacion', 'cotización']];
export const CADENCE = [['trimestral', '1 sesión por trimestre'], ['mensual', '1 sesión al mes'], ['puntual', 'Una sesión puntual']];
const M = col('mentors');

// El mapa del manual, para arrancar (se editan y se agregan más desde la app).
const SEED = [
  ['Restaurantes', 'low', 'Wingman', 'Comunidad', 0, 'gratis', 0, 'Comunidad de dueños, sin 1:1'],
  ['Restaurantes', 'medio', 'GrowthMentor', 'GrowthMentor', 50, 'mes', 0, 'Membresía anual ($85/mes trimestral). Crecimiento y marketing; no garantiza mentor de operaciones'],
  ['Restaurantes', 'premium', 'MASTERESTAURANT', 'Directo', 950, 'sesion', 90, 'Especialista de restaurantes, sesión virtual de 1.5 h'],
  ['Arquitectura', 'low', 'EntreArchitect Network', 'EntreArchitect', 0, 'gratis', 0, 'Comunidad para firmas pequeñas'],
  ['Arquitectura', 'medio', 'EntreArchitect Pro', 'EntreArchitect', 49, 'mes', 0, 'Coaching grupal · $499/año'],
  ['Arquitectura', 'premium', 'EntreArchitect Mastermind', 'EntreArchitect', 99, 'mes', 0, 'Mastermind grupal ($999/año); no es 1:1 privado'],
  ['Moda y fast fashion', 'low', 'The Apparel Mentor', 'The Apparel Mentor', 39, 'mes', 0, 'Clases, eventos y coaching 1:1'],
  ['Moda y fast fashion', 'medio', 'Operador de moda DTC', 'MentorPass', 144, 'sesion', 30, 'Opera marcas DTC de moda'],
  ['Moda y fast fashion', 'premium', 'Fundador DTC', 'MentorPass', 360, 'sesion', 30, 'Fundó una marca DTC: criterio de dueño'],
  ['Moda y fast fashion', 'premium', 'WE are COCO', 'WE are COCO', 0, 'cotizacion', 0, 'Red de 350+ compradores de retail'],
  ['E-commerce y DTC', 'low', 'Mentor de crecimiento', 'MentorPass', 72, 'sesion', 30, 'Crecimiento general de e-commerce'],
  ['E-commerce y DTC', 'medio', 'Especialista en CX', 'MentorPass', 180, 'sesion', 30, 'Experiencia del cliente y recompra'],
  ['E-commerce y DTC', 'premium', 'Retención y CX', 'MentorPass', 540, 'sesion', 30, 'Retención a escala: lo que más mueve el LTV'],
  ['Wellness y fitness', 'low', 'Fundador de marca fitness', 'MentorPass', 72, 'sesion', 30, 'Ya creció una marca fitness'],
  ['Wellness y fitness', 'medio', 'Fundador wellness', 'MentorPass', 180, 'sesion', 30, 'Fundador con marca wellness más grande'],
  ['Wellness y fitness', 'premium', 'The Maxwell Method', 'Directo', 300, 'sesion', 90, '$600 por 2 sesiones de 90 min · mentoría de 6 semanas $2,900'],
  ['Suplementos', 'low', 'MicroMentor', 'MicroMentor', 0, 'gratis', 0, 'Gratis; no garantiza experiencia en suplementos'],
  ['Suplementos', 'medio', 'Fundador de Obvi', 'MentorPass', 144, 'sesion', 30, 'Fundó una marca de suplementos'],
  ['Suplementos', 'premium', 'Fundador de Zesty Paws', 'MentorPass', 720, 'sesion', 30, 'Fundó y vendió una marca grande de suplementos'],
  ['Servicios profesionales', 'low', 'MicroMentor', 'MicroMentor', 0, 'gratis', 0, 'Orientación general'],
  ['Servicios profesionales', 'medio', 'GrowthMentor', 'GrowthMentor', 50, 'mes', 0, '$50-85/mes; algunos mentores cobran aparte'],
  ['Servicios profesionales', 'premium', 'GLG · Guidepoint', 'GLG', 0, 'cotizacion', 0, 'Expertos por hora: $700-1,500+/h. Fuera del techo de cualquier nivel'],
];

export const priceLabel = (m) => (m.unit === 'gratis' ? 'Gratis' : m.unit === 'cotizacion' ? 'Cotización' : m.unit === 'mes' ? `$${m.price}/mes` : `$${m.price} / ${m.minutes || 30} min`);
// Qué cubre, según la política del manual: los especialistas son de Growth Partnership; hasta $180 por sesión se absorbe en el alcance acordado, arriba va aparte.
export function fit(m) {
  if (m.unit === 'gratis') return ['Gratis', 'green'];
  if (m.unit === 'mes') return ['Membresía anual de Inherent', 'blue'];
  if (m.unit === 'cotizacion') return ['Add-on facturado al cliente', 'red'];
  return +m.price <= 180 ? ['Cabe en Growth Partnership', 'green'] : ['Add-on facturado al cliente', 'red'];
}
// Costo al mes de un especialista asignado a un cliente (USD). Las membresías son de Inherent: no se cargan por cliente.
export const monthly = (m, cadence) => (m?.unit !== 'sesion' ? 0 : cadence === 'mensual' ? +m.price : cadence === 'trimestral' ? Math.round(+m.price / 3) : 0);
export const avatar = (m, s = 44) => (m.photo ? html`<span class="mav" style="width:${s}px;height:${s}px;background-image:url('${m.photo}')"></span>` : html`<span class="mav" style="width:${s}px;height:${s}px">${initials(m.name)}</span>`);

export function mentorsTab(body, { list, isCeo, onChange, ind = 'Todas', onInd }) {
  const inds = [...new Set(list.map((m) => m.industry).filter(Boolean))].sort();
  const shown = list.filter((m) => ind === 'Todas' || m.industry === ind);
  mount(body, html`
    <div class="mut sm" style="margin-bottom:12px">La red de especialistas de ${ico('stairs')} Growth Partnership: gente que ya creció una marca en esa industria. En cada propuesta se define quién, cuántas horas y qué entrega. Techo por sesión: <b>$180</b>; arriba de eso va como add-on facturado al cliente.</div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:14px">${['Todas', ...inds].map((x) => html`<button class="chip ${x === ind ? 'dark' : ''}" data-mact="ind" data-v="${x}" style="padding:7px 13px">${x}</button>`)}</div>
    ${!list.length ? html`<div class="empty"><b>Todavía no hay especialistas</b>${isCeo ? html`Carga el mapa del manual para empezar, o agrega uno.<div style="margin-top:14px"><button class="btn ghost" data-mact="seed">Cargar el mapa del manual (${SEED.length})</button></div>` : 'El CEO los agrega aquí.'}</div>`
      : [...new Set(shown.map((m) => m.industry))].sort().map((i) => html`<div class="sec-title"><h2>${i}</h2></div>
        <div class="grid g3">${TIERS.map(([t, tl]) => html`<div><div class="lbl" style="color:var(--mut);margin-bottom:8px">${tl}</div>${shown.filter((m) => m.industry === i && m.tier === t).sort((a, z) => (+a.price || 0) - (+z.price || 0)).map((m) => { const [f, c] = fit(m); return html`
          <div class="card mcard" ${isCeo ? raw(`data-mact="edit" data-id="${m.id}"`) : ''}>
            <div class="row" style="gap:10px">${avatar(m)}<div style="min-width:0"><b style="font-weight:500">${m.name}</b><div class="mut sm">${m.platform || ''}</div></div></div>
            <div class="big" style="font-size:26px;margin:10px 0 4px">${priceLabel(m)}</div>
            <span class="chip ${c}" style="font-size:11px">${f}</span>
            ${m.why ? html`<div class="sm" style="margin-top:8px">${ico('bulb')} ${m.why}</div>` : ''}
            ${/^https:\/\//.test(m.link || '') ? html`<a class="sm mut" href="${m.link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px">Ver perfil ↗</a>` : ''}
          </div>`; })}</div>`)}</div>`)}`);
  body.onclick = async (e) => {
    const t = e.target.closest('[data-mact]'); if (!t || e.target.closest('a')) return;
    if (t.dataset.mact === 'ind') return onInd(t.dataset.v);
    if (t.dataset.mact === 'seed') { t.disabled = true; const made = []; for (const [industry, tier, name, platform, price, unit, minutes, why] of SEED) made.push(await M.create({ industry, tier, name, platform, price, unit, minutes, why, link: '', photo: null })); toast(`${made.length} especialistas cargados ${ico('check', 14)}`); return onChange([...list, ...made]); }
    if (t.dataset.mact === 'edit') { const r = await editMentor(list.find((m) => m.id === t.dataset.id), inds); if (r) onChange(r.deleted ? list.filter((m) => m.id !== r.id) : list.map((m) => (m.id === r.id ? r : m))); }
  };
}

export function editMentor(m, inds = []) {
  return new Promise((resolve) => {
    let photo = m?.photo || null; let done = false;
    const end = (v) => { if (!done) { done = true; resolve(v); } };
    const draw = () => {
      drawer(html`<div class="row"><span class="chip">Especialista</span><div class="sp"></div><button class="arrow light" data-act="close">${ico('x', 16)}</button></div>
        <h2>${m ? m.name : 'Nuevo especialista'}</h2>
        <div class="row" style="gap:12px;margin:14px 0">${avatar({ name: $('#mf [name=name]')?.value || m?.name || '?', photo }, 64)}<label class="btn ghost" style="cursor:pointer">${ico('camera')} ${photo ? 'Cambiar foto' : 'Subir foto'}<input type="file" accept="image/*" id="mphoto" hidden></label>${photo ? html`<button class="btn ghost" data-act="nophoto">Quitar</button>` : ''}</div>
        <form class="form" id="mf">
          <div><label class="f">Nombre *</label><input class="in" name="name" value="${m?.name || ''}"></div>
          <div class="two"><div><label class="f">Industria *</label><input class="in" name="industry" list="minds" value="${m?.industry || ''}"><datalist id="minds">${inds.map((i) => html`<option value="${i}">`)}</datalist></div>
            <div><label class="f">Plataforma</label><input class="in" name="platform" value="${m?.platform || ''}" placeholder="MentorPass, GrowthMentor, directo…"></div></div>
          <div class="two"><div><label class="f">Rango</label><select class="in" name="tier">${TIERS.map(([k, l]) => html`<option value="${k}" ${k === (m?.tier || 'medio') ? raw('selected') : ''}>${l}</option>`)}</select></div>
            <div><label class="f">Se cobra</label><select class="in" name="unit">${UNITS.map(([k, l]) => html`<option value="${k}" ${k === (m?.unit || 'sesion') ? raw('selected') : ''}>${l}</option>`)}</select></div></div>
          <div class="two"><div><label class="f">Precio (USD)</label><input class="in" name="price" type="number" value="${m?.price ?? ''}"></div>
            <div><label class="f">Minutos por sesión</label><input class="in" name="minutes" type="number" value="${m?.minutes ?? 30}"></div></div>
          <div><label class="f">¿Por qué ese precio? (qué lo hace más caro o más barato)</label><textarea class="in" name="why">${m?.why || ''}</textarea></div>
          <div><label class="f">Link del perfil</label><input class="in" name="link" value="${m?.link || ''}" placeholder="https://…"></div>
        </form>
        <div class="row" style="margin-top:16px"><button class="btn" data-act="msave">Guardar</button><div class="sp"></div>${m ? html`<button class="btn ghost" data-act="mdel">${ico('trash')}</button>` : ''}</div>`, {
        nophoto: () => { photo = null; draw(); },
        msave: async () => {
          const f = Object.fromEntries(new FormData($('#mf')));
          if (!f.name.trim() || !f.industry.trim()) return toast('Falta nombre o industria', true);
          if (f.link && !/^https:\/\//.test(f.link)) return toast('El link debe empezar con https://', true);
          const doc = { ...(m || {}), ...f, name: f.name.trim(), industry: f.industry.trim(), price: +f.price || 0, minutes: +f.minutes || 30, photo };
          try { const r = m ? await M.save(doc) : await M.create(doc); closeDrawer(); toast('Guardado'); end(r); } catch (e) { toast(e.message, true); }
        },
        mdel: async () => { if (!(await confirmAsk(`¿Quitar a ${m.name}?`))) return; await M.remove(m.id); closeDrawer(); end({ id: m.id, deleted: true }); },
      });
      $('#mphoto').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { photo = await squareImage(f, 160); draw(); } catch (err) { toast(err.message, true); } };
      $('#drawer [data-act=close]').addEventListener('click', () => end(null));
    };
    draw();
    $('#veil').addEventListener('click', () => end(null), { once: true });
  });
}
