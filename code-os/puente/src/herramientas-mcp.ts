import { createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { esRutaHerramientas, manejarHerramientas, type Memoria } from 'code-os-herramientas';

/**
 * Capacidad «herramientas»: servidor MCP dentro del proceso del puente (no corre en la jaula ni recibe llaves).
 * Expone la misma API de nodos y calculadoras que `/clientes…` y `/calc/…`, como la persona dueña de la sesión.
 * Aprobar un nodo queda fuera: lo hace solo la persona (regla F4.5).
 */
export async function llamarHerramientas(mem: Memoria, usuario: string, a: { metodo: string; ruta: string; cuerpo?: unknown }) {
  const metodo = a.metodo.toUpperCase();
  const url = new URL(a.ruta, 'http://x');
  const texto = (body: unknown, isError: boolean) => ({ content: [{ type: 'text' as const, text: JSON.stringify(body) }], isError });
  if (!['GET', 'POST', 'PUT'].includes(metodo)) return texto({ error: 'metodo debe ser GET, POST o PUT' }, true);
  if (!esRutaHerramientas(url.pathname)) return texto({ error: 'Solo rutas /clientes… y /calc/…' }, true);
  if (/\/aprobar$/.test(url.pathname)) return texto({ error: 'Aprobar lo hace solo la persona desde el OS' }, true);
  const r = await manejarHerramientas(mem, { method: metodo, path: url.pathname, query: url.searchParams, body: a.cuerpo, usuario });
  if (!r) return texto({ error: 'Ruta no encontrada' }, true);
  return texto(r.body, r.status >= 400);
}

export function herramientasMcp(mem: Memoria, usuario: string) {
  return createSdkMcpServer({
    name: 'herramientas', version: '0.1.0',
    tools: [tool('herramientas_api',
      'API de memoria viva del cliente (nodos del hilo: producto, icp, dolor, deseo, pilar, ángulo, campaña, pieza…) y calculadoras outbound/inbound. Rutas y cuerpos como en code-os/docs/herramientas-api.md, p. ej. GET /clientes, GET /clientes/akai/nodos?tipo=dolor, POST /clientes/akai/nodos, PUT /clientes/akai/nodos/dolor-2, POST /calc/outbound.',
      { metodo: z.enum(['GET', 'POST', 'PUT']), ruta: z.string().max(300), cuerpo: z.record(z.string(), z.unknown()).optional() },
      async (a) => llamarHerramientas(mem, usuario, a))],
  });
}
