import { BrainIcon, GaugeIcon, KeyboardIcon, PlugIcon, ServerIcon, ShieldIcon, SlidersHorizontalIcon, SparklesIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { MessageResponse } from '@/components/ai-elements/message'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useDatos } from '@/hooks/use-datos'
import { nuevoId, type Ajustes as AjustesT, type Memoria } from '@/hooks/use-espacio'
import { teclas } from '@/hooks/use-atajos'
import type { Cliente, EstadoCuotas, EstadoServidor } from '@/lib/cliente'
import { describirModelo } from '@/lib/niveles'
import { cn } from '@/lib/utils'
import { DetalleProveedor } from './MedidorCuotas'
import { ModelSelector } from './ModelSelector'

export type SeccionAjustes = 'general' | 'cuenta' | 'uso' | 'memoria' | 'mcp' | 'skills' | 'permisos' | 'atajos'

const SECCIONES: { id: SeccionAjustes; nombre: string; icono: typeof GaugeIcon }[] = [
  { id: 'general', nombre: 'General', icono: SlidersHorizontalIcon },
  { id: 'cuenta', nombre: 'Servidor', icono: ServerIcon },
  { id: 'uso', nombre: 'Uso y cuotas', icono: GaugeIcon },
  { id: 'memoria', nombre: 'Memoria', icono: BrainIcon },
  { id: 'mcp', nombre: 'Conectores (MCP)', icono: PlugIcon },
  { id: 'skills', nombre: 'Skills', icono: SparklesIcon },
  { id: 'permisos', nombre: 'Permisos', icono: ShieldIcon },
  { id: 'atajos', nombre: 'Atajos', icono: KeyboardIcon },
]

export const ATAJOS: [string, string][] = [
  ['mod+k', 'Paleta de comandos'],
  ['mod+n', 'Nueva conversación'],
  ['mod+j', 'Mostrar u ocultar el panel'],
  ['mod+shift+m', 'Alternar Manual / Plan (Code)'],
  ['mod+shift+i', 'Elegir modelo'],
  ['mod+o', 'Vista normal / detallada'],
  ['mod+,', 'Ajustes'],
  ['mod+/', 'Ver atajos'],
]

function Fila({ titulo, detalle, children }: { titulo: string; detalle?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{titulo}</p>
        {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function FaltaEnPuente({ que }: { que: string }) {
  return (
    <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
      Falta en el puente: <code className="font-mono">{que}</code>
    </p>
  )
}

function Memorias({ memorias, onGuardar }: { memorias: Memoria[]; onGuardar: (m: Memoria[]) => void }) {
  const [nueva, setNueva] = useState('')
  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        Lo que Code OS recuerda de ti. Viaja como instrucciones al crear cada conversación (no en incógnito). Lo propio de un proyecto va en los ajustes del proyecto.
      </p>
      <ul className="grid gap-2">
        {memorias.map((m) => (
          <li key={m.id} className="flex items-start gap-2 rounded-lg border bg-background/50 p-2">
            <textarea
              value={m.texto}
              aria-label="Memoria"
              onChange={(e) => onGuardar(memorias.map((x) => (x.id === m.id ? { ...x, texto: e.target.value } : x)))}
              className="field-sizing-content min-h-8 flex-1 resize-none bg-transparent text-sm outline-none"
            />
            <Button variant="ghost" size="icon-xs" aria-label="Olvidar" onClick={() => onGuardar(memorias.filter((x) => x.id !== m.id))}>
              <Trash2Icon />
            </Button>
          </li>
        ))}
        {!memorias.length && <li className="text-xs text-muted-foreground">Nada guardado.</li>}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!nueva.trim()) return
          onGuardar([...memorias, { id: nuevoId('m'), texto: nueva.trim(), creada: new Date().toISOString() }])
          setNueva('')
        }}
      >
        <input value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Recuerda que…" aria-label="Nueva memoria" className="h-8 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <Button size="sm" type="submit" disabled={!nueva.trim()}>
          Guardar
        </Button>
      </form>
      {memorias.length > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => onGuardar([])}>
            Olvidar todo
          </Button>
        </div>
      )}
    </div>
  )
}

