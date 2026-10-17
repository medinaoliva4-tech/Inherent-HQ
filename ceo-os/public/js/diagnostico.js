// El diagnóstico público (/diagnostico): siete preguntas para calificar a un dueño de negocio, su contacto,
// un puntaje y el plan que le toca. Manda todo a la puerta de una fuente tipo quiz (/api/intake/:key).
// La clave viene en ?k=…; si no, se pide al OS la de la fuente principal del quiz.
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const API = ($('meta[name=os-api]')?.content || '').trim().replace(/\/$/, '');
const KEY = new URLSearchParams(location.search).get('k') || '';
import { LEVEL_NAMES } from './levels.js';

// Cada opción: [valor, texto, detalle]. Las llaves (vende, etapa…) son las que ve Ventas en el CRM.
const Q = [
  { k: 'vende', q: '¿Qué vende tu negocio?', opts: [['producto', 'Producto físico', 'Tienda, marca, e-commerce'], ['servicio', 'Servicio profesional', 'Consultoría, clínica, despacho, agencia'], ['local', 'Restaurante o local', 'Comida, café, bar, salón'], ['salud', 'Salud y bienestar', 'Gym, estética, terapia'], ['digital', 'Software o digital', 'App, SaaS, cursos'], ['otro', 'Otro', '']] },
  { k: 'etapa', q: '¿En qué etapa está?', opts: [['arrancando', 'Arrancando', 'Menos de un año o sin ventas estables'], ['inestable', 'Ya vendo, pero sube y baja', 'Un mes bien, otro no'], ['estancado', 'Vendo estable, pero estoy estancado', 'Hace tiempo que no crece'], ['creciendo', 'Estoy creciendo', 'Y quiero que deje de depender de mí']] },
  { k: 'facturacion', q: '¿Cuánto factura al mes, más o menos?', sub: 'No se comparte con nadie. Sirve para no recomendarte algo que no te toca todavía.', opts: [['<15k', 'Menos de Q15 mil', ''], ['15-50k', 'Entre Q15 y Q50 mil', ''], ['50-150k', 'Entre Q50 y Q150 mil', ''], ['150-500k', 'Entre Q150 y Q500 mil', ''], ['>500k', 'Más de Q500 mil', ''], ['nd', 'Prefiero no decirlo', '']], two: true },
  { k: 'trabado', q: '¿Dónde sientes que está trabado?', opts: [['nadie', 'Nadie me conoce', 'Falta que me vean'], ['no_compran', 'Me conocen, pero no compran', 'Llegan, preguntan y se van'], ['no_crece', 'Vendo, pero no crece', 'Siempre los mismos números'], ['depende', 'Crece, pero todo depende de mí', 'Si yo no estoy, se para'], ['no_se', 'No tengo claro', 'Por eso estoy aquí']] },
  { k: 'probado', q: '¿Qué has probado?', sub: 'Marca todo lo que aplique.', multi: true, opts: [['redes', 'Redes por mi cuenta', ''], ['agencia', 'Una agencia', ''], ['pauta', 'Pauta (anuncios)', ''], ['referidos', 'Referidos y boca en boca', ''], ['nada', 'Nada todavía', '']], two: true },
  { k: 'urgencia', q: '¿Qué tan urgente es resolverlo?', opts: [['ya', 'Ya, este mes', ''], ['3m', 'En los próximos tres meses', ''], ['explorando', 'Estoy explorando', '']] },
  { k: 'inversion', q: '¿Cuánto podrías invertir al mes en crecer?', sub: 'La etapa no es mérito: dice qué necesitas ahora.', opts: [['<900', 'Menos de $900', ''], ['900-1500', 'Entre $900 y $1,500', ''], ['1500-3000', 'Entre $1,500 y $3,000', ''], ['>3000', 'Más de $3,000', ''], ['nd', 'No lo sé todavía', '']], two: true },
];
// Los 3 niveles salen de levels.js (un solo lugar). Aquí solo el texto que ve quien responde el quiz.
const PLANS = LEVEL_NAMES;
const PLAN_TXT = {
  'Brand Foundation': ['marca nueva o por reposicionar', 'Creamos la marca cool: diagnóstico, posicionamiento, oferta, identidad y un plan a 90 días. Es un proyecto con inicio y cierre.'],
  'Brand Growth': ['marca con oferta → más demanda', 'Hacemos más cool la marca que ya está: plan mensual de campañas y contenido, canales, pruebas y revisión de métricas cada mes.'],
  'Growth Partnership': ['marca, ventas y sistemas conectados', 'Nos metemos full en el crecimiento: todo lo de Brand Growth, más el recorrido del cliente, ventas, procesos y sistemas comerciales, según lo que se acuerde.'],
};
// Puntaje 0-100 (qué tan listo está) y nivel sugerido (qué le toca por etapa, traba y capacidad). Es una orientación, no una promesa.
export function evaluate(a) {
  const pts = { etapa: { arrancando: 10, inestable: 15, estancado: 25, creciendo: 30 }, facturacion: { '<15k': 5, '15-50k': 10, '50-150k': 18, '150-500k': 25, '>500k': 30, nd: 10 }, urgencia: { ya: 25, '3m': 15, explorando: 5 }, inversion: { '<900': 5, '900-1500': 10, '1500-3000': 15, '>3000': 20, nd: 8 } };
  const score = Math.min(100, Object.entries(pts).reduce((s, [k, m]) => s + (m[a[k]] || 0), 0));
  let i = { arrancando: 0, inestable: 1, estancado: 1, creciendo: 2 }[a.etapa] ?? 0;
  if (a.trabado === 'nadie') i = Math.min(i, 1);           // problema de atención: Brand Growth como tope
  if (a.trabado === 'no_compran') i = Math.max(i, 1);      // oferta y conversión: al menos Brand Growth
  if (a.trabado === 'depende') i = Math.max(i, 2);         // la empresa depende del dueño: conectar ventas y sistemas
  const capF = { '<15k': 1, '15-50k': 1 }[a.facturacion]; if (capF != null) i = Math.min(i, capF); // sin transacciones estables, los sistemas comerciales son teoría
  const capI = { '<900': 1, '900-1500': 1 }[a.inversion]; if (capI != null) i = Math.min(i, capI);
  return { score, plan: PLANS[i] };
}

