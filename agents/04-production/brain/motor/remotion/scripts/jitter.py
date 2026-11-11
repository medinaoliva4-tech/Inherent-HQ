#!/usr/bin/env python3
"""Temblor de cámara robusto a manos: correlación de fase por bloques (4x6) y mediana por cuadro.
Devuelve el temblor (px a 1440 de ancho, parte de alta frecuencia) de un archivo o tramo."""
import subprocess, sys
import cv2, numpy as np
W, H = 240, 426
def frames(path, ss=None, t=None):
    cmd = ["ffmpeg", "-v", "error"] + (["-ss", f"{ss:.3f}"] if ss is not None else []) + ["-i", str(path)] + (["-t", f"{t:.3f}"] if t else []) + ["-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
def jitter(path, ss=None, t=None, step=2):
    fr = frames(path, ss, t)[::step]
    if len(fr) < 8:
        return 0.0
    bw, bh = W // 4, H // 6
    win = cv2.createHanningWindow((bw, bh), cv2.CV_32F)
    acc, tr = np.zeros(2), [np.zeros(2)]
    for a, b in zip(fr[:-1], fr[1:]):
        ds = []
        for by in range(6):
            for bx in range(4):
                pa = a[by*bh:(by+1)*bh, bx*bw:(bx+1)*bw]; pb = b[by*bh:(by+1)*bh, bx*bw:(bx+1)*bw]
                if pa.std() < 6: continue
                (dx, dy), r = cv2.phaseCorrelate(pa, pb, win)
                if r > 0.15: ds.append((dx, dy))
        d = np.median(np.array(ds), axis=0) if len(ds) >= 4 else np.zeros(2)
        acc = acc + d; tr.append(acc.copy())
    tr = np.array(tr)
    k = 7; pad = np.pad(tr, ((k, k), (0, 0)), mode="edge")
    base = np.stack([np.convolve(pad[:, i], np.ones(2*k+1)/(2*k+1), "same")[k:-k] for i in range(2)], 1)
    return float(np.sqrt(((tr - base) ** 2).sum(1).mean())) * 1440 / W
if __name__ == "__main__":
    print(round(jitter(sys.argv[1], *(float(x) for x in sys.argv[2:4])), 2))
