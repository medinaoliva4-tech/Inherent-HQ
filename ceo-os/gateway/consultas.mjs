// Consultas ligeras del trabajador: devuelven solo ids. Leer cada corrida completa cada 3 s gasta la cuota de transferencia
// de la base (28,800 lecturas completas al día) aunque no haya nada que hacer.
// Una etapa pendiente es la que espera turno (en_cola) o la que se marcó como trabajando por si quedó colgada.
export const SQL_ETAPAS_PENDIENTES = `SELECT id FROM docs
  WHERE coll = $1
    AND coalesce((data->>'archivado')::boolean, false) = false
    AND coalesce((data->>'pausado')::boolean, false) = false
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(data->'etapas') = 'array' THEN data->'etapas' ELSE '[]'::jsonb END) AS e
      WHERE e->>'estado' IN ('en_cola', 'trabajando'))`;
