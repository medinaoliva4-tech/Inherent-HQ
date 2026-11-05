// Antes del primer pintado: el tema oscuro y el color de la franja de arriba del iPhone (PLAN-GATEWAY §22: solo oscuro por
// ahora; el modo claro volverá siguiendo al sistema, sin selector). Script clásico de 'self': lo deja pasar la CSP.
(function () {
  var h = document.documentElement;
  h.setAttribute('data-theme', 'dark');
  h.setAttribute('data-llm-tema', 'noche');
  if (window.inherentEscritorio && window.inherentEscritorio.vidrio) h.setAttribute('data-vidrio', 'real');
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', '#0d0d0e');
})();
