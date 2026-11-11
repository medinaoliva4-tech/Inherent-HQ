import { GhostIcon, MenuIcon, PanelRightIcon } from 'lucide-react'
import { AnimatePresence, MotionConfig, motion, useDragControls } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { Suggestion } from '@/components/ai-elements/suggestion'
import { Ajustes, type SeccionAjustes } from '@/components/os/Ajustes'
import { Composer } from '@/components/os/Composer'
import { MensajeVista } from '@/components/os/Mensajes'
import { NodoDetalle } from '@/components/os/hilo/NodoDetalle'
import { PanelLateral, type DestinoPanel, type PestanaPanel, type SeccionPanel, type VistaHerramienta } from '@/components/os/PanelLateral'
import { Paleta } from '@/components/os/Paleta'
import { ProyectoDialogo } from '@/components/os/ProyectoDialogo'
import { SelectorCliente } from '@/components/os/Selectores'
import { Embebido } from '@/components/os/Embebido'
import { Switch } from '@/components/ui/switch'
import { Sidebar } from '@/components/os/Sidebar'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { historialEjemplo } from '@/data/ejemplo'
import { useAtajos } from '@/hooks/use-atajos'
import { useChat } from '@/hooks/use-chat'
import { useCuotas } from '@/hooks/use-cuotas'
import { useDatos } from '@/hooks/use-datos'
import { HiloProvider } from '@/hooks/use-hilo'
import { useEspacio, type Conversacion, type Pestana } from '@/hooks/use-espacio'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useTheme } from '@/hooks/use-theme'
import { prepararEnvio } from '@/lib/adjuntos'
import { AUTO, MODELOS_CLAUDE, modeloDeRuta, rutear } from '@/lib/cocina'
import { leerEmbebido } from '@/lib/embebido'
import { AGENTES, agenteMencionado, agentesParaPuente, instruccionAgente, type Agente } from '@/lib/agentes'
import { extraerArtefactos, type Artefacto } from '@/lib/artefactos'
import type { Cliente, EstadoServidor, NodoArchivo } from '@/lib/cliente'
import type { Comando } from '@/lib/comandos'
import { crearCliente } from '@/lib/crear-cliente'
import type { ModoSesion } from '@/lib/eventos'
import { pendienteDe, textoDe, usoTotal, type Mensaje } from '@/lib/mensajes'
import { resorte } from '@/lib/movimiento'
import { PERSONAS, ROLES, type Persona } from '@/lib/roles'
import { cn } from '@/lib/utils'

type Props = {
  cliente?: Cliente
  /** Dentro del Chat del OS (`?embed=1`). Por defecto se lee de la URL. */
  embebido?: boolean
}

const CLAVE_MENSAJES = 'code-os:mensajes:v2'

function leerMensajes(mock: boolean): Record<string, Mensaje[]> {
  try {
    const g = localStorage.getItem(`${CLAVE_MENSAJES}:${mock ? 'mock' : 'http'}`)
    if (g) return JSON.parse(g)
  } catch {
    /* sin almacenamiento */
  }
  return mock ? historialEjemplo : {}
}

/** Al guardar se quitan las imágenes pesadas (data URL) para no llenar el almacenamiento del navegador. */
function aligerar(lista: Mensaje[]): Mensaje[] {
  return lista.map((m) =>
    m.adjuntos?.some((a) => (a.url?.length ?? 0) > 150_000) ? { ...m, adjuntos: m.adjuntos.map((a) => ((a.url?.length ?? 0) > 150_000 ? { ...a, url: undefined } : a)) } : m,
  )
}

function leerLocal(clave: string, porDefecto: string) {
  try {
    return localStorage.getItem(clave) ?? porDefecto
  } catch {
    return porDefecto
  }
}
function guardarLocal(clave: string, valor: string) {
  try {
    localStorage.setItem(clave, valor)
  } catch {
    /* sin almacenamiento */
  }
}

