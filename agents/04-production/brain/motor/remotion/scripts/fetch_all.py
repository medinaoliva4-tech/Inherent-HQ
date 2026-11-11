#!/usr/bin/env python3
"""Baja en paralelo (N workers, listas disjuntas) todos los originales que falten."""
import sys, time, json
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import prep

N = int(sys.argv[1]) if len(sys.argv) > 1 else 3
todo = [c["clip"] for c in prep.INDEX if c["proxy"] and not (prep.SOURCE / c["file"]).exists()]
lists = [todo[i::N] for i in range(N)]
t0 = time.time()

def worker(lst):
    for c in lst:
        try:
            p = prep.download(c)
            print(f"{c} {p.name} {p.stat().st_size/1e6:.0f}MB {time.time()-t0:.0f}s", flush=True)
        except Exception as e:
            print(f"{c} ERROR {e}", flush=True)

print(f"{len(todo)} por bajar en {N} workers", flush=True)
with ThreadPoolExecutor(N) as ex:
    list(ex.map(worker, lists))
print("listo", flush=True)
