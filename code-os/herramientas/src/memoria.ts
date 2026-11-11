import type { Almacen } from './almacen.js';
import { ErrorHerramienta, malo } from './errores.js';
import { aGraphify, aMarkdown, etiqueta, type GrafoGraphify } from './grafo.js';
import { validarIcp } from './icp.js';
import { AREA_TIPO, ID_RE, TIPOS, type Aviso, type DatosCliente, type Nodo, type TipoNodo, type VersionNodo } from './tipos.js';

export interface NuevoNodo { tipo: TipoNodo; titulo: string; contenido?: unknown; fuente?: string; viene_de?: string[]; id?: string }
export interface CambiosNodo { titulo?: string; contenido?: unknown; fuente?: string; viene_de?: string[]; /** Versión que la persona editó; si ya no es la actual → 409. */ version?: number }
export interface Dependiente { id: string; tipo: TipoNodo; numero: number; titulo: string; estado: Nodo['estado']; distancia: number; ruta: string[] }
export interface ResumenCliente { id: string; nodos: number; avisos_pendientes: number; actualizado: string | null }

const MAX_CONTENIDO = 200_000;
const MAX_VIENE_DE = 50;
const noExiste = (id: string) => new ErrorHerramienta(404, `El nodo «${id}» no existe`);
const ahora = () => new Date().toISOString();
const foto = (n: Nodo): VersionNodo => { const { leido_por: _, ...resto } = n; return structuredClone(resto); };

function validarTitulo(t: unknown): string {
  if (typeof t !== 'string' || !t.trim() || t.length > 300) throw malo('«titulo» es obligatorio (máx. 300 caracteres)');
  return t.trim();
}
function validarFuente(f: unknown): string {
  if (f === undefined) return 'hipótesis';
  if (typeof f !== 'string' || !f.trim() || f.length > 2000) throw malo('«fuente» debe ser un enlace o «hipótesis»');
  return f.trim();
}
function validarContenido(tipo: TipoNodo, c: unknown): unknown {
  if (c === undefined) return null;
  if (JSON.stringify(c).length > MAX_CONTENIDO) throw malo('«contenido» demasiado grande (máx. 200 000 caracteres)');
  if (tipo === 'icp' && c !== null) {
    const v = validarIcp(c);
    if (!v.ok) throw malo(`ICP inválido: ${v.errores.map((e) => `${e.campo}: ${e.mensaje}`).join('; ')}`, v);
  }
  return c;
}
function validarUsuario(u: string) { if (typeof u !== 'string' || !u.trim()) throw malo('Falta quién hace el cambio'); return u; }

/** Hijos directos de cada nodo (quién lo tiene en `viene_de`), en orden de creación. */
function hijos(d: DatosCliente): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const n of Object.values(d.nodos)) for (const p of n.viene_de) { const l = m.get(p) ?? []; l.push(n.id); m.set(p, l); }
  return m;
}

/** Recorrido a lo ancho: todos los que dependen de `id`, cada uno una vez y por el camino más corto. */
function calcularDependientes(d: DatosCliente, id: string): Dependiente[] {
  const h = hijos(d);
  const out: Dependiente[] = [];
  const visto = new Set([id]);
  let frente: string[][] = [[id]];
  while (frente.length) {
    const sig: string[][] = [];
    for (const ruta of frente) for (const c of h.get(ruta[ruta.length - 1]!) ?? []) {
      if (visto.has(c)) continue;
      visto.add(c);
      const n = d.nodos[c]!; const r = [...ruta, c];
      out.push({ id: c, tipo: n.tipo, numero: n.numero, titulo: n.titulo, estado: n.estado, distancia: r.length - 1, ruta: r });
      sig.push(r);
    }
    frente = sig;
  }
  return out;
}

function validarVieneDe(d: DatosCliente, v: unknown, propio?: string): string[] {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.length > MAX_VIENE_DE || v.some((x) => typeof x !== 'string')) throw malo(`«viene_de» debe ser una lista de ids (máx. ${MAX_VIENE_DE})`);
  const ids = [...new Set(v as string[])];
  for (const p of ids) if (!d.nodos[p]) throw malo(`«viene_de»: el nodo «${p}» no existe en este cliente`);
  if (propio) {
    if (ids.includes(propio)) throw malo('«viene_de»: un nodo no puede venir de sí mismo (ciclo)');
    const abajo = new Set(calcularDependientes(d, propio).map((x) => x.id));
    const malos = ids.filter((p) => abajo.has(p));
    if (malos.length) throw malo(`«viene_de»: ${malos.join(', ')} ya depende de este nodo; eso cerraría un ciclo`);
  }
  return ids;
}