/** Nivel con el que se construyó lo último (para que la revisión la haga otro). */
function ultimoNivel(ms: Mensaje[]): string {
  for (let i = ms.length - 1; i >= 0; i--) {
    const m = ms[i]
    if (m.rol !== 'asistente') continue
    if (m.ruta) return m.ruta.nivel
    if (m.uso?.modelo?.startsWith('nivel-')) return m.uso.modelo
  }
  return ''
}

const rutasDe = (ns: NodoArchivo[]): string[] => ns.flatMap((n) => (n.tipo === 'archivo' ? [n.ruta] : rutasDe(n.hijos ?? [])))

const SUGERENCIAS: Record<Pestana, string[]> = {
  chat: ['@estrategia arma los dolores de este cliente', 'Hazme una página con la paleta del OS', 'Resume esto en tres puntos'],
  code: ['Mapea los tokens del OS a shadcn', 'Pregúntame qué tema revisar primero', 'Revisa los cambios de la sesión'],
}

/** `?embed=1` → solo los paneles, dentro del Chat del OS (docs/embebido.md). Si no, la app completa. */
export default function App({ cliente, embebido }: Props) {
  const emb = useMemo(() => (embebido === undefined ? leerEmbebido() : { activo: embebido, pase: undefined }), [embebido])
  return emb.activo ? <Embebido cliente={cliente} pase={emb.pase} /> : <AppCompleta cliente={cliente} />
}

