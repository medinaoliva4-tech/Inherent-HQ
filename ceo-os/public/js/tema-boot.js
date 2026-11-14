// Antes del primer pintado: respeta el sistema salvo que la persona elija claro u oscuro.
// Script clásico de 'self': lo deja pasar la CSP y evita un destello al abrir la app.
(function () {
  var h = document.documentElement;
  var sistema = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  var modo = 'automatico';
  try { modo = localStorage.getItem('os.modo') || 'automatico'; } catch (e) { /* sin memoria, automático */ }
  if (!['automatico', 'claro', 'oscuro'].includes(modo)) modo = 'automatico';
  function aplicar() {
    var claro = modo === 'claro' || (modo === 'automatico' && !!sistema && sistema.matches);
    h.setAttribute('data-theme', claro ? 'light' : 'dark');
    h.setAttribute('data-llm-tema', claro ? 'dia' : 'noche');
    var chat = document.querySelector('.llm');
    if (chat) chat.setAttribute('data-tema', claro ? 'dia' : 'noche');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', claro ? '#f3f3f4' : '#0d0d0e');
  }
  window.inherentTema = {
    modo: function () { return modo; },
    elegir: function (nuevo) {
      if (!['automatico', 'claro', 'oscuro'].includes(nuevo)) return;
      modo = nuevo;
      try { localStorage.setItem('os.modo', modo); } catch (e) { /* dura esta sesión */ }
      aplicar();
    },
  };
  if (sistema) {
    if (sistema.addEventListener) sistema.addEventListener('change', aplicar);
    else if (sistema.addListener) sistema.addListener(aplicar);
  }
  aplicar();
  if (window.inherentEscritorio && window.inherentEscritorio.vidrio) h.setAttribute('data-vidrio', 'real');
})();
