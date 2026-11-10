import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Skill = { nombre: string; descripcion: string; contenido: string };

/** Skills del servidor: `<dir>/<nombre>/SKILL.md` con `description:` en el frontmatter. Solo lectura. */
export function listSkills(dir: string): Skill[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'SKILL.md'))).map((d) => {
    const contenido = readFileSync(join(dir, d.name, 'SKILL.md'), 'utf8').slice(0, 50_000);
    const descripcion = /^description:\s*(.+)$/m.exec(contenido)?.[1]?.trim() ?? '';
    return { nombre: d.name, descripcion, contenido };
  });
}
