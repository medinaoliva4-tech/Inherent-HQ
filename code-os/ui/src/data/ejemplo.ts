import type { Mensaje } from '@/lib/mensajes'

export type Conversacion = { id: string; titulo: string; hace: string }
export type Proyecto = { id: string; nombre: string; conversaciones: Conversacion[] }

export const proyectos: Proyecto[] = [
  {
    id: 'inherent-os',
    nombre: 'Inherent OS',
    conversaciones: [
      { id: 'c1', titulo: 'Base de la interfaz Code OS', hace: 'ahora' },
      { id: 'c2', titulo: 'Tokens claro y oscuro', hace: '2 h' },
      { id: 'c3', titulo: 'Revisar CSP del OS', hace: 'ayer' },
    ],
  },
  {
    id: 'akai',
    nombre: 'AKAI',
    conversaciones: [
      { id: 'c4', titulo: 'Calendario de octubre', hace: '3 d' },
      { id: 'c5', titulo: 'Stories en secuencia', hace: '4 d' },
    ],
  },
  {
    id: 'web',
    nombre: 'inherentglobal.com',
    conversaciones: [{ id: 'c6', titulo: 'Copy de planes por necesidad', hace: '1 sem' }],
  },
]

export type Modelo = { id: string; nombre: string; nota: string }
export type Nivel = { id: 'alto' | 'medio' | 'bajo'; nombre: string; descripcion: string; modelos: Modelo[] }

/** Datos de ejemplo: el catálogo real vendrá del puente. */
export const niveles: Nivel[] = [
  {
    id: 'alto',
    nombre: 'Alto',
    descripcion: 'Decisiones difíciles y trabajo largo',
    modelos: [
      { id: 'claude-fable-5-2', nombre: 'Fable 5.2', nota: 'el más capaz' },
      { id: 'claude-opus-5-5', nombre: 'Opus 5.5', nota: 'razonamiento profundo' },
    ],
  },
  {
    id: 'medio',
    nombre: 'Medio',
    descripcion: 'El equilibrio de cada día',
    modelos: [{ id: 'claude-sonnet-5-5', nombre: 'Sonnet 5.5', nota: 'rápido y preciso' }],
  },
  {
    id: 'bajo',
    nombre: 'Bajo',
    descripcion: 'Tareas cortas y baratas',
    modelos: [{ id: 'claude-haiku-5-5', nombre: 'Haiku 5.5', nota: 'el más ligero' }],
  },
]

export const modeloPorDefecto = 'claude-sonnet-5-5'

export function buscarModelo(id: string) {
  for (const n of niveles) {
    const m = n.modelos.find((x) => x.id === id)
    if (m) return { nivel: n, modelo: m }
  }
  return { nivel: niveles[1], modelo: niveles[1].modelos[0] }
}

export const historialInicial: Record<string, Mensaje[]> = {
  c2: [
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
      uso: { modelo: 'claude-sonnet-5-5', tokens_entrada: 900, tokens_salida: 120 },
    },
  ],
}

export const archivos = [
  { ruta: 'code-os/ui/src', hijos: ['index.css', 'App.tsx', 'lib/eventos.ts', 'lib/cliente-mock.ts', 'components/os/'] },
  { ruta: 'ceo-os/public', hijos: ['app.css', 'app.js', 'index.html'] },
]

export const diffEjemplo = `@@ src/index.css @@
-  --background: oklch(1 0 0);
-  --foreground: oklch(0.145 0 0);
+  --background: var(--ui-bg);
+  --foreground: var(--ui-ink);
+  --border: var(--ui-line);
+  --ring: color-mix(in srgb, var(--ui-ink) 45%, transparent);`

export const artefactos = [
  { id: 'a1', titulo: 'Mapa de tokens', tipo: 'Tabla', detalle: '--ui-* → shadcn' },
  { id: 'a2', titulo: 'Paleta claro / oscuro', tipo: 'Vista previa', detalle: 'bg, surf, ink, acc' },
  { id: 'a3', titulo: 'Contrato de eventos', tipo: 'Documento', detalle: '8 eventos' },
]

export const terminalEjemplo = [
  '$ npm run build',
  '> tsc -b && vite build',
  '✓ 2194 modules transformed',
  'dist/assets/index.css     38.2 kB',
  '✓ built in 1.4s',
]
