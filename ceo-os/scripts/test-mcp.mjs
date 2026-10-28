// Pruebas de los comandos de MCPs de Inherent AI (public/js/mcp-hermes.js): nombre y URL validados, comandos sin llave real ni caracteres
// para inyectar en la shell, y los sugeridos listos para pegar. Puro: sin red ni DOM.
// npm run test:mcp
import assert from 'node:assert/strict';
import { SUGERIDOS, AUTORIZACIONES, MARCADOR_LLAVE, COMANDO_LISTA, nombreValido, urlValida, errorNombre, errorUrl, comandosAgregar, comandosQuitar, comandosProbar, comandosAutorizar, notaAgregar } from '../public/js/mcp-hermes.js';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const hostiles = ['a;b', 'a b', 'a$(id)', 'a`id`', 'a|b', 'a&b', "a'b", 'a"b', '$HOME', '../x', 'a/b', 'a\nb', '-rf', '--help', 'A', 'a', 'x'.repeat(41), '', ' ', 'ñandú', 'a.b', 'a_b'];

t('nombreValido: minúsculas, números y guion, de 2 a 40', () => {
  for (const n of ['inherent', 'notion', 'mi-mcp', 'a1', 'x'.repeat(40), '1password', 'ga4-reportes']) assert.ok(nombreValido(n), n);
  for (const n of hostiles) assert.ok(!nombreValido(n), JSON.stringify(n));
  for (const n of [null, undefined, 5, {}, [], ['abc']]) assert.ok(!nombreValido(n), String(n));
  assert.ok(nombreValido('  notion  '), 'recorta los espacios de los lados');
  assert.ok(!nombreValido('-inherent'), 'un guion al inicio sería una opción del comando');
});

t('urlValida: https, o http solo hacia esta compu', () => {
  for (const u of ['https://inherent-work.vercel.app/mcp', 'https://mcp.ejemplo.com/v1/mcp', 'https://ejemplo.com:8443/mcp', 'http://127.0.0.1:8765/mcp', 'http://localhost:3000/mcp', 'http://localhost/mcp']) assert.ok(urlValida(u), u);
  for (const u of ['', ' ', 'http://ejemplo.com/mcp', 'http://127.0.0.1.evil.com/mcp', 'http://localhost.evil.com/mcp', 'http://10.0.0.5/mcp', 'http://[::1]/mcp', 'ftp://ejemplo.com/mcp', 'javascript:alert', 'javascript:alert(1)', 'data:text/html,hola', 'file:///etc/passwd', '//ejemplo.com/mcp', 'ejemplo.com/mcp', 'https://', 'https:///mcp']) assert.ok(!urlValida(u), JSON.stringify(u));
  for (const u of [null, undefined, 5, {}, ['https://ejemplo.com/mcp']]) assert.ok(!urlValida(u), String(u));
});

t('urlValida: nada que la shell interprete ni llaves dentro de la URL', () => {
  const base = 'https://ejemplo.com/mcp';
  for (const x of [';rm -rf /', '$(id)', '`id`', '|cat', '&x', "'x", '"x', ' x', '\nid', '\\x', '*', '(x)', '{a}', '<x>', '!x', '?llave=sk-123', '#frag', '=x']) assert.ok(!urlValida(base + x), JSON.stringify(x));
  assert.ok(!urlValida('https://usuario:clave@ejemplo.com/mcp'), 'sin usuario ni clave en la URL');
  assert.ok(!urlValida('https://usuario@ejemplo.com/mcp'));
  assert.ok(!urlValida('https://ejemplo.com/mcp?token=sk-abc123'), 'la llave no viaja en la URL');
  assert.ok(!urlValida('https://ejemplo.com/' + 'a'.repeat(300)), 'largo máximo');
});

t('errorNombre / errorUrl: vacío cuando sirve, un mensaje cuando no', () => {
  assert.equal(errorNombre('notion'), ''); assert.equal(errorUrl('https://ejemplo.com/mcp'), '');
  assert.match(errorNombre(''), /Falta/); assert.match(errorUrl(''), /Falta/);
  assert.match(errorNombre('A b'), /minúsculas/); assert.match(errorUrl('http://ejemplo.com'), /https/);
});

t('comandosAgregar con OAuth: url, auth, login y test, en orden', () => {
  const c = comandosAgregar({ nombre: 'notion', url: 'https://mcp.ejemplo.com/mcp', auth: 'oauth' });
  assert.deepEqual(c, ['inherent config set mcp_servers.notion.url https://mcp.ejemplo.com/mcp', 'inherent config set mcp_servers.notion.auth oauth', 'inherent mcp login notion', 'inherent mcp test notion']);
});

t('comandosAgregar con llave: solo el marcador, jamás la llave', () => {
  const llave = 'sk-REAL-0123456789abcdef';
  const c = comandosAgregar({ nombre: 'notion', url: 'https://mcp.ejemplo.com/mcp', auth: 'llave', llave, key: llave, token: llave, headers: { Authorization: `Bearer ${llave}` } });
  assert.equal(c.length, 3);
  assert.equal(c[1], `inherent config set mcp_servers.notion.headers.Authorization "Bearer ${MARCADOR_LLAVE}"`);
  assert.equal(c[2], 'inherent mcp test notion');
  assert.ok(!c.join('\n').includes(llave) && !/sk-/.test(c.join('\n')), 'la llave no entra al comando');
  assert.ok(!c.some((x) => /login/.test(x)), 'con llave no hay login de OAuth');
  assert.match(notaAgregar('llave'), /Terminal/); assert.match(notaAgregar('llave'), /no en el OS/); assert.ok(notaAgregar('llave').includes(MARCADOR_LLAVE));
});

