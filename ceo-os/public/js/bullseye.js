// La diana de audiencia (método Bullseye: Define · Acierta · Expande). Vive en Content → Fuentes.
// El centro es UNA persona hiper-específica; cada anillo suelta UNA restricción. Apuntar al centro le enseña
// al algoritmo a quién mostrarle el video, y él expande el alcance. Se arma conversando con el Claude de cada quien.
import { html, raw, mount, toast, drawer, closeDrawer, ask, claudeJSON } from './core.js';

const COL = ['#7f6149', '#a0856e', '#beaa96', '#bda895', '#4c3829'];
const NAME = ['Centro', 'Anillo 1', 'Anillo 2', 'Anillo 3', 'Anillo 4'];
const JOB = [['Conversión', '#7f6149'], ['Alcance con conversión', '#beaa96'], ['Alcance', '#bda895']];
const R = [30, 60, 90, 120, 150], C = 170; // radios del centro hacia afuera, en un lienzo de 340
let MODE = 'diana', SEL = 0;

const short = (s, k = 22) => (s.length > k ? s.slice(0, k - 1) + '…' : s);

function board(bx, mode) {
  const rings = [...bx.rings.keys()].reverse().map((i) => {
    const dim = mode === 'fuentes' && i > 1, sel = mode === 'diana' && i === SEL;
    return raw(`<circle class="bx-ring" style="animation-delay:${0.15 + i * 0.12}s" cx="${C}" cy="${C}" r="${R[i]}" fill="${COL[i]}" opacity="${dim ? 0.28 : 1}" stroke="${sel ? '#fdfaf3' : '#2e2017'}" stroke-width="${sel ? 3 : 1.5}" data-act="bxRing" data-i="${i}"/>`);
  });
  const nums = [1, 2, 3, 4].map((i) => raw(`<text x="${C}" y="${C - (R[i] + R[i - 1]) / 2 + 4}" text-anchor="middle" class="bx-n">${i}</text>`));
  let extra = '';
  if (mode === 'mix') {
    const at = [[0, -12], [-11, 8], [11, 8], [-32, 32], [53, 53]]; // 3 al centro, 1 al anillo 1, 1 al anillo 2
    extra = at.map(([x, y], i) => { const j = [0, 0, 0, 1, 2][i]; return `<g class="bx-dart" style="animation-delay:${0.5 + i * 0.1}s"><circle cx="${C + x}" cy="${C + y}" r="10" fill="${JOB[j][1]}" stroke="#fdfaf3" stroke-width="2"/><text x="${C + x}" y="${C + y + 3.5}" text-anchor="middle" class="bx-v">V${i + 1}</text></g>`; }).join('');
  } else if (mode === 'fuentes') {
    extra = `<circle cx="${C}" cy="${C}" r="${R[1] + 2}" fill="none" stroke="#fdfaf3" stroke-width="2" stroke-dasharray="5 4"/>
      <text x="${C}" y="${C + R[1] + 16}" text-anchor="middle" class="bx-zone">TEMAS DE AQUÍ</text>
      <path id="bxArc" d="M ${C - 160} ${C} A 160 160 0 0 1 ${C + 160} ${C}" fill="none"/>
      <text class="bx-arc"><textPath href="#bxArc" startOffset="50%" text-anchor="middle">FORMATOS · HOOKS · HISTORIAS · EDICIÓN — DE DONDE SEA</textPath></text>`;
  } else extra = `<text x="${C}" y="${C + 6}" text-anchor="middle" style="font-size:18px">🎯</text>`;
  return html`<svg class="bx-svg" viewBox="0 0 340 340" role="img" aria-label="La diana de audiencia">${rings}${nums}${raw(extra)}</svg>`;
}

