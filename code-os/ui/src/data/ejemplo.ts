/**
 * DATOS DE EJEMPLO (mock). Nada de esto es real: solo alimenta el cliente `mock` para ver la interfaz
 * sin el puente. El cliente `http` no lee este archivo.
 */
import type { ArchivoDiff, EstadoCuotas, NodoArchivo, ServidorMcp, Skill } from '@/lib/cliente'
import type { Mensaje } from '@/lib/mensajes'

export const archivosEjemplo: Record<string, string> = {
  'src/index.css': `:root {
  --background: var(--ui-bg);
  --foreground: var(--ui-ink);
  --border: var(--ui-line);
  --ring: color-mix(in srgb, var(--ui-ink) 45%, transparent);
}
`,
  'src/App.tsx': `import { Composer } from './components/Composer'

export default function App() {
  return (
    <main className="flex h-dvh flex-col">
      <Composer />
    </main>
  )
}
`,
  'src/lib/eventos.ts': `export type Evento =
  | { tipo: 'texto'; id: string; delta: string }
  | { tipo: 'fin'; motivo: 'completo' | 'detenido' | 'error' }
`,
  'README.md': `# Proyecto de ejemplo

Esto es un **archivo de ejemplo**. Con el puente real verás tu carpeta del VPS.
`,
  'package.json': `{
  "name": "ejemplo",
  "private": true,
  "scripts": { "dev": "vite", "test": "vitest run" }
}
`,
  'CLAUDE.md': `# Instrucciones del proyecto

- Copy en español, de tú.
- Antes de editar, explica el cambio en una línea.
`,
}

function arbol(rutas: string[]): NodoArchivo[] {
  const raiz: NodoArchivo[] = []
  for (const ruta of rutas.sort()) {
    const partes = ruta.split('/')
    let nivel = raiz
    partes.forEach((nombre, i) => {
      const r = partes.slice(0, i + 1).join('/')
      const esArchivo = i === partes.length - 1
      let nodo = nivel.find((n) => n.nombre === nombre)
      if (!nodo) {
        nodo = esArchivo ? { nombre, ruta: r, tipo: 'archivo' } : { nombre, ruta: r, tipo: 'carpeta', hijos: [] }
        nivel.push(nodo)
      }
      nivel = nodo.hijos ?? []
    })
  }
  const ordenar = (ns: NodoArchivo[]): NodoArchivo[] =>
    ns
      .sort((a, b) => (a.tipo === b.tipo ? a.nombre.localeCompare(b.nombre) : a.tipo === 'carpeta' ? -1 : 1))
      .map((n) => (n.hijos ? { ...n, hijos: ordenar(n.hijos) } : n))
  return ordenar(raiz)
}

export const arbolEjemplo = () => arbol(Object.keys(archivosEjemplo))

export const diffsEjemplo: ArchivoDiff[] = [
  {
    ruta: 'src/index.css',
    anterior: `:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}
`,
    nuevo: archivosEjemplo['src/index.css'],
    diff: `--- a/src/index.css
+++ b/src/index.css
@@ -1,4 +1,6 @@
 :root {
-  --background: oklch(1 0 0);
-  --foreground: oklch(0.145 0 0);
+  --background: var(--ui-bg);
+  --foreground: var(--ui-ink);
+  --border: var(--ui-line);
+  --ring: color-mix(in srgb, var(--ui-ink) 45%, transparent);
 }
`,
    mas: 4,
    menos: 2,
  },
  {
    ruta: 'src/lib/eventos.ts',
    anterior: `export type Evento = { tipo: 'texto'; delta: string }
`,
    nuevo: archivosEjemplo['src/lib/eventos.ts'],
    diff: `--- a/src/lib/eventos.ts
+++ b/src/lib/eventos.ts
@@ -1 +1,3 @@
-export type Evento = { tipo: 'texto'; delta: string }
+export type Evento =
+  | { tipo: 'texto'; id: string; delta: string }
+  | { tipo: 'fin'; motivo: 'completo' | 'detenido' | 'error' }
`,
    mas: 3,
    menos: 1,
  },
]

const hace = (min: number) => new Date(Date.now() - min * 60_000).toISOString()
const en = (min: number) => new Date(Date.now() + min * 60_000).toISOString()

