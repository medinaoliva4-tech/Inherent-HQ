import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useHilo } from '@/hooks/use-hilo'
import { Cabecera, Segmentado } from './comun'

/**
 * Video: información de video organizada en tres vistas separadas. No es un editor: los videos los produce el agente
 * por prompting (code-os/video, MCP `video`); aquí se ve y se ajusta lo que usa.
 *  · Style menu: lo que la marca eligió del catálogo (transiciones, efectos, textos, estilos) y sus tipografías,
 *    colores, música y assets.
 *  · Referencias: videos para replicar, con su desglose, e «Imitar este».
 *  · Desglose: las escenas de cada video y qué se le aplica a cada una; ahí se cambian música y estilos.
 * Las vistas las sirve el servicio de video (`/vistas/*.html`) y se cargan en un iframe con ?marca=&api=&t=.
 * Contrato en code-os/docs/video.md → «Contrato con Code OS».
 */
type Vista = 'estilo-marca' | 'referencias' | 'desglose'
const VISTAS: { v: Vista; t: string }[] = [
  { v: 'estilo-marca', t: 'Style menu' },
  { v: 'referencias', t: 'Referencias' },
  { v: 'desglose', t: 'Desglose por video' },
]

/** URL del servicio de video: VITE_VIDEO_URL (p. ej. /video detrás del puente). Sin URL no se muestra nada inventado. */
function urlVista(base: string | undefined, vista: Vista, p: { marca?: string; token?: string }) {
  if (!base) return null
  const b = base.replace(/\/$/, '')
  const q = new URLSearchParams({ api: b, ...(p.marca ? { marca: p.marca } : {}), ...(p.token ? { t: p.token } : {}) })
  return `${b}/vistas/${vista}.html?${q}`
}

export function Video() {
  const h = useHilo()
  const [vista, setVista] = useState<Vista>('estilo-marca')
  const env = import.meta.env as Record<string, string | undefined>
  const src = urlVista(env.VITE_VIDEO_URL?.trim() || undefined, vista, { marca: h.marca?.id, token: env.VITE_VIDEO_TOKEN?.trim() || undefined })

  // las vistas avisan por postMessage: «prompt» (texto para el agente) y «cambio» (se guardó algo)
  useEffect(() => {
    const oir = (e: MessageEvent) => {
      const d = e.data as { fuente?: string; tipo?: string; texto?: string }
      if (d?.fuente !== 'code-os-video') return
      if (d.tipo === 'prompt' && d.texto) toast('Prompt copiado', { description: 'Pégalo en el chat con @produccion.' })
    }
    window.addEventListener('message', oir)
    return () => window.removeEventListener('message', oir)
  }, [])

  return (
    <div className="grid gap-4">
      <Cabecera id="video">
        <Segmentado valor={vista} opciones={VISTAS} onCambio={setVista} etiqueta="Vista de video" />
      </Cabecera>
      <section aria-label="Video" className="overflow-hidden rounded-xl border bg-black">
        {src ? (
          <iframe key={src} title={VISTAS.find((x) => x.v === vista)?.t} src={src} className="block h-[72vh] w-full border-0" />
        ) : (
          <p className="p-5 text-sm text-white/60">
            Falta conectar el servicio de video (VITE_VIDEO_URL). Los videos los produce el agente de Producción por prompting; aquí se verán el style menu de la marca, las referencias y el desglose de cada video.
          </p>
        )}
      </section>
    </div>
  )
}