function panel(bx, mode) {
  if (mode === 'diana') {
    const r = bx.rings[SEL], w = [12, 26, 46, 70, 100];
    return html`<div class="bx-list">${bx.rings.map((x, i) => html`<button class="bx-row ${i === SEL ? 'on' : ''}" data-act="bxRing" data-i="${i}"><i style="background:${COL[i]}"></i><span class="grow"><b>${NAME[i]}</b> ${short(x.label, 70)}</span>${i ? html`<span class="bx-tag">suelta ${x.relaxed || '—'}</span>` : ''}</button>`)}</div>
      <div class="bx-detail"><div class="bx-k">${NAME[SEL]}${SEL ? ' · suelta ' + (r.relaxed || '—') : ''}</div><div class="bx-big">${r.label}</div>
        <div class="bx-facts"><div><span>Tamaño</span>${r.size || '—'}</div><div><span>Cercanía a comprar</span>${r.conversion || '—'}</div><div><span>Competencia</span>${r.competition || '—'}</div></div>
        <div class="bx-strip"><span>Audiencia</span><em><b style="width:${w[SEL]}%;background:#bda895"></b></em></div>
        <div class="bx-strip"><span>Conversión</span><em><b style="width:${w[4 - SEL]}%;background:#7f6149"></b></em></div></div>`;
  }
  if (mode === 'mix') {
    const L = bx.calib || [], per = [3, 1, 1], tot = [0, 1, 2].map((i) => L.reduce((s, c) => s + c['c' + i], 0));
    const rate = tot.map((t, i) => (L.length ? t / (L.length * per[i]) : 0)), best = rate.indexOf(Math.max(...rate));
    return html`<div class="bx-bar">${[0, 1, 2].map((j) => html`<span style="flex:${per[j]};background:${JOB[j][1]}">${per[j]} · ${JOB[j][0]}</span>`)}</div>
      <div class="bx-mix">${bx.mix.map((m, i) => html`<div class="bx-card" style="border-color:${JOB[m.ring][1]}"><div class="bx-k">V${i + 1} · ${NAME[m.ring]} · ${JOB[m.ring][0]}</div><div>${m.topic || html`<span class="bx-mut">Sin tema todavía</span>`}</div></div>`)}</div>
      <div class="bx-mut sm">Por cada 5 videos: 3 al centro, 1 al anillo 1, 1 al anillo 2. Nunca más afuera: los anillos 3 y 4 te los da el algoritmo cuando ya te ganaste el centro.</div>
      <div class="bx-k" style="margin-top:14px">Calibración · conversiones por anillo (seguidores, DMs, leads, ventas)</div>
      ${L.length ? html`<div class="bx-cal"><div class="bx-cal-h"><span>Lote</span><span>🎯</span><span>A1</span><span>A2</span><span>Decisión</span></div>${L.map((c) => html`<div><span>${c.lote}</span><span>${c.c0}</span><span>${c.c1}</span><span>${c.c2}</span><span>${c.decision || '—'}</span></div>`)}</div>` : ''}
      <div class="bx-mut sm">${L.length >= 2 ? html`Por video, convierte más <b style="color:#fdfaf3">${NAME[best].toLowerCase()}</b>: inclina los próximos lotes hacia ahí.` : 'Corre el 3/1/1 en 2 o 3 lotes de 10 videos; luego anota qué anillo trajo conversiones y la mezcla se inclina hacia ese.'}</div>
      <button class="btn ghost xs bx-btn" data-act="bxLote">+ Anotar lote</button>`;
  }
  const q = (s) => encodeURIComponent(s);
  return html`<div class="bx-mut sm" style="margin-bottom:10px"><b style="color:#fdfaf3">Los temas</b> salen del centro y el anillo 1 (el 2, a veces): si no hay nadie en tu centro, es tu oportunidad — toma el tema de un creador del anillo 1 y re-apúntalo a tu centro. <b style="color:#fdfaf3">El craft</b> (formato, hook, historia, edición) se toma de donde sea.</div>
    ${bx.rings.map((r, i) => html`<div class="bx-src"><div class="row" style="gap:8px"><i style="background:${COL[i]}"></i><b class="grow">${NAME[i]} · ${short(r.label, 48)}</b><span class="bx-tag">${i < 2 ? 'temas' : i === 2 ? 'temas a veces · craft' : 'craft'}</span></div>
      <div class="bx-chips">${r.search.length ? r.search.map((s) => html`<span class="bx-chip">${s}<a href="https://www.tiktok.com/search?q=${q(s)}" target="_blank" rel="noopener noreferrer">TikTok ↗</a><a href="https://www.instagram.com/explore/search/keyword/?q=${q(s)}" target="_blank" rel="noopener noreferrer">IG ↗</a></span>`) : html`<span class="bx-mut sm">Sin búsquedas.</span>`}</div></div>`)}`;
}

