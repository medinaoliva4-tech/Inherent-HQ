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
  // jsdom no tiene canvas: el visor de diff mide texto con él.
  window.HTMLCanvasElement.prototype.getContext = (() => ({ font: '', measureText: (t: string) => ({ width: t.length * 7 }) })) as never
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

const nuevoCliente = () => crearClienteMock({ velocidad: 0, hilo: crearHiloMemoria({ persistir: false }) })
const montar = () => render(<App cliente={nuevoCliente()} embebido={false} />)

async function escribirYEnviar(texto: string) {
  const caja = screen.getByLabelText('Mensaje')
  fireEvent.change(caja, { target: { value: texto } })
  await userEvent.click(screen.getByRole('button', { name: /enviar/i }))
}

describe('Code: router, permisos, cambios y skills', () => {
  it('modo Auto: el router elige por tarea y se ve en el hilo', async () => {
    montar()
    await userEvent.click(screen.getByRole('button', { name: /elegir modelo/i }))
    const auto = await screen.findByRole('group', { name: 'Auto' })
    expect(auto).toHaveTextContent(/Chef principal · nivel-alto · esfuerzo máximo/)
    await userEvent.click(within(auto).getByRole('menuitemradio', { name: /Auto/ }))
    await escribirYEnviar('mejora la interfaz del panel')
    const nota = await screen.findByRole('note', { name: 'Elección del router' })
    // Con Claude por login (el mock lo da activo) se ve el modelo del orden del CEO
    expect(nota).toHaveTextContent(/Sous chef · nivel-alto \(Sonnet\): interfaz/)
    expect(nota).toHaveTextContent(/esfuerzo alto/)
  })

  it('«Aceptar ediciones» aprueba solo las ediciones; no hay «Saltar permisos»', async () => {
    montar()
    expect(screen.queryByRole('radio', { name: /saltar/i })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /aceptar ediciones/i }))
    await escribirYEnviar('hola')
    expect(await screen.findByText(/Apliqué el mapeo/)).toBeInTheDocument()
    expect(screen.getByText(/Aprobado solo \(Aceptar ediciones\)/)).toBeInTheDocument()
  })

  it('sesión aislada: se elige al crearla y Cambios la fusiona; los comentarios se envían', async () => {
    montar()
    await userEvent.click(screen.getByRole('button', { name: /nueva sesión/i }))
    await userEvent.click(await screen.findByRole('switch', { name: 'Sesión aislada' }))
    await userEvent.click(screen.getByRole('radio', { name: /aceptar ediciones/i }))
    await escribirYEnviar('hola')
    await screen.findByText(/Apliqué el mapeo/)
    const panel = screen.getByRole('complementary', { name: /panel lateral/i })
    await userEvent.click(within(panel).getByRole('tab', { name: /código/i }))
    await userEvent.click(within(panel).getByRole('tab', { name: 'Cambios' }))
    const fusionar = await within(panel).findByRole('button', { name: /fusionar/i })
    expect(fusionar).toBeEnabled()
    await userEvent.click(fusionar)
    expect(await within(panel).findByText('Fusionado con el proyecto.')).toBeInTheDocument()
    await userEvent.click(within(panel).getByRole('button', { name: /revisar/i }))
    expect(await within(panel).findByText(/Revisión pedida a Sous chef · nivel-alto/)).toBeInTheDocument()
  })

  it('/ lista también las skills del servidor', async () => {
    montar()
    const caja = screen.getByLabelText('Mensaje')
    fireEvent.change(caja, { target: { value: '/' } })
    const lista = await screen.findByRole('listbox', { name: 'Comandos' })
    await waitFor(() => expect(within(lista).getByText('/revisar-copy')).toBeInTheDocument())
  })

  it('memoria del cliente y skills cargadas en la página del cliente', async () => {
    montar()
    const panel = screen.getByRole('complementary', { name: /panel lateral/i })
    await userEvent.click(within(panel).getByRole('tab', { name: /cliente/i }))
    const ctx = await within(panel).findByRole('region', { name: /memoria y skills/i })
    await waitFor(() => expect(ctx).toHaveTextContent('clients/lumbre/CLAUDE.md'))
    expect(ctx).toHaveTextContent('/capturas')
  })
})

describe('embebido (?embed=1 dentro del Chat del OS)', () => {
  it('solo paneles: sin barra lateral ni caja de mensaje propias', async () => {
    render(<App cliente={nuevoCliente()} embebido />)
    expect(screen.queryByLabelText('Mensaje')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /proyectos/i })).not.toBeInTheDocument()
    const panel = screen.getByRole('complementary', { name: /panel lateral/i })
    const tabs = within(within(panel).getByRole('tablist', { name: 'Secciones del panel' })).getAllByRole('tab').map((t) => t.getAttribute('aria-label'))
    expect(tabs).toEqual(['Cliente', 'Agentes', 'Herramientas', 'Código'])
    expect(within(panel).queryByRole('button', { name: 'Cerrar panel' })).not.toBeInTheDocument()
    await userEvent.click(within(panel).getByRole('tab', { name: /código/i }))
    const codigo = within(panel).getAllByRole('tab').map((t) => t.getAttribute('aria-label'))
    expect(codigo).toEqual(expect.arrayContaining(['Cambios', 'Terminal']))
    expect(codigo).not.toContain('Tareas')
  })
})
