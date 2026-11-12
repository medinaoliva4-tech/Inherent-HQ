// Datos del diff y comentarios, sin dependencias del navegador.
export function lineasDiff(diff) {
  let antes = 0, despues = 0;
  return String(diff || '').split('\n').slice(0, 900).map((texto) => {
    const cab = /^@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(texto);
    if (cab) { antes = Number(cab[1]) - 1; despues = Number(cab[2]) - 1; return { texto, tipo: 'cab', linea: 0, lado: '' }; }
    if (/^(---|\+\+\+|diff |index )/.test(texto)) return { texto, tipo: 'cab', linea: 0, lado: '' };
    if (texto.startsWith('+')) return { texto, tipo: 'mas', linea: ++despues, lado: 'despues' };
    if (texto.startsWith('-')) return { texto, tipo: 'menos', linea: ++antes, lado: 'antes' };
    if (texto.startsWith(' ')) { antes++; despues++; return { texto, tipo: 'igual', linea: despues, lado: 'despues' }; }
    return { texto, tipo: 'cab', linea: 0, lado: '' };
  });
}

export const mensajeComentarios = (cs) => `Revisé los cambios y te dejo estos comentarios. Atiéndelos uno por uno:\n\n${cs.map((c) => `- \`${c.ruta}\` línea ${c.linea}${c.lado === 'antes' ? ' (versión anterior)' : ''}: ${c.texto}`).join('\n')}`;