// La tarjeta completa. save(bullseye) guarda; prompt() arma el texto para el Claude de la persona.
export function bullseye(host, { name, bx, save, prompt }) {
  const paint = () => {
    if (!bx) {
      return mount(host, html`<div class="card bx"><div class="row" style="flex-wrap:wrap;gap:10px"><h3 class="bx-t">🎯 La diana de ${name}</h3><div class="sp"></div><button class="btn xs bx-cta" data-act="bxAI">✦ Armarla con Claude</button><button class="btn ghost xs bx-btn" data-act="bxEdit">Escribirla yo</button></div>
        <div class="bx-steps"><div><b>1 · Define</b>Una persona exacta, no «emprendedores».</div><div><b>2 · Acierta</b>Cada video le habla a esa persona.</div><div><b>3 · Expande</b>El algoritmo aprende a quién mostrarlo y abre el alcance solo.</div></div>
        <div class="bx-mut sm">Apunta más chico para crecer más grande. Claude te hace unas preguntas, una a la vez, y arma el centro, los 4 anillos, la mezcla 3/1/1 y dónde buscar inspiración.</div></div>`);
    }
    mount(host, html`<div class="card bx"><div class="row" style="flex-wrap:wrap;gap:10px"><h3 class="bx-t">🎯 La diana de ${name}</h3><div class="sp"></div><button class="btn ghost xs bx-btn" data-act="bxAI">✦ Rehacer con Claude</button><button class="btn ghost xs bx-btn" data-act="bxEdit">Editar</button></div>
      <div class="bx-center">${bx.center || bx.rings[0].label}</div>${bx.buyer ? html`<div class="bx-mut sm">Quien paga: ${bx.buyer}</div>` : ''}
      <div class="bx-seg">${[['diana', 'La diana'], ['mix', 'Mezcla 3/1/1'], ['fuentes', 'De dónde inspirarse']].map(([k, l]) => html`<button class="${MODE === k ? 'on' : ''}" data-act="bxMode" data-m="${k}">${l}</button>`)}</div>
      <div class="bx-grid"><div>${board(bx, MODE)}</div><div style="min-width:0">${panel(bx, MODE)}</div></div></div>`);
  };
  const commit = async (next) => { try { bx = await save(next); paint(); return true; } catch (e) { toast(e.message, true); return false; } };
  host.onclick = async (e) => {
    const t = e.target.closest('[data-act]'); if (!t || !host.contains(t)) return;
    const a = t.dataset.act;
    if (a === 'bxRing') { SEL = +t.dataset.i; if (MODE !== 'diana') MODE = 'diana'; paint(); }
    else if (a === 'bxMode') { MODE = t.dataset.m; paint(); }
    else if (a === 'bxEdit') edit(bx, commit);
    else if (a === 'bxAI') {
      const out = await claudeJSON('La diana con Claude', prompt(), 'Se abrió tu Claude con todo listo: dale enviar y contesta sus preguntas (una a la vez). Al final te da un JSON: cópialo y pégalo aquí.');
      if (!out) return;
      if (!Array.isArray(out.rings) || out.rings.length < 5) return toast('A esa respuesta le faltan los 5 niveles. Pídele a Claude el JSON final completo.', true);
      if (await commit({ ...out, calib: bx?.calib || [], at: new Date().toISOString() })) { MODE = 'diana'; SEL = 0; toast('Diana guardada ✅ · ajústala si hace falta'); }
    } else if (a === 'bxLote') {
      const v = await ask('Anotar un lote', [{ k: 'lote', l: 'Lote', v: `Lote ${(bx.calib || []).length + 1}`, req: true }, { k: 'c0', l: 'Conversiones del centro', t: 'number', v: 0, half: true }, { k: 'c1', l: 'Del anillo 1', t: 'number', v: 0, half: true }, { k: 'c2', l: 'Del anillo 2', t: 'number', v: 0 }, { k: 'decision', l: 'Qué decidimos', t: 'textarea' }], 'Anotar');
      if (v && (await commit({ ...bx, calib: [...(bx.calib || []), v] }))) toast('Lote anotado ✅');
    }
  };
  paint();
}

