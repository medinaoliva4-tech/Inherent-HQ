// La luz del mouse (PLAN-GATEWAY §22): una luz suave detrás del vidrio y un brillo en el borde de la superficie donde está el
// cursor. Son dos capas fijas: no tocan las pantallas y mover el mouse no recalcula la página. Sin mouse o con «reducir
// movimiento» no se instala.
export const SUPERFICIES = '.lat,.llm-side,.llm-panel,.lc,.card,.ainoti,.home-ask-box,.home-kpi,.home-act,.hy-box,.agx-q,.agx-tabla,.cal-res,.kb-card,.vx-goal,.gl,.cp-tool,.fx-mi,.mcd-q,.mcd-card,.aj-pasos,.aj-prov,.avi,.ch-cli-datos,.ch-pl,.ch-eq,.node,.agx-espera';
export const aroDe = (r, x, y) => ({ x: r.left, y: r.top, ancho: r.width, alto: r.height, mx: x - r.left, my: y - r.top });

export function instalarLuz() {
  if (document.getElementById('luz') || !matchMedia('(hover:hover)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const luz = document.createElement('div'), aro = document.createElement('div');
  luz.id = 'luz'; aro.id = 'luz-aro'; luz.setAttribute('aria-hidden', 'true'); aro.setAttribute('aria-hidden', 'true');
  document.body.prepend(luz); document.body.append(aro);
  let x = 0, y = 0, sup = null, cuadro = 0;
  const apagar = () => { sup = null; aro.classList.remove('on'); };
  const pintar = () => {
    cuadro = 0;
    luz.style.transform = `translate(${x}px,${y}px)`; luz.classList.add('on');
    sup = document.elementFromPoint(x, y)?.closest?.(SUPERFICIES) || null;
    if (!sup) return apagar();
    const a = aroDe(sup.getBoundingClientRect(), x, y);
    aro.style.transform = `translate(${a.x}px,${a.y}px)`; aro.style.width = `${a.ancho}px`; aro.style.height = `${a.alto}px`;
    aro.style.borderRadius = getComputedStyle(sup).borderRadius;
    aro.style.setProperty('--mx', `${a.mx}px`); aro.style.setProperty('--my', `${a.my}px`);
    aro.classList.add('on');
  };
  const pedir = () => { if (!cuadro) cuadro = requestAnimationFrame(pintar); };
  addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; x = e.clientX; y = e.clientY; pedir(); }, { passive: true });
  addEventListener('scroll', pedir, { passive: true, capture: true });
  addEventListener('hashchange', apagar);
  document.documentElement.addEventListener('pointerleave', () => { apagar(); luz.classList.remove('on'); });
}
