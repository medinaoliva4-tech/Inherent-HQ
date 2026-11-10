import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Proyecto } from '@/hooks/use-espacio'

type Props = {
  proyecto: Proyecto | null
  total: number
  onCerrar: () => void
  onGuardar: (cambios: Partial<Proyecto>) => void
  onBorrar: () => void
}

/** Nombre e instrucciones del proyecto (su memoria). Las instrucciones viajan al crear cada sesión. */
export function ProyectoDialogo({ proyecto, total, onCerrar, onGuardar, onBorrar }: Props) {
  const [nombre, setNombre] = useState('')
  const [instrucciones, setInstrucciones] = useState('')
  const [confirmar, setConfirmar] = useState(false)
  useEffect(() => {
    if (proyecto) {
      setNombre(proyecto.nombre)
      setInstrucciones(proyecto.instrucciones)
      setConfirmar(false)
    }
  }, [proyecto])
  return (
    <Dialog open={!!proyecto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="vidrio w-[min(560px,calc(100vw-2rem))] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Proyecto</DialogTitle>
          <DialogDescription>Las instrucciones se mandan a Claude al empezar cada conversación de este proyecto.</DialogDescription>
        </DialogHeader>
        <form
          id="form-proyecto"
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            onGuardar({ nombre: nombre.trim() || proyecto?.nombre, instrucciones })
            onCerrar()
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="proy-nombre">Nombre</Label>
            <input id="proy-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="proy-instr">Instrucciones del proyecto</Label>
            <Textarea
              id="proy-instr"
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              placeholder="Ej.: Responde en español, de tú. El código usa TypeScript estricto."
              className="min-h-32"
            />
            <p className="text-xs text-muted-foreground">Se aplican a conversaciones nuevas. Las que ya existen siguen con las de antes.</p>
          </div>
        </form>
        <DialogFooter className="items-center sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-bad"
            disabled={total <= 1}
            title={total <= 1 ? 'Necesitas al menos un proyecto' : undefined}
            onClick={() => {
              if (!confirmar) return setConfirmar(true)
              onBorrar()
              onCerrar()
            }}
          >
            {confirmar ? 'Toca otra vez: sus chats pasan a otro proyecto' : 'Borrar proyecto'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button size="sm" type="submit" form="form-proyecto">
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
