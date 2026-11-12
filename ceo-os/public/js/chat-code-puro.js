// Lo puro del motor Code (sin DOM ni red): lo prueba scripts/test-code.mjs.
/** El slug de un cliente → id de proyecto válido para el puente (a-z, 0-9, _ y -, máx. 63). */
export const proyectoDe = (slug) => (String(slug || 'general').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^[^a-z0-9]+/, '').slice(0, 63) || 'general');

/**
 * Traduce un evento del puente a lo que la pantalla del Chat ya sabe pintar. Puro (lo prueba scripts/test-code.mjs).
 * `est` acumula el texto del turno. Devuelve una lista de [callback, argumento].
 */
export function traducir(e, est) {
  switch (e.type) {
    // Con planifica/ejecuta, turn_start trae planner y executor: la pantalla pinta la línea sutil «X planifica · Y ejecuta».
    case 'turn_start': return [['nota', e.via === 'claude_login' ? 'Corre con tu sesión de Claude' : `Corre en ${e.model}`], ...(e.planner && e.executor ? [['plan', { planner: String(e.planner), executor: String(e.executor) }]] : [])];
    case 'route_fallback': return [['nota', 'Tu sesión de Claude llegó a su límite: sigo con Cline']];
    case 'text_delta': if (e.parentToolUseId) return []; est.texto += e.text; return [['delta', est.texto]];
    // Los pasos del subagente ejecutor llegan con parentToolUseId: van plegados bajo el plan (padre).
    case 'tool_call': return [['tool', { fase: 'inicio', id: e.toolUseId, nombre: e.name, detalle: detalleDe(e.name, e.input), imagen: '', ...(e.parentToolUseId ? { padre: e.parentToolUseId } : {}) }]];
    case 'tool_result': return [['tool', { fase: e.isError ? 'error' : 'fin', id: e.toolUseId, nombre: '', detalle: String(e.content || '').slice(0, 300), imagen: '', ...(e.parentToolUseId ? { padre: e.parentToolUseId } : {}) }]];
    // Lo que cuesta (imágenes, video) trae su estimado: la tarjeta lo muestra y solo la persona aprueba (aprobado_usd).
    case 'permission_request': return [['permiso', { id: e.requestId, herramienta: e.tool, entrada: e.input, titulo: e.title || '', descripcion: e.description || '', ...(costoEv(e) != null ? { costo: costoEv(e) } : {}) }]];
    case 'mode_changed': return [['nota', e.mode === 'code' ? 'Plan aprobado: ahora puedo hacer cambios' : `Modo ${e.mode}`]];
    case 'error': return [['nota', 'Error: ' + e.message]];
    default: return [];
  }
}
const costoEv = (e) => { const v = [e.costo_usd, e.costoUsd, e.estimado_usd, e.input?.aprobado_usd, e.input?.costo_usd].find((x) => x != null && x !== '' && Number.isFinite(+x)); return v == null ? null : Math.max(0, +v); };
const detalleDe = (nombre, i = {}) => String(i.file_path || i.command || i.pattern || i.path || i.url || i.description || '').slice(0, 200) || nombre;

