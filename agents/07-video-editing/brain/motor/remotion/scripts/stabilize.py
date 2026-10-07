#!/usr/bin/env python3
"""Estabiliza una toma usando el margen del 4K y genera el mezzanine 1440x2560 (sin audio).

1. Decodifica el original (o un tramo) a 1440x2560 con ffmpeg.
2. Mide el movimiento cuadro a cuadro (puntos + flujo óptico en una versión reducida).
3. Suaviza la trayectoria (media móvil) y compensa solo el temblor: los movimientos
   intencionales lentos (paneo, acercamiento) se conservan.
4. Recorta un margen fijo (zoom) para que no se vean bordes y codifica H.264 CRF 14.
Opcional: corrección de exposición/color con un filtro de ffmpeg (--grade).

Uso: .venv/bin/python scripts/stabilize.py CLIP [--from S --to S] [--radius 40] [--zoom 1.08] [--grade "eq=..."] [--out ruta]
"""
import argparse
import json
import subprocess
from pathlib import Path

import cv2
import numpy as np

MOTION = Path(__file__).resolve().parents[1]
ROOT = MOTION.parents[1]
INDEX = {c["clip"]: c for c in json.loads((ROOT / "assets/videos/clips_index.json").read_text())}
SOURCE = ROOT / "assets/videos/source"
W, H = 1440, 2560
SW, SH = 360, 640  # resolución de análisis


def moving_average(curve, radius):
    k = np.ones(2 * radius + 1) / (2 * radius + 1)
    padded = np.pad(curve, (radius, radius), mode="edge")
    return np.convolve(padded, k, mode="same")[radius:-radius]