function Mcp({ cliente }: { cliente: Cliente }) {
  const d = useDatos(() => cliente.mcp(), [cliente])
  if (d.falta) return <FaltaEnPuente que={d.falta} />
  return (
    <div className="grid gap-2">
      <p className="text-xs text-muted-foreground">El catálogo vive en el servidor (PUENTE_MCP_CONFIG). Desde aquí solo se eligen por nombre: nunca se mandan comandos.</p>
      {d.datos?.map((s) => (
        <div key={s.nombre} className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
          <PlugIcon className="size-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm">{s.nombre}</p>
            <p className="text-xs text-muted-foreground">{s.descripcion}</p>
          </div>
          <span className={cn('rounded-full px-2 py-0.5 text-[11px]', s.estado === 'activo' ? 'bg-ok/15 text-ok' : s.estado === 'error' ? 'bg-bad/15 text-bad' : 'bg-muted text-muted-foreground')}>
            {s.estado === 'activo' ? 'activo' : s.estado === 'error' ? 'con error' : 'apagado'}
          </span>
        </div>
      ))}
      {cliente.tipo === 'mock' && <p className="text-[11px] text-muted-foreground">Datos de ejemplo.</p>}
    </div>
  )
}

function Skills({ cliente }: { cliente: Cliente }) {
  const d = useDatos(() => cliente.skills(), [cliente])
  const [abierta, setAbierta] = useState<string | null>(null)
  if (d.falta) return <FaltaEnPuente que={d.falta} />
  return (
    <div className="grid gap-2">
      <p className="text-xs text-muted-foreground">Carpetas en .claude/skills/ del servidor. Claude las usa solo o con /nombre.</p>
      {d.datos?.map((s) => (
        <div key={s.nombre} className="rounded-lg border bg-background/50">
          <button type="button" onClick={() => setAbierta(abierta === s.nombre ? null : s.nombre)} aria-expanded={abierta === s.nombre} className="flex w-full items-center gap-3 p-3 text-left">
            <SparklesIcon className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-sm">/{s.nombre}</span>
              <span className="text-xs text-muted-foreground">{s.descripcion}</span>
            </span>
          </button>
          {abierta === s.nombre && (
            <div className="border-t p-3 text-sm">
              <MessageResponse>{s.contenido}</MessageResponse>
            </div>
          )}
        </div>
      ))}
      {cliente.tipo === 'mock' && <p className="text-[11px] text-muted-foreground">Datos de ejemplo.</p>}
    </div>
  )
}

type Props = {
  abierto: boolean
  onAbierto: (v: boolean) => void
  seccion: SeccionAjustes
  onSeccion: (s: SeccionAjustes) => void
  cliente: Cliente
  ajustes: AjustesT
  onAjustes: (c: Partial<AjustesT>) => void
  memorias: Memoria[]
  onMemorias: (m: Memoria[]) => void
  cuotas: EstadoCuotas | null
  errorCuotas: string | null
  servidor: EstadoServidor | null
  disponibles?: string[]
  tema: 'dark' | 'light'
  onTema: (t: 'dark' | 'light') => void
}

