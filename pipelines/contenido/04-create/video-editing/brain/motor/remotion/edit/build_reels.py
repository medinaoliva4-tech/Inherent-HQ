#!/usr/bin/env python3
"""Guion de montaje → edit/reels.json. Es la ÚNICA fuente de cada reel: tomas, segundos, textos y transiciones.

Se llena desde el guion visual aprobado (ve-armado §2) y la lista de posproducción (ve-recepcion §4).
Después: `python3 edit/build_reels.py && python3 edit/stab_shots.py 4` → `npx remotion render src/index.ts CLIENTE-V01 out/V01_v1.mp4 --muted`.

Toma   sh(clip, desde, hasta, velocidad, focusY, modo, grade, win, zoom)
       · clip/desde/hasta: id del índice y segundos del ORIGINAL (verificados con hoja de tiempos exactos)
       · velocidad 0.5 = cámara lenta real (fuente 60 fps). Solo en momentos protagonistas
       · focusY: centro vertical del sujeto (0 arriba, 1 abajo) para encuadrar en doble cuadro
       · modo: "none" (original — por defecto) · "lock" (trípode) · "smooth" (suavizado). Ver ve-marca §6
       · grade: filtro ffmpeg POR TOMA (p. ej. "colortemperature=temperature=5500:mix=1:pl=0.6")
       · win: (desde, hasta) para cortar varias escenas de UNA toma continua sin saltos
       · zoom: [1.14, 1.0] = la toma se aleja suave (sirve para mostrar entorno en tomas caminando)
Escena sc(layout, [tomas], texto, dur, enter)
       · layout: "full" · "doble" (2 tomas apiladas 9:8) · "cierre"
       · dur en segundos (por defecto 3–4.5 s según la toma) · enter: None (empuje) · "cut" · "flash"
Texto  T(estilo, líneas, posición, efecto, kicker, size, span)
       · estilo: titular | cursiva | pildora | pildoras ("A|B": una por cuadro)
       · posición: arriba-izq | arriba-centro | centro | linea | linea-izq | abajo
       · efecto: lineas | suave | pildora | letras · span: el texto dura N escenas seguidas
"""
import json
from pathlib import Path

def sh(clip, a, b, speed=1, fy=0.5, mode="none", grade="", win=None, zoom=None):
    return {"clip": clip, "from": a, "to": b, "speed": speed, "focusY": fy, "mode": mode, "grade": grade, "win": win, "zoom": zoom}

def sc(layout, shots, text=None, dur=None, enter=None):
    return {"layout": layout, "shots": shots, "text": text, "dur": dur, "enter": enter}

def T(style, lines, pos, fx, kicker=None, size=None, span=None):
    return {"style": style, "lines": lines, "pos": pos, "fx": fx, "kicker": kicker, "size": size, "span": span}

END = lambda: sc("cierre", [], None, 3.2)

# ── EJEMPLO (estructura real de un reel aprobado; reemplazar ids y textos por los del ciclo) ──
REELS = [
 ("V01", "Armado del platillo", [
  # HOOK: el momento más apetitoso, en cámara lenta, con el hook literal de ④ Creatividad
  sc("full", [sh("R1_34", 4.0, 6.0, 0.5, 0.55)], T("titular", ["Hook literal", "de ④"], "arriba-centro", "lineas", kicker="Etiqueta")),
  # BODY: doble cuadro — arriba el detalle, abajo el contexto; una píldora por paso
  sc("doble", [sh("R1_03", 8.3, 11.8, 1, 0.56), sh("R1_02", 0.6, 4.1, 1, 0.62)], T("pildora", ["Paso 1"], "linea", "pildora")),
  sc("doble", [sh("R1_04", 3.4, 6.9, 1, 0.52), sh("R1_05", 9.2, 12.7, 1, 0.56)]),
  # Lo más rico al final y más largo
  sc("full", [sh("R1_30", 3.3, 5.0, 0.5, 0.5)]),
  # PAYOFF: remate de ④ Creatividad, centrado
  sc("full", [sh("R1_32", 8.0, 12.0, 1, 0.52)], T("cursiva", ["Remate", "literal de ④"], "centro", "suave")),
  END()]),
]

out = []
for vid, name, scenes in REELS:
    for s in scenes:
        if s["dur"] is None:
            s["dur"] = round(min(4.5, max(3.0, max(((x["to"] - x["from"]) / x["speed"]) for x in s["shots"]))), 2) if s["shots"] else 3.2
    out.append({"id": vid, "name": name, "scenes": scenes, "duration": round(sum(s["dur"] for s in scenes), 2)})
Path(__file__).with_name("reels.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
for r in out:
    print(r["id"], r["name"], r["duration"], "s")
