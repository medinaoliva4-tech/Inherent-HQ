import { ExternalLinkIcon, GlobeIcon, RotateCwIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { WebPreview, WebPreviewBody, WebPreviewNavigation, WebPreviewNavigationButton, WebPreviewUrl } from '@/components/ai-elements/web-preview'
import { Vacio } from './Vacio'

/**
 * Vista previa de una URL (staging, un deploy de Vercel…). Abrir el servidor de desarrollo del VPS
 * necesita un proxy en el puente; hasta entonces solo sirven URLs que tu navegador ya alcanza.
 */
export function VistaPrevia() {
  const [url, setUrl] = useState('')
  const [vuelta, setVuelta] = useState(0)
  return (
    <WebPreview
      defaultUrl=""
      onUrlChange={(u) => (/^https?:\/\//i.test(u.trim()) ? setUrl(u.trim()) : toast.error('Solo direcciones que empiezan con http:// o https://'))}
      className="rounded-none border-0">
      <WebPreviewNavigation className="gap-1 border-b p-1.5">
        <WebPreviewNavigationButton tooltip="Volver a cargar" onClick={() => setVuelta((v) => v + 1)} disabled={!url}>
          <RotateCwIcon className="size-4" />
        </WebPreviewNavigationButton>
        <WebPreviewUrl placeholder="https://… y Enter" aria-label="Dirección de la vista previa" className="h-8 text-xs" />
        <WebPreviewNavigationButton tooltip="Abrir en otra pestaña" onClick={() => url && window.open(url, '_blank', 'noopener')} disabled={!url}>
          <ExternalLinkIcon className="size-4" />
        </WebPreviewNavigationButton>
      </WebPreviewNavigation>
      {url ? (
        <WebPreviewBody key={vuelta} src={url} title="Vista previa" className="bg-white" />
      ) : (
        <Vacio icono={GlobeIcon} titulo="Escribe una dirección" texto="Sirve para revisar staging o un deploy. Ver el servidor de desarrollo del VPS necesita un proxy en el puente." falta="proxy /sessions/:id/preview/:puerto" />
      )}
    </WebPreview>
  )
}
