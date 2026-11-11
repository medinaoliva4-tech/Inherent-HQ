import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { crearClienteMock } from './lib/cliente-mock'
import { crearHiloMemoria } from './lib/hilo-memoria'

beforeAll(() => {
  const mm = (q: string) => ({ matches: q.includes('min-width'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })
  window.matchMedia = mm as never
  window.HTMLElement.prototype.scrollTo = () => {}
  window.HTMLElement.prototype.scrollIntoView = () => {}
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

const montar = () => render(<App cliente={crearClienteMock({ velocidad: 0, hilo: crearHiloMemoria({ persistir: false }) })} />)
const panel = () => screen.getByRole('complementary', { name: /panel lateral/i })
const seccion = async (nombre: RegExp) => userEvent.click(within(panel()).getByRole('tab', { name: nombre }))

describe('departamentos: herramientas, hilo y agentes', () => {
  it('calculadora outbound: caso de referencia 913 / 229 / 46 con el texto fijo', async () => {
    montar()
    await seccion(/herramientas/i)
    await userEvent.click(within(panel()).getByRole('button', { name: /calculadora de adquisición/i }))
    const res = await within(panel()).findByRole('region', { name: 'Resultado outbound' })
    expect(within(res).getByTestId('prospectos')).toHaveTextContent('913')
    expect(res).toHaveTextContent('229 por semana')
    expect(res).toHaveTextContent('46 por día hábil')
    expect(res).toHaveTextContent(/no una garantía/)
    // Cambiar la probabilidad recalcula al instante
    await userEvent.click(within(panel()).getByRole('button', { name: '99 %' }))
    expect(within(res).getByTestId('prospectos')).not.toHaveTextContent(/^913$/)
  })

  it('aprobar exige abrir el contenido: «Abre para aprobar» → Abrir → Aprobar', async () => {
    montar()
    await seccion(/herramientas/i)
    await userEvent.click(within(panel()).getByRole('button', { name: /perfil del cliente ideal/i }))
    // El ICP ya está aprobado; probamos con la adquisición (hipótesis) en la calculadora
    await userEvent.click(within(panel()).getByRole('button', { name: /calculadora de adquisición/i }))
    const tarjeta = await within(panel()).findByRole('article', { name: /Decisión: Outbound/ })
    const bloqueado = within(tarjeta).getByRole('button', { name: 'Abre para aprobar' })
    expect(bloqueado).toBeDisabled()
    await userEvent.click(within(tarjeta).getByRole('button', { name: /abrir/i }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByText(/Depende de esto/)).toBeInTheDocument()
    await userEvent.click(within(dialogo).getByRole('button', { name: /aprobar versión 1/i }))
    await waitFor(() => expect(within(tarjeta).getByText('Aprobado')).toBeInTheDocument())
  })

  it('cliente: el aviso de Strategy se ve y el hilo marca lo que depende', async () => {
    montar()
    await seccion(/cliente/i)
    const avisos = await within(panel()).findByRole('region', { name: 'Avisos' })
    expect(avisos).toHaveTextContent(/Strategy cambió «dolor #2»/)
    await userEvent.click(within(avisos).getByRole('button', { name: /ver en el hilo/i }))
    const hilo = within(panel()).getByRole('region', { name: 'Hilo del cliente' })
    expect(within(hilo).getByRole('button', { pressed: true })).toHaveTextContent(/dolor #2/)
    expect(within(hilo).getByText(/↓ ángulo #2/)).toBeInTheDocument()
    expect(within(hilo).getByText(/↑ perfil del cliente ideal/)).toBeInTheDocument()
  })

  it('el workspace cambia con el rol: el editor ve el editor de video, no el ICP', async () => {
    montar()
    screen.getByRole('button', { name: /ver como/i }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Editor de video' }))
    await seccion(/herramientas/i)
    const nav = within(panel()).getByRole('navigation', { name: 'Herramientas' })
    expect(within(nav).getAllByRole('button').map((b) => b.textContent)).toEqual(['Editor de video', 'Production Pre'])
    expect(within(panel()).getByRole('region', { name: /editor de video/i })).toBeInTheDocument()
  })

  it('@estrategia: sugiere el agente, pide tu aporte en el chat, escribe el documento en vivo y deja tarjetas', async () => {
    montar()
    await userEvent.click(screen.getByRole('tab', { name: /^chat$/i }))
    const caja = screen.getByLabelText('Mensaje')
    fireEvent.change(caja, { target: { value: '@est' } })
    const lista = await screen.findByRole('listbox', { name: 'Agentes' })
    expect(within(lista).getByText('@estrategia')).toBeInTheDocument()
    fireEvent.keyDown(caja, { key: 'Enter' })
    expect(caja).toHaveValue('@estrategia ')
    fireEvent.change(caja, { target: { value: '@estrategia arma los dolores' } })
    await userEvent.click(screen.getByRole('button', { name: /enviar/i }))

    // La pregunta del agente va en el chat, no en el panel
    const pregunta = await screen.findByRole('group', { name: 'Pregunta de Claude' })
    await userEvent.click(within(pregunta).getByRole('radio', { name: /Asistentes de gerencia/ }))
    await userEvent.click(within(pregunta).getByRole('button', { name: 'Responder' }))

    // Pestaña del agente: documento en vivo
    const vivo = await within(panel()).findByRole('region', { name: /Trabajo en vivo de Strategy/ })
    await waitFor(() => expect(vivo).toHaveTextContent(/Nadie confirma cuántas personas van/))
    expect(vivo).toHaveTextContent(/etapa 3\/4: Dolores y deseos/)

    // Tarjetas en el chat: la propuesta y el dato que cambió
    const propuesta = await screen.findByRole('article', { name: /Propuesta: Nadie confirma/ })
    expect(within(propuesta).getByText(/viene de Strategy: perfil del cliente ideal/)).toBeInTheDocument()
    await userEvent.click(within(propuesta).getByRole('button', { name: /guardar como hipótesis/i }))
    expect(await screen.findAllByRole('article', { name: /Decisión: Nadie confirma/ })).not.toHaveLength(0)
    const cambio = screen.getAllByRole('article', { name: /Decisión: La comida llega tarde/ })[0]
    expect(within(cambio).getByText(/Cambió · \d+ dependen/)).toBeInTheDocument()
  })
})
