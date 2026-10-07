#!/usr/bin/env python3
"""Datos del guion visual → storyboard.json (una entrada por reel, una fila por escena).

El texto de cada escena es el COPY LITERAL de ④ (ideas-<formato>.md). El guion visual no inventa copy:
lo pone sobre el fotograma real para que el operador confirme posición, estilo y efecto (ve-armado §2).
Toma = (clip, desde, hasta, velocidad, focusY) con los segundos de la lista de posproducción.
"""
import json
from pathlib import Path

F, D, E = "full", "doble", "cierre"
def s(lay, shots, texto="", rol="", pos="", fx="", nota=""):
    return {"layout": lay, "shots": [dict(zip(("clip", "from", "to", "speed", "focusY"), sh + (None,) * (5 - len(sh)))) for sh in shots],
            "text": texto, "role": rol, "pos": pos, "fx": fx, "note": nota}
def end(): return s(E, [], "Logo · frase de cierre de la guía", "cierre", "Centro", "La superficie sube, logo y frase aparecen suave")

# rol: titular | píldora | etiquetas | remate · texto: "ETIQUETA / Titular" para titular con kicker; "A | B" para dos píldoras
V = [
 ("V01", "<id_creativo · título>", "<pilar>", [
  s(F, [("R1_34", 4.0, 6.0, 0.5, 0.55)], "ETIQUETA / Hook literal de ④", "titular", "Arriba centro", "Revelado por líneas"),
  s(D, [("R1_03", 8.3, 11.0, 1, 0.56), ("R1_02", 0.5, 4.5, 1, 0.62)], "Paso 1", "píldora", "Sobre la línea", "Píldora se abre"),
  s(F, [("R1_30", 3.3, 4.8, 0.5, 0.5)], "Remate literal de ④", "remate", "Centro", "Aparece suave"),
  end()]),
]

out = []
for vid, title, pillar, scenes in V:
    t = 0.0; sc = []
    for i, x in enumerate(scenes, 1):
        d = 3.0 if x["layout"] == E else max(3.0, max((sh["to"] - sh["from"]) / (sh["speed"] or 1) for sh in x["shots"]))
        d = round(min(d, 4.5), 1)
        x.update({"id": f"{vid}_{i:02d}", "n": i, "start": round(t, 1), "end": round(t + d, 1)}); t += d; sc.append(x)
    out.append({"id": vid, "title": title, "pillar": pillar, "duration": round(t, 1), "scenes": sc})
Path(__file__).with_name("storyboard.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
for v in out:
    print(v["id"], v["title"], v["duration"], "s,", len(v["scenes"]), "escenas")
