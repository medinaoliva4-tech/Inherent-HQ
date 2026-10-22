// Lo interno que antes viajaba en el código público del navegador: costos por rol, markup, el baseline de los niveles y el
// mapa inicial de especialistas con sus precios. Ahora solo sale del servidor, y solo a quien le toca.
//   GET internos/paquetes         → los paquetes por industria y sus reglas de costo (solo CEO)
//   GET internos/industrias       → solo los nombres de las industrias (el equipo, para filtrar)
//   GET internos/baseline         → el baseline de cada nivel (solo CEO; lo que el CEO edita en settings «levels» va encima)
//   GET internos/especialistas    → el mapa inicial de especialistas para cargarlo (solo CEO)
import { guard } from './access.js';
import PAQUETES from './datos/paquetes-industria.js';

// Servicios → Paquetes → Por industria: las reglas por defecto (lo que el CEO cambia se guarda en `packages` «default»).
const DEF_PAQUETES = () => ({
  id: 'default',
  roles: [{ id: 'dir', n: 'Dirección (CEO)', c: 0, dir: true }, { id: 'fin', n: 'Finanzas y administración', c: 300 }, { id: 'mkt', n: 'Marketing (con creatividad)', c: 200 }, { id: 'op', n: 'Operador de agentes', c: 150 }, { id: 'prod', n: 'Producción y foto', c: 150 }, { id: 'edi', n: 'Edición y diseño', c: 100 }],
  markup: 2.5, ovh: 0, dirVal: 300, mentor: 1400, cx: { S: 1, M: 1.25, X: 1.5 }, round: 500,
  sc: { base: 100000, gr: 15, marg: 30, months: 6, pct: 10 }, ov: {},
});

// El baseline de cada nivel (CLAUDE.md → «La economía»): el piso interno desde el que se cotiza. Nunca sale en la web.
const BASELINE = { foundation: { usd: 1200, gtq: 9240, per: 'por proyecto' }, growth: { usd: 2400, gtq: 18480, per: 'al mes' }, partnership: { usd: 4200, gtq: 32340, per: 'al mes' } };
// El mapa del manual para arrancar la red de especialistas (inherent/04-MERCADO.md): se cargan una vez y se editan en la app.
const SEED = [
  ['Restaurantes', 'low', 'Wingman', 'Comunidad', 0, 'gratis', 0, 'Comunidad de dueños, sin 1:1'],
  ['Restaurantes', 'medio', 'GrowthMentor', 'GrowthMentor', 50, 'mes', 0, 'Membresía anual ($85/mes trimestral). Crecimiento y marketing; no garantiza mentor de operaciones'],
  ['Restaurantes', 'premium', 'MASTERESTAURANT', 'Directo', 950, 'sesion', 90, 'Especialista de restaurantes, sesión virtual de 1.5 h'],
  ['Arquitectura', 'low', 'EntreArchitect Network', 'EntreArchitect', 0, 'gratis', 0, 'Comunidad para firmas pequeñas'],
  ['Arquitectura', 'medio', 'EntreArchitect Pro', 'EntreArchitect', 49, 'mes', 0, 'Coaching grupal · $499/año'],
  ['Arquitectura', 'premium', 'EntreArchitect Mastermind', 'EntreArchitect', 99, 'mes', 0, 'Mastermind grupal ($999/año); no es 1:1 privado'],
  ['Moda y fast fashion', 'low', 'The Apparel Mentor', 'The Apparel Mentor', 39, 'mes', 0, 'Clases, eventos y coaching 1:1'],
  ['Moda y fast fashion', 'medio', 'Operador de moda DTC', 'MentorPass', 144, 'sesion', 30, 'Opera marcas DTC de moda'],
  ['Moda y fast fashion', 'premium', 'Fundador DTC', 'MentorPass', 360, 'sesion', 30, 'Fundó una marca DTC: criterio de dueño'],
  ['Moda y fast fashion', 'premium', 'WE are COCO', 'WE are COCO', 0, 'cotizacion', 0, 'Red de 350+ compradores de retail'],
  ['E-commerce y DTC', 'low', 'Mentor de crecimiento', 'MentorPass', 72, 'sesion', 30, 'Crecimiento general de e-commerce'],
  ['E-commerce y DTC', 'medio', 'Especialista en CX', 'MentorPass', 180, 'sesion', 30, 'Experiencia del cliente y recompra'],
  ['E-commerce y DTC', 'premium', 'Retención y CX', 'MentorPass', 540, 'sesion', 30, 'Retención a escala: lo que más mueve el LTV'],
  ['Wellness y fitness', 'low', 'Fundador de marca fitness', 'MentorPass', 72, 'sesion', 30, 'Ya creció una marca fitness'],
  ['Wellness y fitness', 'medio', 'Fundador wellness', 'MentorPass', 180, 'sesion', 30, 'Fundador con marca wellness más grande'],
  ['Wellness y fitness', 'premium', 'The Maxwell Method', 'Directo', 300, 'sesion', 90, '$600 por 2 sesiones de 90 min · mentoría de 6 semanas $2,900'],
  ['Suplementos', 'low', 'MicroMentor', 'MicroMentor', 0, 'gratis', 0, 'Gratis; no garantiza experiencia en suplementos'],
  ['Suplementos', 'medio', 'Fundador de Obvi', 'MentorPass', 144, 'sesion', 30, 'Fundó una marca de suplementos'],
  ['Suplementos', 'premium', 'Fundador de Zesty Paws', 'MentorPass', 720, 'sesion', 30, 'Fundó y vendió una marca grande de suplementos'],
  ['Servicios profesionales', 'low', 'MicroMentor', 'MicroMentor', 0, 'gratis', 0, 'Orientación general'],
  ['Servicios profesionales', 'medio', 'GrowthMentor', 'GrowthMentor', 50, 'mes', 0, '$50-85/mes; algunos mentores cobran aparte'],
  ['Servicios profesionales', 'premium', 'GLG · Guidepoint', 'GLG', 0, 'cotizacion', 0, 'Expertos por hora: $700-1,500+/h. Fuera del techo de cualquier nivel'],
];

const soloCeo = (u, res) => { if (u.role === 'ceo') return true; res.status(403).json({ error: 'Solo el CEO ve esto' }); return false; };

export function rutas(on) {
  on('GET', 'internos/paquetes', async (req, res) => {
    const u = await guard(req, res); if (!u || !soloCeo(u, res)) return;
    res.json({ data: PAQUETES, def: DEF_PAQUETES() });
  });
  on('GET', 'internos/industrias', async (req, res) => {
    const u = await guard(req, res); if (!u) return;
    res.json({ nombres: PAQUETES.ind.map((i) => i.n) });
  });
  on('GET', 'internos/baseline', async (req, res) => {
    const u = await guard(req, res); if (!u || !soloCeo(u, res)) return;
    res.json({ base: BASELINE });
  });
  on('GET', 'internos/especialistas', async (req, res) => {
    const u = await guard(req, res); if (!u || !soloCeo(u, res)) return;
    res.json({ especialistas: SEED.map(([industry, tier, name, platform, price, unit, minutes, why]) => ({ industry, tier, name, platform, price, unit, minutes, why })) });
  });
}
