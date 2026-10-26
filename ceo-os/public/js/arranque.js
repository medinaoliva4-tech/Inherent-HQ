// El Arranque (#/org/setup, solo el CEO): deja la app lista con lo que ya dice el repo. 5 pasos: 1 Equipo (de la tabla
// de slots de inherent/05-OPERACION.md) · 2 Clientes y ciclo · 3 Tareas del ciclo · 4 Library base · 5 Carpeta de entregas.
// Puro: sin DOM ni red. Lo usan la pantalla (screens/setup.js) y el aviso pla-arranque (avisos-reglas/plataforma.js), para
// que los dos digan lo mismo.
export const SLOT_ROLES = { CEO: ['ceo'], COO: ['coo'], 'Operador de agentes': ['content'], 'Editor de video': ['video'] };
export const SKIP = /^(IA|Scraping|Diseño|Publicaci)/i;
// Los SOPs base de la Library: [carpeta, tipo, título, perfiles, cuerpo]. En la Library se llaman «<tipo> · <título>».
export const SOPS = [
  ['Operaciones', 'SOP', 'Activar el ciclo de contenido', ['coo', 'ceo'], `> **Para qué sirve:** que cada cliente tenga su ciclo del día 1 al 20 sin que nada se atore.
> **Dueño:** COO · **Cuándo se usa:** el día 1 de cada mes · **Herramientas:** Inherent OS, Google Calendar

## Resultado esperado
El proyecto del ciclo creado, con tareas, responsables y fechas, y el cliente con su reunión del día 1.

## Pasos
1. **Día 1** — CEO · reunión con el cliente y estrategia del ciclo
2. **Días 1-3** — plan del ciclo; **2-3** calendario y shot list
3. **Días 3-6** — brand guidelines
4. **Días 6-11** — producción. **El 11 es el último día para producir**
5. **Días 12-15** — montaje: diseño y edición
6. **Días 16-19** — cambios y programación
7. **Día 20** — presentación al cliente. Lo presentado se publica desde el día 1 del mes siguiente

## Checklist de calidad
- [ ] Cada tarea tiene responsable y quién rinde cuentas
- [ ] Las fechas respetan el límite del 11 y del 20
- [ ] Los gates del CEO están marcados: ① Strategy y ⑩ Ads

## Si algo falla
Precio, alcance y fechas → el CEO · lo demás → el COO.`],
  ['Operaciones', 'SOP', 'Revisión de calidad y entrega', ['coo', 'content', 'video'], `> **Para qué sirve:** que nada llegue al cliente sin pasar por QA.
> **Dueño:** COO · **Cuándo se usa:** cada vez que alguien entrega a revisión

## Pasos
1. **Quien hace la pieza** la sube en su Workspace → «Subir trabajo para revisión»
2. **②B Branding** valida que sea de marca
3. **COO** revisa contra el checklist: aprueba o devuelve con comentario
4. Lo aprobado queda listo para programar y para el portal del cliente

## Checklist de calidad
- [ ] Formato y medidas correctas
- [ ] Texto sin errores y con el tono de la marca
- [ ] Audio, subtítulos y logo en su lugar
- [ ] Claims validados

## Errores comunes
- **Devolver sin comentario:** siempre se dice qué cambiar y por qué`],
  ['Video', 'SOP', 'Edición de video con agente', ['video'], `> **Para qué sirve:** editar rápido y de marca con el agente de video.
> **Dueño:** Editor de video · **Herramientas:** agente de video, Drive del cliente

## Pasos
1. Abre el **material del cliente**: calendario, brief y brand assets
2. Confirma formato, objetivo y fecha de entrega en la tarea
3. En tu Workspace → **Agente de video**: elige la plantilla y la pieza → «Preparar prompt»
4. Genera el borrador con el agente y ajusta edición, audio, subtítulos y marca
5. Exporta orgánico y Ads
6. Sube el corte para revisión del COO

## Checklist de calidad
- [ ] Hook en los primeros 2 segundos
- [ ] Subtítulos y safe zones
- [ ] Versiones para orgánico y Ads`],
  ['Contenido', 'SOP', 'Matriz de publicaciones y static ads', ['content'], `> **Para qué sirve:** que cada pieza tenga fecha, canal, formato, idea y CTA.
> **Dueño:** Operador de agentes (Content)

## Pasos
1. En Workspace → Content → **Matriz y publicaciones**: crea cada pieza con su fecha
2. Por cada pieza: formato, idea, caption y CTA
3. Los static ads del ciclo se crean como tareas de ⑥A Diseño gráfico
4. Mueve cada pieza por su estado: Idea → En proceso → Listo → Publicado (lo publicado hace más de 30 días se archiva solo)

## Checklist de calidad
- [ ] Toda pieza tiene CTA
- [ ] La semana cubre los canales del plan contratado`],
  ['Contenido', 'SOP', 'Setup de community', ['content'], `> **Para qué sirve:** que ⑧ Community responda solo lo que sabe y escale lo demás.

## Pasos
1. Tono y voz de la marca
2. FAQ y respuestas frecuentes (la ficha \`05-comunidad/respuestas.md\` del cliente)
3. Reglas de escalamiento: precio, alcance y fechas al CEO; lo demás al COO
4. Plantillas de respuesta

## Checklist de calidad
- [ ] Nunca se dicen costos ni márgenes
- [ ] Nunca se compromete precio, fecha o alcance`],
  ['Business Growth', 'Playbook', 'Activar un proyecto Business Growth', ['finance', 'ceo'], `> **Objetivo:** que el cliente gane más y gaste menos, con números.
> **Para quién:** Finance + Business mapping

## La jugada
Diagnóstico → auditoría con el especialista → plan → implementación → revisión.

## Paso a paso
1. **Diagnóstico** — leer los números y mapear el negocio
2. **Auditoría** — con el especialista de la industria
3. **Plan** — un proyecto para ganar más y otro para gastar menos
4. **Implementación** — tareas con responsable y fecha
5. **Revisión** — qué movió los números

## Cómo sabemos que funcionó
- Facturación, margen y costo, antes y después`],
];

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\(.*\)/, '').trim();
export const tituloSop = ([, kind, title]) => `${kind} · ${title}`;

