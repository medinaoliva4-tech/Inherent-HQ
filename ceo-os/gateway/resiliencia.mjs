// Un fallo del latido o de una cola no impide revisar las otras.
export async function revisarColas(pasos, onError) {
  for (const [nombre, paso] of pasos) { try { await paso(); } catch (e) { onError(nombre, e); } }
}
// Toda tarea lanzada sin await tiene un dueño para su error y libera su plaza.
export async function enSegundoPlano(tarea, terminar, onError) {
  try { await tarea(); } catch (e) { try { await onError(e); } catch { /* El ciclo siguiente podrá recuperar el trabajo. */ } }
  finally { terminar(); }
}
