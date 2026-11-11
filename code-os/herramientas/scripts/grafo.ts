/**
 * Exporta el hilo de uno o todos los clientes para graphify.
 * Uso: npm run grafo -- <carpeta-del-almacén> [cliente] [salida=graphify-out]
 * Escribe <salida>/graph.json (lo que lee `graphify query`) y <salida>/hilo.md.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AlmacenJson } from '../src/almacen.js';
import { aGraphify, aMarkdown } from '../src/grafo.js';

const [dir, cliente, salida = 'graphify-out'] = process.argv.slice(2);
if (!dir) { console.error('Uso: npm run grafo -- <carpeta-del-almacén> [cliente] [salida]'); process.exit(1); }
const alm = new AlmacenJson(dir);
const ids = cliente ? [cliente] : await alm.listarClientes();
const datos = await Promise.all(ids.map(async (c) => ({ cliente: c, d: await alm.leer(c) })));
mkdirSync(salida, { recursive: true });
const g = aGraphify(datos);
writeFileSync(join(salida, 'graph.json'), JSON.stringify(g, null, 1));
writeFileSync(join(salida, 'hilo.md'), datos.map((x) => aMarkdown(x.cliente, x.d)).join('\n'));
console.log(`✓ ${g.nodes.length} nodos y ${g.links.length} enlaces de ${ids.join(', ') || '(ningún cliente)'} → ${salida}/graph.json · ${salida}/hilo.md`);
