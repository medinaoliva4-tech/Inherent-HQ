import { isInside } from './workspace.js';

const PATH_KEYS: Record<string, string[]> = {
  Read: ['file_path'], Write: ['file_path'], Edit: ['file_path'], MultiEdit: ['file_path'],
  NotebookEdit: ['notebook_path'], Glob: ['path'], Grep: ['path'],
};

/** Devuelve un mensaje de rechazo si una herramienta de archivos apunta fuera de la carpeta del proyecto. */
export function pathViolation(tool: string, input: Record<string, unknown>, cwd: string): string | null {
  for (const k of PATH_KEYS[tool] ?? []) {
    const v = input[k];
    if (typeof v === 'string' && v && !isInside(cwd, v)) return `Ruta fuera de la carpeta del proyecto: ${v}`;
  }
  return null;
}
