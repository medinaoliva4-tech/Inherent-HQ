// Antes del primer pintado: el tema oscuro y el color de la franja de arriba del iPhone (PLAN-GATEWAY §22).
// El modo claro se elige en el menú de la cuenta. Script clásico de 'self': lo deja pasar la CSP.
(function () {
  var h = document.documentElement;
  var claro = false; try { claro = localStorage.getItem('os.modo') === 'claro'; } catch (e) { /* sin memoria, oscuro */ }
  h.setAttribute('data-theme', claro ? 'light' : 'dark');
  h.setAttribute('data-llm-tema', 'noche');
  if (window.inherentEscritorio && window.inherentEscritorio.vidrio) h.setAttribute('data-vidrio', 'real');
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', claro ? '#f3f3f4' : '#0d0d0e');
})();
