// De la app al repo. Cada «kind» arma UN archivo a partir de lo que hay en la base, nunca de texto
// libre que mande el navegador. Solo estas rutas se pueden escribir; finanzas, nómina, leads y
// contraseñas nunca salen de la base.
import * as db from './db.js';
import { readLive, writeFile } from './gh.js';
import * as content from './content.js';

const cell = (s) => String(s ?? '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim() || '—';
const line = (s) => String(s ?? '').replace(/\r/g, '').trim();
export const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'sin-nombre';
const RM = { todo: 'Pendiente', now: 'En curso', done: 'Logrado' };

const ALLOWED = [
  /^(clients\/[a-z0-9-]+|inherent\/inherent-social-media)\/00-onboarding\/LINKS\.md$/,
  /^(clients\/[a-z0-9-]+|inherent\/inherent-social-media)\/01-estrategia\/roadmap\.md$/,
  /^(clients\/[a-z0-9-]+|inherent\/inherent-social-media)\/99-referencias\/investigacion\/competencia\.md$/,
  /^(clients\/[a-z0-9-]+|inherent\/inherent-social-media)\/04-contenido\/\d{4}-\d{2}\/publicacion\/por-postear\.md$/,
  /^inherent\/biblioteca\/[a-z0-9-]+\/[a-z0-9-]+\.md$/,
];
export const allowed = (p) => ALLOWED.some((re) => re.test(p)) && !p.includes('..') && !p.startsWith('clients/_');

async function rootOf(slug) {
  const p = (await content.profiles()).find((x) => x.slug === slug);
  if (!p) throw Object.assign(new Error('Perfil no encontrado'), { status: 400 });
  if (slug === 'personal') {
    const exists = await readLive(`${p.root}/README.md`).catch(() => null) || await readLive(`${p.root}/CLAUDE.md`).catch(() => null);
    if (!exists) throw Object.assign(new Error('La marca personal todavía no tiene folder en el repo (clients/marca-personal/)'), { status: 400 });
  }
  return p;
}

// Reemplaza (o agrega al final) la sección que la app maneja dentro de un archivo escrito a mano.
function section(md, tag, body) {
  const a = `<!-- ceo-os:${tag} -->`, z = `<!-- /ceo-os:${tag} -->`;
  const block = `${a}\n${body.trim()}\n${z}`;
  const i = md.indexOf(a), j = md.indexOf(z);
  return i >= 0 && j > i ? md.slice(0, i) + block + md.slice(j + z.length) : md.replace(/\s*$/, '') + '\n\n' + block + '\n';
}

// Devuelve { path, content, summary } — lo que se escribiría.
export async function build(kind, ref) {
  if (kind === 'roadmap') {
    const p = await rootOf(ref.slug);
    const a = await db.get('accounts', 'acc-' + ref.slug);
    const rm = [...(a?.roadmap || [])].sort((x, z) => String(x.date || '9').localeCompare(String(z.date || '9')));
    if (!rm.length) throw Object.assign(new Error('El roadmap está vacío'), { status: 400 });
    const name = a?.name || p.name;
    return {
      path: `${p.root}/01-estrategia/roadmap.md`,
      summary: `Roadmap de ${name} · ${rm.length} hitos`,
      content: `# Roadmap — ${name}\n\n> Los hitos grandes del cliente: a dónde vamos y cuándo.\n> Se edita en CEO OS → Clients y entra al repo con el OK del CEO.\n\n| Hito | Fecha | Estado | Nota |\n|---|---|---|---|\n${rm.map((x) => `| ${cell(x.t)} | ${cell(x.date)} | ${RM[x.status] || 'Pendiente'} | ${cell(x.note)} |`).join('\n')}\n`,
    };
  }
  if (kind === 'accesos') {
    const p = await rootOf(ref.slug);
    const a = await db.get('accounts', 'acc-' + ref.slug);
    const list = a?.accesos || [];
    const path = `${p.root}/00-onboarding/LINKS.md`;
    const cur = await readLive(path);
    const body = `## Accesos del equipo\n\n> 🔒 Solo qué cuenta, qué usuario y dónde está la clave. **La clave nunca va aquí.**\n> Se edita en CEO OS → Clients.\n\n| Cuenta | Usuario | Dónde está la clave |\n|---|---|---|\n${list.length ? list.map((x) => `| ${cell(x.servicio)} | ${cell(x.usuario)} | ${cell(x.donde)} |`).join('\n') : '| — | — | — |'}`;
    return { path, summary: `Accesos de ${a?.name || p.name} · ${list.length}`, content: section(cur?.content || `# Links — ${a?.name || p.name}\n\n> 🔒 **Contraseñas nunca.** Acá van los links y quién tiene acceso.\n`, 'accesos', body) };
  }
  if (kind === 'competencia') {
    const p = await rootOf(ref.slug);
    const c = await content.cfg(ref.slug);
    if (!c.accounts.length && !c.hashtags.length) throw Object.assign(new Error('No hay cuentas ni hashtags agregados en la app'), { status: 400 });
    return {
      path: `${p.root}/99-referencias/investigacion/competencia.md`,
      summary: `Competencia de ${p.name} · ${c.accounts.length} cuentas, ${c.hashtags.length} hashtags`,
      content: `# Competencia y referentes — ${p.name}\n\n> Las cuentas y hashtags que CEO OS scrapea cada semana (Content → Fuentes).\n> Las cuentas que ① Strategy deja en \`ingenieria-inversa.md\` también se scrapean.\n\n## Cuentas\n\n| Red | Cuenta | Link |\n|---|---|---|\n${c.accounts.map((x) => `| ${x.red === 'tiktok' ? 'TikTok' : 'Instagram'} | @${x.handle} | ${content.accountUrl(x)} |`).join('\n') || '| — | — | — |'}\n\n## Hashtags del nicho\n\n${c.hashtags.map((h) => `- #${h}`).join('\n') || '—'}\n${c.videos.length ? `\n## Videos que seguimos\n\n${c.videos.map((u) => `- ${u}`).join('\n')}\n` : ''}`,
    };
  }
  if (kind === 'posts') {
    const p = await rootOf(ref.slug);
    if (!/^\d{4}-\d{2}$/.test(String(ref.mes))) throw Object.assign(new Error('Mes inválido'), { status: 400 });
    const posts = (await db.list('content')).filter((x) => x.kind === 'post' && x.profile === ref.slug && String(x.date || '').startsWith(ref.mes)).sort((x, z) => String(x.date).localeCompare(String(z.date)));
    if (!posts.length) throw Object.assign(new Error(`No hay piezas con fecha en ${ref.mes}`), { status: 400 });
    return {
      path: `${p.root}/04-contenido/${ref.mes}/publicacion/por-postear.md`,
      summary: `Por postear de ${p.name} · ${ref.mes} · ${posts.length} piezas`,
      content: `# Por postear — ${p.name} · ${ref.mes}\n\n> Las piezas propias y su estado, desde CEO OS → Content. ⑨ Posting las toma de aquí.\n\n| Fecha | Formato | Pieza | Estado | Video |\n|---|---|---|---|---|\n${posts.map((x) => `| ${cell(x.date)} | ${cell(x.format)} | ${cell(x.title)} | ${cell(x.status || 'Idea')} | ${x.url ? `[abrir](${x.url})` : '—'} |`).join('\n')}\n\n## Captions\n${posts.filter((x) => x.caption).map((x) => `\n### ${line(x.date)} · ${line(x.title)}\n\n${line(x.caption)}\n`).join('') || '\n—\n'}`,
    };
  }
  if (kind === 'doc') {
    const d = await db.get('docs', String(ref.id || ''));
    if (!d) throw Object.assign(new Error('Documento no encontrado'), { status: 400 });
    const f = d.folder_id ? await db.get('folders', d.folder_id) : null;
    const folder = slugify(f?.name || 'general');
    return {
      path: `inherent/biblioteca/${folder}/${slugify(d.title)}.md`,
      summary: `${d.kind || 'Doc'} · ${d.title}`,
      content: `# ${line(d.title)}\n\n> **${d.kind || 'Doc'}**${f ? ` · ${line(f.name)}` : ''}. Se edita en CEO OS → Library.\n${d.url ? `\n🎬 ${d.url}\n` : ''}\n${d.kind === 'Diagrama' ? '```mermaid\n' + line(d.body) + '\n```' : line(d.body)}\n`,
    };
  }
  throw Object.assign(new Error('Tipo desconocido'), { status: 400 });
}

// Escribe en el repo (commit). Si nada cambió, no hace commit.
export async function commit(item) {
  if (!allowed(item.path)) throw Object.assign(new Error('Ruta no permitida'), { status: 400 });
  const cur = await readLive(item.path);
  if (cur && cur.content === item.content) return { unchanged: true };
  const r = await writeFile(item.path, item.content, cur?.sha, `${item.summary} · desde CEO OS, aprobado por el CEO`);
  if (r.conflict) throw Object.assign(new Error('El archivo cambió en el repo mientras tanto. Vuelve a intentarlo.'), { status: 409 });
  return { ok: true };
}
