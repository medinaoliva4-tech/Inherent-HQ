import { DESCRIPCIONES } from './descripciones.js';

// Un SOP por servicio, en la carpeta «Servicios» de la Library. Ya traen la estructura y lo que se entrega
// (sale del catálogo); el «cómo lo hacemos» queda marcado con ✏️ para que el equipo lo escriba.
export const CARPETA = { name: 'Servicios', tone: 'gris', desc: 'Un SOP por cada servicio del catálogo: qué entregamos y cómo lo hacemos.' };

const sinPunto = (t) => t.replace(/\.$/, '');

export function cuerpoSop(d) {
  const roles = Object.keys(d.h || {});
  return `# SOP · ${d.name}

> **Para qué sirve:** ${sinPunto(d.b[0])}.
> **Dueño:** COO · **Cuándo se usa:** cuando el cliente contrata este servicio
> **Tiempo y precio:** en Sales → Catálogo de servicios · **Herramientas:** ✏️ por completar

## Qué entregamos
Lo que promete el catálogo. Todo esto tiene que estar hecho al entregar.

**En sencillo (5)**
${d.b.map((x) => `- [ ] ${x}`).join('\n')}

**Se suma en fuerte (10)**
${d.a.map((x) => `- [ ] ${x}`).join('\n')}

## Antes de empezar
- [ ] El servicio está en una cotización aceptada y se definió el nivel (5 a 10)
- [ ] El onboarding del cliente está completo: accesos, logo y quién aprueba de su lado
- [ ] ✏️ Lo que este servicio necesita del cliente para arrancar

## Quién participa
${roles.map((r) => `- **${r}** — ✏️ qué hace en este servicio`).join('\n')}

> Las horas de cada rol se editan en Sales → Catálogo de servicios.

## Cómo lo hacemos
Un paso por cada cosa que entregamos. En cada uno: quién, dónde y cuánto tarda.

${d.b.map((x, i) => `${i + 1}. **${sinPunto(x)}** — quién: ✏️ · dónde: ✏️ · cómo: ✏️`).join('\n')}

**Si el cliente contrató fuerte (10), además:**

${d.a.map((x, i) => `${d.b.length + i + 1}. **${sinPunto(x)}** — quién: ✏️ · dónde: ✏️ · cómo: ✏️`).join('\n')}

## Checklist de calidad
- [ ] Todo lo de «Qué entregamos» para el nivel contratado está hecho
- [ ] Lo revisó el COO antes de entregar
- [ ] El cliente recibió lo entregado y sabe cómo usarlo
- [ ] ✏️ Revisión propia de este servicio

## Errores comunes
- ✏️ **Error:** cómo se evita

## Si algo falla
Precio, alcance y fechas → el CEO · lo demás → el COO.
`;
}

// Crea la carpeta «Servicios» y un SOP por servicio. Lo que ya existe no se toca ni se duplica.
export async function cargarSops(F, D, folders, docs) {
  let f = folders.find((x) => x.name.trim().toLowerCase() === CARPETA.name.toLowerCase());
  const r = { carpeta: !f, creados: 0, existentes: 0 };
  if (!f) f = await F.create(CARPETA);
  const nuevos = [];
  for (const d of DESCRIPCIONES) {
    const title = `SOP · ${d.name}`;
    if (docs.some((x) => x.folder_id === f.id && x.title === title)) { r.existentes++; continue; }
    nuevos.push(await D.create({ title, kind: 'SOP', url: '', folder_id: f.id, roles: [], body: cuerpoSop(d) }));
    r.creados++;
  }
  return { ...r, folder: f, docs: [...docs, ...nuevos] };
}
