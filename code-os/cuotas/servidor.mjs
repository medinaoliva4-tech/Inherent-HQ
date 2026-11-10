#!/usr/bin/env node
// Servicio de cuotas: lee el registro de eventos que escribe LiteLLM (eventos.jsonl) y expone
//   GET /cuotas   → estado por proveedor/ventana + avisos (lo lee la interfaz)
//   GET /salud    → ok
//   POST /evento  → registrar un evento a mano (opcional)
// Variables: CUOTAS_EVENTOS (ruta jsonl), CUOTAS_LIMITES (limites.json), CUOTAS_PUERTO (4200),
//            CUOTAS_TOKEN (si existe, exige Authorization: Bearer), CUOTAS_WEBHOOK (POST al cruzar 80%).
import { createServer } from 'node:http';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { crearMedidor } from './medidor.mjs';
import { cargarConfig, proveedorDe } from './config.mjs';

export function leerEventos(ruta) {
  if (!existsSync(ruta)) return [];
  return readFileSync(ruta, 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
}

export function medidorDesdeArchivo({ eventos, limites, ahora }) {
  const m = crearMedidor({ config: cargarConfig(limites), ahora });
  for (const e of leerEventos(eventos)) m.registrar({ ...e, proveedor: e.proveedor ?? proveedorDe(e) });
  return m;
}

export function crearServidor({ eventos, limites, token, webhook, avisosRuta, ahora = () => Date.now() }) {
  const vistos = new Set();
  async function notificar(estado) {
    for (const a of estado.avisos) {
      const clave = `${a.proveedor}|${a.ventana}|${a.nivel}|${a.reinicia_en}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      if (avisosRuta) appendFileSync(avisosRuta, JSON.stringify({ ts: new Date(ahora()).toISOString(), ...a }) + '\n');
      if (webhook) fetch(webhook, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(a) }).catch(() => {});
    }
  }
  return createServer(async (req, res) => {
    const json = (c, o) => { res.writeHead(c, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); res.end(JSON.stringify(o)); };
    if (req.url === '/salud') return json(200, { ok: true });
    if (token && req.headers.authorization !== `Bearer ${token}`) return json(401, { error: 'no autorizado' });
    if (req.method === 'GET' && req.url.split('?')[0] === '/cuotas') {
      const estado = medidorDesdeArchivo({ eventos, limites, ahora }).estado();
      await notificar(estado);
      return json(200, estado);
    }
    if (req.method === 'POST' && req.url === '/evento') {
      let b = ''; for await (const c of req) b += c;
      try { appendFileSync(eventos, JSON.stringify({ ts: new Date(ahora()).toISOString(), ...JSON.parse(b) }) + '\n'); return json(200, { ok: true }); }
      catch { return json(400, { error: 'json inválido' }); }
    }
    json(404, { error: 'no existe' });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const e = process.env;
  const srv = crearServidor({
    eventos: e.CUOTAS_EVENTOS ?? './eventos.jsonl', limites: e.CUOTAS_LIMITES ?? './limites.json',
    token: e.CUOTAS_TOKEN, webhook: e.CUOTAS_WEBHOOK, avisosRuta: e.CUOTAS_AVISOS ?? './avisos.jsonl',
  });
  srv.listen(Number(e.CUOTAS_PUERTO ?? 4200), '127.0.0.1', () => console.log(`cuotas en :${e.CUOTAS_PUERTO ?? 4200}`));
}
