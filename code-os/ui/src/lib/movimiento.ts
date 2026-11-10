/** Resortes compartidos. Con prefers-reduced-motion, <MotionConfig reducedMotion="user"> anula los desplazamientos. */
export const resorte = { type: 'spring', stiffness: 380, damping: 34, mass: 0.9 } as const
export const resorteSuave = { type: 'spring', stiffness: 260, damping: 30 } as const
/** Resorte con un rebote mínimo (~4%): menús, diálogos, toasts. */
export const resortePop = { type: 'spring', stiffness: 520, damping: 28, mass: 0.8 } as const
export const entrada = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: resorte,
} as const
