// Antes del primer pintado: el día o la noche (lo que elegiste, o lo de tu compu si no elegiste) y el color de la franja
// de arriba del iPhone. Sin esto la página se pintaría de día un instante. Script clásico de 'self' (lo deja pasar la CSP);
// después lo mantiene tema.js. localStorage 'theme': 'light' · 'dark' · nada = el de tu compu.
(function () {
  var t = '';
  try { t = localStorage.getItem('theme') || ''; } catch (e) { /* sin almacenamiento: el de la compu */ }
  var noche = t === 'dark' || (t !== 'light' && !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches));
  var h = document.documentElement;
  h.setAttribute('data-theme', noche ? 'dark' : 'light');
  h.setAttribute('data-llm-tema', noche ? 'noche' : 'dia');
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', noche ? '#1f1e1c' : '#faf9f6');
})();
