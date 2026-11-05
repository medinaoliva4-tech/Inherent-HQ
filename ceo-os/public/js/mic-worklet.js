// Pasa el micrófono, tal cual, al hilo de la pantalla.
class Mic extends AudioWorkletProcessor {
  process(inputs) {
    const c = inputs[0]?.[0];
    if (c) this.port.postMessage(c.slice(0));
    return true;
  }
}
registerProcessor('mic', Mic);