const v = (llamadas: number, tope: number | null, reinicia: number | null, nivel?: 'ok' | 'aviso' | 'agotado' | 'sin_tope') => {
  const pct = tope ? +(llamadas / tope).toFixed(4) : null
  return {
    llamadas,
    usd: 0,
    tokens: llamadas * 5200,
    topes: { llamadas: tope, usd: null },
    pct,
    nivel: nivel ?? (pct === null ? 'sin_tope' : pct >= 1 ? 'agotado' : pct >= 0.8 ? 'aviso' : 'ok'),
    rechazos: 0,
    reinicia_en: reinicia === null ? null : en(reinicia),
    desde: hace(300),
  } as const
}

/** Mismo formato que `GET /cuotas` (code-os/cuotas/medidor.mjs). Los números son inventados. */
export const cuotasEjemplo = (): EstadoCuotas => ({
  generado: new Date().toISOString(),
  proveedores: [
    { id: 'claude_login', nombre: 'Claude (login de suscripción)', tipo: 'suscripcion', nivel: 'aviso', ventanas: { '5h': v(25, 30, 74), semana: v(140, 400, 4000) } },
    { id: 'cline', nombre: 'Cline Pass', tipo: 'suscripcion', nivel: 'ok', ventanas: { '5h': v(41, 120, 180), semana: v(310, null, null), mes: v(980, null, null) } },
    { id: 'nvidia', nombre: 'NVIDIA', tipo: 'gratis', nivel: 'sin_tope', ventanas: { dia: v(64, null, 600) } },
    {
      id: 'deepseek',
      nombre: 'DeepSeek (por token)',
      tipo: 'pago',
      nivel: 'sin_tope',
      ventanas: { dia: { ...v(0, null, 600), topes: { llamadas: null, usd: null } }, mes: v(0, null, null) },
    },
  ],
  avisos: [
    { proveedor: 'claude_login', ventana: '5h', nivel: 'aviso', pct: 0.8333, mensaje: 'Claude (login de suscripción) va en 83% de su cupo (5h).', reinicia_en: en(74) },
  ],
})

export const mcpEjemplo: ServidorMcp[] = [
  { nombre: 'github', descripcion: 'Leer issues y PRs del repo', estado: 'activo' },
  { nombre: 'playwright', descripcion: 'Abrir la app y tomar capturas', estado: 'activo' },
  { nombre: 'supabase', descripcion: 'Consultar la base (solo lectura)', estado: 'apagado' },
]

export const skillsEjemplo: Skill[] = [
  {
    nombre: 'revisar-copy',
    descripcion: 'Revisa textos en español: de tú, sin jerga',
    contenido: '# revisar-copy\n\nLee el texto y marca:\n\n- frases de «vos» → «tú»\n- jerga sin explicar\n- párrafos de más de 3 líneas',
  },
  {
    nombre: 'capturas',
    descripcion: 'Toma capturas claro/oscuro, escritorio y móvil',
    contenido: '# capturas\n\n1. Levanta `npm run dev`.\n2. Captura cada pantalla en los dos temas.\n3. Guarda en `docs/capturas/`.',
  },
]

/** Respuestas de la terminal de ejemplo. */
export const terminalEjemplo: Record<string, string> = {
  ls: 'CLAUDE.md  README.md  package.json  src',
  pwd: '/srv/code-os/workspaces/inherent-os',
  'git status': 'En la rama feat/ejemplo\nCambios no preparados:\n  modificado: src/index.css\n  modificado: src/lib/eventos.ts',
  'npm test': '✓ src/lib/mensajes.test.ts (6)\n✓ src/App.test.tsx (3)\n\nTest Files  2 passed (2)\n     Tests  9 passed (9)',
  'npm run build': '> tsc -b && vite build\n✓ 2194 modules transformed\n✓ built in 1.4s',
}

export const historialEjemplo: Record<string, Mensaje[]> = {
  s2: [
    { id: 'h1', rol: 'usuario', partes: [{ tipo: 'texto', id: 'u1', texto: '¿Qué tokens tiene el OS para el modo claro?' }] },
    {
      id: 'h2',
      rol: 'asistente',
      partes: [
        {
          tipo: 'texto',
          id: 'a1',
          texto:
            'El modo claro vive en `:root[data-theme="light"]`: fondo `#fafafa`, superficie blanca y tinta `#18181b`. El acento es la propia tinta, sin color de marca.',
        },
      ],
      uso: { modelo: 'nivel-medio', tokens_entrada: 900, tokens_salida: 120 },
    },
  ],
}
