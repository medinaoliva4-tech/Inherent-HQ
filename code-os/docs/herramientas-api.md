# API de herramientas · Code OS

La sirve el puente (`code-os/puente`); la lógica vive en `code-os/herramientas`. **Todas las rutas exigen el mismo token o cookie que el resto del puente** (`Authorization: Bearer <token>`); sin él dan `401`. El usuario del token es quien queda en `actualizado_por`, `leido_por`, `aprobado_por` y `resuelto_por`. Si el servidor no tiene la memoria activa, todo responde `503`.

Errores: `{ "error": "mensaje en español", "detalle"?: … }` con `400` (entrada inválida), `404` (no existe), `405` (método), `409` (regla o conflicto de versión).

Ids de cliente, nodo y aviso: minúsculas, números y guiones, máx. 64 (`akai`, `dolor-2`, `aviso-7`).

## Tipos

```ts
type TipoNodo = 'producto' | 'icp' | 'dolor' | 'deseo' | 'pilar' | 'angulo' | 'campana' | 'pieza' | 'decision' | 'adquisicion';

interface Nodo {
  id: string;              // estable; por defecto `${tipo}-${numero}` (dolor-2)
  cliente: string;
  tipo: TipoNodo;
  numero: number;          // «dolor #2»; no cambia
  titulo: string;          // 1–300
  contenido: unknown;      // texto o JSON (≤ 200 000). Para icp: objeto Icp (abajo)
  estado: 'hipotesis' | 'aprobado';
  fuente: string;          // enlace o «hipótesis» (por defecto)
  viene_de: string[];      // ids del mismo cliente; sin ciclos
  version: number;         // empieza en 1; sube con cada cambio real
  creado: string;          // ISO
  actualizado: string;     // ISO
  actualizado_por: string;
  leido_por: { usuario: string; version: number; en: string }[];  // una entrada por persona (la última versión que abrió)
  aprobado_por?: string;
  aprobado_en?: string;
}
type VersionNodo = Omit<Nodo, 'leido_por'>;

interface Aviso {
  id: string;              // aviso-N
  cliente: string;
  nodo: string;            // el que hay que revisar
  origen: string;          // el que cambió
  origen_version: number;
  ruta: string[];          // origen → … → nodo
  mensaje: string;         // «cambió Strategy: dolor #2 «X» → revisa pilar #1 «Y» (vía ángulo #3)»
  creado: string;
  resuelto: boolean;
  resuelto_por?: string;
  resuelto_en?: string;
}

interface Dependiente { id: string; tipo: TipoNodo; numero: number; titulo: string; estado: 'hipotesis' | 'aprobado'; distancia: number; ruta: string[] }
```

## Memoria del cliente

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /clientes` | — | `200 { clientes: { id, nodos: number, avisos_pendientes: number, actualizado: string \| null }[] }` |
| `GET /clientes/:id/nodos[?tipo=dolor]` | — | `200 { nodos: Nodo[] }` (orden de creación; cliente sin datos → `[]`) |
| `POST /clientes/:id/nodos` | `{ tipo, titulo, contenido?, fuente?, viene_de?, id? }` | `201 { nodo: Nodo }` (siempre nace `hipotesis`, versión 1). `409` si el `id` ya existe |
| `GET /clientes/:id/nodos/:nid` | — | `200 { nodo: Nodo, historial: VersionNodo[] }` y **marca que tú leíste la versión actual** (habilita aprobar) |
| `PUT /clientes/:id/nodos/:nid` | `{ titulo?, contenido?, fuente?, viene_de?, version? }` | `200 { nodo: Nodo, avisos: Aviso[] }` — `avisos` = los creados o refrescados para todos los dependientes (recursivo). Si `version` no es la actual → `409`. Sin cambios reales → misma versión y `avisos: []`. Un nodo aprobado que se edita vuelve a `hipotesis`. Editarlo resuelve sus propios avisos pendientes |
| `POST /clientes/:id/nodos/:nid/aprobar` | — | `200 { nodo: Nodo }`. **`409` si tú no abriste (GET) la versión actual** (regla F4.5). ICP: `409` si no está completo. Resuelve los avisos pendientes del nodo |
| `GET /clientes/:id/nodos/:nid/dependientes` | — | `200 { nodo: string, dependientes: Dependiente[] }` (a lo ancho: cada uno una vez, por su camino más corto) |
| `GET /clientes/:id/avisos[?todos=1]` | — | `200 { avisos: Aviso[] }` (solo pendientes; con `todos=1`, también resueltos) |
| `POST /clientes/:id/avisos/:aid/resolver` | — | `200 { aviso: Aviso }` |
| `GET /clientes/:id/grafo[?formato=graphify\|markdown]` | — | `graphify` (por defecto): el `graph.json` de graphify (abajo). `markdown`: `200 { markdown: string }` |

Un aviso pendiente por par (nodo, origen): si el origen vuelve a cambiar, se refresca (versión, mensaje, fecha) en vez de duplicarse.

## Calculadoras

### `POST /calc/outbound`

```ts
// cuerpo
{ m: number; c: number; P: number; w: number;
  oferta_comprobada?: boolean;
  sugerencia?: { c: number; fuente: string; etiqueta: 'hipótesis' | 'evidencia'; autor?: string; nota?: string } }
