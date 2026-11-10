import { createHash } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';

const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const MAX = 1_000_000;
export interface WS { send(data: Buffer | string): void; close(code?: number): void; onMessage(fn: (data: Buffer, text: boolean) => void): void; onClose(fn: () => void): void }

/** WebSocket mínimo (RFC 6455) sobre el `upgrade` de Node: sin dependencias. Tramas de texto/binario, ping/pong y cierre. */
export function acceptWebSocket(req: IncomingMessage, socket: Duplex): WS | null {
  const key = req.headers['sec-websocket-key'];
  if (typeof key !== 'string' || req.headers.upgrade?.toLowerCase() !== 'websocket') return null;
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${createHash('sha1').update(key + GUID).digest('base64')}\r\n\r\n`);
  let msg: (d: Buffer, t: boolean) => void = () => {}; let closed: () => void = () => {}; let buf = Buffer.alloc(0); let done = false;
  const frame = (op: number, payload: Buffer) => {
    const n = payload.length; const h = n < 126 ? Buffer.from([0x80 | op, n]) : n < 65536 ? Buffer.from([0x80 | op, 126, n >> 8, n & 255]) : (() => { const b = Buffer.alloc(10); b[0] = 0x80 | op; b[1] = 127; b.writeBigUInt64BE(BigInt(n), 2); return b; })();
    return Buffer.concat([h, payload]);
  };
  const end = () => { if (!done) { done = true; closed(); } };
  socket.on('data', (c: Buffer) => {
    buf = Buffer.concat([buf, c]);
    for (;;) {
      if (buf.length < 2) return;
      const op = buf[0]! & 15; let len = buf[1]! & 127; let off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (len > MAX) { socket.destroy(); return end(); }
      const masked = (buf[1]! & 128) !== 0; if (!masked) { socket.destroy(); return end(); }
      if (buf.length < off + 4 + len) return;
      const mask = buf.subarray(off, off + 4); const data = Buffer.from(buf.subarray(off + 4, off + 4 + len));
      for (let i = 0; i < data.length; i++) data[i]! ^= mask[i % 4]!;
      buf = buf.subarray(off + 4 + len);
      if (op === 8) { socket.end(frame(8, Buffer.alloc(0))); return end(); }
      if (op === 9) socket.write(frame(10, data));
      else if (op === 1 || op === 2) msg(data, op === 1);
    }
  });
  socket.on('close', end); socket.on('error', end);
  return {
    send: (d) => { if (!done) socket.write(frame(typeof d === 'string' ? 1 : 2, typeof d === 'string' ? Buffer.from(d) : d)); },
    close: (code = 1000) => { if (!done) { const p = Buffer.alloc(2); p.writeUInt16BE(code); socket.end(frame(8, p)); end(); } },
    onMessage: (fn) => { msg = fn; }, onClose: (fn) => { closed = fn; if (done) fn(); },
  };
}
