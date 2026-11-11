#!/usr/bin/env python3
"""Máscara de persona para el estilo «detrás de la persona» (MediaPipe Selfie Segmenter, Apache-2.0, CPU).

Lee un clip, segmenta a la persona cuadro por cuadro y escribe un video en grises (blanco = persona)
con el mismo tamaño, fps y duración que el clip. ffmpeg lo usa con alphamerge al renderizar.

  python3 mascara.py clip.mp4 mascara.mp4 --modelo selfie_segmenter.tflite [--suavizado 0.6] [--ffmpeg ffmpeg]

Requisitos: pip install mediapipe opencv-python-headless numpy
Modelo: https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite
"""
import argparse, json, subprocess, sys, time

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entrada"); ap.add_argument("salida")
    ap.add_argument("--modelo", required=True)
    ap.add_argument("--suavizado", type=float, default=0.6, help="0 = sin suavizado temporal; 0.6 quita parpadeo")
    ap.add_argument("--ffmpeg", default="ffmpeg")
    a = ap.parse_args()

    cap = cv2.VideoCapture(a.entrada)
    if not cap.isOpened():
        sys.exit(f"no se pudo abrir {a.entrada}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
        base_options=mp_python.BaseOptions(model_asset_path=a.modelo),
        running_mode=vision.RunningMode.VIDEO, output_confidence_masks=True))

    out = subprocess.Popen([a.ffmpeg, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{w}x{h}",
                            "-r", str(fps), "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                            "-pix_fmt", "yuv420p", a.salida], stdin=subprocess.PIPE)
    prev, n, t0 = None, 0, time.time()
    while True:
        ok, bgr = cap.read()
        if not ok:
            break
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        r = seg.segment_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), int(n * 1000 / fps))
        m = r.confidence_masks[0].numpy_view().astype(np.float32)
        if m.ndim == 3:
            m = m[..., 0]
        m = cv2.resize(m, (w, h), interpolation=cv2.INTER_LINEAR)
        if prev is not None and a.suavizado > 0:
            m = a.suavizado * prev + (1 - a.suavizado) * m  # suavizado temporal: menos parpadeo en el borde
        prev = m
        borde = cv2.GaussianBlur(m, (0, 0), 2)  # borde suave, sin escalones
        out.stdin.write((np.clip(borde, 0, 1) * 255).astype(np.uint8).tobytes())
        n += 1
    out.stdin.close(); out.wait(); cap.release()
    s = time.time() - t0
    print(json.dumps({"cuadros": n, "segundos": round(s, 2), "fps": round(n / s, 2) if s else None, "tam": [w, h]}))


if __name__ == "__main__":
    main()