t('comandosAgregar sin autorización: url y test', () => {
  assert.deepEqual(comandosAgregar({ nombre: 'local', url: 'http://127.0.0.1:8765/mcp', auth: 'ninguna' }), ['inherent config set mcp_servers.local.url http://127.0.0.1:8765/mcp', 'inherent mcp test local']);
});

t('comandosAgregar: nombre, URL o autorización inválidos no generan comandos', () => {
  const buena = { nombre: 'notion', url: 'https://mcp.ejemplo.com/mcp', auth: 'oauth' };
  assert.ok(comandosAgregar(buena).length);
  for (const n of hostiles) assert.deepEqual(comandosAgregar({ ...buena, nombre: n }), [], `nombre ${JSON.stringify(n)}`);
  for (const u of ['', 'http://ejemplo.com/mcp', 'javascript:alert(1)', 'https://ejemplo.com/mcp;id', 'https://ejemplo.com/$(id)', 'https://ejemplo.com/`id`', 'https://ejemplo.com/a|b', 'https://ejemplo.com/a&b', "https://ejemplo.com/a'b", 'https://ejemplo.com/a"b', 'https://ejemplo.com/mcp?k=sk-1']) assert.deepEqual(comandosAgregar({ ...buena, url: u }), [], `url ${JSON.stringify(u)}`);
  for (const a of ['', 'OAuth', 'Bearer sk-123', 'oauth; id', null, undefined, 5]) assert.deepEqual(comandosAgregar({ ...buena, auth: a }), [], `auth ${JSON.stringify(a)}`);
  for (const x of [undefined, null, {}, 'notion', 5]) assert.deepEqual(comandosAgregar(x), []);
});

t('ningún comando lleva comillas sueltas, ;, $, `, |, & ni saltos: solo el «Bearer <tu-llave>» fijo', () => {
  for (const auth of AUTORIZACIONES.map(([k]) => k)) {
    const url = auth === 'ninguna' ? 'http://localhost:3000/mcp' : 'https://mcp.ejemplo.com/v1/mcp';
    const cs = [...comandosAgregar({ nombre: 'mi-mcp-2', url, auth }), ...comandosQuitar('mi-mcp-2'), ...comandosProbar('mi-mcp-2'), ...comandosAutorizar('mi-mcp-2'), COMANDO_LISTA];
    assert.ok(cs.length >= 4, auth);
    for (const c of cs) {
      const sin = c.replace(`"Bearer ${MARCADOR_LLAVE}"`, ''); // lo único que lleva comillas: la plantilla fija del encabezado
      assert.ok(!/["';$`|&\n\r\\]/.test(sin), `${auth}: ${c}`);
      assert.ok(!/[<>]/.test(sin), `${auth}: ${c}`);
      assert.ok(c.startsWith('inherent '), c);
    }
  }
});

t('quitar, probar y autorizar: un comando por MCP, y vacío si el nombre no sirve', () => {
  assert.deepEqual(comandosQuitar('notion'), ['inherent mcp remove notion']);
  assert.deepEqual(comandosProbar('notion'), ['inherent mcp test notion']);
  assert.deepEqual(comandosAutorizar('notion'), ['inherent mcp login notion']);
  assert.equal(COMANDO_LISTA, 'inherent mcp list');
  for (const n of hostiles) { assert.deepEqual(comandosQuitar(n), [], n); assert.deepEqual(comandosProbar(n), [], n); assert.deepEqual(comandosAutorizar(n), [], n); }
  for (const f of [comandosQuitar, comandosProbar, comandosAutorizar]) for (const n of ['a; rm -rf ~', '$(id)', '`id`', 'a|b', 'a&b']) assert.deepEqual(f(n), []);
});

t('SUGERIDOS: solo el conector de Inherent OS, válido y listo para pegar', () => {
  assert.deepEqual(SUGERIDOS.map((s) => s.nombre), ['inherent']);
  for (const s of SUGERIDOS) {
    assert.ok(nombreValido(s.nombre) && urlValida(s.url) && s.que, s.nombre);
    assert.ok(AUTORIZACIONES.some(([k]) => k === s.auth), s.nombre);
    assert.ok(s.url.startsWith('https://inherent-work.vercel.app/'), 'no se inventan URLs de terceros');
    assert.ok(comandosAgregar(s).length >= 3, s.nombre);
  }
  assert.deepEqual(comandosAgregar(SUGERIDOS[0]), ['inherent config set mcp_servers.inherent.url https://inherent-work.vercel.app/mcp', 'inherent config set mcp_servers.inherent.auth oauth', 'inherent mcp login inherent', 'inherent mcp test inherent']);
});

t('AUTORIZACIONES: oauth, llave y ninguna', () => assert.deepEqual(AUTORIZACIONES.map(([k]) => k), ['oauth', 'llave', 'ninguna']));

console.log(`\n${ok} pruebas de MCPs, todas bien`);
