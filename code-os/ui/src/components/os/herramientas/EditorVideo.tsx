import { ClapperboardIcon, ScissorsIcon, UploadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Cabecera } from './comun'

/**
 * Contenedor del editor de video de Post. El editor (FilmCraft en prueba; respaldo Twick) se carga aquí
 * en otro PR; solo el rol de editor (y CEO/COO) lo ve. Esto reserva el lugar y la forma.
 */
export function EditorVideo() {
  return (
    <div className="grid gap-4">
      <Cabecera id="video" />
      <section aria-label="Editor de video (próximamente)" className="grid gap-4 rounded-xl border border-dashed bg-card/60 p-5">
        <div className="grid justify-items-center gap-2 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-accent">
            <ClapperboardIcon className="size-5" />
          </span>
          <p className="text-sm font-medium">El editor de video se carga aquí</p>
          <p className="max-w-sm text-xs text-balance text-muted-foreground">
            El agente hace el primer corte y las derivadas; tú solo ajustas. El motor del editor llega en otro PR (en prueba: FilmCraft).
          </p>
        </div>
        <div className="grid aspect-video place-items-center rounded-lg bg-black/80 text-xs text-white/50">Vista previa</div>
        <div className="grid gap-1.5" aria-hidden>
          {[70, 45, 85].map((w, i) => (
            <div key={i} className="flex h-6 items-center gap-1 rounded-md bg-muted/60 px-1">
              <span className="h-4 rounded-sm bg-foreground/15" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="sm" variant="outline" disabled>
            <UploadIcon /> Importar material
          </Button>
          <Button size="sm" variant="outline" disabled>
            <ScissorsIcon /> Primer corte del agente
          </Button>
        </div>
      </section>
    </div>
  )
}