export function Ajustes(p: Props) {
  const pedirNotificaciones = async (v: boolean) => {
    if (v && 'Notification' in window && Notification.permission !== 'granted') {
      const r = await Notification.requestPermission()
      if (r !== 'granted') return p.onAjustes({ notificaciones: false })
    }
    p.onAjustes({ notificaciones: v })
  }
  const actual = SECCIONES.find((s) => s.id === p.seccion) ?? SECCIONES[0]
  return (
    <Dialog open={p.abierto} onOpenChange={p.onAbierto}>
      <DialogContent className="vidrio grid h-[min(640px,90dvh)] w-[min(860px,calc(100vw-2rem))] max-w-none grid-rows-[auto_1fr] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-none">
        <DialogHeader className="border-b px-5 py-3">
          <DialogTitle>Ajustes</DialogTitle>
          <DialogDescription className="sr-only">Preferencias de Code OS</DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 md:grid-cols-[200px_1fr]">
          <nav aria-label="Secciones de ajustes" className="flex gap-1 overflow-x-auto border-b p-2 md:flex-col md:border-r md:border-b-0">
            {SECCIONES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-current={p.seccion === s.id ? 'page' : undefined}
                onClick={() => p.onSeccion(s.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors',
                  p.seccion === s.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <s.icono className="size-4" /> {s.nombre}
              </button>
            ))}
          </nav>
          <section aria-label={actual.nombre} className="min-h-0 overflow-y-auto p-5">
            <h2 className="mb-3 text-base font-semibold">{actual.nombre}</h2>
            {p.seccion === 'general' && (
              <div>
                <Fila titulo="Tema" detalle="Claro u oscuro">
                  <div className="flex rounded-md bg-muted p-0.5 text-xs">
                    {(['dark', 'light'] as const).map((t) => (
                      <button key={t} type="button" aria-pressed={p.tema === t} onClick={() => p.onTema(t)} className={cn('rounded px-2.5 py-1', p.tema === t ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
                        {t === 'dark' ? 'Oscuro' : 'Claro'}
                      </button>
                    ))}
                  </div>
                </Fila>
                <Fila titulo="Modelo para conversaciones nuevas" detalle={`${describirModelo(p.ajustes.modeloPorDefecto).nivel.nombre} · ${describirModelo(p.ajustes.modeloPorDefecto).etiqueta}`}>
                  <ModelSelector modeloId={p.ajustes.modeloPorDefecto} onChange={(id) => p.onAjustes({ modeloPorDefecto: id })} disponibles={p.disponibles} claude={p.servidor?.claude} />
                </Fila>
                <Fila titulo="Vista detallada" detalle="Abre herramientas y razonamiento por defecto (⌘O)">
                  <Switch checked={p.ajustes.vista === 'detallada'} onCheckedChange={(v) => p.onAjustes({ vista: v ? 'detallada' : 'normal' })} aria-label="Vista detallada" />
                </Fila>
                <Fila titulo="Avisarme cuando termine" detalle="Notificación del sistema si estás en otra pestaña">
                  <Switch checked={p.ajustes.notificaciones} onCheckedChange={pedirNotificaciones} aria-label="Notificaciones" />
                </Fila>
              </div>
            )}
            {p.seccion === 'cuenta' && (
              <div>
                <Fila titulo="Puente" detalle={p.cliente.tipo === 'mock' ? 'Sin VITE_PUENTE_URL: usando datos de ejemplo' : 'Conectado por HTTP + SSE'}>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs', p.servidor?.puente === 'conectado' ? 'bg-ok/15 text-ok' : p.servidor?.puente === 'mock' ? 'bg-muted' : 'bg-bad/15 text-bad')}>
                    {p.servidor?.puente === 'conectado' ? 'conectado' : p.servidor?.puente === 'mock' ? 'ejemplo' : 'sin conexión'}
                  </span>
                </Fila>
                <Fila titulo="Sesión de Claude" detalle="El login con tu suscripción se hace en el servidor, no aquí.">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs', p.servidor?.claude === 'activa' ? 'bg-ok/15 text-ok' : p.servidor?.claude === 'inactiva' ? 'bg-warn/15 text-warn' : 'bg-muted text-muted-foreground')}>
                    {p.servidor?.claude === 'activa' ? 'activa' : p.servidor?.claude === 'inactiva' ? 'no activa' : 'sin dato'}
                  </span>
                </Fila>
                {p.servidor?.pista && <p className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">{p.servidor.pista}</p>}
                {p.servidor?.claude === 'desconocido' && p.cliente.tipo === 'http' && <FaltaEnPuente que="GET /me → { claude: { active } }" />}
              </div>
            )}
            {p.seccion === 'uso' && (
              <div className="grid gap-5">
                {p.errorCuotas && <p className="text-sm text-bad">{p.errorCuotas}</p>}
                {p.cuotas?.proveedores.map((x) => <DetalleProveedor key={x.id} p={x} />)}
                <p className="text-[11px] text-muted-foreground">
                  La raya marca el 80%: al cruzarla te avisamos. {p.cliente.tipo === 'mock' ? 'Datos de ejemplo.' : `Leído ${p.cuotas ? new Date(p.cuotas.generado).toLocaleTimeString('es') : '—'}.`}
                </p>
              </div>
            )}
            {p.seccion === 'memoria' && <Memorias memorias={p.memorias} onGuardar={p.onMemorias} />}
            {p.seccion === 'mcp' && <Mcp cliente={p.cliente} />}
            {p.seccion === 'skills' && <Skills cliente={p.cliente} />}
            {p.seccion === 'permisos' && (
              <div className="grid gap-3 text-sm">
                <p>Cómo pide permiso Claude en Code:</p>
                <ul className="grid gap-2 text-sm">
                  <li>
                    <b>Manual</b>: pregunta antes de cada acción. Respondes <kbd className="rounded bg-muted px-1">S</kbd> sí, <kbd className="rounded bg-muted px-1">N</kbd> no o{' '}
                    <kbd className="rounded bg-muted px-1">T</kbd> sí a todo en esa sesión.
                  </li>
                  <li>
                    <b>Plan</b>: solo lee y propone. Nada cambia hasta que apruebas el plan.
                  </li>
                  <li>Leer o escribir fuera de la carpeta del proyecto se niega siempre, aunque digas «sí a todo».</li>
                </ul>
                <FaltaEnPuente que="GET/PUT /settings/permissions (reglas permitir/negar editables)" />
              </div>
            )}
            {p.seccion === 'atajos' && (
              <ul className="grid gap-1">
                {ATAJOS.map(([k, d]) => (
                  <li key={k} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                    <span>{d}</span>
                    <kbd className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">{teclas(k)}</kbd>
                  </li>
                ))}
                <li className="flex items-center justify-between py-2 text-sm">
                  <span>Responder un permiso</span>
                  <kbd className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">S · N · T</kbd>
                </li>
              </ul>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
