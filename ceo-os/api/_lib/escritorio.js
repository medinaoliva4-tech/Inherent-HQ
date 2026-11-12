// La app de escritorio (ceo-os/escritorio) pregunta aquí si hay una versión nueva. El repo es privado: las versiones (GitHub
// Releases, «escritorio-v<versión>-<n>») solo se leen con el GITHUB_TOKEN del OS, y la app pregunta con la sesión de quien
// la usa. La descarga es un link firmado de GitHub que vence en minutos: la app baja el .zip directo de ahí.
import { guard } from './access.js';
import { ghApi } from './gh.js';

const REPO_APP = 'medinaoliva4-tech/Inherent-HQ'; // la app siempre se publica aquí, aunque GITHUB_REPO apunte a otro
const TAG = /^escritorio-v(\d+\.\d+\.\d+)-(\d+)$/;
let CACHE = { at: 0, v: null };

// Qué archivo de la release toca: el .zip (la app se actualiza sola) o el .dmg (el instalador, para bajarlo a mano).
export function archivoDe(assets, arch, formato) {
  const ext = formato === 'dmg' ? 'dmg' : 'zip';
  return (assets || []).find((x) => x.nombre === `Inherent-OS-${arch === 'x64' ? 'x64' : 'arm64'}.${ext}`) || null;
}
// El identificador del despliegue web (Vercel lo pone en cada deploy). null en local: el cliente no avisa de nada.
export const idDespliegue = () => process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || null;

// La última versión publicada desde main (las de las ramas quedan como «prerelease» y no cuentan).
async function ultima() {
  if (CACHE.v && Date.now() - CACHE.at < 5 * 60_000) return CACHE.v;
  const r = await ghApi('releases?per_page=30', undefined, REPO_APP);
  if (!r.ok) { console.error(`escritorio/version: GitHub respondió ${r.status} · permisos: ${r.headers.get('x-accepted-github-permissions') || '—'} · tipo: ${r.headers.get('github-authentication-token-expiration') ? 'con vencimiento' : 'sin vencimiento'}`); throw Object.assign(new Error(`GitHub ${r.status} leyendo las versiones de la app`), { code: 'GH' }); }
  const rel = (await r.json()).find((x) => !x.draft && !x.prerelease && TAG.test(x.tag_name));
  const v = rel ? { version: TAG.exec(rel.tag_name)[1], n: Number(TAG.exec(rel.tag_name)[2]), tag: rel.tag_name, fecha: rel.published_at,
    assets: rel.assets.map((a) => ({ id: a.id, nombre: a.name, tam: a.size })) } : null;
  CACHE = { at: Date.now(), v };
  return v;
}

export function rutas(on) {
  // Pública y ligera (sin sesión, sin GitHub): el OS la pregunta cada ~10 minutos para saber si hay un deploy nuevo.
  on('GET', 'os/version', (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ id: idDespliegue() });
  });
  on('GET', 'escritorio/version', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const v = await ultima();
    if (!v) return res.json({ version: null });
    res.json({ version: v.version, n: v.n, tag: v.tag, fecha: v.fecha, archivos: v.assets.map((a) => a.nombre) });
  });
  // El link de descarga para la Mac de quien pregunta (arm64: chip de Apple · x64: Intel). Por defecto el .zip de la
  // actualización automática; con formato=dmg, el instalador.
  on('GET', 'escritorio/descarga', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    const arch = req.query.arch === 'x64' ? 'x64' : 'arm64';
    const v = await ultima();
    const dmg = req.query.formato === 'dmg';
    const a = archivoDe(v?.assets, arch, dmg ? 'dmg' : 'zip');
    if (!a) return res.status(404).json({ error: dmg ? 'No encontré el instalador de esta versión.' : 'Esta versión no trae actualización automática: bájala desde la página de descargas.' });
    const r = await ghApi(`releases/assets/${a.id}`, { headers: { Accept: 'application/octet-stream' }, redirect: 'manual' }, REPO_APP);
    const url = r.headers.get('location');
    if (!url) return res.status(502).json({ error: `GitHub no dio el link de descarga (${r.status})` });
    res.json({ version: v.version, url, tam: a.tam });
  });
}