const a = {}; let step = -1; // -1 = portada · 0..Q.length-1 = preguntas · Q.length = contacto · Q.length+1 = resultado
const main = $('#main'), foot = $('#foot'), bar = $('#bar'), count = $('#count'), next = $('#next'), nextl = $('#nextl'), back = $('#back');
const total = Q.length + 1;
const done = (s) => { const q = Q[s]; const v = a[q.k]; return q.multi ? Array.isArray(v) && v.length > 0 : v != null; };
function paint() {
  const pct = step < 0 ? 0 : Math.min(100, Math.round(((step) / total) * 100));
  bar.style.width = pct + '%'; count.textContent = step >= 0 && step < total ? `${step + 1} / ${total}` : '';
  foot.hidden = step < 0 || step > Q.length; back.style.visibility = step > 0 ? 'visible' : 'hidden';
  if (step < 0) {
    main.innerHTML = `<section class="step"><span class="eyebrow">Diagnóstico · 2 minutos</span>
      <h1>¿Dónde está trabado <em>tu negocio?</em></h1>
      <p class="lead">Siete preguntas. Al final te contamos qué nivel de trabajo encaja hoy con tu empresa, sin venderte volumen: <em>lo que necesita, no lo que la industria dice.</em> Es una orientación, no una promesa de resultados.</p>
      <button class="btn cream" id="start" type="button">Empezar <span class="arr">→</span></button>
      <p class="tiny" style="margin-top:18px">Nada de esto se comparte. Lo usa Inherent para prepararse antes de hablar contigo.</p></section>`;
    $('#start').onclick = () => go(0);
    return;
  }
  if (step < Q.length) {
    const q = Q[step], v = a[q.k];
    main.innerHTML = `<section class="step"><span class="eyebrow">Pregunta ${step + 1}</span><h2>${esc(q.q)}</h2>${q.sub ? `<p class="sub">${esc(q.sub)}</p>` : ''}
      <div class="opts ${q.two ? 'two' : ''}" role="group">${q.opts.map(([val, l, d], i) => `<button type="button" class="opt ${(q.multi ? (v || []).includes(val) : v === val) ? 'on' : ''}" data-v="${esc(val)}"><span class="k">${i + 1}</span><span><b style="font-weight:500">${esc(l)}</b>${d ? `<small>${esc(d)}</small>` : ''}</span></button>`).join('')}</div></section>`;
    nextl.textContent = 'Seguir'; next.disabled = !done(step);
    main.querySelectorAll('.opt').forEach((b) => { b.onclick = () => {
      if (q.multi) { const cur = new Set(a[q.k] || []); cur.has(b.dataset.v) ? cur.delete(b.dataset.v) : cur.add(b.dataset.v); if (b.dataset.v === 'nada' && cur.has('nada')) cur.clear(), cur.add('nada'); else cur.delete('nada'); a[q.k] = [...cur]; paint(); }
      else { a[q.k] = b.dataset.v; main.querySelectorAll('.opt').forEach((x) => x.classList.toggle('on', x === b)); next.disabled = false; setTimeout(() => go(step + 1), 220); }
    }; });
    return;
  }
  if (step === Q.length) {
    main.innerHTML = `<section class="step"><span class="eyebrow">Último paso</span><h2>¿A quién le <em>contamos</em> el resultado?</h2><p class="sub">Te escribimos por WhatsApp. Sin cadenas ni correos de más.</p>
      <form class="fields" id="cf" autocomplete="on">
        <div><label class="f" for="name">Tu nombre</label><input class="in" id="name" name="name" autocomplete="name" placeholder="Nombre y apellido" value="${esc(a.name || '')}" required></div>
        <div><label class="f" for="company">Tu negocio</label><input class="in" id="company" name="company" autocomplete="organization" placeholder="Nombre de la marca o empresa" value="${esc(a.company || '')}"></div>
        <div><label class="f" for="phone">WhatsApp</label><input class="in" id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+502 5555 5555" value="${esc(a.phone || '')}" required></div>
        <div><label class="f" for="email">Correo</label><input class="in" id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="tu@correo.com" value="${esc(a.email || '')}"></div>
        <div aria-hidden="true" style="position:absolute;left:-9999px;top:-9999px;height:0;overflow:hidden"><label for="_hp">Deja este campo vacío</label><input id="_hp" name="_hp" type="text" tabindex="-1" autocomplete="off" value=""></div>
      </form><div class="err" id="err"></div></section>`;
    nextl.textContent = 'Ver mi resultado'; next.disabled = false;
    $('#cf').onsubmit = (e) => { e.preventDefault(); go(step + 1); };
    $('#name').focus();
    return;
  }
  // resultado
  const { score, plan } = evaluate(a); const [arc, txt] = PLAN_TXT[plan];
  main.innerHTML = `<section class="step"><span class="eyebrow">Tu resultado</span><h2>Gracias, <em>${esc((a.name || '').split(' ')[0])}</em>.</h2>
    <p class="lead">Por lo que nos contaste, hoy a tu negocio le encaja:</p>
    <div class="result"><div class="arc">${esc(arc)}</div><div class="plan">${esc(plan)}</div><p>${esc(txt)}</p>
      <div class="meter"><i id="meter"></i></div><div class="tiny">Qué tan listo está tu negocio para crecer: <b style="color:var(--cream)">${score}/100</b></div></div>
    <p class="lead" id="thanks">Te escribimos por WhatsApp para contarte cómo se ve esto en tu empresa, con tus números y tu mercado. El alcance se define en una propuesta y el precio parte «desde», según volumen y complejidad; no es un precio fijo ni un resultado garantizado.</p>
    <p class="tiny" id="sent">Guardando tus respuestas…</p>
    <a class="btn outline" href="https://inherentglobal.com" style="margin-top:18px">Volver a inherentglobal.com</a></section>`;
  requestAnimationFrame(() => { $('#meter').style.width = score + '%'; });
  send(score, plan);
}
function go(n) {
  if (n === Q.length + 1) { // validar el contacto
    const f = $('#cf'); const v = Object.fromEntries(new FormData(f)); Object.assign(a, { name: v.name.trim(), company: v.company.trim(), phone: v.phone.trim(), email: v.email.trim(), _hp: String(v._hp || '') });
    const digits = a.phone.replace(/\D/g, '');
    const bad = !a.name ? 'Dinos tu nombre.' : digits.length < 8 ? 'Escribe un WhatsApp con código de país, ej. +502 5555 5555.' : a.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email) ? 'Ese correo no se ve bien.' : '';
    if (bad) { $('#err').textContent = bad; return; }
  }
  step = n; window.scrollTo({ top: 0, behavior: 'instant' }); paint();
}
next.onclick = () => { if (step < Q.length && !done(step)) return; go(step + 1); };
back.onclick = () => go(step - 1);
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && step >= 0 && step < Q.length && done(step)) go(step + 1); if (step >= 0 && step < Q.length && /^[1-9]$/.test(e.key)) main.querySelectorAll('.opt')[+e.key - 1]?.click(); });

let sentOnce = false;
async function send(score, plan) {
  if (sentOnce) return; sentOnce = true;
  const out = $('#sent');
  try {
    let key = KEY;
    if (!key) { const r = await fetch(`${API}/api/intake/quiz`).then((x) => x.json()).catch(() => ({})); key = r.key || ''; }
    if (!key) throw new Error('sin fuente');
    const answers = Object.fromEntries(Q.map((q) => [q.k, Array.isArray(a[q.k]) ? a[q.k].map((v) => label(q, v)) : label(q, a[q.k])]));
    const r = await fetch(`${API}/api/intake/${encodeURIComponent(key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: a.name, company: a.company, phone: a.phone, email: a.email, _hp: a._hp || '', answers, score, plan, origen: location.href.split('?')[0] }) });
    if (!r.ok) throw new Error('no entró');
    out.textContent = 'Listo. Tus respuestas ya están con el equipo.';
  } catch {
    out.innerHTML = 'No pudimos guardar tus respuestas. Escríbenos por Instagram a <b style="color:var(--cream)">@inherent</b> y te atendemos igual.';
  }
}
const label = (q, v) => q.opts.find(([x]) => x === v)?.[1] || v || '';
paint();
