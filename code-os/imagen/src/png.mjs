// PNG mínimo sin dependencias: decodifica a RGBA 8 bits y codifica RGBA. Solo lo necesario para validar.
import { inflateSync, deflateSync, crc32 } from 'node:zlib';

const FIRMA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
export const esPng = (b) => Buffer.isBuffer(b) && b.length > 8 && b.subarray(0, 8).equals(FIRMA);

/** Lee el encabezado sin decodificar píxeles. */
export function cabeceraPng(buf) {
  if (!esPng(buf)) throw new Error('no es un PNG');
  let o = 8; let ihdr = null; let trns = false;
  while (o + 8 <= buf.length) {
    const len = buf.readUInt32BE(o); const tipo = buf.toString('latin1', o + 4, o + 8);
    if (tipo === 'IHDR') ihdr = { ancho: buf.readUInt32BE(o + 8), alto: buf.readUInt32BE(o + 12), bits: buf[o + 16], tipoColor: buf[o + 17], entrelazado: buf[o + 20] };
    if (tipo === 'tRNS') trns = true;
    if (tipo === 'IDAT') break;
    o += 12 + len;
  }
  if (!ihdr) throw new Error('PNG sin IHDR');
  // Tiene canal alfa si es gris+alfa (4), RGBA (6) o si trae tRNS (transparencia por paleta/color).
  return { ...ihdr, canalAlfa: ihdr.tipoColor === 4 || ihdr.tipoColor === 6 || trns };
}

export function decodificarPng(buf) {
  const h = cabeceraPng(buf);
  if (h.entrelazado) throw new Error('PNG entrelazado no soportado');
  if (![8, 16].includes(h.bits)) throw new Error(`profundidad ${h.bits} no soportada`);
  let o = 8; const idat = []; let paleta = null; let trns = null;
  while (o + 8 <= buf.length) {
    const len = buf.readUInt32BE(o); const tipo = buf.toString('latin1', o + 4, o + 8); const d = buf.subarray(o + 8, o + 8 + len);
    if (tipo === 'IDAT') idat.push(d); else if (tipo === 'PLTE') paleta = d; else if (tipo === 'tRNS') trns = d; else if (tipo === 'IEND') break;
    o += 12 + len;
  }
  const canales = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[h.tipoColor];
  if (!canales) throw new Error(`tipo de color ${h.tipoColor} no soportado`);
  if (h.tipoColor === 3 && h.bits !== 8) throw new Error('paleta de 8 bits solamente');
  const bpp = canales * (h.bits / 8); const fila = h.ancho * bpp;
  const raw = inflateSync(Buffer.concat(idat));
  if (raw.length < (fila + 1) * h.alto) throw new Error('datos PNG incompletos');
  const px = Buffer.alloc(fila * h.alto);
  for (let y = 0; y < h.alto; y++) {
    const f = raw[y * (fila + 1)]; const s = y * (fila + 1) + 1; const d = y * fila;
    for (let x = 0; x < fila; x++) {
      const a = x >= bpp ? px[d + x - bpp] : 0; const b = y ? px[d - fila + x] : 0; const c = x >= bpp && y ? px[d - fila + x - bpp] : 0;
      let v = raw[s + x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c; const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      else if (f !== 0) throw new Error(`filtro ${f} inválido`);
      px[d + x] = v & 255;
    }
  }
  const rgba = Buffer.alloc(h.ancho * h.alto * 4); const paso = h.bits / 8;
  for (let i = 0; i < h.ancho * h.alto; i++) {
    const p = i * bpp; const q = i * 4;
    const g = (k) => px[p + k * paso];
    if (h.tipoColor === 6) { rgba[q] = g(0); rgba[q + 1] = g(1); rgba[q + 2] = g(2); rgba[q + 3] = g(3); }
    else if (h.tipoColor === 2) { rgba[q] = g(0); rgba[q + 1] = g(1); rgba[q + 2] = g(2); rgba[q + 3] = 255; }
    else if (h.tipoColor === 0) { rgba[q] = rgba[q + 1] = rgba[q + 2] = g(0); rgba[q + 3] = 255; }
    else if (h.tipoColor === 4) { rgba[q] = rgba[q + 1] = rgba[q + 2] = g(0); rgba[q + 3] = g(1); }
    else { const k = px[p]; rgba[q] = paleta[k * 3]; rgba[q + 1] = paleta[k * 3 + 1]; rgba[q + 2] = paleta[k * 3 + 2]; rgba[q + 3] = trns && k < trns.length ? trns[k] : 255; }
  }
  return { ancho: h.ancho, alto: h.alto, rgba, canalAlfa: h.canalAlfa };
}

const chunk = (tipo, datos) => {
  const t = Buffer.from(tipo, 'latin1'); const l = Buffer.alloc(4); l.writeUInt32BE(datos.length);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(Buffer.concat([t, datos])) >>> 0);
  return Buffer.concat([l, t, datos, c]);
};

/** Codifica RGBA (o RGB si conAlfa=false). */
export function codificarPng({ ancho, alto, rgba }, { conAlfa = true } = {}) {
  const canales = conAlfa ? 4 : 3; const fila = ancho * canales; const raw = Buffer.alloc((fila + 1) * alto);
  for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) for (let k = 0; k < canales; k++) raw[y * (fila + 1) + 1 + x * canales + k] = rgba[(y * ancho + x) * 4 + k];
  const ih = Buffer.alloc(13); ih.writeUInt32BE(ancho, 0); ih.writeUInt32BE(alto, 4); ih[8] = 8; ih[9] = conAlfa ? 6 : 2;
  return Buffer.concat([FIRMA, chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
