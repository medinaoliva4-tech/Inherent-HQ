import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { crearClienteMock } from './lib/cliente-mock'

beforeAll(() => {
  const mm = (q: string) => ({ matches: q.includes('min-width'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })
  window.matchMedia = mm as never
  window.HTMLElement.prototype.scrollTo = () => {}
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

beforeEach(() => {
  localStorage.clear()
  document.documentElement.dataset.theme = 'dark'
})

const montar = () => render(<App cliente={crearClienteMock({ velocidad: 0 })} />)

async function escribirYEnviar(texto: string) {
  const caja = screen.getByLabelText('Mensaje')
  fireEvent.change(caja, { target: { value: texto } })
  await userEvent.click(screen.getByRole('button', { name: /enviar/i }))
}

describe('App', () => {
  it('muestra proyectos y el selector con los niveles reales', async () => {
    montar()
    expect(screen.getByRole('navigation', { name: /proyectos/i })).toBeInTheDocument()
    expect(screen.getByText('Inherent OS')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /elegir modelo/i }))
    const alto = await screen.findByRole('group', { name: 'Nivel Alto' })
    expect(within(alto).getByText('Kimi K3.1 Pro')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Nivel Medio' })).getByText('GLM 5.3')).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Nivel Bajo' })).getByText('Nemotron 3 Ultra')).toBeInTheDocument()
    expect(screen.getByText(/sesión activa/)).toBeInTheDocument()
  })

  it('pide permiso y responde con la tecla S; la lista de tareas llega al panel', async () => {
    montar()
    await escribirYEnviar('hola')
    expect(await screen.findByRole('alertdialog', { name: /permiso/i })).toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: 's' })
    await waitFor(() => expect(screen.getByText(/Permitido esta vez/)).toBeInTheDocument())
    expect(await screen.findByText(/Apliqué el mapeo/)).toBeInTheDocument()
    const panel = screen.getByRole('complementary', { name: /panel lateral/i })
    expect(within(panel).getByRole('region', { name: 'Subagentes' })).toBeInTheDocument()
    expect(within(panel).getByText('3/3')).toBeInTheDocument()
  })

  it('modo plan: muestra el plan y al aprobar pasa a Manual', async () => {
    montar()
    await userEvent.click(screen.getByRole('radio', { name: /plan/i }))
    await escribirYEnviar('mapea los tokens')
    expect(await screen.findByRole('group', { name: 'Plan propuesto' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aprobar y seguir' }))
    expect(await screen.findByText(/Plan aprobado/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('radio', { name: /manual/i })).toHaveAttribute('aria-checked', 'true'))
  })

  it('pregunta de Claude: eliges una opción y sigue', async () => {
    montar()
    await escribirYEnviar('pregúntame qué revisar')
    const tarjeta = await screen.findByRole('group', { name: 'Pregunta de Claude' })
    await userEvent.click(within(tarjeta).getByRole('radio', { name: /Claro/ }))
    await userEvent.click(within(tarjeta).getByRole('button', { name: 'Responder' }))
    expect(await screen.findByText(/empiezo por/)).toBeInTheDocument()
  })

  it('Chat: el artefacto HTML se abre en un iframe aislado', async () => {
    montar()
    await userEvent.click(screen.getByRole('tab', { name: /chat/i }))
    await escribirYEnviar('hazme una página con la paleta')
    const iframe = (await screen.findByTitle('Paleta del OS')) as HTMLIFrameElement
    expect(iframe.tagName).toBe('IFRAME')
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-modals')
  })

  it('/ abre los comandos y /ajustes abre los ajustes', async () => {
    montar()
    const caja = screen.getByLabelText('Mensaje')
    fireEvent.change(caja, { target: { value: '/aj' } })
    const lista = await screen.findByRole('listbox', { name: 'Comandos' })
    expect(within(lista).getByText('/ajustes')).toBeInTheDocument()
    fireEvent.keyDown(caja, { key: 'Enter' })
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'General' })).toBeInTheDocument()
  })

  it('ajustes: uso y cuotas con aviso al 80%', async () => {
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Ajustes' }))
    await userEvent.click(await screen.findByRole('button', { name: /uso y cuotas/i }))
    expect(await screen.findByText('Cline Pass')).toBeInTheDocument()
    expect(screen.getByText(/La raya marca el 80%/)).toBeInTheDocument()
  })

  it('busca en el historial por título', async () => {
    montar()
    await userEvent.click(screen.getByRole('tab', { name: /chat/i }))
    fireEvent.change(screen.getByLabelText('Buscar en el historial'), { target: { value: 'octubre' } })
    const nav = screen.getByRole('navigation', { name: /proyectos/i })
    expect(within(nav).getByText('Calendario de octubre')).toBeInTheDocument()
    await waitFor(() => expect(within(nav).queryByText('Tokens claro y oscuro')).not.toBeInTheDocument())
  })

  it('el tema alterna entre oscuro y claro', async () => {
    montar()
    expect(document.documentElement.dataset.theme).toBe('dark')
    await userEvent.click(screen.getByRole('button', { name: /modo claro/i }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
