// App 01 · Marca › Tech: las webs, landings y herramientas de cada marca, la landing conectada al CRM, la web viva y la
// auditoría de SEO. Puro (sin DOM): lo usan el servidor (api/_lib/tech.js), la pantalla (tech-ui.js) y las pruebas.
//   tech  <id>            un sitio: { profile, kind: 'sitio', nombre, tipo, url, estado, actualizado, fuente, intake, notas, archivado }
//         viva--<marca>   la web viva: { profile, kind: 'viva', on, por, en } (solo el CEO la enciende)
//         <id>            una auditoría: { profile, kind: 'auditoria', url, fecha, puntaje, resumen, por }
export const COLL_T = 'tech';
export const idViva = (slug) => `viva--${slug}`;
export const TIPOS_T = ['Web', 'Landing', 'Herramienta'];
export const ESTADOS_T = ['En construcción', 'En vivo', 'Pausada'];

const txt = (v, n) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
const largo = (v, n) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, n);
export const httpsOk = (v) => /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/[^\s"'<>]*)?$/i.test(String(v || '').trim());
const fecha = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '');

export function limpiarSitio(s = {}) {
  return {
    kind: 'sitio',
    nombre: txt(s.nombre, 100),
    tipo: TIPOS_T.includes(s.tipo) ? s.tipo : 'Web',
    url: httpsOk(s.url) ? String(s.url).trim().slice(0, 300) : '',
    estado: ESTADOS_T.includes(s.estado) ? s.estado : 'En construcción',
    actualizado: fecha(s.actualizado),
    fuente: txt(s.fuente, 300),
    notas: largo(s.notas, 1500),
  };
}
export function limpiarAuditoria(a = {}) {
  const p = a.puntaje === '' || a.puntaje == null ? null : Math.round(+a.puntaje);
  return { kind: 'auditoria', url: httpsOk(a.url) ? String(a.url).trim().slice(0, 300) : '', fecha: fecha(a.fecha), puntaje: Number.isFinite(p) && p >= 0 && p <= 100 ? p : null, resumen: largo(a.resumen, 20000) };
}

// El formulario de la landing, listo para pegar: cada envío entra solo al CRM como lead de esa fuente.
// «_hp» es el campo trampa: solo lo llenan los bots y el OS los descarta.
export function formularioLanding(key, origen, marca = '') {
  const accion = `${String(origen || '').replace(/\/+$/, '')}/api/intake/${key}`;
  return `<!-- Formulario de ${marca || 'la marca'} conectado al CRM de Inherent OS. Cada envío entra como lead. -->
<form action="${accion}" method="post">
  <input name="name" placeholder="Tu nombre" required>
  <input name="phone" placeholder="WhatsApp">
  <input name="email" type="email" placeholder="Correo">
  <textarea name="wants" placeholder="¿Qué necesitas?"></textarea>
  <input name="_hp" style="position:absolute;left:-9999px" tabindex="-1" autocomplete="off" aria-hidden="true">
  <button type="submit">Enviar</button>
</form>`;
}

// El pedido de auditoría de SEO y búsqueda con IA (GEO) para Claude Code, con el plugin claude-seo.
export function promptAuditoria(url, marca) {
  return [
    `Audita el SEO y la búsqueda con IA (GEO) de ${url}, la web de ${marca}. Usa el plugin claude-seo (técnico, schema, GEO, local y tienda en línea si aplica).`,
    'Solo lee y mide: no cambies nada de la web.',
    '',
    'Entrégame:',
    '1. Un puntaje general de 0 a 100.',
    '2. Lo que está bien (3 a 5 puntos).',
    '3. Lo que hay que arreglar, de lo que más pesa a lo que menos, cada punto con por qué importa y cómo se arregla.',
    '4. Cómo la entienden Google y los asistentes de IA hoy, en dos líneas.',
    '',
    'Escríbelo en español, en markdown, corto y accionable. La primera línea: «Puntaje: N/100».',
  ].join('\n');
}
export const puntajeDe = (md) => { const m = /puntaje[^0-9]{0,12}(\d{1,3})\s*\/\s*100/i.exec(String(md || '')); const n = m ? +m[1] : null; return n != null && n <= 100 ? n : null; };

// Lo que la web viva puede mostrar de una pieza publicada: título, texto, fecha y formato. El link solo si es de una red
// pública (nunca Drive ni Figma: esos son internos).
const RED_PUBLICA = /^https:\/\/(www\.)?(instagram\.com|tiktok\.com|youtube\.com|youtu\.be|linkedin\.com|facebook\.com|x\.com|threads\.net)\//i;
export function piezaPublica(p) {
  return { titulo: txt(p.title, 200), texto: largo(p.caption, 2200), fecha: fecha(String(p.date || '').slice(0, 10)), formato: txt(p.format, 30), link: RED_PUBLICA.test(String(p.url || '')) ? String(p.url) : '' };
}
