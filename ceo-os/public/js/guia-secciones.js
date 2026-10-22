// Las secciones del OS que pueden tener su video «Cómo se usa». La clave es la que app.js saca de la ruta;
// el servidor (api/_lib/guia.js) usa la misma lista para validar. Puro: sin DOM ni red.
export const SECCIONES = [['hoy', 'Hoy y Mis tareas'], ['proyectos', 'Clientes y Proyectos'], ['ventas', 'Ventas'], ['servicios', 'Servicios'], ['finanzas', 'Finanzas'], ['inherent', 'Inherent (Equipo, Visión, Library)'],
  ['estrategia', 'Estrategia'], ['marcas', 'Marcas · la portada'], ['investigacion', 'Marca · Investigación'], ['icp', 'Marca · Cliente ideal'], ['brief', 'Marca · Brief del ciclo'], ['plan', 'Marca · Plan del mes'], ['formatos', 'Marca · Formatos'], ['ideas', 'Marca · Ideas y guiones'],
  ['creacion', 'Marca · Creación'], ['marca', 'Marca · Identidad'], ['design', 'Marca · Design system'], ['video', 'Marca · Video'], ['calendario', 'Marca · Calendario'], ['ads', 'Marca · Ads'], ['resultados', 'Marca · Resultados'], ['tech', 'Marca · Tech'], ['diseno', 'El chat de Diseño'], ['me', 'Mi perfil']];
export const nombreSeccion = (k) => (SECCIONES.find(([x]) => x === k) || [k, k])[1];
// Los videos que le tocan a una persona: los de su puesto (o los de todos) en el orden en que se grabaron para verse.
export const videosDe = (items, me) => items.filter((d) => me.role === 'ceo' || !d.roles?.length || d.roles.some((r) => (me.roles || []).includes(r)));
