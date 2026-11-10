// Proveedores, ventanas y topes. Los topes en `null` = sin tope conocido (solo se mide y se muestra).
// Se pueden fijar sin tocar código en limites.json (mismo formato, se fusiona encima).
import { readFileSync, existsSync } from 'node:fs';

export const PROVEEDORES = {
  cline: {
    nombre: 'Cline Pass', tipo: 'suscripcion',
    // Sin números públicos: medimos llamadas y avisamos si el proveedor responde 402/429.
    ventanas: { '5h': { tipo: 'rodante', horas: 5, llamadas: null }, semana: { tipo: 'rodante', horas: 168, llamadas: null }, mes: { tipo: 'rodante', horas: 720, llamadas: null } },
  },
  modelscope: {
    nombre: 'ModelScope', tipo: 'gratis',
    ventanas: { dia: { tipo: 'dia_utc8', llamadas: 2000 } }, // 2,000 llamadas/día en total, reinicia 00:00 UTC+8
  },
  nvidia: {
    nombre: 'NVIDIA', tipo: 'gratis',
    ventanas: { dia: { tipo: 'dia_utc', llamadas: null } },
  },
  deepseek: {
    nombre: 'DeepSeek (por token)', tipo: 'pago',
    ventanas: { dia: { tipo: 'dia_utc', usd: null }, mes: { tipo: 'mes_utc', usd: null } },
  },
  frontier: {
    nombre: 'Frontier (por llave)', tipo: 'pago',
    ventanas: { dia: { tipo: 'dia_utc', usd: null }, mes: { tipo: 'mes_utc', usd: null } },
  },
  featherless: {
    nombre: 'Featherless (se cancela)', tipo: 'suscripcion',
    ventanas: { dia: { tipo: 'dia_utc', llamadas: null } },
  },
};

/** Deduce el proveedor desde un evento de LiteLLM (api_base / modelo). */
export function proveedorDe({ api_base = '', modelo = '' } = {}) {
  const s = `${api_base} ${modelo}`.toLowerCase();
  if (s.includes('cline.bot')) return 'cline';
  if (s.includes('modelscope')) return 'modelscope';
  if (s.includes('nvidia.com')) return 'nvidia';
  if (s.includes('featherless')) return 'featherless';
  if (s.includes('frontier')) return 'frontier';
  if (s.includes('deepseek')) return 'deepseek';
  return 'otro';
}

export function cargarConfig(ruta) {
  const base = structuredClone(PROVEEDORES);
  if (ruta && existsSync(ruta)) {
    const extra = JSON.parse(readFileSync(ruta, 'utf8'));
    for (const [p, def] of Object.entries(extra)) {
      base[p] ??= { nombre: p, tipo: 'otro', ventanas: {} };
      for (const [v, d] of Object.entries(def.ventanas ?? {})) base[p].ventanas[v] = { ...base[p].ventanas[v], ...d };
      for (const k of ['nombre', 'tipo']) if (def[k]) base[p][k] = def[k];
    }
  }
  return base;
}
