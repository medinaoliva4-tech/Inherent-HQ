// El divisor que se arrastra entre el chat y su panel (Estrategia, Diseño, Plan del mes): estira o achica el chat.
// Se recuerda por pantalla (localStorage). Doble clic vuelve al ancho de siempre. Con el teclado: flechas.
// Cuando las dos columnas quedan una abajo de la otra (pantalla chica), el divisor se esconde solo.
export function divisor(cont, izq, { key, min = 320, max = 0.72 } = {}) {
  if (!cont || !izq) return;
  cont.querySelector(':scope > .divisor')?.remove();
  const h = document.createElement('div');
  h.className = 'divisor'; h.tabIndex = 0; h.setAttribute('role', 'separator'); h.setAttribute('aria-orientation', 'vertical');
  h.setAttribute('aria-label', 'Arrastra para hacer más ancho o más angosto el chat'); h.title = 'Arrastra para ajustar · doble clic para volver';
  cont.append(h);
  const guardado = () => { try { return +localStorage.getItem('os.divisor.' + key) || 0; } catch { return 0; } };
  const guardar = (w) => { try { if (w) localStorage.setItem('os.divisor.' + key, String(Math.round(w))); else localStorage.removeItem('os.divisor.' + key); } catch {} };
  const limite = (w) => Math.max(min, Math.min(w, cont.clientWidth * max));
  const poner = (w) => { if (w) { cont.style.setProperty('--izq', `${limite(w)}px`); cont.classList.add('dividido'); } else { cont.style.removeProperty('--izq'); cont.classList.remove('dividido'); } ubicar(); };
  function ubicar() {
    const otro = [...cont.children].find((x) => x !== izq && x !== h && getComputedStyle(x).display !== 'none');
    const apilado = !otro || otro.getBoundingClientRect().top > izq.getBoundingClientRect().bottom - 4;
    h.hidden = apilado; if (apilado) return;
    const gap = parseFloat(getComputedStyle(cont).columnGap) || 16;
    h.style.left = `${izq.offsetLeft + izq.offsetWidth + gap / 2 - 6}px`;
  }
  poner(guardado());
  new ResizeObserver(() => ubicar()).observe(cont);
  let x0 = 0, w0 = 0;
  h.addEventListener('pointerdown', (e) => { e.preventDefault(); h.setPointerCapture(e.pointerId); x0 = e.clientX; w0 = izq.getBoundingClientRect().width; h.classList.add('on'); document.body.classList.add('arrastrando'); });
  h.addEventListener('pointermove', (e) => { if (!h.classList.contains('on')) return; poner(w0 + e.clientX - x0); });
  const soltar = () => { if (!h.classList.contains('on')) return; h.classList.remove('on'); document.body.classList.remove('arrastrando'); guardar(izq.getBoundingClientRect().width); };
  h.addEventListener('pointerup', soltar); h.addEventListener('pointercancel', soltar);
  h.addEventListener('dblclick', () => { guardar(0); poner(0); });
  h.addEventListener('keydown', (e) => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); const w = limite(izq.getBoundingClientRect().width + (e.key === 'ArrowRight' ? 32 : -32)); poner(w); guardar(w); });
  return { ubicar };
}

// Una ventana que sale de la caja del chat: se abre hacia donde hay espacio (arriba o abajo) y se baja por dentro si no cabe.
export function ubicarPop(m, box) {
  const r = box.getBoundingClientRect(), barra = document.querySelector('header.top')?.getBoundingClientRect().bottom || 80;
  const arriba = r.top - barra - 16, abajo = innerHeight - r.bottom - 16, haciaAbajo = arriba < 320 && abajo > arriba;
  m.classList.toggle('abajo', haciaAbajo);
  m.style.maxHeight = `${Math.max(220, Math.min(560, haciaAbajo ? abajo : arriba))}px`;
}
