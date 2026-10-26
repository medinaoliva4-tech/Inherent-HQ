// Avisos · Clientes (la ficha, el ciclo, la estrategia y Consulting de cada cliente). Ver index.js.
// datos.clientes = [{ slug, nombre, ficha: { hay, nivel, plan, incluye, pipeline, redes }, presentes: [{ id, mes }] }],
// solo los del alcance de la persona. Si un cliente no tiene ficha, solo sale cli-sin-ficha de ese cliente (base.js · correr).
import { aviso } from './base.js';

// cli-sin-ficha · CLAUDE.md § El techo comercial: «Sin ficha, el agente BLOQUEA a ese cliente». No se pospone.
// El botón (crear la ficha) solo para el CEO: solo él escribe en el repo.
const SIN_FICHA = { id: 'cli-sin-ficha', grupo: 'clientes', area: 'todas', urgencia: 'alta', fijo: true };
SIN_FICHA.calcular = (d, p) => (d.clientes || []).filter((c) => !c.ficha?.hay).map((c) => aviso(SIN_FICHA, {
  clave: `cli-sin-ficha:${c.slug}`, cliente: c.slug, titulo: `A ${c.nombre} le falta su ficha de oferta: todos los agentes lo bloquean`,
  detalle: p.esCeo ? 'El alcance contratado es el techo: sin ficha, nadie sabe qué entregar.' : 'La crea el CEO.', huella: 'sin-ficha',
  accion: p.esCeo ? { label: 'Crear la ficha', href: `#/estrategia/${encodeURIComponent(c.slug)}` } : null,
}));

export const CLIENTES_ESTRATEGIA = [SIN_FICHA];