function AppCompleta({ cliente: clienteProp }: { cliente?: Cliente }) {
  const cliente = useMemo(() => clienteProp ?? crearCliente(), [clienteProp])
  const mock = cliente.tipo === 'mock'
  const { tema, setTema, alternar } = useTheme()
  const escritorio = useMediaQuery('(min-width: 900px)')
  const { espacio, crearConversacion, editarConversacion, borrarConversacion, crearProyecto, editarProyecto, borrarProyecto, guardarMemorias, cambiarAjustes } = useEspacio(mock)
  const inicial = useMemo(() => leerMensajes(mock), [mock])
  const { porConv, enCurso, enviar, detener, responderPermiso, responderPregunta, responderPlan, olvidar } = useChat(cliente, inicial)

  const [pestana, setPestana] = useState<Pestana>('code')
  const [activaPor, setActivaPor] = useState<Record<Pestana, string | null>>(mock ? { chat: 's2', code: 's1' } : { chat: null, code: null })
  const [panel, setPanel] = useState(escritorio)
  const [pestanaPanel, setPestanaPanel] = useState<PestanaPanel>('tareas')
  const [seccion, setSeccion] = useState<SeccionPanel>('codigo')
  const [herramienta, setHerramienta] = useState<VistaHerramienta>('icp')
  const [agentePanel, setAgentePanel] = useState('estrategia')
  // Cliente activo y persona de demostración (el workspace se arma según su rol).
  const [clienteId, setClienteIdEstado] = useState(() => leerLocal('code-os:cliente', mock ? 'lumbre' : ''))
  const setClienteId = useCallback((id: string) => {
    setClienteIdEstado(id)
    guardarLocal('code-os:cliente', id)
  }, [])
  const [persona, setPersonaEstado] = useState<Persona>(() => PERSONAS.find((p) => p.id === leerLocal('code-os:persona', 'demo-ceo')) ?? PERSONAS[0])
  const rol = ROLES[persona.rol]
  const setPersona = useCallback((p: Persona) => {
    setPersonaEstado(p)
    guardarLocal('code-os:persona', p.id)
    // El workspace cambia: la primera herramienta del rol queda a mano.
    setHerramienta(ROLES[p.rol].herramientas[0])
    setAgentePanel(ROLES[p.rol].agentes[0])
  }, [])
  const agentesOrdenados = useMemo(() => [...AGENTES].sort((a, b) => (rol.agentes.indexOf(a.id) + 1 || 99) - (rol.agentes.indexOf(b.id) + 1 || 99)), [rol])
  const [menu, setMenu] = useState(false)
  const [paleta, setPaleta] = useState(false)
  const [ajustes, setAjustes] = useState<{ abierto: boolean; seccion: SeccionAjustes }>({ abierto: false, seccion: 'general' })
  const [proyectoEditado, setProyectoEditado] = useState<string | null>(null)
  const [modeloAbierto, setModeloAbierto] = useState(false)
  const [borrador, setBorrador] = useState<{ texto: string; n: number } | undefined>()
  const [artefactoActivo, setArtefactoActivo] = useState<string | null>(null)
  const [servidor, setServidor] = useState<EstadoServidor | null>(null)
  const { estado: cuotas, error: errorCuotas } = useCuotas(cliente)
  const arrastreHoja = useDragControls()
  const catalogo = useDatos(() => cliente.modelos(), [cliente])
  const skills = useDatos(() => cliente.skills(), [cliente])

  // Conversación activa de la pestaña (si no hay, la más reciente; si no hay ninguna, se crea).
  const delaPestana = espacio.conversaciones.filter((c) => c.pestana === pestana && !c.archivada)
  const conv: Conversacion | undefined = espacio.conversaciones.find((c) => c.id === activaPor[pestana]) ?? delaPestana[0]
  const creando = useRef<Partial<Record<Pestana, boolean>>>({})
  useEffect(() => {
    // El ref evita crear dos (React en modo estricto corre los efectos dos veces en desarrollo).
    if (!conv && !creando.current[pestana]) {
      creando.current[pestana] = true
      const c = crearConversacion({ proyectoId: espacio.proyectos[0]?.id ?? 'general', pestana, modeloId: espacio.ajustes.modeloPorDefecto })
      setActivaPor((s) => ({ ...s, [pestana]: c.id }))
    } else if (conv) creando.current[pestana] = false
  }, [conv, pestana, crearConversacion, espacio.proyectos, espacio.ajustes.modeloPorDefecto])
  const convId = conv?.id ?? ''
  const convIdRef = useRef(convId)
  useEffect(() => {
    convIdRef.current = convId
  }, [convId])
  const proyecto = espacio.proyectos.find((p) => p.id === conv?.proyectoId)
  const mensajes = useMemo(() => porConv[convId] ?? [], [porConv, convId])
  const pendiente = pendienteDe(mensajes)

  // Estado del servidor (login de Claude) cada minuto.
  useEffect(() => {
    let vivo = true
    const leer = () => cliente.estado().then((e) => vivo && setServidor(e))
    leer()
    const t = setInterval(leer, 60_000)
    return () => {
      vivo = false
      clearInterval(t)
    }
  }, [cliente])

  // Guardar mensajes (sin incógnito).
  const incognitos = useMemo(() => new Set(espacio.conversaciones.filter((c) => c.incognito).map((c) => c.id)), [espacio.conversaciones])
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const guardar: Record<string, Mensaje[]> = {}
        for (const [id, lista] of Object.entries(porConv)) if (!incognitos.has(id)) guardar[id] = aligerar(lista.map((m) => (m.enCurso ? { ...m, enCurso: false } : m)))
        localStorage.setItem(`${CLAVE_MENSAJES}:${mock ? 'mock' : 'http'}`, JSON.stringify(guardar))
      } catch {
        /* lleno o sin almacenamiento */
      }
    }, 400)
    return () => clearTimeout(t)
  }, [porConv, incognitos, mock])

  // Rutas para @ (solo Code; si el puente no tiene archivos, no hay autocompletado).
  const archivos = useDatos(() => (pestana === 'code' && convId ? cliente.archivos(convId) : Promise.resolve([])), [cliente, convId, pestana])
  const rutas = useMemo(() => rutasDe(archivos.datos ?? []), [archivos.datos])

  const artefactos = useMemo<Artefacto[]>(
    () => mensajes.filter((m) => m.rol === 'asistente' && !m.enCurso).flatMap((m) => m.partes.flatMap((p) => (p.tipo === 'texto' ? extraerArtefactos(p.texto, p.id) : []))),
    [mensajes],
  )
  const uso = usoTotal(mensajes)
  const esperando = useMemo(() => Object.fromEntries(Object.entries(porConv).map(([id, l]) => [id, !!pendienteDe(l)])), [porConv])

  const elegir = useCallback(
    (id: string) => {
      const c = espacio.conversaciones.find((x) => x.id === id)
      if (!c) return
      // Un incógnito que se deja atrás se olvida.
      if (conv?.incognito && conv.id !== id) {
        olvidar(conv.id)
        borrarConversacion(conv.id)
        cliente.cerrarSesion(conv.id).catch(() => {})
      }
      setPestana(c.pestana)
      setActivaPor((s) => ({ ...s, [c.pestana]: id }))
      setMenu(false)
      setArtefactoActivo(null)
    },
    [espacio.conversaciones, conv, olvidar, borrarConversacion, cliente],
  )

  const nueva = useCallback(
    (proyectoId?: string, incognito = false) => {
      const pid = proyectoId ?? conv?.proyectoId ?? espacio.proyectos[0]?.id ?? 'general'
      // Si la actual está vacía y es del mismo tipo, se reutiliza.
      if (conv && !incognito && !conv.incognito && !(porConv[conv.id]?.length) && conv.proyectoId === pid) {
        setMenu(false)
        return
      }
      if (conv?.incognito) {
        olvidar(conv.id)
        borrarConversacion(conv.id)
      }
      const c = crearConversacion({
        proyectoId: pid,
        pestana,
        modeloId: espacio.ajustes.modeloPorDefecto,
        incognito,
        titulo: incognito ? 'Incógnito' : pestana === 'code' ? 'Sesión nueva' : 'Chat nuevo',
      })
      setActivaPor((s) => ({ ...s, [pestana]: c.id }))
      setMenu(false)
    },
    [conv, espacio.proyectos, espacio.ajustes.modeloPorDefecto, porConv, crearConversacion, pestana, olvidar, borrarConversacion],
  )

  const cambiarModo = useCallback((m: ModoSesion) => conv && editarConversacion(conv.id, { modo: m }), [conv, editarConversacion])
  const cambiarModelo = useCallback((id: string) => conv && editarConversacion(conv.id, { modeloId: id }), [conv, editarConversacion])
  const abrirPanel = (d?: DestinoPanel) => {
    if (d) {
      setSeccion(d.seccion)
      if (d.pestana) setPestanaPanel(d.pestana)
      if (d.herramienta) setHerramienta(d.herramienta)
      setPanel(true)
    } else setPanel((v) => !v)
  }
  const abrirAjustes = (seccion: SeccionAjustes = 'general') => setAjustes({ abierto: true, seccion })
  const ponerEnCaja = (texto: string) => setBorrador((b) => ({ texto, n: (b?.n ?? 0) + 1 }))

  const comando = (c: Comando) => {
    const acciones: Record<string, () => void> = {
      '/nueva': () => nueva(),
      '/plan': () => cambiarModo('plan'),
      '/manual': () => cambiarModo('code'),
      '/modelo': () => setModeloAbierto(true),
      '/incognito': () => nueva(undefined, true),
      '/memoria': () => abrirAjustes('memoria'),
      '/ajustes': () => abrirAjustes(),
      '/tema': alternar,
    }
    acciones[c.nombre]?.()
  }

  const onEnviar = (texto: string, adjuntos: { nombre: string; tipo: string; url?: string }[]) => {
    if (!conv) return
    const { texto: paraMotor, sinEnviar } = prepararEnvio(texto, adjuntos)
    if (sinEnviar.length) toast.warning(`${sinEnviar.join(', ')}: el puente aún no recibe imágenes ni PDF, solo texto.`)
    const titulo = /^(Conversación nueva|Sesión nueva|Chat nuevo)$/.test(conv.titulo) && texto ? texto.replace(/\s+/g, ' ').slice(0, 60) : conv.titulo
    editarConversacion(conv.id, { titulo, actualizada: new Date().toISOString() })
    const memoria = conv.incognito ? [] : espacio.memorias.map((m) => `- ${m.texto}`)
    const instrucciones = [
      proyecto?.instrucciones?.trim() ? `Instrucciones del proyecto «${proyecto.nombre}»:\n${proyecto.instrucciones.trim()}` : '',
      memoria.length ? `Lo que sabes de quien te escribe:\n${memoria.join('\n')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')
    const id = conv.id
    // `@agente …` arranca el flujo de ese agente con lo ya hablado; su pestaña se abre en el panel.
    const llamado = agenteMencionado(paraMotor)
    if (llamado) {
      setAgentePanel(llamado.agente.id)
      setSeccion('agentes')
      setPanel(true)
    }
    // Modo Auto: el router elige el nivel por la tarea (si la persona fijó uno, no se mete).
    const claudeActiva = servidor?.claude === 'activa'
    const ruta = conv.modeloId === AUTO ? rutear(texto, { ultimo: ultimoNivel(mensajes) }) : null
    enviar(id, texto, adjuntos, {
      modeloId: ruta ? modeloDeRuta(ruta, claudeActiva) : conv.modeloId,
      ruta: ruta ? { nombre: ruta.nombre, nivel: ruta.nivel, motivo: ruta.motivo, esfuerzo: ruta.esfuerzo, ...(claudeActiva ? { claude: MODELOS_CLAUDE[ruta.cocinero].nombre } : {}) } : undefined,
      aislada: conv.pestana === 'code' && !!conv.aislada,
      // En Chat la sesión no tiene herramientas: para lanzar al subagente, ese turno va en modo plan (solo lectura).
      modo: conv.pestana === 'chat' ? (llamado ? 'plan' : 'chat') : conv.modo,
      agentes: agentesParaPuente(),
      proyectoId: conv.proyectoId,
      titulo,
      instrucciones: instrucciones || undefined,
      textoParaMotor: llamado ? instruccionAgente(llamado.agente, llamado.resto) : paraMotor,
      alCambiarModo: (m) => editarConversacion(id, { modo: m }),
      alTerminar: (m) => {
        // Como en Claude: si la respuesta trae un artefacto visual, se abre solo en el panel.
        const nuevos = m.partes.flatMap((x) => (x.tipo === 'texto' ? extraerArtefactos(x.texto, x.id) : [])).filter((a) => a.tipo !== 'codigo')
        if (nuevos.length && id === convIdRef.current) {
          setArtefactoActivo(nuevos[nuevos.length - 1].id)
          setSeccion('herramientas')
          setHerramienta('artefactos')
          setPanel(true)
        }
        if (espacio.ajustes.notificaciones && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Code OS', { body: `${titulo}: ${m.error ? 'terminó con un error' : 'listo'}`, tag: id })
        }
      },
    })
  }

  // S / N / T responden al permiso pendiente (si el foco no está escribiendo).
  useEffect(() => {
    if (!pendiente || pendiente.tipo !== 'permiso') return
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 's' || k === 'n' || k === 't') {
        e.preventDefault()
        responderPermiso(convId, pendiente.id, k)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [pendiente, convId, responderPermiso])

  useAtajos({
    'mod+k': () => setPaleta((v) => !v),
    'mod+shift+o': () => nueva(),
    'mod+j': () => setPanel((v) => !v),
    'mod+shift+m': () => pestana === 'code' && cambiarModo(conv?.modo === 'plan' ? 'code' : 'plan'),
    'mod+shift+i': () => setModeloAbierto(true),
    'mod+o': () => cambiarAjustes({ vista: espacio.ajustes.vista === 'detallada' ? 'normal' : 'detallada' }),
    'mod+,': () => abrirAjustes(),
    'mod+/': () => abrirAjustes('atajos'),
  })

  const buscarEnMensajes = useCallback((id: string, q: string) => (porConv[id] ?? []).some((m) => textoDe(m).toLowerCase().includes(q)), [porConv])
  const visiblesSidebar = useMemo(() => espacio.conversaciones.filter((c) => !c.incognito), [espacio.conversaciones])

  const sidebar = (
    <Sidebar
      pestana={pestana}
      onPestana={(p) => {
        setPestana(p)
        setMenu(false)
      }}
      proyectos={espacio.proyectos}
      conversaciones={visiblesSidebar}
      activa={convId}
      enCurso={enCurso}
      esperando={esperando}
      buscarEnMensajes={buscarEnMensajes}
      onElegir={elegir}
      onNueva={(pid) => nueva(pid)}
      onIncognito={() => nueva(undefined, true)}
      onEditar={editarConversacion}
      onBorrar={(id) => {
        olvidar(id)
        borrarConversacion(id)
        cliente.cerrarSesion(id).catch(() => {})
      }}
      onNuevoProyecto={() => {
        const p = crearProyecto('Proyecto nuevo')
        setProyectoEditado(p.id)
      }}
      onProyecto={setProyectoEditado}
      onAjustes={() => abrirAjustes()}
      tema={tema}
      onTema={alternar}
      cuotas={cuotas}
      errorCuotas={errorCuotas}
      servidor={servidor}
      mock={mock}
      persona={persona}
      onPersona={setPersona}
    />
  )

  const bloqueado = pendiente ? (pendiente.tipo === 'pregunta' ? 'Responde la pregunta de arriba para seguir…' : pendiente.tipo === 'plan' ? 'Revisa el plan de arriba para seguir…' : 'Responde el permiso de arriba (S · N · T)…') : undefined

  const chat = (
    <main className="flex h-full min-w-0 flex-1 flex-col">
      <header className="vidrio z-10 flex h-12 shrink-0 items-center gap-2 px-3">
        {!escritorio && (
          <Button variant="ghost" size="icon-sm" onClick={() => setMenu(true)} aria-label="Abrir proyectos">
            <MenuIcon />
          </Button>
        )}
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          {proyecto && <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{proyecto.nombre} /</span>}
          <h1 className="truncate text-sm font-medium">{conv?.titulo ?? 'Conversación'}</h1>
          {conv?.incognito && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px]">
              <GhostIcon className="size-3" /> no se guarda
            </span>
          )}
        </div>
        <SelectorCliente />
        {uso.ultimaEntrada > 0 && (
          <span className="hidden text-[11px] text-muted-foreground tabular-nums sm:inline" title="Tokens de contexto en el último turno">
            {(uso.ultimaEntrada / 1000).toFixed(1)} k de contexto
          </span>
        )}
        <Button variant={panel ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => abrirPanel()} aria-label="Mostrar u ocultar panel lateral" aria-pressed={panel}>
          <PanelRightIcon />
        </Button>
      </header>
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
          {mensajes.length === 0 ? (
            <ConversationEmptyState>
              <div className="grid justify-items-center gap-3">
                <p className="text-base font-medium">{pestana === 'code' ? '¿Qué hacemos en el proyecto?' : conv?.incognito ? 'Chat incógnito' : '¿En qué te ayudo?'}</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {conv?.incognito
                    ? 'No entra al historial ni a la memoria.'
                    : pestana === 'code'
                      ? `Claude trabaja en la carpeta de ${proyecto?.nombre ?? 'este proyecto'} y te pide permiso antes de tocar algo.`
                      : 'Conversación sin herramientas. Si pides algo visual, lo abres como artefacto.'}
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  {SUGERENCIAS[pestana].map((s) => (
                    <Suggestion key={s} suggestion={s} onClick={ponerEnCaja} />
                  ))}
                </div>
                {pestana === 'code' && conv && !conv.incognito && (
                  <label className="mt-1 flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2 text-left text-xs">
                    <Switch checked={!!conv.aislada} onCheckedChange={(v) => editarConversacion(conv.id, { aislada: v })} aria-label="Sesión aislada" />
                    <span className="grid">
                      <span className="font-medium text-foreground">Sesión aislada</span>
                      <span className="text-muted-foreground">Trabaja en una rama propia y la fusionas al final desde Cambios.</span>
                    </span>
                  </label>
                )}
                {mock && <p className="text-[11px] text-mut2">Modo ejemplo: sin VITE_PUENTE_URL las respuestas son simuladas.</p>}
              </div>
            </ConversationEmptyState>
          ) : (
            mensajes.map((m) => (
              <MensajeVista
                key={m.id}
                mensaje={m}
                detallada={espacio.ajustes.vista === 'detallada'}
                onPermiso={(id, r) => responderPermiso(convId, id, r)}
                onPregunta={(id, qs, r) => responderPregunta(convId, id, qs, r)}
                onPlan={(id, a, c) => responderPlan(convId, id, a, c)}
                onArtefacto={(a) => {
                  setArtefactoActivo(a.id)
                  abrirPanel({ seccion: 'herramientas', herramienta: 'artefactos' })
                }}
              />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Composer
          key={convId}
          pestana={pestana}
          modo={conv?.modo ?? 'code'}
          onModo={cambiarModo}
          modeloId={conv?.modeloId ?? espacio.ajustes.modeloPorDefecto}
          onModelo={cambiarModelo}
          disponibles={catalogo.datos?.ids}
          claude={servidor?.claude}
          modeloAbierto={modeloAbierto}
          onModeloAbierto={setModeloAbierto}
          enCurso={!!enCurso[convId]}
          incognito={conv?.incognito}
          bloqueado={enCurso[convId] ? bloqueado : undefined}
          onEnviar={onEnviar}
          onDetener={() => detener(convId)}
          onComando={comando}
          rutas={pestana === 'code' ? rutas : undefined}
          agentes={agentesOrdenados}
          skills={skills.datos ?? undefined}
          borrador={borrador}
        />
      </div>
    </main>
  )

  const panelLateral = (
    <PanelLateral
      seccion={seccion}
      onSeccion={setSeccion}
      pestana={pestanaPanel}
      onPestana={setPestanaPanel}
      herramienta={herramienta}
      onHerramienta={setHerramienta}
      herramientas={rol.herramientas}
      agentesRol={rol.agentes}
      agente={agentePanel}
      onAgente={setAgentePanel}
      onEmpezarAgente={(a: Agente) => {
        ponerEnCaja(`@${a.id} `)
        if (!escritorio) setPanel(false)
      }}
      onCerrar={() => setPanel(false)}
      modo={pestana}
      cliente={cliente}
      conversacionId={convId}
      mensajes={mensajes}
      artefactos={artefactos}
      artefactoActivo={artefactoActivo}
      onArtefacto={setArtefactoActivo}
      tema={tema}
      onMencionar={(r) => ponerEnCaja(`@${r} `)}
      onEnviar={(t) => onEnviar(t, [])}
      onRevisar={() => {
        // La revisión la hace OTRO nivel distinto al que construyó.
        const r = rutear('revisa los cambios', { ultimo: ultimoNivel(mensajes) })
        if (!conv) return
        enviar(conv.id, 'Revisa los cambios de esta sesión: busca errores, riesgos y lo que falte probar. No edites nada; dame la lista.', [], {
          modeloId: modeloDeRuta(r, servidor?.claude === 'activa'),
          modo: conv.pestana === 'chat' ? 'chat' : 'plan',
          ruta: { nombre: r.nombre, nivel: r.nivel, motivo: r.motivo, esfuerzo: r.esfuerzo },
          agentes: agentesParaPuente(),
        })
        return `${r.nombre} · ${r.nivel}`
      }}
      aislada={!!conv?.aislada}
      onTextoAlMensaje={(t) => {
        ponerEnCaja(t)
        if (!escritorio) setPanel(false)
      }}
    />
  )

  return (
    <MotionConfig reducedMotion="user" transition={resorte}>
      <HiloProvider cliente={cliente} clienteId={clienteId} onClienteId={setClienteId}>
      <TooltipProvider>
        <div className="flex h-dvh w-full overflow-hidden">
          {escritorio ? (
            <div className="w-72 shrink-0 border-r">{sidebar}</div>
          ) : (
            <AnimatePresence>
              {menu && (
                <>
                  <motion.div key="velo" className="fixed inset-0 z-40 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />
                  <motion.div
                    key="cajon"
                    className="vidrio fixed inset-y-0 left-0 z-50 w-[86%] max-w-80"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={{ left: 0.6, right: 0 }}
                    onDragEnd={(_, i) => (i.offset.x < -80 || i.velocity.x < -400) && setMenu(false)}
                  >
                    {sidebar}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          )}

          {escritorio ? (
            panel ? (
              <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1">
                <ResizablePanel defaultSize="60%" minSize="35%">
                  {chat}
                </ResizablePanel>
                <ResizableHandle withHandle aria-label="Redimensionar panel lateral" />
                <ResizablePanel defaultSize="40%" minSize="22%" maxSize="60%">
                  {panelLateral}
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              chat
            )
          ) : (
            <>
              {chat}
              <AnimatePresence>
                {panel && (
                  <>
                    <motion.div key="velo-panel" className="fixed inset-0 z-30 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanel(false)} />
                    <motion.div
                      key="hoja"
                      className={cn('fixed inset-x-0 bottom-0 z-40 h-[78dvh] overflow-hidden rounded-t-2xl border-t shadow-2xl')}
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      drag="y"
                      dragListener={false}
                      dragControls={arrastreHoja}
                      dragConstraints={{ top: 0, bottom: 0 }}
                      dragElastic={{ top: 0, bottom: 0.6 }}
                      onDragEnd={(_, i) => (i.offset.y > 120 || i.velocity.y > 500) && setPanel(false)}
                    >
                      <div className="flex h-full flex-col bg-card">
                        {/* Asa: se arrastra hacia abajo para cerrar (el resto del panel hace scroll normal). */}
                        <div className="flex h-5 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing" onPointerDown={(e) => arrastreHoja.start(e)} aria-hidden>
                          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                        </div>
                        <div className="min-h-0 flex-1">{panelLateral}</div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
        <Paleta
          abierta={paleta}
          onAbierta={setPaleta}
          pestana={pestana}
          conversaciones={visiblesSidebar}
          onConversacion={elegir}
          onNueva={() => nueva()}
          onIncognito={() => nueva(undefined, true)}
          onPestana={setPestana}
          onTema={alternar}
          onPanel={abrirPanel}
          herramientas={rol.herramientas}
          onModelo={cambiarModelo}
          onAjustes={abrirAjustes}
          onModo={() => cambiarModo(conv?.modo === 'plan' ? 'code' : 'plan')}
        />
        <Ajustes
          abierto={ajustes.abierto}
          onAbierto={(v) => setAjustes((s) => ({ ...s, abierto: v }))}
          seccion={ajustes.seccion}
          onSeccion={(s) => setAjustes((x) => ({ ...x, seccion: s }))}
          cliente={cliente}
          ajustes={espacio.ajustes}
          onAjustes={cambiarAjustes}
          memorias={espacio.memorias}
          onMemorias={guardarMemorias}
          cuotas={cuotas}
          errorCuotas={errorCuotas}
          servidor={servidor}
          disponibles={catalogo.datos?.ids}
          tema={tema}
          onTema={setTema}
        />
        <ProyectoDialogo
          proyecto={espacio.proyectos.find((p) => p.id === proyectoEditado) ?? null}
          total={espacio.proyectos.length}
          onCerrar={() => setProyectoEditado(null)}
          onGuardar={(c) => proyectoEditado && editarProyecto(proyectoEditado, c)}
          onBorrar={() => proyectoEditado && borrarProyecto(proyectoEditado)}
        />
        <NodoDetalle />
        <Toaster position={escritorio ? 'bottom-right' : 'top-center'} theme={tema} />
      </TooltipProvider>
      </HiloProvider>
    </MotionConfig>
  )
}
