import { MenuIcon, PanelRightIcon } from 'lucide-react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { Composer } from '@/components/os/Composer'
import { MensajeVista } from '@/components/os/Mensajes'
import { PanelLateral, type PestanaPanel } from '@/components/os/PanelLateral'
import { Paleta } from '@/components/os/Paleta'
import { Sidebar } from '@/components/os/Sidebar'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { TooltipProvider } from '@/components/ui/tooltip'
import { historialInicial, modeloPorDefecto, proyectos } from '@/data/ejemplo'
import { useChat } from '@/hooks/use-chat'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useTheme } from '@/hooks/use-theme'
import { crearClienteMock } from '@/lib/cliente-mock'
import type { ClienteEventos } from '@/lib/eventos'
import { resorte } from '@/lib/movimiento'

type Props = { cliente?: ClienteEventos }

export default function App({ cliente }: Props) {
  const clienteActivo = useMemo(() => cliente ?? crearClienteMock(), [cliente])
  const { tema, alternar } = useTheme()
  const escritorio = useMediaQuery('(min-width: 900px)')
  const [conv, setConv] = useState('c1')
  const [modeloId, setModeloId] = useState(modeloPorDefecto)
  const [panel, setPanel] = useState(escritorio)
  const [pestana, setPestana] = useState<PestanaPanel>('archivos')
  const [menu, setMenu] = useState(false)
  const [paleta, setPaleta] = useState(false)
  const [nuevas, setNuevas] = useState(0)
  const { porConv, enCurso, enviar, detener, responderPermiso } = useChat(clienteActivo, historialInicial)

  const mensajes = porConv[conv] ?? []
  const titulo = proyectos.flatMap((p) => p.conversaciones).find((c) => c.id === conv)?.titulo ?? 'Conversación nueva'
  const permisoPendiente = mensajes.flatMap((m) => m.partes).find((p) => p.tipo === 'permiso' && !p.respuesta)

  // S / N / T responden al permiso pendiente (si el foco no está escribiendo)
  useEffect(() => {
    if (!permisoPendiente) return
    const h = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 's' || k === 'n' || k === 't') {
        e.preventDefault()
        responderPermiso(conv, permisoPendiente.id, k)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [permisoPendiente, conv, responderPermiso])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setPanel((v) => !v)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const nueva = () => {
    const id = `n${nuevas + 1}`
    setNuevas((n) => n + 1)
    setConv(id)
    setMenu(false)
  }
  const abrirPanel = (p?: PestanaPanel) => {
    if (p) {
      setPestana(p)
      setPanel(true)
    } else setPanel((v) => !v)
  }

  const sidebar = (
    <Sidebar
      proyectos={proyectos}
      activa={conv}
      onElegir={(id) => {
        setConv(id)
        setMenu(false)
      }}
      onNueva={nueva}
      onPaleta={() => setPaleta(true)}
      tema={tema}
      onTema={alternar}
    />
  )

  const chat = (
    <main className="flex h-full min-w-0 flex-1 flex-col">
      <header className="vidrio z-10 flex h-12 shrink-0 items-center gap-2 px-3">
        {!escritorio && (
          <Button variant="ghost" size="icon-sm" onClick={() => setMenu(true)} aria-label="Abrir proyectos">
            <MenuIcon />
          </Button>
        )}
        <h1 className="flex-1 truncate text-sm font-medium">{titulo}</h1>
        <Button variant={panel ? 'secondary' : 'ghost'} size="icon-sm" onClick={() => abrirPanel()} aria-label="Mostrar u ocultar panel lateral" aria-pressed={panel}>
          <PanelRightIcon />
        </Button>
      </header>
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
          {mensajes.length === 0 ? (
            <ConversationEmptyState title="¿En qué trabajamos hoy?" description="Escribe abajo. Esta vista usa datos de ejemplo; el puente real se conecta después." />
          ) : (
            mensajes.map((m) => <MensajeVista key={m.id} mensaje={m} onPermiso={(id, r) => responderPermiso(conv, id, r)} />)
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4">
        <Composer
          modeloId={modeloId}
          onModelo={setModeloId}
          enCurso={!!enCurso[conv]}
          onEnviar={(t, a) => enviar(conv, t, a, modeloId)}
          onDetener={() => detener(conv)}
        />
      </div>
    </main>
  )

  return (
    <MotionConfig reducedMotion="user" transition={resorte}>
      <TooltipProvider>
        <div className="flex h-dvh w-full overflow-hidden">
          {escritorio ? (
            <div className="w-72 shrink-0 border-r">{sidebar}</div>
          ) : (
            <AnimatePresence>
              {menu && (
                <>
                  <motion.div key="velo" className="fixed inset-0 z-40 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />
                  <motion.div key="cajon" className="vidrio fixed inset-y-0 left-0 z-50 w-[82%] max-w-80" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}>
                    {sidebar}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          )}

          {escritorio ? (
            panel ? (
              <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1">
                <ResizablePanel defaultSize="68%" minSize="35%">
                  {chat}
                </ResizablePanel>
                <ResizableHandle withHandle aria-label="Redimensionar panel lateral" />
                <ResizablePanel defaultSize="32%" minSize="20%" maxSize="55%">
                  <PanelLateral pestana={pestana} onPestana={setPestana} onCerrar={() => setPanel(false)} />
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
                  <motion.div key="hoja" className="fixed inset-x-0 bottom-0 z-40 h-[70dvh] overflow-hidden rounded-t-2xl border-t shadow-2xl" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}>
                    <PanelLateral pestana={pestana} onPestana={setPestana} onCerrar={() => setPanel(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
        <Paleta abierta={paleta} onAbierta={setPaleta} onNueva={nueva} onTema={alternar} onPanel={abrirPanel} onModelo={setModeloId} />
      </TooltipProvider>
    </MotionConfig>
  )
}
