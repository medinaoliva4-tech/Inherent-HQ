// Los correos que Inherent le manda a sus clientes: bienvenida al pagar e invitación a alguien de su equipo.
// Salen del Gmail de quien confirma (así el cliente responde a una persona, no a un robot).
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const first = (n) => String(n || '').trim().split(/\s+/)[0] || '';

const shell = (base, inner) => `<div style="background:#ebe6dc;padding:28px 12px;font-family:Helvetica,Arial,sans-serif;color:#171410">
<div style="max-width:560px;margin:0 auto;background:#fffdf8;border-radius:22px;padding:30px">
<img src="${base}/brand/icon-192.png" alt="Inherent" width="44" height="44" style="border-radius:12px;display:block">
${inner}
<p style="font-size:12px;color:#8f877b;margin-top:26px">Inherent · We build cool brands—and the growth systems behind them.</p></div></div>`;
const btn = (href, label) => `<p style="margin:22px 0"><a href="${href}" style="background:#171410;color:#f1ede1;text-decoration:none;padding:13px 22px;border-radius:99px;font-size:15px;display:inline-block">${label}</a></p>`;
const list = (items) => `<ul style="padding-left:18px;margin:8px 0;line-height:1.6">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;

export function welcome({ base, to, name, client, project, kickoff, items, sender }) {
  const link = `${base}/api/auth/google?portal=1`;
  const subject = `¡Bienvenido a Inherent, ${client}! Ya arrancamos`;
  const text = [`Hola ${first(name)},`, '', `¡Muchas gracias por confiar en Inherent! Recibimos tu pago y ${project} ya arrancó.`, kickoff ? `Nuestra primera reunión es el ${kickoff}.` : '',
    '', 'Tu portal: ahí ves cómo va todo y haces tu onboarding.', `Entra aquí con tu cuenta de Google (${to}): ${link}`,
    '', 'Para arrancar necesitamos:', ...items.map((x) => `- ${x}`),
    '', 'Si alguien de tu equipo ve estos temas, agrégalo desde el portal («Invitar a alguien de mi equipo») o respóndenos este correo con su correo.', '', `${sender}`].filter((x) => x !== null).join('\n');
  const html = shell(base, `<h1 style="font-size:24px;font-weight:500;letter-spacing:-.5px;margin:18px 0 8px">¡Gracias, ${esc(first(name) || client)}! Ya arrancamos.</h1>
<p style="font-size:15px;line-height:1.55">Recibimos tu pago y <b>${esc(project)}</b> ya está en marcha.${kickoff ? ` Nuestra primera reunión es el <b>${esc(kickoff)}</b>.` : ''}</p>
<p style="font-size:15px;line-height:1.55">En tu portal ves cómo va todo y haces tu onboarding. Entra con tu cuenta de Google (<b>${esc(to)}</b>):</p>
${btn(link, 'Entrar a mi portal')}
<p style="font-size:15px;margin-bottom:0"><b>Para arrancar necesitamos:</b></p>${list(items)}
<p style="font-size:14px;line-height:1.55;color:#3b342c">¿Alguien de tu equipo ve estos temas? Agrégalo desde el portal (<i>Invitar a alguien de mi equipo</i>) o respóndenos con su correo.</p>
<p style="font-size:15px">${esc(sender)}</p>`);
  return { to, subject, text, html };
}

export function invite({ base, to, name, by, client, items }) {
  const link = `${base}/api/auth/google?portal=1`;
  const subject = `${by} te invitó al portal de ${client} en Inherent`;
  const text = [`Hola ${first(name)},`, '', `${by} te dio acceso al portal de ${client} con Inherent, para que nos ayudes con el onboarding.`, `Entra con tu cuenta de Google (${to}): ${link}`, '', 'Lo que necesitamos:', ...items.map((x) => `- ${x}`)].join('\n');
  const html = shell(base, `<h1 style="font-size:22px;font-weight:500;margin:18px 0 8px">${esc(by)} te invitó al portal de ${esc(client)}</h1>
<p style="font-size:15px;line-height:1.55">Es para que nos ayudes con el onboarding del proyecto con Inherent. Entra con tu cuenta de Google (<b>${esc(to)}</b>):</p>
${btn(link, 'Entrar al portal')}<p style="font-size:15px;margin-bottom:0"><b>Lo que necesitamos:</b></p>${list(items)}`);
  return { to, subject, text, html };
}

// Si no se pudo mandar (falta el permiso de Gmail), un link a Gmail con el correo ya escrito.
export const composeUrl = (m) => `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.to)}&su=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.text)}`;
