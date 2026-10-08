#!/usr/bin/env python3
"""Arma page/guiones.html (fuentes de la guía embebidas + storyboard.json) para publicarla como Artifact con `db`.
  python3 build_data.py && python3 thumbs.py && python3 build.py <fuente-display.ttf> <fuente-sans.ttf> "<Cliente>" "<ciclo>"
"""
import base64, json, sys
from pathlib import Path
H = Path(__file__).parent
disp, sans, cliente, ciclo = sys.argv[1:5]
t = (H / "template.html").read_text()
t = t.replace("__DISPLAY__", base64.b64encode(Path(disp).read_bytes()).decode()).replace("__SANS__", base64.b64encode(Path(sans).read_bytes()).decode())
t = t.replace("__CLIENTE__", cliente).replace("__CICLO__", ciclo).replace("__DATA__", json.dumps(json.loads((H / "storyboard.json").read_text()), ensure_ascii=False))
(H / "page").mkdir(exist_ok=True)
(H / "page/guiones.html").write_text(t)
print("page/guiones.html", round(len(t) / 1024), "KB")
