// El Chat abierto se avisa aquí: cambiar de conversación no reconstruye la pantalla, solo cambia su contenido.
let ir = null;
export const ponerChatVivo = (f) => { ir = f; };
export const chatVivo = () => ir;
