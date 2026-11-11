import { describe, expect, it } from 'vitest'
import { nodosEjemplo } from '@/data/departamentos'
import { crearClienteMock } from './cliente-mock'
import { crearClienteHttp } from './cliente-http'
import { NoDisponible } from './cliente'
import { ancestrosDe, dependientesDe, etiquetaNodo, origenDe } from './hilo'
import { crearHiloMemoria } from './hilo-memoria'

describe('hilo', () => {
  const todos = nodosEjemplo()
  it('etiqueta y origen: «viene de Strategy: dolor #2»', () => {
    const angulo2 = todos.find((n) => n.id === 'lu-angulo-2')!
    expect(origenDe(angulo2, todos)).toBe('viene de Strategy: dolor #2')
    expect(etiquetaNodo(todos.find((n) => n.id === 'lu-icp')!, todos)).toBe('perfil del cliente ideal')
  })

  it('dependientes transitivos y ancestros', () => {
    const deps = dependientesDe('lu-dolor-2', todos).map((n) => n.id)
    expect(deps).toEqual(expect.arrayContaining(['lu-pilar-2', 'lu-angulo-2', 'lu-idea-2', 'lu-campana-1', 'lu-pieza-2', 'lu-pre']))
    expect(deps).not.toContain('lu-dolor-1')
    expect(ancestrosDe('lu-pieza-2', todos).map((n) => n.id)).toEqual(expect.arrayContaining(['lu-campana-1', 'lu-angulo-2', 'lu-dolor-2', 'lu-icp', 'lu-producto']))
  })
})

describe('hilo en el cliente mock', () => {
  const nuevo = () => crearClienteMock({ velocidad: 0, hilo: crearHiloMemoria({ persistir: false }) })

  it('lista clientes, nodos y el aviso inicial', async () => {
    const c = nuevo()
    expect((await c.clientes()).map((m) => m.id)).toContain('lumbre')
    expect((await c.nodos('lumbre')).length).toBeGreaterThan(20)
    const av = await c.avisos('lumbre')
    expect(av[0]).toMatchObject({ nodo: 'lu-dolor-2' })
    expect(av[0].afectados).toContain('lu-angulo-2')
  })

  it('aprobar exige haber abierto la versión actual (409)', async () => {
    const c = nuevo()
    const n = await c.nodo('lumbre', 'lu-angulo-2')
    await expect(c.aprobarNodo('lumbre', n.id, { version: n.version + 1 })).rejects.toThrow(/Abre el contenido/)
    const ok = await c.aprobarNodo('lumbre', n.id, { version: n.version })
    expect(ok.estado).toBe('aprobado')
    // lo aprobado sale del aviso
    expect((await c.avisos('lumbre'))[0].afectados).not.toContain('lu-angulo-2')
  })

  it('guardar sube la versión, vuelve a hipótesis y avisa a lo que depende', async () => {
    const c = nuevo()
    const g = await c.guardarNodo('lumbre', 'lu-dolor-1', { titulo: 'Coordinar comida es un caos' })
    expect(g).toMatchObject({ version: 2, estado: 'hipotesis' })
    const av = (await c.avisos('lumbre')).find((a) => a.nodo === 'lu-dolor-1')!
    expect(av.afectados).toEqual(expect.arrayContaining(['lu-pilar-1', 'lu-angulo-1', 'lu-historia']))
    expect(av.mensaje).toContain('dolor #1')
  })

  it('crear: nace como hipótesis, con los orígenes que existen', async () => {
    const c = nuevo()
    const x = await c.crearNodo('lumbre', { tipo: 'dolor', titulo: 'Nuevo', viene_de: ['lu-icp', 'no-existe'] })
    expect(x).toMatchObject({ estado: 'hipotesis', fuente: 'hipótesis', viene_de: ['lu-icp'], version: 1 })
  })

  it('calculadora: misma fórmula en el mock', async () => {
    expect(await nuevo().calcOutbound({ meta: 5, conversion: 0.01, probabilidad: 0.95, semanas: 4 })).toEqual({ prospectos: 913, porSemana: 229, porDiaHabil: 46 })
  })
})

describe('hilo en el cliente http', () => {
  const respuesta = (estado: number, cuerpo: unknown) => new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'content-type': 'application/json' } })

  it('llama a las rutas acordadas con el token, en la URL de herramientas', async () => {
    const llamadas: { url: string; init?: RequestInit }[] = []
    const f = (async (url: string, init?: RequestInit) => {
      llamadas.push({ url, init })
      return respuesta(200, url.endsWith('/aprobar') ? { id: 'x', estado: 'aprobado' } : [])
    }) as typeof fetch
    const c = crearClienteHttp({ url: 'http://puente', token: 't0k', herramientasUrl: 'http://herr' }, f)
    await c.nodos('lumbre')
    await c.aprobarNodo('lumbre', 'lu-icp', { version: 3 })
    await c.dependientes('lumbre', 'lu-icp')
    expect(llamadas.map((l) => l.url)).toEqual(['http://herr/clientes/lumbre/nodos', 'http://herr/clientes/lumbre/nodos/lu-icp/aprobar', 'http://herr/clientes/lumbre/nodos/lu-icp/dependientes'])
    expect(JSON.parse(String(llamadas[1].init?.body))).toEqual({ version: 3 })
    expect((llamadas[0].init?.headers as Record<string, string>).authorization).toBe('Bearer t0k')
  })

  it('404 = aún no está en el backend; las calculadoras se resuelven en el navegador', async () => {
    const f = (async () => respuesta(404, { error: 'no' })) as typeof fetch
    const c = crearClienteHttp({ url: 'http://puente' }, f)
    await expect(c.nodos('lumbre')).rejects.toBeInstanceOf(NoDisponible)
    expect(await c.calcOutbound({ meta: 5, conversion: 0.01, probabilidad: 0.95, semanas: 4 })).toEqual({ prospectos: 913, porSemana: 229, porDiaHabil: 46 })
  })

  it('si el puente responde con la página HTML (ruta que no es de su API), es «aún no está»', async () => {
    const f = (async () => new Response('<!doctype html><title>Code OS</title>', { status: 200, headers: { 'content-type': 'text/html' } })) as typeof fetch
    const c = crearClienteHttp({ url: '' }, f)
    await expect(c.clientes()).rejects.toBeInstanceOf(NoDisponible)
  })

  it('409 al aprobar sin leer se explica en español', async () => {
    const f = (async () => respuesta(409, {})) as typeof fetch
    const c = crearClienteHttp({ url: 'http://puente' }, f)
    await expect(c.aprobarNodo('lumbre', 'x', { version: 1 })).rejects.toThrow(/Abre el contenido/)
  })
})
