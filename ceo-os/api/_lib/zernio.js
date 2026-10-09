// La bandeja de comunidad (comentarios y mensajes directos) desde Zernio. Solo lectura:
// se responde desde Zernio o con el agente ⑧ Community.
const BASE = 'https://zernio.com/api/v1';
export const zernioOn = () => Boolean(process.env.ZERNIO_API_KEY?.trim());
async function z(path) {
  const r = await fetch(BASE + path, { headers: { Authorization: 'Bearer ' + process.env.ZERNIO_API_KEY.trim() } });
  if (!r.ok) throw Object.assign(new Error(`Zernio ${r.status}: ${(await r.text()).slice(0, 160)}`), { status: 502 });
  return r.json();
}
const low = (s) => String(s || '').replace(/^@/, '').toLowerCase();

// handles: las cuentas propias del perfil. Solo se muestra lo de esas cuentas.
export async function inbox(handles) {
  const accRes = await z('/accounts').catch(() => null);
  const accs = (accRes?.accounts || accRes?.data || (Array.isArray(accRes) ? accRes : [])).map((a) => ({ id: a._id || a.id, platform: a.platform, user: low(a.username || a.platformUsername || a.displayName || a.name) }));
  const posts = ((await z('/inbox/comments?limit=50')).data || []);
  const mine = (u) => handles.includes(low(u));
  const ids = new Set([...accs.filter((a) => mine(a.user)).map((a) => a.id), ...posts.filter((p) => mine(p.accountUsername)).map((p) => p.accountId)]);
  const withComments = posts.filter((p) => ids.has(p.accountId) && p.commentCount > 0).slice(0, 6);
  const threads = await Promise.all(withComments.map(async (p) => {
    const c = await z(`/inbox/comments/${encodeURIComponent(p.id)}?accountId=${encodeURIComponent(p.accountId)}&limit=10`).catch(() => ({ comments: [] }));
    return { id: p.id, platform: p.platform, account: p.accountUsername, text: String(p.content || '').slice(0, 140), url: p.permalink, picture: p.picture || null, at: p.createdTime, count: p.commentCount,
      comments: (c.comments || []).filter((x) => !x.from?.isOwner).map((x) => ({ id: x.id, text: String(x.message || '').slice(0, 500), from: x.from?.username || x.from?.name || '', at: x.createdTime, replies: x.replyCount || 0, url: x.url })) };
  })).then((l) => l.filter((t) => t.comments.length));
  const conv = await z('/inbox/conversations?status=active&limit=30').catch(() => ({ data: [] }));
  const dms = (conv.data || []).filter((c) => ids.has(c.accountId)).map((c) => ({ id: c.id, platform: c.platform, who: c.participantName || '', last: String(c.lastMessage || '').slice(0, 300), at: c.updatedTime }));
  return { accounts: [...ids].length, comments: threads, dms };
}