// Editar a mano: el centro, los 5 niveles y los 5 temas del lote.
function edit(bx, commit) {
  const b = bx || { center: '', buyer: '', rings: NAME.map(() => ({ label: '', relaxed: '', size: '', conversion: '', competition: '', search: [] })), mix: [0, 0, 0, 1, 2].map((ring) => ({ ring, topic: '' })), calib: [] };
  const f = (k, l, v, ph = '', area) => html`<div><label class="f">${l}</label>${area ? html`<textarea class="in" data-bk="${k}" placeholder="${ph}" style="min-height:56px">${v || ''}</textarea>` : html`<input class="in" data-bk="${k}" value="${v || ''}" placeholder="${ph}">`}</div>`;
  const d = drawer(html`<div class="row"><h2 style="margin:0">Editar la diana</h2><div class="sp"></div><button class="arrow light" data-act="close">✕</button></div>
    <div class="form" style="margin-top:12px">
      ${f('center', 'El centro, en una frase', b.center, '[persona específica] que [situación] y batalla con [problema]', true)}
      ${f('buyer', 'Quien paga (solo si no es quien ve)', b.buyer)}
      ${b.rings.map((r, i) => html`<div class="bx-ed"><div class="bx-ed-h"><i style="background:${COL[i]}"></i>${NAME[i]}</div>
        ${f(`r${i}.label`, 'Audiencia', r.label)}${i ? f(`r${i}.relaxed`, 'Qué restricción suelta', r.relaxed, 'industria, tamaño, modelo…') : ''}
        <div class="two">${f(`r${i}.size`, 'Tamaño', r.size, 'miles · millones…')}${f(`r${i}.conversion`, 'Cercanía a comprar', r.conversion, 'alta · media · baja')}</div>
        <div class="two">${f(`r${i}.competition`, 'Competencia', r.competition, 'vacía · llena…')}${f(`r${i}.search`, 'Búsquedas (separadas por coma)', r.search.join(', '))}</div></div>`)}
      <div class="bx-ed"><div class="bx-ed-h">El primer lote · 3/1/1</div>${b.mix.map((m, i) => f(`m${i}`, `V${i + 1} · ${NAME[[0, 0, 0, 1, 2][i]]}`, m.topic))}</div>
      <div class="row"><button class="btn" data-act="bxSave">Guardar la diana</button></div></div>`, {
    bxSave: async () => {
      const v = (k) => d.querySelector(`[data-bk="${k}"]`)?.value.trim() || '';
      const next = { center: v('center'), buyer: v('buyer'), calib: b.calib || [], at: new Date().toISOString(),
        rings: b.rings.map((_, i) => ({ label: v(`r${i}.label`), relaxed: v(`r${i}.relaxed`), size: v(`r${i}.size`), conversion: v(`r${i}.conversion`), competition: v(`r${i}.competition`), search: v(`r${i}.search`).split(',').map((s) => s.trim()).filter(Boolean) })),
        mix: b.mix.map((_, i) => ({ topic: v(`m${i}`) })) };
      if (!next.rings[0].label) return toast('Escribe al menos la audiencia del centro', true);
      if (await commit(next)) { closeDrawer(); toast('Diana guardada ✅'); }
    },
  });
}

