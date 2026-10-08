#!/usr/bin/env python3
"""Agrega calificaciones (lista JSON por stdin) a production/grading/G_main.jsonl, completando file/duration."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
INDEX = {c["clip"]: c for c in json.loads((ROOT / "assets/videos/clips_index.json").read_text())}
out = ROOT / "production/grading/G_main.jsonl"
rows = json.loads(sys.stdin.read())
with out.open("a") as f:
    for r in rows:
        c = INDEX[r["clip"]]
        base = {"clip": r["clip"], "file": c["file"], "duration": c["duration"]}
        base.update({k: v for k, v in r.items() if k != "clip"})
        for k in ("keep", "cut", "hero", "actions", "issues"):
            base.setdefault(k, [])
        base.setdefault("duplicate_of", None)
        base.setdefault("notes", "")
        f.write(json.dumps(base, ensure_ascii=False) + "\n")
print(f"+{len(rows)} → {out.name} ({sum(1 for _ in out.open())} clips)")
