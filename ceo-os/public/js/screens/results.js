// Resultados: los números reales de Inherent y de cada cliente. Solo datos que existen en el OS;
// lo que no tiene dato se muestra vacío con de dónde va a salir, nunca un cero inventado.
// Los calcula el servidor (GET /api/results, lo mismo que la herramienta «resultados» del conector de Claude)
// y cada bloque sale solo si el perfil ve su sección de origen.
import { html, mount, api, acts, swap, Q, USD, fdate, ico, $ } from '../core.js';

const PERIODS = [[30, '30 días'], [90, '90 días'], [365, '12 meses']];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const mName = (m) => MONTHS[+String(m).slice(5, 7) - 1] || m;
const hrs = (h) => (h == null ? '—' : h < 1 ? `${Math.round(h * 60)} min` : h < 48 ? `${Math.round(h * 10) / 10} h` : `${Math.round(h / 24)} días`);

export async function render(el, { me, alive }) {
  let dias = 90, r = null, err = null;
  try { dias = [30, 90, 365].includes(+localStorage.getItem('res.dias')) ? +localStorage.getItem('res.dias') : 90; } catch {}
  const redes = {}; // slug → resultado (o 'cargando')
  async function load() { err = null; try { r = await api('results?dias=' + dias); } catch (e) { err = e.message; r = null; } }
  await load(); if (alive && !alive()) return;

  // Un número, o el vacío con de dónde sale (y a dónde ir a llenarlo).
  const kpi = (label, value, hint, empty) => html`<div class="card ctlk"><div class="mut sm">${label}</div>${value == null
    ? html`<div class="big" style="font-size:38px;opacity:.35">—</div><div class="mut sm" style="margin-top:4px">${empty}</div>`
    : html`<div class="big" style="font-size:38px">${value}</div>${hint ? html`<div class="mut sm" style="margin-top:4px">${hint}</div>` : ''}`}</div>`;
  const emptyBox = (title, from, href, btn) => html`<div class="empty"><b>${title}</b>${from}${href ? html`<div><a class="btn" href="${href}">${btn}</a></div>` : ''}</div>`;
  const bar = (n, max) => html`<div class="ctlbar" style="margin:6px 0 0"><i style="width:${n && max ? Math.max(3, Math.round((n / max) * 100)) : 0}%"></i></div>`;
  const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  function comercial(c) {
    const per = PERIODS.find(([d]) => d === dias)[1];
    const maxV = Math.max(0, ...c.pipeline.map((x) => x.leads));
    return html`<div class="sec-title"><h2>Comercial</h2><span class="mut sm">Leads que entraron en los últimos ${per}</span><a href="#/sales/crm">Abrir el CRM →</a></div>
      <div class="ctlkpis res4">
        ${kpi('Leads', c.leads || null, `${pl(c.ganados, 'ganado', 'ganados')} · ${pl(c.perdidos, 'perdido', 'perdidos')}`, 'Salen del CRM, de cada lead que entra')}
        ${kpi('Cierre', c.leads ? `${Math.round((c.ganados / c.leads) * 100)}%` : null, 'De cada 100 leads, los que se ganan', 'Sale de los leads ganados del periodo')}
        ${kpi('Tiempo de respuesta', c.respuesta.mediana_horas == null ? null : hrs(c.respuesta.mediana_horas), `La mitad se responde antes · ${pl(c.respuesta.medidos, 'medido', 'medidos')}${c.respuesta.sin_respuesta ? ` · ${c.respuesta.sin_respuesta} sin responder` : ''}`, 'Del alta de cada lead a su primera nota en el historial')}
        ${kpi('Pipeline abierto', c.pipeline_total_usd ? USD(c.pipeline_total_usd) : null, `Valor mensual${c.pipeline_sin_valor ? ` · ${c.pipeline_sin_valor} leads sin valor` : ''}`, 'Sale del valor mensual que tiene cada lead abierto')}
      </div>
      <div class="grid g2" style="margin-top:14px">
        <div class="card"><div class="chead"><div class="ico">${ico('target', 14)}</div><h3>Por fuente<br><span class="mut sm">Cuántos entran y cuántos se cierran</span></h3></div>
          ${c.por_fuente.length ? html`<div>${c.por_fuente.map((f) => html`<div class="wkrow"><span class="grow"><b style="font-weight:500">${f.fuente}</b><span class="mut sm"> · ${f.leads} ${f.leads === 1 ? 'lead' : 'leads'} · ${f.ganados} ${f.ganados === 1 ? 'ganado' : 'ganados'}</span></span><span class="chip sm2">${f.cierre_pct}%</span></div>`)}</div>`
            : emptyBox('Sin leads en este periodo', 'Cada lead que entra por una fuente (formulario, quiz, mensajes, anuncios) se cuenta aquí.', '#/sales/src', 'Ver las fuentes')}</div>
        <div class="card"><div class="chead"><div class="ico">${ico('list', 14)}</div><h3>Pipeline por etapa<br><span class="mut sm">Lo que está abierto hoy</span></h3></div>
          ${maxV ? c.pipeline.map((x) => html`<div style="padding:8px 2px;border-bottom:1px solid var(--line)"><div class="row sm"><b style="font-weight:500">${x.etapa}</b><span class="mut">· ${x.leads}</span><div class="sp"></div><span>${x.con_valor ? USD(x.valor_usd) : html`<span class="mut">sin valor</span>`}</span></div>${bar(x.leads, maxV)}</div>`)
            : emptyBox('No hay leads abiertos', 'Los leads en Nuevo, Contactado, Reunión o Propuesta aparecen aquí con su valor.', '#/sales/crm', 'Abrir el CRM')}</div>
      </div>
      <div class="card" style="margin-top:14px"><div class="chead"><div class="ico">${ico('x', 14)}</div><h3>Por qué se pierden<br><span class="mut sm">Motivo de cada lead perdido en el periodo</span></h3></div>
        ${c.perdidas.length ? html`<div class="row" style="gap:8px;flex-wrap:wrap">${c.perdidas.map((x) => html`<span class="chip">${x.motivo} · <b style="font-weight:600">${x.n}</b></span>`)}</div>`
          : html`<div class="mut sm">Ningún lead perdido en este periodo. Cuando uno se marca «Perdido», el CRM pide el motivo y aquí se suma.</div>`}</div>`;
  }

  function entregas(e) {
    return html`<div class="sec-title"><h2>Entregas</h2><span class="mut sm">Tareas terminadas en el periodo contra su fecha límite</span><a href="#/operations/tasks">Ver las tareas →</a></div>
      <div class="ctlkpis res3">
        ${kpi('A tiempo', e.a_tiempo_pct == null ? null : `${e.a_tiempo_pct}%`, `${e.a_tiempo} de ${e.medidas} a tiempo · ${e.tarde} tarde`, 'Se mide con cada tarea que se marca «Hecha» y tiene fecha límite')}
        ${kpi('Terminadas sin fecha límite', e.hechas_sin_fecha_limite || null, 'No se pueden medir: ponles fecha', 'Ninguna en el periodo')}
        ${kpi('Abiertas y atrasadas', e.abiertas_atrasadas, 'Hoy, pasadas de su fecha', '')}
      </div>`;
  }

  function finanzas(f) {
    const diff = f.ingresos_q != null && f.ingresos_mes_anterior_q ? Math.round(((f.ingresos_q - f.ingresos_mes_anterior_q) / f.ingresos_mes_anterior_q) * 100) : null;
    return html`<div class="sec-title"><h2>Ingresos</h2><span class="mut sm">Lo que entró este mes, sin costos</span><a href="#/finanzas">Abrir Finanzas →</a></div>
      <div class="ctlkpis res3">
        ${kpi(`Ingresos de ${mName(f.mes)}`, f.ingresos_q == null ? null : Q(f.ingresos_q), `${f.movimientos} ${f.movimientos === 1 ? 'movimiento' : 'movimientos'}${diff != null ? ` · ${diff >= 0 ? '+' : ''}${diff}% contra ${mName(f.mes_anterior)}` : ''}`, f.hoja === 'no se pudo leer' ? 'No pude leer la hoja de movimientos; ábrela en Finanzas' : 'Salen de los ingresos que se registran en Finanzas')}
        ${kpi(`Ingresos de ${mName(f.mes_anterior)}`, f.ingresos_mes_anterior_q == null ? null : Q(f.ingresos_mes_anterior_q), 'El mes pasado', 'Sin ingresos registrados ese mes')}
      </div>`;
  }

  function redesHtml(slug) {
    const x = redes[slug];
    if (!x) return html`<button class="btn ghost xs" data-act="redes" data-s="${slug}">${ico('trend', 14)} Ver sus redes</button>`;
    if (x === 'cargando') return html`<span class="mut sm">Leyendo Instagram…</span>`;
    if (x.error) return html`<span class="mut sm">No se pudo leer: ${x.error}</span>`;
    if (x.seguidores == null && x.alcance == null) return html`<span class="mut sm">Sin datos de redes · ${x.de_donde}</span>`;
    const n = (v) => (v == null ? '—' : Number(v).toLocaleString('es-GT'));
    return html`<div class="row sm" style="gap:14px;flex-wrap:wrap"><span><span class="mut">Seguidores</span> <b style="font-weight:500">${n(x.seguidores)}</b></span><span><span class="mut">Alcance 30 d</span> <b style="font-weight:500">${n(x.alcance)}</b></span><span><span class="mut">Vistas</span> <b style="font-weight:500">${n(x.vistas)}</b></span><span><span class="mut">Engagement</span> <b style="font-weight:500">${x.engagement_pct == null ? '—' : x.engagement_pct + '%'}</b></span></div>`;
  }
  function clientes(list) {
    return html`<div class="sec-title"><h2>Clientes</h2><span class="mut sm">Su meta contra dónde va</span><a href="#/clients">Abrir Clientes →</a></div>
      ${list.length ? html`<div class="grid g2">${list.map((c) => html`<div class="card"><div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-weight:500;font-size:17px">${c.nombre}</b><div class="sp"></div><a class="sm" href="#/clients/${c.slug}" style="color:inherit">Su página ↗</a></div>
          <div style="margin-top:8px">${c.metas.length ? c.metas.map((g) => html`<div class="wkrow" style="align-items:flex-start"><span class="grow" style="white-space:normal"><b style="font-weight:500">${g.meta || g.metrica || 'Meta'}</b>
              <div class="mut sm">${g.metrica ? `${g.metrica} · ` : ''}${g.actual !== '' ? `va en ${g.actual}` : 'sin dato actual'}${g.objetivo !== '' ? ` de ${g.objetivo}` : ''}${g.base !== '' ? ` (arrancó en ${g.base})` : ''}${g.vence ? ` · para el ${fdate(g.vence)}` : ''}</div></span>${g.estado ? html`<span class="chip sm2">${g.estado}</span>` : ''}</div>`)
            : html`<div class="mut sm" style="padding:6px 0">Sin metas todavía. Se definen en su página → Roadmap (qué, cómo se mide, dónde está y a cuánto llega).</div>`}</div>
          <div data-redes="${c.slug}" style="margin-top:10px">${redesHtml(c.slug)}</div></div>`)}</div>`
        : emptyBox('Todavía no hay clientes con página', 'Cada cliente con su plan, sus metas y sus redes aparece aquí.', '#/clients', 'Abrir Clientes')}`;
  }

  function paint() {
    const blocks = r ? [r.comercial && comercial(r.comercial), r.entregas && entregas(r.entregas), r.finanzas && finanzas(r.finanzas), r.clientes && clientes(r.clientes)].filter(Boolean) : [];
    mount(el, html`<div class="hello row" style="align-items:flex-end"><div><h1>Resultados</h1><p>Lo que de verdad pasó, <em>con datos reales</em>.</p></div><div class="sp"></div>
        <div class="tabs" style="margin:0 0 18px">${PERIODS.map(([d, l]) => html`<button class="${d === dias ? 'on' : ''}" data-act="dias" data-d="${d}">${l}</button>`)}</div></div>
      ${err ? html`<div class="warnbox">${err}</div>` : blocks.length ? blocks : emptyBox('Tu perfil no ve ninguna sección con números', 'Resultados junta lo de Comercial, Operaciones, Finanzas y Clientes. El CEO decide qué ve cada perfil en Administración → Vistas por rol.')}`);
  }

  acts(el, {
    dias: async (b) => { dias = +b.dataset.d; try { localStorage.setItem('res.dias', String(dias)); } catch {} await load(); swap(el, paint); },
    redes: async (b) => {
      const slug = b.dataset.s; redes[slug] = 'cargando'; const box = $(`[data-redes="${slug}"]`, el); if (box) mount(box, redesHtml(slug));
      try { redes[slug] = await api('results/redes/' + encodeURIComponent(slug)); } catch (e) { redes[slug] = { error: e.message }; }
      const box2 = $(`[data-redes="${slug}"]`, el); if (box2) mount(box2, redesHtml(slug));
    },
  });
  paint();
}
