// Avisos · La plataforma: lo que falta conectar o terminar (ver index.js). Lo de tu compu (Hermes, el puente, la app de
// Mac) no está aquí: lo revisa el navegador (avisos-compu.js).
import { aviso } from './base.js';
import { PASOS_PRIMER_DIA } from '../primer-dia-pasos.js';

// pla-primer-dia · ceo-os/PROPOSITOS.md §4 «El primer día». Cada quien el suyo, hasta que lo termine.
const PRIMER_DIA = { id: 'pla-primer-dia', grupo: 'plataforma', area: 'todas', urgencia: 'media' };
PRIMER_DIA.calcular = (d, p) => {
  if (p.role === 'client' || d.yo?.primer_dia?.hecho_at) return [];
  const h = d.yo?.primer_dia?.hechos || {}, n = PASOS_PRIMER_DIA.filter(([k]) => h[k]).length;
  return [aviso(PRIMER_DIA, { clave: 'pla-primer-dia', titulo: `Tu primer día va en ${n} de ${PASOS_PRIMER_DIA.length}: termina de dejar todo listo`, huella: String(n), accion: { label: 'Seguir tu primer día', abre: 'primer-dia' } })];
};

export const PLATAFORMA = [PRIMER_DIA];
