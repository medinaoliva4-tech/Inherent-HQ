import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'
import App from './App'
import { crearClienteMock } from './lib/cliente-mock'

beforeAll(() => {
  const mm = (q: string) => ({ matches: q.includes('min-width'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })
  window.matchMedia = mm as never
  window.HTMLElement.prototype.scrollTo = () => {}
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as never
})

describe('App', () => {
  it('muestra proyectos, conversaciones y el selector de modelo por nivel', async () => {
    render(<App cliente={crearClienteMock({ velocidad: 0 })} />)
    expect(screen.getByRole('navigation', { name: /proyectos/i })).toBeInTheDocument()
    expect(screen.getByText('Inherent OS')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /elegir modelo/i }))
    expect(await screen.findByText('Alto')).toBeInTheDocument()
    expect(screen.getByText('Medio', { selector: 'span.uppercase' })).toBeInTheDocument()
    expect(screen.getByText('Bajo')).toBeInTheDocument()
  })

  it('pide permiso y responde con la tecla S', async () => {
    render(<App cliente={crearClienteMock({ velocidad: 0 })} />)
    const caja = screen.getByLabelText('Mensaje')
    fireEvent.change(caja, { target: { value: 'hola' } })
    await userEvent.click(screen.getByRole('button', { name: /enviar/i }))
    expect(await screen.findByRole('alertdialog', { name: /permiso/i })).toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: 's' })
    await waitFor(() => expect(screen.getByText(/Permitido esta vez/)).toBeInTheDocument())
    expect(await screen.findByText(/Apliqué el mapeo/)).toBeInTheDocument()
  })

  it('el tema alterna entre oscuro y claro', async () => {
    render(<App cliente={crearClienteMock({ velocidad: 0 })} />)
    expect(document.documentElement.dataset.theme).toBe('dark')
    await userEvent.click(screen.getByRole('button', { name: /modo claro/i }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