// 200
{ resultado: { n: number; por_semana: number; por_dia_habil: number; probabilidad: number; texto: string; entradas: {…lo mismo, validado} } }
```

- `n` = menor entero con P(Binomial(n, c) ≥ m) ≥ P · `por_semana` = ceil(n / w) · `por_dia_habil` = ceil(n / (w·5)).
- Referencia: `{m:5, c:0.01, P:0.95, w:4}` → `n 913 · por_semana 229 · por_dia_habil 46`.
- Rangos: `m` entero 0–100 000 · `c` en (0, 1] · `P` en (0, 1) · `w` en (0, 520]. `m = 0` → todo 0. `c = 1` → `n = m`.
- `texto` es fijo: «La probabilidad es una estimación estadística, no una garantía; …».
- La sugerencia la propone el agente con IA; aquí solo se guarda tal cual (con fuente y etiqueta obligatorias).

### `POST /calc/inbound`

```ts
// cuerpo (EntradaInbound)
{ clientes_meta: number;                                   // entero ≥ 1
  tasas: { clic: number; lead: number; cliente: number };  // alcance→clic, clic→lead, lead→cliente, en (0, 1]
  engagement_objetivo: number;                             // [0, 1]
  frecuencia?: number;    // impresiones por persona, 1–100 (por defecto 1)
  presupuesto?: number; cpm?: number; cpc?: number;        // > 0
  segmentacion?: string; angulos?: string[]; moneda?: string /* USD, GTQ */ }
// 200
{ resultado: {
    clientes: number; leads: number; clics: number; alcance: number; impresiones: number; interacciones_objetivo: number;
    presupuesto_estimado: { por_cpm: number | null; por_cpc: number | null; estimado: number | null };  // estimado = el mayor
    con_presupuesto: { presupuesto: number; alcanza: boolean; faltante: number; clientes_esperados: number } | null;
    reels_prueba: { angulo: string; impresiones: number; presupuesto: number | null; engagement_minimo: number; interacciones_minimas: number }[];
    engagement_real: number | null;
    origen: Record<'clic' | 'lead' | 'cliente' | 'engagement' | 'frecuencia' | 'cpm' | 'cpc', Origen>;
    entradas: EntradaInbound } }

type Origen = { fuente: 'supuesto' } | { fuente: 'real'; desde: string; hasta: string; numerador: number; denominador: number };
```

### `POST /calc/icp`

Cuerpo: un `Icp` (completo o parcial). `200 { validacion: { ok, completo, faltan: string[], errores: {campo, mensaje}[], alertas: string[] } }`.

```ts
interface Icp {
  moneda: string;                                        // USD, GTQ…
  facturacion_mensual: { min: number; max?: number };
  ticket_promedio: number;
  frecuencia_ventas: { ventas: number; periodo: 'dia' | 'semana' | 'mes' };
  demanda: 'alta' | 'media' | 'baja';
  ciclo_comercial: { dias: number };
  margen: number;                                        // 0–1
  capacidad: string; decisor: string;
  industrias: string[]; perfiles?: string[];
  geografia: string[]; canales: string[];
  regla_guia: { multiplo: number; precio_producto: number; texto?: string; ciclo_rapido_dias?: number };
}
```

Un nodo `icp` se puede guardar parcial (`ok`), pero para aprobarlo tiene que estar `completo`. Campos desconocidos son error.

### `POST /clientes/:id/calibrar`

```ts
// cuerpo
{ entradas: EntradaInbound;
  analytics: <JSON de Zernio>;                               // ver formatos aceptados
  extras?: { desde?: string; hasta?: string; leads?: number; ventas?: number; gasto?: number };
  guardar_en?: string }                                      // id de un nodo (p. ej. adquisicion-1)
