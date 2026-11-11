import { BookOpenIcon, SparklesIcon } from 'lucide-react'
import { useDatos } from '@/hooks/use-datos'
import { useHilo } from '@/hooks/use-hilo'

/**
 * Qué sabe la sesión de este cliente: su memoria (`clients/<slug>/CLAUDE.md`…) y las skills cargadas en el servidor
 * (las de `agents/` que el puente sirve en `GET /skills`). Las skills también salen en `/` del chat.
 */
export function ContextoSesion() {
  const h = useHilo()
  const memoria = useDatos(() => h.cliente.memoriaCliente(h.clienteId), [h.cliente, h.clienteId])
  const skills = useDatos(() => h.cliente.skills(), [h.cliente])
  return (
    <section aria-label="Memoria y skills de la sesión" className="grid gap-2 rounded-xl border bg-card p-3">
      <h3 className="flex items-center gap-1.5 text-sm font-medium">
        <BookOpenIcon className="size-4 text-muted-foreground" /> Lo que la sesión sabe de este cliente
      </h3>
      {memoria.falta ? (
        <p className="text-xs text-muted-foreground">Memoria del cliente: falta en el puente ({memoria.falta}).</p>
      ) : (
        <ul className="grid gap-1">
          {(memoria.datos ?? []).map((m) => (
            <li key={m.ruta} className="grid text-xs">
              <span className="flex items-center gap-1.5">
                <span className={m.cargada ? 'size-1.5 rounded-full bg-ok' : 'size-1.5 rounded-full bg-mut2'} aria-label={m.cargada ? 'cargada' : 'sin cargar'} />
                <code className="truncate">{m.ruta}</code>
              </span>
              <span className="pl-3 text-muted-foreground">{m.resumen}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-1">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <SparklesIcon className="size-3.5" /> Skills cargadas{skills.datos ? ` · ${skills.datos.length}` : ''} (escribe / en el chat)
        </p>
        {skills.falta ? (
          <p className="text-xs text-mut2">Falta en el puente: {skills.falta}</p>
        ) : skills.error ? (
          <p className="text-xs text-bad">{skills.error}</p>
        ) : (
          <ul className="flex flex-wrap gap-1">
            {(skills.datos ?? []).map((k) => (
              <li key={k.nombre} title={k.descripcion} className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px]">
                /{k.nombre}
              </li>
            ))}
            {skills.datos && !skills.datos.length && <li className="text-xs text-mut2">Ninguna en el servidor.</li>}
          </ul>
        )}
      </div>
      {h.cliente.tipo === 'mock' && <p className="text-[11px] text-mut2">Datos de ejemplo.</p>}
    </section>
  )
}