// El prompt para el Claude de la persona: conversa como la skill (una pregunta a la vez, reflejar cada respuesta)
// y termina en un JSON que la app guarda.
export function bullseyePrompt({ name, pillars, own, refs, comp, posts, bx }) {
  return `Eres el estratega de contenido de Inherent. Vamos a armar la DIANA DE AUDIENCIA de «${name}» con el método Bullseye: Define · Acierta · Expande.
La idea: apuntar cada video a UNA persona hiper-específica. El algoritmo ve quién interactúa, aprende a quién mostrarle el video y LUEGO él abre el alcance a los públicos vecinos. Primero precisión, después alcance.

Cómo conversas (obligatorio):
- Una sola pregunta a la vez. Nunca juntes preguntas.
- Después de CADA respuesta, refleja en una frase lo que entendiste; si fue vaga, refleja una versión más específica como suposición («O sea, dueños de restaurante con 1 local que quieren abrir el segundo, ¿cierto?»).
- Nunca preguntes lo que ya está en el contexto de abajo ni lo que ya te dijeron.
- Sin jerga: «tu persona exacta», no «ICP». En español, de tú (nunca de vos).
- No inventes datos: tamaños y competencia son estimaciones direccionales, dilo así.

Pasos:
0. Lee el contexto. Si ya alcanza para un centro nítido (un rol o identidad + un detalle que lo estreche: precio, etapa, tamaño, plataforma o problema), proponlo en una línea y pide confirmación. Si no, haz hasta 3 o 4 preguntas: de qué es el contenido, quién saca más valor, cuál es el problema de esa persona que la marca resuelve y, solo si hace falta, el detalle que lo estrecha.
1. Revisa que quien VE sea quien PAGA. Si no, el centro es quien paga (los anillos de afuera dan alcance y prueba social).
2. Escribe el centro así: [persona específica] que [situación] y batalla con [problema]. Confírmalo antes de seguir.
3. Arma 5 niveles: el centro + 4 anillos, soltando UNA restricción por anillo. Ejemplo de la calidad esperada: ventas B2B de tecnología de $1M+ → ventas B2B high-ticket (suelta la industria) → ventas B2B (suelta el tamaño) → ventas (suelta el modelo) → negocios (suelta la profesión). Cada anillo es un público real y nombrable. Por nivel: tamaño relativo (crece 5-10x por anillo, en escala entendible: «miles», «millones»), cercanía a comprar (máxima al centro) y competencia (suele estar casi vacía al centro). Muéstralos y pregunta si la escalera se siente bien.
4. La mezcla 3/1/1 del primer lote de 5 videos: 3 al centro (conversión), 1 al anillo 1 (alcance con conversión), 1 al anillo 2 (alcance). Nunca más allá del anillo 2. Un tema de ejemplo por video, escrito para ese público${pillars.length ? ' y dentro de los pilares de la marca' : ''}.
5. Por cada nivel, 2 o 3 búsquedas que alguien escribiría en TikTok o Instagram para encontrar creadores ahí. Los de adentro dan TEMAS; los de afuera solo CRAFT (formatos, hooks, historias, edición).

Cuando la persona confirme, tu ÚLTIMO mensaje es SOLO este JSON, sin texto antes ni después (rings: 5, del centro hacia afuera; mix: los 3 primeros al centro, el 4º al anillo 1, el 5º al anillo 2):
{"center":"","buyer":"","rings":[{"label":"","relaxed":"","size":"","conversion":"","competition":"","search":["",""]}],"mix":[{"topic":""},{"topic":""},{"topic":""},{"topic":""},{"topic":""}]}
(buyer: quién paga si no es quien ve; si es el mismo, vacío. relaxed del centro: vacío.)

Contexto de ${name}:
Pilares: ${pillars.join(' · ') || '—'}
Cuentas de la marca: ${own.join(', ') || '—'}
Referentes: ${refs.join(', ') || '—'}
Competencia: ${comp.join(', ') || '—'}
${bx ? `Diana actual (mejórala, no empieces de cero): ${bx.center || bx.rings[0].label} → ${bx.rings.slice(1).map((r) => r.label).join(' → ')}\n` : ''}Lo que publica la marca:
${posts}`;
}
