// Pruebas del Design system: el sistema-visual.md de una marca se lee bien y lo que falta queda vacío.
// npm run test:design
import assert from 'node:assert/strict';
import { leerSistema, colorEn, contraste, fuentesUrl, tokensCss } from '../public/js/sistema-visual.js';
import { escribirSistema, huella, contrasteFino, pasaAA, matrizContraste, parContraste, faltasSistema, medidasDe } from '../public/js/sistema-visual.js';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const MD = `# Sistema visual — Prueba
> El documento que abren Diseño y Video.

## § Color
| Rol | Nombre | Hex | Dónde se usa | Dónde NO |
|---|---|---|---|---|
| **Principal** | **Negro mate** | \`#262523\` | Fondos | — |
| Tinta | Blanco | \`#ffffff\` | Texto | — |
| **Acento** *(uno solo)* | **Naranja Marca** | \`#C4702A\` | Cifras | Fondos grandes |

| | Contraste | |
|---|---|---|
| Blanco sobre negro mate | 15.3 | ✅ |
| Naranja sobre negro mate | 4.2 | ✅ cifras grandes |
| Blanco sobre naranja | 3.7 | ❌ nunca en texto chico |

## § Tipografía
| Familia | Para qué | Pesos |
|---|---|---|
| **Inter Tight** | Títulos | Medium 500 · SemiBold 600 |
| **Inter** | Texto | Light 300 · Regular 400 |

### La escala
| Nivel | Fuente | Tamaño | Espaciado |
|---|---|---|---|
| **Título 1** | Inter Tight Medium | 88 / 95% | −3.5% |
| **Cifra** | Inter Tight Medium, **naranja** | 72 / 100% | −3% |
| **Etiqueta** | Inter Medium, mayúsculas | 13 / 130% | +12% |

## § Logo
| Versión | Archivo | Dónde |
|---|---|---|
| **Blanco sobre negro mate** *(el principal)* | \`logo-blanco.svg\` | Casi todo |

## § Composición
| | |
|---|---|
| **Grilla** | 6 columnas en redes |
| **Márgenes** | 7% del lado corto |
| **Safe zones** | Reel y story: nada en el 14% de arriba, el 22% de abajo ni el 12% derecho |

## § Qué está prohibido
- Dos acentos.
- Emojis.
`;
const S = leerSistema(MD);