function mensajeAviso(d: DatosCliente, origen: Nodo, dep: Dependiente): string {
  const via = dep.ruta.slice(1, -1).map((id) => etiqueta(d.nodos[id]!));
  return `cambió ${AREA_TIPO[origen.tipo]}: ${etiqueta(origen)} «${origen.titulo}» → revisa ${etiqueta(dep)} «${dep.titulo}»${via.length ? ` (vía ${via.join(', ')})` : ''}`;
}

function resolverAvisosDe(d: DatosCliente, nodo: string, usuario: string) {
  const t = ahora();
  for (const a of d.avisos) if (!a.resuelto && a.nodo === nodo) Object.assign(a, { resuelto: true, resuelto_por: usuario, resuelto_en: t });
}

/** Genera (o refresca, si ya había uno pendiente con el mismo origen) un aviso por cada dependiente. */
function avisar(d: DatosCliente, cliente: string, origen: Nodo): Aviso[] {
  const out: Aviso[] = [];
  for (const dep of calcularDependientes(d, origen.id)) {
    const mensaje = mensajeAviso(d, origen, dep);
    let a = d.avisos.find((x) => !x.resuelto && x.nodo === dep.id && x.origen === origen.id);
    if (a) Object.assign(a, { origen_version: origen.version, ruta: dep.ruta, mensaje, creado: ahora() });
    else { a = { id: `aviso-${++d.secuencia}`, cliente, nodo: dep.id, origen: origen.id, origen_version: origen.version, ruta: dep.ruta, mensaje, creado: ahora(), resuelto: false }; d.avisos.push(a); }
    out.push(structuredClone(a));
  }
  return out;
}

/**
 * Memoria viva del cliente: nodos con versión e historial, dependientes por `viene_de` y avisos al cambiar.
 * Toda la lógica vive aquí; el almacén solo guarda.
 */
export class Memoria {
  constructor(private almacen: Almacen) {}

  async clientes(): Promise<ResumenCliente[]> {
    const ids = await this.almacen.listarClientes();
    const out: ResumenCliente[] = [];
    for (const id of ids) {
      const d = await this.almacen.leer(id);
      const nodos = Object.values(d.nodos);
      const fechas = nodos.map((n) => n.actualizado).sort();
      out.push({ id, nodos: nodos.length, avisos_pendientes: d.avisos.filter((a) => !a.resuelto).length, actualizado: fechas[fechas.length - 1] ?? null });
    }
    return out;
  }

  async listar(cliente: string, filtro: { tipo?: string } = {}): Promise<Nodo[]> {
    if (filtro.tipo !== undefined && !TIPOS.includes(filtro.tipo as TipoNodo)) throw malo(`«tipo» debe ser uno de: ${TIPOS.join(', ')}`);
    const d = await this.almacen.leer(cliente);
    return Object.values(d.nodos).filter((n) => !filtro.tipo || n.tipo === filtro.tipo);
  }

  /** Lee sin marcar como leído (uso interno, agentes). */
  async obtener(cliente: string, id: string): Promise<Nodo> {
    const n = (await this.almacen.leer(cliente)).nodos[id];
    if (!n) throw noExiste(id);
    return n;
  }

  /** Abre el nodo: devuelve nodo + historial y registra que `usuario` leyó esta versión (habilita aprobar). */
  async leer(cliente: string, id: string, usuario: string): Promise<{ nodo: Nodo; historial: VersionNodo[] }> {
    validarUsuario(usuario);
    return this.almacen.transaccion(cliente, (d) => {
      const n = d.nodos[id];
      if (!n) throw noExiste(id);
      n.leido_por = [...n.leido_por.filter((l) => l.usuario !== usuario), { usuario, version: n.version, en: ahora() }];
      return { nodo: structuredClone(n), historial: structuredClone(d.historial[id] ?? []) };
    });
  }

  async crear(cliente: string, e: NuevoNodo, usuario: string): Promise<Nodo> {
    validarUsuario(usuario);
    if (!e || typeof e !== 'object') throw malo('Faltan los datos del nodo');
    if (!TIPOS.includes(e.tipo)) throw malo(`«tipo» debe ser uno de: ${TIPOS.join(', ')}`);
    const titulo = validarTitulo(e.titulo);
    const fuente = validarFuente(e.fuente);
    const contenido = validarContenido(e.tipo, e.contenido);
    if (e.id !== undefined && (typeof e.id !== 'string' || !ID_RE.test(e.id))) throw malo('«id» inválido: minúsculas, números y guiones (máx. 64)');
    return this.almacen.transaccion(cliente, (d) => {
      const viene_de = validarVieneDe(d, e.viene_de);
      const numero = Object.values(d.nodos).filter((n) => n.tipo === e.tipo).length + 1;
      let id = e.id;
      if (id && d.nodos[id]) throw new ErrorHerramienta(409, `Ya existe un nodo con id «${id}»`);
      if (!id) { let k = numero; while (d.nodos[`${e.tipo}-${k}`]) k++; id = `${e.tipo}-${k}`; }
      const t = ahora();
      const n: Nodo = { id, cliente, tipo: e.tipo, numero, titulo, contenido, estado: 'hipotesis', fuente, viene_de, version: 1, creado: t, actualizado: t, actualizado_por: usuario, leido_por: [] };
      d.nodos[id] = n;
      return structuredClone(n);
    });
  }