def read_frames(src, a, b, pre):
    cmd = ["ffmpeg", "-v", "error"]
    if a is not None:
        cmd += ["-ss", f"{a:.3f}"]
    cmd += ["-i", str(src)]
    if b is not None:
        cmd += ["-t", f"{b - (a or 0):.3f}"]
    vf = f"scale={W}:{H}:flags=lanczos" + (f",{pre}" if pre else "")
    cmd += ["-vf", vf, "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = W * H * 3
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    p.wait()


def estimate(src, a, b, pre):
    transforms = []
    prev = None
    n = 0
    for frame in read_frames(src, a, b, pre):
        g = cv2.cvtColor(cv2.resize(frame, (SW, SH), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY)
        if prev is not None:
            pts = cv2.goodFeaturesToTrack(prev, maxCorners=300, qualityLevel=0.01, minDistance=12, blockSize=3)
            dx = dy = da = ds = 0.0
            if pts is not None and len(pts) >= 8:
                nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev, g, pts, None)
                ok = st.reshape(-1) == 1
                if ok.sum() >= 8:
                    m, inl = cv2.estimateAffinePartial2D(pts[ok], nxt[ok], method=cv2.RANSAC, ransacReprojThreshold=1.5)
                    # Si menos del 60 % de los puntos coincide, el movimiento es de un objeto (manos, platos), no de la cámara.
                    if m is not None and inl is not None and inl.sum() >= 0.6 * ok.sum():
                        dx, dy = m[0, 2], m[1, 2]
                        da = float(np.arctan2(m[1, 0], m[0, 0]))
                        ds = float(np.log(np.hypot(m[0, 0], m[1, 0])))
            transforms.append((dx, dy, da, ds))
        prev = g
        n += 1
    return np.array(transforms, dtype=np.float64), n


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("clip")
    ap.add_argument("--from", dest="a", type=float)
    ap.add_argument("--to", dest="b", type=float)
    ap.add_argument("--radius", type=int, default=40, help="frames de suavizado (60 fps)")
    ap.add_argument("--zoom", type=float, default=None, help="zoom fijo; por defecto se calcula")
    ap.add_argument("--lock", action="store_true", help="modo trípode")
    ap.add_argument("--none", action="store_true", help="sin estabilizar: solo recorte del tramo, color y codificación")
    ap.add_argument("--zoom-max", dest="zoom_max", type=float, default=1.15)
    ap.add_argument("--grade", default="", help="filtro ffmpeg de color/exposición antes de estabilizar")
    ap.add_argument("--out")
    args = ap.parse_args()

    c = INDEX[args.clip]
    src = SOURCE / c["file"]
    out = Path(args.out) if args.out else MOTION / "public/clips" / f"{args.clip}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)

    if args.none:
        cmd = ["ffmpeg", "-v", "error", "-y"] + (["-ss", f"{args.a:.3f}"] if args.a is not None else []) + ["-i", str(src)]
        if args.b is not None:
            cmd += ["-t", f"{args.b - (args.a or 0):.3f}"]
        vf = f"scale={W}:{H}:flags=lanczos" + (f",{args.grade}" if args.grade else "")
        cmd += ["-an", "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-g", "30", "-pix_fmt", "yuv420p",
                "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", str(out)]
        subprocess.run(cmd, check=True)
        print(f"{args.clip}: sin estabilizar · {out.name}")
        return

    t, n = estimate(src, args.a, args.b, args.grade)
    traj = np.cumsum(t, axis=0)
    if args.lock and len(traj) > 2:
        x = np.arange(len(traj))
        fit = np.stack([np.polyval(np.polyfit(x, traj[:, i], 1), x) for i in range(4)], axis=1)
        dev = np.abs(fit - traj)
        if max(dev[:, 0].max() / SW, dev[:, 1].max() / SH) * 2.1 + 1 > 1.12:
            args.lock = False  # pediría demasiado recorte: se usa el modo suave
            print(f"{args.clip}: movimiento grande, modo suave en lugar de trípode")
    if args.lock and len(traj) > 2:
        # Modo trípode: la cámara queda quieta o con un desplazamiento lineal suave (sin temblor).
        x = np.arange(len(traj))
        smooth = np.stack([np.polyval(np.polyfit(x, traj[:, i], 1), x) for i in range(4)], axis=1)
    else:
        smooth = np.stack([moving_average(traj[:, i], args.radius) for i in range(4)], axis=1)
    scale = W / SW  # el análisis se hizo a 360 px de ancho
    resid = smooth - traj
    # Zoom adaptativo: lo justo para cubrir la corrección (entre 4 % y el máximo), y la corrección se limita a ese margen.
    need = 1 + 2.1 * max(np.abs(resid[:, 0]).max() / SW if len(resid) else 0, np.abs(resid[:, 1]).max() / SH if len(resid) else 0)
    zoom_f = float(min(max(need, 1.04), args.zoom_max)) if args.zoom is None else args.zoom
    mx = (zoom_f - 1) / 2 * SW * 0.95
    my = (zoom_f - 1) / 2 * SH * 0.95
    if len(resid):
        resid[:, 0] = np.clip(resid[:, 0], -mx, mx)
        resid[:, 1] = np.clip(resid[:, 1], -my, my)
        resid[:, 3] = np.clip(resid[:, 3], -np.log(zoom_f) * 0.6, np.log(zoom_f) * 0.6)

    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", "60000/1001", "-i", "-",
         "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-g", "30", "-pix_fmt", "yuv420p",
         "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-movflags", "+faststart", str(out)],
        stdin=subprocess.PIPE,
    )
    center = (W / 2, H / 2)
    zoom = cv2.getRotationMatrix2D(center, 0, zoom_f)
    for i, frame in enumerate(read_frames(src, args.a, args.b, args.grade)):
        if i == 0:
            dx = dy = da = ds = 0.0
        else:
            dx, dy, da, ds = resid[i - 1]
        # Corrección (giro + escala alrededor del centro + traslación) y zoom fijo en un solo remuestreo.
        # getRotationMatrix2D gira en sentido contrario a la matriz estimada, de ahí el signo.
        r = cv2.getRotationMatrix2D(center, -np.degrees(da), float(np.exp(ds)))
        r[0, 2] += dx * scale
        r[1, 2] += dy * scale
        m = np.vstack([zoom, [0, 0, 1]]) @ np.vstack([r, [0, 0, 1]])
        warped = cv2.warpAffine(frame, m[:2], (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        enc.stdin.write(warped.tobytes())
    enc.stdin.close()
    enc.wait()
    print(f"{args.clip}: {n} frames · zoom {zoom_f:.3f} · {out.name}")


if __name__ == "__main__":
    main()