// 200
{ resultado: <resultado inbound con las tasas reales>;
  calibracion: { origen: Origenes; advertencias: string[]; metricas: { desde, hasta, impresiones, alcance, clics?, interacciones, leads?, ventas?, publicaciones?, gasto? } };
  nodo?: Nodo; avisos?: Aviso[] }   // si hubo guardar_en: contenido.inbound = resultado, fuente = «Zernio analytics <desde> a <hasta>»
```

Formatos de `analytics` aceptados (no se llama a Zernio desde aquí; la sesión que tenga el MCP de Zernio pasa el JSON):
- **Métricas diarias** (`analytics_get_daily_metrics`): `{ totals: { impressions, reach, likes, comments, shares, saves, clicks, … }, dateRange?: {from, to}, dailyData?|days?: [{date, …}] }`.
- **Lista de posts** (`analytics_get_analytics`): `{ posts: [{ publishedAt, analytics|metrics: { impressions, reach, engagement? | likes, comments, shares, saves, clicks } }] }`.
- Leads, ventas y gasto no vienen en analytics: van en `extras` o en el mismo JSON (`leads`, `ventas`|`sales`, `gasto`|`spend`).

Qué reemplaza: clic = clics/alcance · lead = leads/clics · cliente = ventas/leads · frecuencia = impresiones/alcance · CPM = gasto·1000/impresiones · CPC = gasto/clics. Con denominador < 1000 avisa «muestra chica». Tasa 0, > 1 o sin dato → se queda la supuesta y avisa.

## Grafo para graphify

`GET /clientes/:id/grafo` o `npm run grafo -- <data>/herramientas [cliente] [salida]` (en `code-os/herramientas`) escribe `graph.json` + `hilo.md`. Formato node-link de NetworkX, **no dirigido** (graphify recorre en los dos sentidos; la dirección queda en `source → target` = hijo → padre):

```json
{ "directed": false, "multigraph": false, "graph": {"fuente": "code-os/herramientas", "clientes": ["akai"], "generado": "…"},
  "nodes": [{ "id": "akai:dolor-2", "label": "dolor #2 · Comer en el escritorio", "norm_label": "dolor #2 · comer en el escritorio",
              "file_type": "concept", "source_file": "memoria/akai", "source_location": null, "community": null,
              "cliente": "akai", "tipo": "dolor", "numero": 2, "estado": "hipotesis", "version": 1, "fuente": "hipótesis", "actualizado": "…", "contenido": "…" }],
  "links": [{ "source": "akai:pilar-1", "target": "akai:dolor-2", "relation": "viene_de", "confidence": "EXTRACTED", "confidence_score": 1, "weight": 1, "source_file": "memoria/akai" }],
  "hyperedges": [] }
```

Con la salida en `graphify-out/graph.json`: `graphify query "qué depende de dolor comer en el escritorio"`, `graphify path "dolor #2 · …" "pieza #1 · …"` y `graphify explain` funcionan sin extraer nada (probado con graphify instalado).

## Conectar con la base de ceo-os

`Memoria` solo usa la interfaz `Almacen` (`src/almacen.ts`): `listarClientes()`, `leer(cliente)` y `transaccion(cliente, fn)`. Para pasar de archivos JSON a la base de ceo-os:

1. Tablas: `hilo_nodos (cliente, id, tipo, numero, titulo, contenido jsonb, estado, fuente, viene_de text[], version, creado, actualizado, actualizado_por, leido_por jsonb, aprobado_por, aprobado_en, PRIMARY KEY (cliente, id))`, `hilo_versiones (cliente, id, version, foto jsonb)`, `hilo_avisos (cliente, id, nodo, origen, origen_version, ruta text[], mensaje, creado, resuelto, resuelto_por, resuelto_en)` y `hilo_clientes (cliente, secuencia)`.
2. Escribir `AlmacenCeoOs implements Almacen`: `leer` arma un `DatosCliente` con tres SELECT; `transaccion` hace `BEGIN`, `SELECT … FROM hilo_clientes WHERE cliente = $1 FOR UPDATE` (serializa por cliente), carga, corre `fn`, escribe la diferencia (upsert de nodos, insert de versiones nuevas, upsert de avisos) y `COMMIT`; si `fn` lanza, `ROLLBACK`.
3. Migrar: por cada `<data>/herramientas/<cliente>.json`, `transaccion(cliente, d => Object.assign(d, json))`.
4. En `puente/src/server.ts` cambiar `new AlmacenJson(…)` por el nuevo almacén. La API y las pruebas de `Memoria` no cambian (correr `memoria.test.ts` también contra el nuevo almacén).