  async actualizar(cliente: string, id: string, c: CambiosNodo, usuario: string): Promise<{ nodo: Nodo; avisos: Aviso[] }> {
    validarUsuario(usuario);
    if (!c || typeof c !== 'object') throw malo('Faltan los cambios');
    return this.almacen.transaccion(cliente, (d) => {
      const n = d.nodos[id];
      if (!n) throw noExiste(id);
      if (c.version !== undefined && c.version !== n.version) throw new ErrorHerramienta(409, `El nodo cambió mientras lo editabas (vas en la versión ${c.version}, la actual es ${n.version}); vuelve a abrirlo`);
      const nuevo = {
        titulo: c.titulo !== undefined ? validarTitulo(c.titulo) : n.titulo,
        contenido: c.contenido !== undefined ? validarContenido(n.tipo, c.contenido) : n.contenido,
        fuente: c.fuente !== undefined ? validarFuente(c.fuente) : n.fuente,
        viene_de: c.viene_de !== undefined ? validarVieneDe(d, c.viene_de, id) : n.viene_de,
      };
      const antes = JSON.stringify([n.titulo, n.contenido, n.fuente, n.viene_de]);
      if (JSON.stringify([nuevo.titulo, nuevo.contenido, nuevo.fuente, nuevo.viene_de]) === antes) return { nodo: structuredClone(n), avisos: [] };
      (d.historial[id] ??= []).push(foto(n));
      Object.assign(n, nuevo, { version: n.version + 1, actualizado: ahora(), actualizado_por: usuario, estado: 'hipotesis' });
      delete n.aprobado_por; delete n.aprobado_en;
      resolverAvisosDe(d, id, usuario); // editarlo es revisarlo
      const avisos = avisar(d, cliente, n);
      return { nodo: structuredClone(n), avisos };
    });
  }

  /** Aprueba la versión actual. Regla F4.5: solo quien la abrió (`leido_por`) puede aprobarla. ICP: exige perfil completo. */
  async aprobar(cliente: string, id: string, usuario: string): Promise<Nodo> {
    validarUsuario(usuario);
    return this.almacen.transaccion(cliente, (d) => {
      const n = d.nodos[id];
      if (!n) throw noExiste(id);
      if (!n.leido_por.some((l) => l.usuario === usuario && l.version === n.version))
        throw new ErrorHerramienta(409, `Para aprobar, primero abre el nodo (versión ${n.version}); el OK se activa al leerlo`);
      if (n.tipo === 'icp') {
        const v = validarIcp(n.contenido ?? {});
        if (!v.completo) throw new ErrorHerramienta(409, `El ICP no está completo; faltan: ${v.faltan.join(', ') || v.errores.map((e) => e.campo).join(', ')}`, v);
      }
      if (n.estado !== 'aprobado') Object.assign(n, { estado: 'aprobado', aprobado_por: usuario, aprobado_en: ahora() });
      resolverAvisosDe(d, id, usuario);
      return structuredClone(n);
    });
  }

  async dependientes(cliente: string, id: string): Promise<Dependiente[]> {
    const d = await this.almacen.leer(cliente);
    if (!d.nodos[id]) throw noExiste(id);
    return calcularDependientes(d, id);
  }

  async avisos(cliente: string, op: { todos?: boolean } = {}): Promise<Aviso[]> {
    const d = await this.almacen.leer(cliente);
    return d.avisos.filter((a) => op.todos || !a.resuelto);
  }

  async resolverAviso(cliente: string, avisoId: string, usuario: string): Promise<Aviso> {
    validarUsuario(usuario);
    return this.almacen.transaccion(cliente, (d) => {
      const a = d.avisos.find((x) => x.id === avisoId);
      if (!a) throw new ErrorHerramienta(404, `El aviso «${avisoId}» no existe`);
      if (!a.resuelto) Object.assign(a, { resuelto: true, resuelto_por: usuario, resuelto_en: ahora() });
      return structuredClone(a);
    });
  }

  async grafo(cliente: string): Promise<GrafoGraphify> {
    return aGraphify([{ cliente, d: await this.almacen.leer(cliente) }]);
  }

  async grafoMarkdown(cliente: string): Promise<string> {
    return aMarkdown(cliente, await this.almacen.leer(cliente));
  }
}
