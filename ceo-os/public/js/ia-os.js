// La IA del OS desde el navegador: corre un pedido con la IA conectada en Ajustes → IA (el servidor guarda las llaves y
// habla con el proveedor; aquí solo llega el texto, en streaming). → { texto, citas, modelo, via: 'os' }.
// conectores: ids de MCPs de quien lo corre → el servidor deja que la IA use sus herramientas (onPaso avisa cada una).
export async function correrOS({ uso = 'agents', proveedor = '', modelo = '', sistema = '', mensaje, buscar = false, conectores = [], client_slug = '', onDelta = () => {}, onPaso = () => {}, signal } = {}) {
  let r;
  try {
    r = await fetch(conectores.length ? '/api/ia/agente' : '/api/ia/completar', { method: 'POST', credentials: 'same-origin', signal, headers: { 'Content-Type': 'application/json', 'X-CEOOS': '1' }, body: JSON.stringify({ uso, proveedor, modelo, sistema, mensaje, buscar, conectores, client_slug }) });
  } catch (e) { if (e.name === 'AbortError') throw e; throw new Error('Sin conexión. Revisa tu internet.'); }
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw Object.assign(new Error(j.error || 'La IA del OS no respondió'), { code: j.code, status: r.status }); }
  const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '', texto = '', fin = null;
  for (;;) {
    const { value, done } = await rd.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let k; while ((k = buf.indexOf('\n\n')) >= 0) {
      const bloq = buf.slice(0, k); buf = buf.slice(k + 2);
      const crudo = /^data: (.*)$/m.exec(bloq)?.[1]; if (!crudo) continue;
      let d; try { d = JSON.parse(crudo); } catch { continue; }
      if (d.error) throw new Error(d.error);
      if (d.paso) onPaso(d.paso);
      if (d.delta) { texto += d.delta; onDelta(texto); }
      if (d.fin) fin = d;
    }
  }
  if (!fin) throw new Error('La respuesta se cortó. Reintenta.');
  if (fin.aprobaciones?.length) {
    const { revisarAccionesExternas } = await import('./external-actions-ui.js');
    const results = await revisarAccionesExternas(fin.aprobaciones);
    return { texto: results.map((r) => r.texto || r.estado).join('\n'), citas: [], modelo: fin.modelo || '', usadas: [], acciones: results, via: 'os' };
  }
  return { texto: fin.texto || texto, citas: fin.citas || [], modelo: fin.modelo || '', usadas: fin.usadas || [], via: 'os' };
}