// Las personas del manual (la tabla de slots), juntando los roles de cada una, con su perfil del equipo si ya existe (cur),
// más las del equipo que no están en el manual. slots = [{ slot, hoy }] · team = el equipo sin clientes · me = { email, name }.
export function filasEquipo(slots, team, me) {
  const meP = team.find((p) => p.id === me.email);
  const fromSlots = new Map();
  for (const s of slots || []) {
    if (SKIP.test(s.slot)) continue;
    const isAgent = /agente/i.test(s.hoy); const name = s.hoy.split(/\s+—\s+/)[0].replace(/\s*\(.*\)/, '').trim();
    const k = s.slot === 'CEO' ? 'ceo' : norm(name);
    const x = fromSlots.get(k) || { name, slots: [], roles: [], ia: isAgent }; x.slots.push(s.slot); (SLOT_ROLES[s.slot] || []).forEach((r) => !x.roles.includes(r) && x.roles.push(r)); fromSlots.set(k, x);
  }
  const rows = [...fromSlots.entries()].map(([k, x]) => {
    const cur = k === 'ceo' ? meP : team.find((p) => norm(p.name) === k || norm(p.name).split(' ')[0] === k);
    return { k, name: k === 'ceo' ? (meP?.name || me.name) : x.name, title: x.slots.join(' · '), roles: cur?.roles?.length ? cur.roles : x.roles, email: cur?.email || (k === 'ceo' ? me.email : ''), cur, ia: x.ia, slots: x.slots };
  });
  for (const p of team) if (!rows.some((r) => r.cur?.id === p.id) && p.id !== me.email) rows.push({ k: p.id, name: p.name, title: p.title || '', roles: p.roles || [], email: p.email || '', cur: p, ia: p.kind === 'ia', slots: [] });
  return rows;
}

// ¿Qué paso ya está? drive = settings «drive» · clients = los del repo con ficha · mes = el AAAA-MM del ciclo.
export function hechosArranque({ drive, team, rows, clients, projects, tasks, docs, mes }) {
  return {
    drive: Boolean(drive?.root),
    team: team.length > 1 && rows.every((r) => r.ia || r.cur),
    ciclo: Boolean(clients.length) && clients.every((c) => projects.some((p) => p.client_slug === c.slug && p.cycle === mes)),
    tareas: tasks.some((t) => t.cycle === mes),
    lib: SOPS.every((s) => docs.some((d) => d.title === tituloSop(s))),
  };
}
