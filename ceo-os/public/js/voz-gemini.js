// La voz real del Chat con Gemini Live (PLAN-GATEWAY §22): lo puro. La llave nunca llega al navegador: el OS da un token de un solo uso.
export const WS_VOZ = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained';
export const urlVoz = (token) => `${WS_VOZ}?access_token=${encodeURIComponent(token)}`;
export const AUDIO_ENTRADA = 'audio/pcm;rate=16000';

export function setupVoz({ modelo, voz, sistema, handle = '' }) {
  return { setup: {
    model: `models/${modelo}`,
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } } } },
    systemInstruction: { parts: [{ text: sistema }] },
    inputAudioTranscription: {}, outputAudioTranscription: {},
    contextWindowCompression: { slidingWindow: {} },
    sessionResumption: handle ? { handle } : {},
  } };
}

// De la frecuencia del equipo a 16 kHz, en enteros de 16 bits.
export function aPcm16(muestras, desde, a = 16000) {
  const paso = desde / a, n = Math.floor(muestras.length / paso), s = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, muestras[Math.floor(i * paso)] || 0));
    s[i] = v < 0 ? v * 32768 : v * 32767;
  }
  return s;
}
export function aFloat(bytes) {
  const s = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2)), f = new Float32Array(s.length);
  for (let i = 0; i < s.length; i++) f[i] = s[i] / 32768;
  return f;
}
export const aB64 = (bytes) => { let t = ''; for (let i = 0; i < bytes.length; i += 8192) t += String.fromCharCode(...bytes.subarray(i, i + 8192)); return btoa(t); };
export const deB64 = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0));

// Lo importante de cada mensaje de Gemini.
export function leerMensaje(m) {
  const c = m?.serverContent || {};
  return {
    audio: (c.modelTurn?.parts || []).map((p) => p.inlineData?.data).filter(Boolean),
    oido: c.inputTranscription?.text || '', dicho: c.outputTranscription?.text || '',
    interrumpido: Boolean(c.interrupted), fin: Boolean(c.turnComplete),
    handle: m?.sessionResumptionUpdate?.resumable ? m.sessionResumptionUpdate.newHandle || '' : '',
    salir: Boolean(m?.goAway), listo: m?.setupComplete !== undefined,
  };
}