t('Lee los colores con su hex en mayúsculas y sin markdown', () => {
  assert.deepEqual(S.colores.map((c) => [c.nombre, c.hex]), [['Negro mate', '#262523'], ['Blanco', '#FFFFFF'], ['Naranja Marca', '#C4702A']]);
  assert.equal(S.colores[2].no, 'Fondos grandes'); assert.equal(S.colores[0].no, '');
});
t('Un nombre corto encuentra su color, y el más largo gana', () => {
  assert.equal(colorEn('Naranja sobre negro', S.colores).nombre, 'Naranja Marca');
  assert.equal(colorEn('negro mate', S.colores).nombre, 'Negro mate');
});
t('El contraste trae tinta, fondo y si sirve, sin emojis', () => {
  assert.deepEqual(S.contrastes.map((c) => [c.tinta.nombre, c.fondo.nombre, c.ok]), [['Blanco', 'Negro mate', true], ['Naranja Marca', 'Negro mate', true], ['Blanco', 'Naranja Marca', false]]);
  assert.ok(S.contrastes.every((c) => !/[✅❌]/u.test(c.nota)));
});
t('La escala sale con familia, peso, tamaño, interlineado y espaciado', () => {
  const [t1, cif, eti] = S.tipo.escala;
  assert.deepEqual([t1.familia, t1.peso, t1.size, t1.lh, t1.tracking], ['Inter Tight', 500, 88, 0.95, -0.035]);
  assert.equal(cif.color, '#C4702A'); assert.equal(eti.mayus, true); assert.equal(eti.tracking, 0.12); assert.equal(eti.familia, 'Inter');
});
t('Logos, composición y lo prohibido', () => {
  assert.equal(S.logos[0].archivo, 'logo-blanco.svg'); assert.equal(S.logos[0].fondo.nombre, 'Negro mate');
  assert.equal(S.composicion[0].rows.length, 3);
  assert.deepEqual(S.prohibido, ['Dos acentos.', 'Emojis.']);
});
t('Contraste WCAG, fuentes y tokens', () => {
  assert.equal(contraste('#FFFFFF', '#000000'), 21);
  assert.equal(fuentesUrl(S.tipo.familias), 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600&family=Inter:wght@300;400&display=swap');
  assert.match(tokensCss(S), /--color-naranja-marca: #C4702A;/);
});
t('Un archivo vacío no rompe: todo queda vacío', () => {
  const v = leerSistema(''); assert.deepEqual([v.colores, v.logos, v.prohibido, v.tipo.escala], [[], [], [], []]);
});

// ---------- Visual Identity Builder: escribirSistema es la inversa de leerSistema ----------
const RAIZ = fileURLToPath(new URL('../../', import.meta.url));
const reales = existsSync(RAIZ + 'clients') ? readdirSync(RAIZ + 'clients').map((c) => RAIZ + `clients/${c}/02-marca/sistema-visual.md`).filter((f) => existsSync(f)) : [];
t('Hay al menos un sistema real de cliente para probar', () => assert.ok(reales.length >= 1, 'no hay clients/*/02-marca/sistema-visual.md'));
for (const f of reales) t(`leerSistema(escribirSistema(x)) = x con ${f.split('/').slice(-3, -2)[0]}`, () => {
  const x = leerSistema(readFileSync(f, 'utf8')), md = escribirSistema(x, { nombre: 'Prueba' });
  assert.deepEqual(leerSistema(md), x);
  assert.equal(escribirSistema(leerSistema(md), { nombre: 'Prueba' }), md, 'escribir es estable');
});
t('Lo mismo con un sistema mínimo y con uno vacío', () => {
  const m = leerSistema(MD); assert.deepEqual(leerSistema(escribirSistema(m)), m);
  const solo = leerSistema('## § Color\n| Rol | Nombre | Hex | Dónde se usa | Dónde NO |\n|---|---|---|---|---|\n| Acento | Rojo | `#ff0000` | Botón | — |\n'); assert.deepEqual(leerSistema(escribirSistema(solo)), solo);
  const v = leerSistema(''); assert.deepEqual(leerSistema(escribirSistema(v)), v);
});
t('Contraste fino: 4.46 no pasa como 4.5, y la matriz cubre todos los pares', () => {
  assert.equal(contrasteFino('#FFFFFF', '#000000'), 21); assert.equal(contrasteFino('zzz', '#000'), null);
  assert.equal(pasaAA('#FFFFFF', '#262523'), true); assert.equal(pasaAA('#C4702A', '#262523'), false);
  const mx = matrizContraste(S.colores); assert.equal(mx.length, 3); assert.ok(mx.every((r) => r.fila.length === 3 && r.fila.filter((c) => c.ratio === null).length === 1));
});
t('Ningún par marcado ok baja de 4.5: un par nuevo solo sale ok si pasa, y las faltas lo cazan', () => {
  const [neg, bla, nar] = S.colores;
  assert.equal(parContraste(bla, neg).ok, true); assert.equal(parContraste(nar, neg).ok, false); assert.equal(parContraste(bla, nar).ok, false);
  const malo = { ...S, contrastes: [{ ...parContraste(nar, neg), ok: true }] };
  assert.match(faltasSistema(malo).join(), /bajo 4.5/);
  assert.deepEqual(faltasSistema({ ...S, contrastes: [parContraste(bla, neg), parContraste(nar, neg)] }), []);
  assert.match(faltasSistema({ ...S, colores: [{ ...nar, rol: 'Acento' }, { ...neg, rol: 'Acento' }] }).join(), /más de un acento/);
});
t('Huella estable y medidas de composición', () => {
  assert.equal(huella(MD), huella(MD)); assert.notEqual(huella(MD), huella(MD + ' ')); assert.equal(huella(''), '811c9dc5');
  assert.deepEqual(medidasDe(S.composicion), { margen: 7, safe: { arriba: 14, abajo: 22, der: 12 }, columnas: 6, canaleta: null });
  assert.deepEqual(medidasDe([]), { margen: null, safe: null, columnas: null, canaleta: null });
});
console.log(`\n${ok} pruebas pasaron`);
