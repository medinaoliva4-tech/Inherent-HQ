// Un fallo del latido o de una cola no impide revisar las otras.
export async function revisarColas(pasos, onError) {
  for (const [nombre, paso] of pasos) { try { await paso(); } catch (e) { onError(nombre, e); } }
}
// Toda tarea lanzada sin await tiene un dueño para su error y libera su plaza.
export async function enSegundoPlano(tarea, terminar, onError) {
  try { await tarea(); } catch (e) { try { await onError(e); } catch { /* El ciclo siguiente podrá recuperar el trabajo. */ } }
  finally { terminar(); }
}

// Cuánto esperar antes del siguiente ciclo. Sin fallos, lo normal. Con fallos seguidos se duplica hasta 5 minutos. Si la base
// dice que se acabó la cuota (HTTP 402) no tiene sentido insistir cada pocos segundos: se revisa cada 10 minutos.
export const cuotaAgotada = (e) => /exceeded the quota|HTTP status 402|\b402\b.*quota/i.test(`${e?.message} ${e?.cause?.message}`);
export function siguienteEspera({ normal = 3000, fallos = 0, cuota = false } = {}) {
  if (cuota) return 10 * 60 * 1000;
  if (!fallos) return normal;
  return Math.min(normal * 2 ** Math.min(fallos, 7), 5 * 60 * 1000);
}
