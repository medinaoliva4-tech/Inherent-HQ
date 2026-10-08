import { get, list, put } from "@vercel/blob";
import { IDS } from "./_ids.js"; // lo genera build.py desde data.json

const ESTADOS = ["pendiente", "aprobado", "cambios"];

export async function readJson(pathname) {
  const r = await get(pathname, { access: "private", useCache: false });
  if (!r) return null;
  return await new Response(r.stream).json();
}

export async function latestAll() {
  const out = {};
  const { blobs } = await list({ prefix: "latest/" });
  await Promise.all(blobs.map(async (b) => { const d = await readJson(b.pathname); if (d && IDS.includes(d.video)) out[d.video] = d; }));
  return out;
}

export function clean(body) {
  const video = String(body?.video || "");
  if (!IDS.includes(video)) throw new Error("video");
  return {
    video,
    version: String(body?.version || "").slice(0, 10),
    estado: ESTADOS.includes(body?.estado) ? body.estado : "pendiente",
    calificacion: Math.max(0, Math.min(5, parseInt(body?.calificacion, 10) || 0)),
    comentarios: String(body?.comentarios || "").slice(0, 2000),
    actualizado: new Date().toISOString(),
  };
}

export async function save(rec) {
  const json = JSON.stringify(rec);
  const opts = { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true };
  await put(`latest/${rec.video}.json`, json, opts);
  await put(`historial/${rec.video}/${rec.actualizado.replace(/[:.]/g, "-")}.json`, json, opts);
}

export async function history() {
  const items = [];
  let cursor;
  do { const r = await list({ prefix: "historial/", cursor, limit: 1000 }); items.push(...r.blobs); cursor = r.hasMore ? r.cursor : undefined; } while (cursor);
  const recs = await Promise.all(items.map((b) => readJson(b.pathname)));
  return recs.filter(Boolean).sort((a, b) => (a.actualizado < b.actualizado ? 1 : -1));
}
