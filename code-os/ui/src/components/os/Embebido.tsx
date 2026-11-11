import { MotionConfig } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { HiloProvider } from '@/hooks/use-hilo'
import { useTheme } from '@/hooks/use-theme'
import { rutear } from '@/lib/cocina'
import type { Cliente } from '@/lib/cliente'
import { configDesdeEntorno } from '@/lib/cliente'
import { crearCliente } from '@/lib/crear-cliente'
import { crearEnlaceOS, type ContextoOS, type EnlaceOS } from '@/lib/embebido'
import { resorte } from '@/lib/movimiento'
import { PERSONAS, ROLES, type Rol } from '@/lib/roles'
import { NodoDetalle } from './hilo/NodoDetalle'
import { PanelLateral, type PestanaPanel, type SeccionPanel, type VistaHerramienta } from './PanelLateral'

/** Id fijo de la conversación dentro del iframe: la sesión real la elige el Chat del OS (`contexto.sesion`). */
const CONV = 'os-embebido'

/**
 * Code OS dentro del Chat del OS: SOLO los paneles (Cliente/hilo, Agentes, Herramientas, Cambios, Terminal).
 * El chat es el nativo del OS: lo que aquí «va al chat» se le manda al OS con `codeos:al-chat`.
 * Sin login propio: usa el pase del OS (por `postMessage`, o `?pase=` en la primera carga).
 */
export function Embebido({ cliente: clienteProp, pase }: { cliente?: Cliente; pase?: string }) {
  const { tema, setTema } = useTheme()
  const [ctx, setCtx] = useState<ContextoOS>({})
  const enlace = useRef<EnlaceOS | null>(null)
  const cliente = useMemo(
    () =>
      clienteProp ??
      crearCliente({
        // En producción la interfaz la sirve el puente (VITE_PUENTE_URL=.): mismo origen. Sin URL, mock.
        ...configDesdeEntorno(),
        obtenerToken: () => enlace.current?.token() ?? pase,
        alNoAutorizado: () => enlace.current?.pedirPase(),
      }),
    [clienteProp, pase],
  )
  useEffect(() => {
    const e = crearEnlaceOS({ pase, alContexto: (c) => setCtx((x) => ({ ...x, ...c })) })
    enlace.current = e
    return () => e.cerrar()
  }, [pase])

  useEffect(() => {
    if (ctx.tema) setTema(ctx.tema)
  }, [ctx.tema, setTema])
  useEffect(() => {
    if (ctx.sesion) cliente.vincularSesion(CONV, ctx.sesion)
  }, [ctx.sesion, cliente])

  const [clienteId, setClienteId] = useState('')
  useEffect(() => {
    if (ctx.cliente) setClienteId(ctx.cliente)
  }, [ctx.cliente])
  const rol: Rol = ctx.rol && ROLES[ctx.rol] ? ctx.rol : PERSONAS[0].rol
  const [seccion, setSeccion] = useState<SeccionPanel>('cliente')
  useEffect(() => {
    if (ctx.seccion) setSeccion(ctx.seccion)
  }, [ctx.seccion])
  const [pestana, setPestana] = useState<PestanaPanel>('cambios')
  const [herramienta, setHerramienta] = useState<VistaHerramienta>(ROLES[rol].herramientas[0])
  const [agente, setAgente] = useState(ROLES[rol].agentes[0])
  const alChat = (texto: string, enviar = false, modelo?: string) => enlace.current?.alChat(texto, enviar, modelo)

  return (
    <MotionConfig reducedMotion="user" transition={resorte}>
      <HiloProvider cliente={cliente} clienteId={clienteId} onClienteId={setClienteId}>
        <TooltipProvider>
          <div className="h-dvh w-full overflow-hidden" data-embebido>
            <PanelLateral
              embebido
              seccion={seccion}
              onSeccion={setSeccion}
              pestana={pestana}
              onPestana={setPestana}
              herramienta={herramienta}
              onHerramienta={setHerramienta}
              herramientas={ROLES[rol].herramientas}
              agentesRol={ROLES[rol].agentes}
              agente={agente}
              onAgente={setAgente}
              onEmpezarAgente={(a) => alChat(`@${a.id} `)}
              modo="code"
              cliente={cliente}
              conversacionId={CONV}
              mensajes={[]}
              artefactos={[]}
              artefactoActivo={null}
              onArtefacto={() => {}}
              tema={tema}
              onMencionar={(r) => alChat(`@${r} `)}
              onTextoAlMensaje={(t) => alChat(t)}
              onEnviar={(t) => alChat(t, true)}
              onRevisar={() => {
                const r = rutear('revisa los cambios', { ultimo: ctx.nivel ?? '' })
                alChat('Revisa los cambios de esta sesión: busca errores, riesgos y lo que falte probar. No edites nada; dame la lista.', true, r.nivel)
                return `${r.nombre} · ${r.nivel}`
              }}
              aislada={!!ctx.aislada}
            />
          </div>
          <NodoDetalle />
          <Toaster position="top-center" theme={tema} />
        </TooltipProvider>
      </HiloProvider>
    </MotionConfig>
  )
}
