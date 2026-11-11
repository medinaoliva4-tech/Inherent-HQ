// Lector mínimo de RSS 2.0 y Atom, sin dependencias.
const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodificar(s = '') {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTIDADES[n.toLowerCase()] ?? m);
}

export function sinHtml(s = '') {
  return decodificar(decodificar(s)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function etiqueta(bloque, nombres) {
  for (const n of nombres) {
    const m = bloque.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)</${n}>`, 'i'));
    if (m) return m[1];
  }
  return '';
}

function enlace(bloque) {
  // Atom: <link href="..." rel="alternate"/> (preferir alternate); RSS: <link>...</link>
  const atoms = [...bloque.matchAll(/<link\b([^>]*?)\/?>/gi)].map((m) => m[1]);
  const alt = atoms.find((a) => /href=/.test(a) && (!/rel=/.test(a) || /rel=["']alternate["']/.test(a)));
  if (alt) return decodificar(alt.match(/href=["']([^"']+)["']/)[1]);
  const rss = etiqueta(bloque, ['link']);
  if (rss.trim()) return decodificar(rss).trim();
  return decodificar(etiqueta(bloque, ['guid', 'id'])).trim();
}

/** Devuelve [{titulo, url, fecha (ISO o null), resumen}] */
export function leerFeed(xml = '') {
  const bloques = [...xml.matchAll(/<(item|entry)\b[\s\S]*?<\/\1>/gi)].map((m) => m[0]);
  return bloques.map((b) => {
    const f = etiqueta(b, ['pubDate', 'published', 'updated', 'dc:date']);
    const d = f ? new Date(decodificar(f).trim()) : null;
    return {
      titulo: sinHtml(etiqueta(b, ['title'])),
      url: enlace(b),
      fecha: d && !Number.isNaN(d.getTime()) ? d.toISOString() : null,
      resumen: sinHtml(etiqueta(b, ['description', 'summary', 'content', 'content:encoded'])).slice(0, 500),
    };
  }).filter((x) => x.titulo && x.url);
}
