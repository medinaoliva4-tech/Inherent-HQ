#!/usr/bin/env python3
# Terminal real sin dependencias nativas: crea un pty, ejecuta el shell y lo conecta a stdin/stdout.
# stdin (desde el puente) va en tramas:  b"D"+len(2B)+datos  ·  b"R"+cols(2B)+filas(2B)  (tamaño de la ventana).
# stdout es la salida cruda del pty.
import os, pty, sys, select, struct, fcntl, termios, signal

shell = os.environ.get("SHELL_BIN") or "/bin/bash"
pid, fd = pty.fork()
if pid == 0:
    os.execvp(shell, [shell, "-l"] if os.environ.get("SHELL_LOGIN") else [shell])

def resize(cols, rows):
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))

resize(80, 24)
buf = b""
inp = sys.stdin.fileno()
out = sys.stdout.fileno()
alive = True
while alive:
    try:
        r, _, _ = select.select([inp, fd], [], [])
    except InterruptedError:
        continue
    if fd in r:
        try:
            d = os.read(fd, 65536)
        except OSError:
            d = b""
        if not d:
            break
        os.write(out, d)
    if inp in r:
        d = os.read(inp, 65536)
        if not d:
            break
        buf += d
        while buf:
            t = buf[:1]
            if t == b"D" and len(buf) >= 3:
                n = struct.unpack(">H", buf[1:3])[0]
                if len(buf) < 3 + n: break
                os.write(fd, buf[3:3 + n]); buf = buf[3 + n:]
            elif t == b"R" and len(buf) >= 5:
                c, rw = struct.unpack(">HH", buf[1:5]); resize(c, rw); buf = buf[5:]
            elif t in (b"D", b"R"):
                break
            else:
                buf = buf[1:]
try:
    os.kill(pid, signal.SIGHUP)
except OSError:
    pass
